"""
LG CNS 화학/전지사업부 - 제약/바이오 영업 AI BD 서비스
"""

import os
import json
import asyncio
from typing import AsyncIterator

import anthropic
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="LG CNS AI BD 서비스",
    description="제약/바이오 영업을 위한 AI Business Development 지원 플랫폼",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# ── 시스템 프롬프트 ──────────────────────────────────────────────────────────

BASE_SYSTEM = """당신은 LG CNS 화학/전지사업부의 제약·바이오 영업을 전문적으로 지원하는 AI BD(Business Development) 어시스턴트입니다.

LG CNS는 한국 최고 수준의 IT 서비스 기업으로, 제약·바이오 산업에 특화된 디지털 트랜스포메이션 솔루션을 제공합니다.

주요 LG CNS 솔루션 포트폴리오 (제약/바이오):
- MES (Manufacturing Execution System): GMP 준수 스마트 생산관리
- LIMS (Laboratory Information Management System): 실험실 데이터 통합 관리
- QMS (Quality Management System): 품질 이슈 추적 및 CAPA 관리
- ERP (SAP 기반): 제약사 특화 전사 자원 관리
- AI/ML 기반 신약개발 지원: 임상 데이터 분석, 바이오마커 분석
- 클라우드 마이그레이션: FDA/EMA 컴플라이언스 클라우드 전환
- 데이터 분석 플랫폼: 리얼월드데이터(RWD) 분석, 임상 BI
- CSV (Computer System Validation): 21 CFR Part 11 대응
- 공급망 최적화: 콜드체인 물류, 의약품 유통 추적

항상 한국어로 답변하며, 실무에 즉시 활용할 수 있는 구체적이고 전략적인 내용을 제공하세요.
고객사의 비즈니스 맥락과 LG CNS의 강점을 연결하여 차별화된 가치를 제시하세요."""

COMPANY_ANALYSIS_PROMPT = BASE_SYSTEM + """

[역할: 기업 분석 전문가]
제약/바이오 기업에 대한 심층 분석을 수행합니다.

분석 시 다음 항목을 포함하세요:
1. 기업 개요 및 사업 현황
2. 디지털 성숙도 및 IT 투자 현황
3. 주요 비즈니스 과제 및 Pain Point
4. LG CNS 솔루션 적용 기회 영역 (우선순위화)
5. 경쟁사 대비 LG CNS 차별화 포인트
6. 예상 예산 규모 및 의사결정 구조
7. 영업 전략 권고사항"""

MEETING_BRIEFING_PROMPT = BASE_SYSTEM + """

[역할: 영업 미팅 코치]
고객사 미팅을 위한 실전 브리핑 자료를 작성합니다.

브리핑에 다음을 포함하세요:
1. 미팅 목표 및 기대 성과
2. 고객사 담당자 프로파일 및 관심사 추정
3. 핵심 메시지 (3가지 이내)
4. 제안 포인트 및 스토리라인
5. 예상 질문 & 답변 준비
6. 경쟁사 비교 시 대응 논리
7. 다음 단계 액션 아이템"""

PROPOSAL_PROMPT = BASE_SYSTEM + """

[역할: 제안서 작성 전문가]
고객 맞춤형 IT 솔루션 제안서 초안을 작성합니다.

제안서에 다음을 포함하세요:
1. Executive Summary (1페이지 분량)
2. 고객 현황 분석 및 과제 인식
3. LG CNS 솔루션 제안 (맞춤 구성)
4. 기대 효과 및 ROI (정량적 수치 포함)
5. 구현 방법론 및 일정 (단계별)
6. LG CNS 레퍼런스 및 역량 증명
7. 투자 비용 구조 (개략)
8. 리스크 대응 방안"""

COACHING_PROMPT = BASE_SYSTEM + """

[역할: 영업 대화 코치]
제약/바이오 고객과의 영업 대화를 실시간으로 코칭합니다.

다음을 제공하세요:
1. 고객 발언의 숨겨진 의도 및 우려사항 해석
2. 최적 대응 메시지 (2-3가지 옵션)
3. 추가 확인이 필요한 질문
4. 해당 상황에 적합한 LG CNS 사례 및 데이터
5. 다음 영업 단계 전진 전략"""


