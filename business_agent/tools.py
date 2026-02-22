"""
경영관리 Agent 도구 모음
수주/매출/영업이익 예상·실적·Variance·액션아이템 CRUD 제공
"""

import uuid
from datetime import datetime
from typing import Any

from data_manager import load_data, save_data


# ─────────────────────────────────────────────
# 내부 헬퍼
# ─────────────────────────────────────────────

def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _profit_margin(profit: float, revenue: float) -> float:
    if revenue == 0:
        return 0.0
    return round(profit / revenue * 100, 2)


def _variance(plan: float, actual: float) -> dict:
    diff = actual - plan
    pct = round(diff / plan * 100, 2) if plan != 0 else 0.0
    return {
        "plan": plan,
        "actual": actual,
        "diff": round(diff, 2),
        "pct": pct,
        "status": "over" if diff >= 0 else "under",
    }


# ─────────────────────────────────────────────
# 예상(Plan) 관리
# ─────────────────────────────────────────────

def set_monthly_forecast(
    period: str,
    orders: float,
    revenue: float,
    profit: float,
    notes: str = "",
) -> dict:
    """월간 사업 예상(Plan)을 설정합니다."""
    data = load_data()
    if period in data["forecasts"]:
        return {
            "error": f"{period} 예상이 이미 존재합니다. 수정하려면 update_monthly_forecast를 사용하세요."
        }

    forecast = {
        "period": period,
        "orders": float(orders),
        "revenue": float(revenue),
        "profit": float(profit),
        "profit_margin": _profit_margin(profit, revenue),
        "notes": notes,
        "created_at": _now(),
        "updated_at": _now(),
    }
    data["forecasts"][period] = forecast
    save_data(data)
    return {"success": True, "forecast": forecast}


def update_monthly_forecast(
    period: str,
    orders: float | None = None,
    revenue: float | None = None,
    profit: float | None = None,
    notes: str | None = None,
) -> dict:
    """기존 월간 예상을 수정합니다."""
    data = load_data()
    if period not in data["forecasts"]:
        return {"error": f"{period} 예상 데이터가 없습니다. set_monthly_forecast로 먼저 입력하세요."}

    fc = data["forecasts"][period]
    if orders is not None:
        fc["orders"] = float(orders)
    if revenue is not None:
        fc["revenue"] = float(revenue)
    if profit is not None:
        fc["profit"] = float(profit)
    if notes is not None:
        fc["notes"] = notes
    fc["profit_margin"] = _profit_margin(fc["profit"], fc["revenue"])
    fc["updated_at"] = _now()

    save_data(data)
    return {"success": True, "forecast": fc}


def get_monthly_forecast(period: str) -> dict:
    """특정 월의 예상(Plan) 데이터를 조회합니다."""
    data = load_data()
    fc = data["forecasts"].get(period)
    if not fc:
        return {"error": f"{period} 예상 데이터가 없습니다."}
    return {"period": period, "forecast": fc}


# ─────────────────────────────────────────────
# 실적 관리
# ─────────────────────────────────────────────

def record_actuals(
    period: str,
    orders: float,
    revenue: float,
    profit: float,
    is_final: bool = False,
    as_of_date: str | None = None,
    notes: str = "",
) -> dict:
    """월간 실적을 입력합니다 (잠정 또는 확정)."""
    data = load_data()
    actual = {
        "period": period,
        "orders": float(orders),
        "revenue": float(revenue),
        "profit": float(profit),
        "profit_margin": _profit_margin(profit, revenue),
        "is_final": is_final,
        "as_of_date": as_of_date or datetime.now().strftime("%Y-%m-%d"),
        "notes": notes,
        "updated_at": _now(),
    }
    data["actuals"][period] = actual
    save_data(data)
    return {"success": True, "actual": actual}


