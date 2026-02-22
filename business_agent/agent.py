"""
LG CNS 경영관리 Agent
수주/매출/영업이익 예상 수립 → 월중 실적 추적 → Variance 분석 → 확정실적 관리
"""

import json
import os
import sys

import anthropic
import tools as biz_tools

# ─────────────────────────────────────────────
# 시스템 프롬프트
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """당신은 LG CNS 경영관리 전문 AI 어시스턴트입니다.

## 역할
담당 사업 영역의 월별 경영관리를 지원합니다:
- 수주 / 매출 / 영업이익 월간 예상(Forecast) 수립 및 관리
- 월중 진행 현황 파악 및 실적 추적
- Plan 대비 예상 Variance 분석 및 리스크 관리
- 확정실적까지 챙겨야 할 액션 아이템 관리
- 경영현황 리포팅 지원

## 핵심 용어
| 용어 | 설명 |
|------|------|
| 수주 | 신규 계약 체결 금액 |
| 매출 | 실제 수익 인식 금액 |
| 영업이익 | 매출에서 영업비용을 뺀 이익 |
| 영업이익률 | 영업이익 ÷ 매출 × 100 (%) |
| Plan / 예상 | 당초 수립한 목표 수치 |
| 잠정실적 | 월중 잠정 집계 실적 |
| 확정실적 | 회계적으로 최종 확정된 실적 |
| Variance | Plan 대비 실적 차이 (초과 ▲ / 미달 ▼) |

## 답변 지침
- 한국어로 답변하세요
- 금액은 억원 단위로 표현하세요
- 영업이익률(%)을 항상 함께 표시하세요
- Variance 표시: 절대값(억원) + 비율(%) 병기
  - 초과달성: ▲ (긍정)
  - 미달: ▼ ⚠️ (경고)
- 리스크 요인은 명확히 강조하고 구체적 대응방안을 제시하세요
- 액션 아이템은 실행 가능하고 기한이 명확하게 제안하세요

## 월간 관리 사이클
1. 월초: 수주/매출/영업이익 예상 수립
2. 월중: 진행 현황 모니터링, Variance 예방 액션 실행
3. 월말: 잠정실적 입력 및 분석
4. 익월초: 확정실적 입력, 종합 분석"""

# ─────────────────────────────────────────────
# 도구 스키마 (Claude API용)
# ─────────────────────────────────────────────