# ── 요청/응답 모델 ────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    company_name: str
    additional_info: str = ""


class MeetingRequest(BaseModel):
    company_name: str
    meeting_purpose: str
    attendees: str = ""
    known_issues: str = ""


class ProposalRequest(BaseModel):
    company_name: str
    requirements: str
    budget_range: str = ""
    timeline: str = ""


class CoachingRequest(BaseModel):
    customer_statement: str
    context: str = ""


# ── 스트리밍 헬퍼 ──────────────────────────────────────────────────────────────

async def stream_claude_response(system: str, user_message: str) -> AsyncIterator[str]:
    """Claude API 스트리밍 응답을 SSE 형식으로 변환합니다."""
    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=system,
        messages=[{"role": "user", "content": user_message}],
    ) as stream:
        for event in stream:
            if (
                event.type == "content_block_delta"
                and hasattr(event.delta, "text")
            ):
                chunk = event.delta.text
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            await asyncio.sleep(0)  # event loop 양보

    yield "data: [DONE]\n\n"


# ── API 엔드포인트 ─────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def root():
    with open("index.html", encoding="utf-8") as f:
        return f.read()


@app.post("/api/analyze-company")
async def analyze_company(req: AnalysisRequest):
    """제약/바이오 기업 심층 분석"""
    user_message = f"""
다음 기업에 대한 LG CNS 영업 관점의 심층 분석을 수행해주세요.

기업명: {req.company_name}
{f"추가 정보: {req.additional_info}" if req.additional_info else ""}

위 기업에 대해 알려진 정보와 제약/바이오 업계 일반 동향을 바탕으로
LG CNS IT 솔루션 영업 전략을 수립할 수 있는 종합 분석을 제공해주세요.
"""
    return StreamingResponse(
        stream_claude_response(COMPANY_ANALYSIS_PROMPT, user_message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/meeting-briefing")
async def meeting_briefing(req: MeetingRequest):
    """영업 미팅 브리핑 자료 생성"""
    user_message = f"""
다음 미팅을 위한 실전 브리핑 자료를 작성해주세요.

고객사: {req.company_name}
미팅 목적: {req.meeting_purpose}
{f"참석자: {req.attendees}" if req.attendees else ""}
{f"알려진 고객 이슈/관심사: {req.known_issues}" if req.known_issues else ""}

LG CNS 영업 담당자가 미팅 전 15분 안에 숙지할 수 있는
핵심 브리핑 자료를 작성해주세요.
"""
    return StreamingResponse(
        stream_claude_response(MEETING_BRIEFING_PROMPT, user_message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/draft-proposal")
async def draft_proposal(req: ProposalRequest):
    """맞춤형 제안서 초안 생성"""
    user_message = f"""
다음 고객을 위한 LG CNS IT 솔루션 제안서 초안을 작성해주세요.

고객사: {req.company_name}
고객 요구사항/RFP 내용: {req.requirements}
{f"예산 규모: {req.budget_range}" if req.budget_range else ""}
{f"구축 일정: {req.timeline}" if req.timeline else ""}

제약/바이오 산업에 특화된 LG CNS 솔루션을 중심으로
설득력 있는 제안서 초안을 작성해주세요.
"""
    return StreamingResponse(
        stream_claude_response(PROPOSAL_PROMPT, user_message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/sales-coaching")
async def sales_coaching(req: CoachingRequest):
    """실시간 영업 대화 코칭"""
    user_message = f"""
다음 영업 상황에서 최적의 대응 방법을 코칭해주세요.

고객 발언: "{req.customer_statement}"
{f"상황 맥락: {req.context}" if req.context else ""}

LG CNS 영업 담당자가 이 상황에서 어떻게 대응해야 할지
즉시 활용 가능한 코칭을 제공해주세요.
"""
    return StreamingResponse(
        stream_claude_response(COACHING_PROMPT, user_message),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "LG CNS AI BD Service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 8000)),
        reload=True,
    )