def get_actuals(period: str) -> dict:
    """특정 월의 실적 데이터를 조회합니다."""
    data = load_data()
    actual = data["actuals"].get(period)
    if not actual:
        return {"error": f"{period} 실적 데이터가 없습니다."}
    return {"period": period, "actual": actual}


# ─────────────────────────────────────────────
# Variance 분석
# ─────────────────────────────────────────────

def calculate_variance(period: str) -> dict:
    """Plan 대비 실적 Variance를 계산합니다."""
    data = load_data()
    fc = data["forecasts"].get(period)
    actual = data["actuals"].get(period)

    if not fc:
        return {"error": f"{period} 예상 데이터가 없습니다. 먼저 예상을 입력해주세요."}

    if not actual:
        return {
            "period": period,
            "message": "아직 실적이 입력되지 않았습니다.",
            "forecast": fc,
        }

    return {
        "period": period,
        "forecast": fc,
        "actual": actual,
        "is_final": actual["is_final"],
        "as_of_date": actual["as_of_date"],
        "variance": {
            "orders": _variance(fc["orders"], actual["orders"]),
            "revenue": _variance(fc["revenue"], actual["revenue"]),
            "profit": _variance(fc["profit"], actual["profit"]),
            "profit_margin": {
                "plan": fc["profit_margin"],
                "actual": actual["profit_margin"],
                "diff": round(actual["profit_margin"] - fc["profit_margin"], 2),
            },
        },
    }


# ─────────────────────────────────────────────
# 액션 아이템 관리
# ─────────────────────────────────────────────

def add_action_item(
    period: str,
    category: str,
    description: str,
    priority: str,
    owner: str = "",
    due_date: str = "",
) -> dict:
    """확정실적까지 관리해야 할 액션 아이템을 추가합니다."""
    data = load_data()
    item_id = str(uuid.uuid4())[:8]
    item = {
        "id": item_id,
        "period": period,
        "category": category,
        "description": description,
        "owner": owner,
        "due_date": due_date,
        "priority": priority,
        "status": "pending",
        "notes": "",
        "created_at": _now(),
        "updated_at": _now(),
    }
    data["action_items"][item_id] = item
    save_data(data)
    return {"success": True, "item": item}


def update_action_item(
    item_id: str,
    status: str | None = None,
    notes: str | None = None,
    due_date: str | None = None,
) -> dict:
    """액션 아이템의 상태나 내용을 업데이트합니다."""
    data = load_data()
    item = data["action_items"].get(item_id)
    if not item:
        return {"error": f"ID '{item_id}' 액션 아이템을 찾을 수 없습니다."}

    if status is not None:
        item["status"] = status
    if notes is not None:
        item["notes"] = notes
    if due_date is not None:
        item["due_date"] = due_date
    item["updated_at"] = _now()

    save_data(data)
    return {"success": True, "item": item}


def delete_action_item(item_id: str) -> dict:
    """액션 아이템을 삭제합니다."""
    data = load_data()
    if item_id not in data["action_items"]:
        return {"error": f"ID '{item_id}' 액션 아이템을 찾을 수 없습니다."}
    removed = data["action_items"].pop(item_id)
    save_data(data)
    return {"success": True, "deleted": removed}


def get_action_items(
    period: str | None = None,
    status: str = "all",
    category: str | None = None,
) -> dict:
    """액션 아이템 목록을 조회합니다."""
    data = load_data()
    items = list(data["action_items"].values())

    if period:
        items = [i for i in items if i["period"] == period]
    if status != "all":
        items = [i for i in items if i["status"] == status]
    if category:
        items = [i for i in items if i["category"] == category]

    # 우선순위 + 생성일 순 정렬
    priority_order = {"high": 0, "medium": 1, "low": 2}
    items.sort(key=lambda i: (priority_order.get(i["priority"], 9), i["created_at"]))

    today = datetime.now().strftime("%Y-%m-%d")
    overdue = [i for i in items if i["due_date"] and i["due_date"] < today and i["status"] not in ("completed", "cancelled")]

    return {
        "total": len(items),
        "items": items,
        "overdue_count": len(overdue),
        "overdue_items": overdue,
    }


