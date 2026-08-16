# AI 브리핑 파이프라인 스크립트

일일/주간 "AI 유튜브 다이제스트" Routine이 실행하는 스크립트입니다.
트리거 prompt에 통째로 박아두던 것을 여기로 옮겼습니다 — prompt가 50KB 줄고,
수정이 커밋 한 번으로 끝나며, 재전송 과정에서 코드가 변형될 여지가 없습니다.

## 실행

두 스크립트 모두 환경변수 두 개를 받습니다.

| 변수 | 설명 |
|---|---|
| `YT_SCRATCH` | 데이터 파일(digest_data.json 등)이 있는 스크래치패드 절대경로 |
| `YT_API_KEY` | YouTube Data API v3 키 (**레포에 두지 않습니다.** 트리거 prompt에 있음) |

```bash
export YT_SCRATCH=/path/to/scratchpad
export YT_API_KEY=...

python3 scripts/keyword_pipeline.py fetch          # 코퍼스 수집 (15 units)
python3 scripts/keyword_pipeline.py discover       # 급상승 n-gram 후보 (0 units)
python3 scripts/keyword_pipeline.py verify _cand.json   # 근거 검증 (후보당 400~800 units)
python3 scripts/gen_html.py                        # ai_briefing.html 생성
```

## keyword_pipeline.py — 키워드 태그 근거 검증

태그는 "이번 주에 무엇이 달라졌는가"를 보여주는 게 목적이라, 근거 없는 용어나
아무 때나 쓰이는 범용어가 붙으면 안 됩니다. 두 축을 따로 재서 합산합니다.

- **코퍼스 급등** — 추적 15개 채널의 최근 750개 영상을 전수 조사. 최근 7일 2건 이상 +
  2개 채널 이상이면서, 직전 8~60일에 없었거나(신규) 언급률이 3배 이상 뛴 경우.
  전수 조사라 신뢰도가 가장 높습니다.
- **글로벌 상승** — `search.list`의 `totalResults`가 작년 동기 대비 2배 이상.
  이 값은 추정치라 같은 질의에도 크게 흔들립니다(실측: 같은 창에서 3764 → 299).
  창마다 2회 샘플링하고 2배 넘게 벌어지면 4회까지 뽑아 중앙값을 쓰며,
  그래도 안 잡히면 이 축을 판정에서 뺍니다.

둘 다 오르면 `급상승`, 하나만 오르면 `상승`, 어느 쪽도 안 움직이면 제외합니다.

두 축이 엇갈리는 건 정상입니다. 예를 들어 `continual learning`은 추적 채널에서
0건 → 7건인데 글로벌 검색은 작년 대비 0.6배였습니다. 오래된 연구 용어가 이번 주
소스에서만 급부상한 경우로, `상승`으로 채택됩니다. 앱의 근거 시트가 두 축을 따로
보여주므로 한쪽 수치만 보고 모순이라고 판단하면 안 됩니다.

후보 목록 끝에 대조군으로 `AI 에이전트`를 넣고 돌리면 회귀 확인이 됩니다 —
이게 `제외(범용어·변화없음)`로 나와야 판정 로직이 정상입니다.

## gen_html.py — 웹앱 생성

`digest_data.json` + `fonts/*.ttf`를 읽어 self-contained `ai_briefing.html`을 만듭니다.
유튜브 앱 느낌의 레이아웃(앱바 / 채널 아바타 레일 / 필터 칩 / 브리핑 카드 /
영상 카드 피드 / 하단 고정바 / 시트 3종)이며, 키워드 태그를 누르면 근거 시트가 뜹니다.