TOOLS_SCHEMA = [
    {
        "name": "set_monthly_forecast",
        "description": "월간 사업 예상(Plan)을 신규 설정합니다. 수주, 매출, 영업이익 목표를 입력합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
                "orders": {"type": "number", "description": "수주 예상 금액 (억원)"},
                "revenue": {"type": "number", "description": "매출 예상 금액 (억원)"},
                "profit": {"type": "number", "description": "영업이익 예상 금액 (억원)"},
                "notes": {"type": "string", "description": "추가 메모 (선택)"},
            },
            "required": ["period", "orders", "revenue", "profit"],
        },
    },
    {
        "name": "update_monthly_forecast",
        "description": "기존 월간 예상을 수정합니다. 변경할 항목만 입력합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
                "orders": {"type": "number", "description": "수주 예상 수정 금액 (억원, 선택)"},
                "revenue": {"type": "number", "description": "매출 예상 수정 금액 (억원, 선택)"},
                "profit": {"type": "number", "description": "영업이익 예상 수정 금액 (억원, 선택)"},
                "notes": {"type": "string", "description": "메모 수정 (선택)"},
            },
            "required": ["period"],
        },
    },
    {
        "name": "get_monthly_forecast",
        "description": "특정 월의 예상(Plan) 데이터를 조회합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
            },
            "required": ["period"],
        },
    },
    {
        "name": "record_actuals",
        "description": "월간 실적을 입력합니다. 잠정실적(is_final=false) 또는 확정실적(is_final=true)을 기록합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
                "orders": {"type": "number", "description": "수주 실적 (억원)"},
                "revenue": {"type": "number", "description": "매출 실적 (억원)"},
                "profit": {"type": "number", "description": "영업이익 실적 (억원)"},
                "is_final": {"type": "boolean", "description": "확정실적 여부 (기본 false)"},
                "as_of_date": {"type": "string", "description": "실적 기준일 (예: '2026-02-28')"},
                "notes": {"type": "string", "description": "메모 (선택)"},
            },
            "required": ["period", "orders", "revenue", "profit"],
        },
    },
    {
        "name": "get_actuals",
        "description": "특정 월의 실적 데이터를 조회합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
            },
            "required": ["period"],
        },
    },
    {
        "name": "calculate_variance",
        "description": "특정 월의 Plan 대비 실적 Variance를 계산합니다. 수주/매출/영업이익 각각의 차이와 비율을 반환합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
            },
            "required": ["period"],
        },
    },
    {
        "name": "add_action_item",
        "description": "확정실적까지 관리해야 할 액션 아이템을 추가합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
                "category": {
                    "type": "string",
                    "enum": ["수주", "매출", "영업이익", "리스크관리", "기타"],
                    "description": "분류",
                },
                "description": {"type": "string", "description": "액션 아이템 내용"},
                "priority": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                    "description": "우선순위",
                },
                "owner": {"type": "string", "description": "담당자 (선택)"},
                "due_date": {"type": "string", "description": "완료 목표일 (예: '2026-02-20', 선택)"},
            },
            "required": ["period", "category", "description", "priority"],
        },
    },
    {
        "name": "update_action_item",
        "description": "액션 아이템의 상태나 내용을 업데이트합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "액션 아이템 ID"},
                "status": {
                    "type": "string",
                    "enum": ["pending", "in_progress", "completed", "cancelled"],
                    "description": "진행 상태",
                },
                "notes": {"type": "string", "description": "업데이트 메모 (선택)"},
                "due_date": {"type": "string", "description": "완료 목표일 변경 (선택)"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "delete_action_item",
        "description": "액션 아이템을 삭제합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "item_id": {"type": "string", "description": "삭제할 액션 아이템 ID"},
            },
            "required": ["item_id"],
        },
    },
    {
        "name": "get_action_items",
        "description": "액션 아이템 목록을 조회합니다. 기간, 상태, 분류로 필터링 가능합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 필터 (선택, 없으면 전체)"},
                "status": {
                    "type": "string",
                    "enum": ["pending", "in_progress", "completed", "cancelled", "all"],
                    "description": "상태 필터 (기본: all)",
                },
                "category": {"type": "string", "description": "분류 필터 (선택)"},
            },
        },
    },
    {
        "name": "get_monthly_report",
        "description": "특정 월의 경영현황 종합 리포트를 조회합니다. 예상/실적/Variance/액션아이템을 모두 포함합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "period": {"type": "string", "description": "대상 연월 (예: '2026-02')"},
            },
            "required": ["period"],
        },
    },
    {
        "name": "list_all_months",
        "description": "관리 중인 전체 월 목록과 요약 현황(예상 유무, 실적 유무, 확정 여부, 미완료 액션 건수)을 조회합니다.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]

# ─────────────────────────────────────────────
# 대화 루프
# ─────────────────────────────────────────────

WELCOME = """\
╔══════════════════════════════════════════════════╗
║         LG CNS 경영관리 Agent                    ║
╚══════════════════════════════════════════════════╝

안녕하세요! 경영관리 업무를 도와드리겠습니다.

주요 기능:
  • 월간 수주/매출/영업이익 예상 수립
  • 월중 실적 입력 및 진행 현황 추적
  • Plan 대비 Variance 분석
  • 확정실적까지 액션 아이템 관리
  • 월간 경영현황 리포트

대화 예시:
  "2월 예상 입력해줘. 수주 500억, 매출 400억, 영업이익 40억"
  "2월 현황 리포트 보여줘"
  "매출 Variance 분석해줘"
  "이번달 챙겨야 할 액션 아이템 추가해줘"
  "전체 관리 현황 보여줘"

종료: quit 또는 exit
"""


def run_agent_turn(
    client: anthropic.Anthropic,
    messages: list[dict],
) -> list[dict]:
    """
    하나의 사용자 턴을 처리합니다.
    - 스트리밍으로 텍스트 출력
    - tool_use 발생 시 도구 실행 후 반복
    - 최종 응답까지 messages 업데이트 후 반환
    """
    while True:
        print("\n어시스턴트: ", end="", flush=True)

        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=8096,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            tools=TOOLS_SCHEMA,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                print(text, end="", flush=True)
            response = stream.get_final_message()

        print()  # 줄바꿈

        # 어시스턴트 응답을 히스토리에 추가 (thinking 블록 포함 전체)
        messages.append({"role": "assistant", "content": response.content})

        # 도구 호출이 없으면 종료
        if response.stop_reason != "tool_use":
            break

        # 도구 실행
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"\n  [도구 실행] {block.name} ...", flush=True)
                result_str = biz_tools.execute(block.name, block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_str,
                    }
                )

        # 도구 결과를 히스토리에 추가 후 반복
        messages.append({"role": "user", "content": tool_results})

    return messages


def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("오류: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("  export ANTHROPIC_API_KEY='your-api-key'")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    messages: list[dict] = []

    print(WELCOME)

    while True:
        try:
            user_input = input("나: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\n경영관리 Agent를 종료합니다.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "종료"):
            print("경영관리 Agent를 종료합니다.")
            break

        messages.append({"role": "user", "content": user_input})
        messages = run_agent_turn(client, messages)


if __name__ == "__main__":
    main()