# ─────────────────────────────────────────────
# 리포트
# ─────────────────────────────────────────────

def get_monthly_report(period: str) -> dict:
    """특정 월의 경영현황 종합 리포트를 생성합니다."""
    data = load_data()
    fc = data["forecasts"].get(period)
    actual = data["actuals"].get(period)

    # 해당 월 액션 아이템
    all_items = [i for i in data["action_items"].values() if i["period"] == period]
    today = datetime.now().strftime("%Y-%m-%d")
    overdue = [i for i in all_items if i["due_date"] and i["due_date"] < today and i["status"] not in ("completed", "cancelled")]

    status_summary: dict[str, int] = {}
    for item in all_items:
        status_summary[item["status"]] = status_summary.get(item["status"], 0) + 1

    high_priority = [i for i in all_items if i["priority"] == "high" and i["status"] not in ("completed", "cancelled")]

    variance_data = None
    if fc and actual:
        variance_data = {
            "orders": _variance(fc["orders"], actual["orders"]),
            "revenue": _variance(fc["revenue"], actual["revenue"]),
            "profit": _variance(fc["profit"], actual["profit"]),
            "profit_margin": {
                "plan": fc["profit_margin"],
                "actual": actual["profit_margin"],
                "diff": round(actual["profit_margin"] - fc["profit_margin"], 2),
            },
        }

    return {
        "period": period,
        "forecast": fc,
        "actual": actual,
        "variance": variance_data,
        "action_items": {
            "total": len(all_items),
            "by_status": status_summary,
            "high_priority_open": high_priority,
            "overdue": overdue,
        },
    }


def list_all_months() -> dict:
    """관리 중인 전체 월 목록과 요약 현황을 조회합니다."""
    data = load_data()
    periods = sorted(set(list(data["forecasts"].keys()) + list(data["actuals"].keys())), reverse=True)

    summary = []
    for period in periods:
        fc = data["forecasts"].get(period)
        actual = data["actuals"].get(period)
        items = [i for i in data["action_items"].values() if i["period"] == period]
        open_items = [i for i in items if i["status"] not in ("completed", "cancelled")]

        entry: dict[str, Any] = {
            "period": period,
            "has_forecast": fc is not None,
            "has_actuals": actual is not None,
            "is_final": actual["is_final"] if actual else False,
            "open_action_items": len(open_items),
        }
        if fc:
            entry["forecast_revenue"] = fc["revenue"]
            entry["forecast_profit_margin"] = fc["profit_margin"]
        if actual:
            entry["actual_revenue"] = actual["revenue"]
            entry["actual_profit_margin"] = actual["profit_margin"]
        summary.append(entry)

    return {"total_months": len(periods), "months": summary}


# ─────────────────────────────────────────────
# 도구 디스패처
# ─────────────────────────────────────────────

TOOL_MAP = {
    "set_monthly_forecast": set_monthly_forecast,
    "update_monthly_forecast": update_monthly_forecast,
    "get_monthly_forecast": get_monthly_forecast,
    "record_actuals": record_actuals,
    "get_actuals": get_actuals,
    "calculate_variance": calculate_variance,
    "add_action_item": add_action_item,
    "update_action_item": update_action_item,
    "delete_action_item": delete_action_item,
    "get_action_items": get_action_items,
    "get_monthly_report": get_monthly_report,
    "list_all_months": list_all_months,
}


def execute(tool_name: str, tool_input: dict) -> str:
    """도구를 실행하고 결과를 JSON 문자열로 반환합니다."""
    import json
    func = TOOL_MAP.get(tool_name)
    if not func:
        return json.dumps({"error": f"알 수 없는 도구: {tool_name}"})
    try:
        result = func(**tool_input)
        return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)})
