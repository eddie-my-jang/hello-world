"""
데이터 영속성 관리 모듈
수주/매출/영업이익 예상, 실적, 액션 아이템 데이터를 JSON 파일로 저장/로드
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "business_data.json"


def load_data() -> dict:
    """JSON 파일에서 전체 데이터 로드"""
    DATA_DIR.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        initial = {"forecasts": {}, "actuals": {}, "action_items": {}}
        save_data(initial)
        return initial
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data: dict) -> None:
    """전체 데이터를 JSON 파일에 저장"""
    DATA_DIR.mkdir(exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
