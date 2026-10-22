"""추적 채널의 업로드 이력을 기준일까지 거슬러 올라가 모은다 → corpus_full.json

챕터 키워드(chapter_keywords.py)는 '몇 주·몇 달 동안 이어지는가'를 봐야 하므로
채널별 최근 50건(keyword_pipeline.py fetch)으로는 부족하다. 고빈도 채널(AI Engineer,
조코딩 등)은 50건이 2주도 못 덮는다. 그래서 채널마다 기준일(기본 2025-01-01)까지
playlistItems를 페이지로 이어 받는다. 페이지당 1 unit이라 전체가 수백 unit 안쪽이다.

두 번째 실행부터는 증분: 채널마다 이미 가진 videoId만 나오는 페이지에 닿으면 멈춘다.

사용법:
  python3 backfill_corpus.py                 # 증분 (없으면 전체)
  python3 backfill_corpus.py --full          # 기준일까지 전체 다시
  python3 backfill_corpus.py --since 2025-01-01
"""
import urllib.request, json, os, sys
from datetime import datetime, timezone

SCR = os.environ["YT_SCRATCH"]
API_KEY = os.environ["YT_API_KEY"]
OUT = f"{SCR}/corpus_full.json"

args = sys.argv[1:]
FULL = "--full" in args
SINCE = args[args.index("--since") + 1] if "--since" in args else "2025-01-01"
CUT = datetime.fromisoformat(SINCE + "T00:00:00+00:00")

CHANS = json.load(open(f"{SCR}/digest_data.json"))["channels"]


def page(pl, token=None):
    u = ("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails"
         f"&playlistId={pl}&maxResults=50&key={API_KEY}")
    if token:
        u += f"&pageToken={token}"
    d = json.load(urllib.request.urlopen(u, timeout=30))
    return d.get("items", []), d.get("nextPageToken")


old = {} if FULL or not os.path.exists(OUT) else {v["videoId"]: v for v in json.load(open(OUT))}
known_by_ch = {}
for v in old.values():
    known_by_ch.setdefault(v["channel"], set()).add(v["videoId"])

units = 0
merged = dict(old)
for c in CHANS:
    pl = "UU" + c["channelId"][2:]
    known = known_by_ch.get(c["name"], set())
    token, added, pages = None, 0, 0
    while True:
        items, token = page(pl, token)
        units += 1
        pages += 1
        fresh = 0
        oldest = None
        for it in items:
            s = it["snippet"]
            vid = it["contentDetails"]["videoId"]
            pub = datetime.fromisoformat(s["publishedAt"].replace("Z", "+00:00"))
            oldest = pub if oldest is None or pub < oldest else oldest
            if pub < CUT:
                continue
            if vid not in known:
                fresh += 1
            # 제목·설명은 바뀔 수 있으므로 항상 최신값으로 덮어쓴다
            merged[vid] = {"channel": c["name"], "videoId": vid, "title": s["title"],
                           "description": (s.get("description") or "")[:5000],
                           "publishedAt": s["publishedAt"]}
        added += fresh
        if not token or not items:
            break
        if oldest is not None and oldest < CUT:
            break
        if known and fresh == 0:          # 증분: 이미 아는 구간에 닿음
            break
    print(f"{c['name']:28} +{added:4}  ({pages}p)")

allv = sorted(merged.values(), key=lambda v: v["publishedAt"], reverse=True)
json.dump(allv, open(OUT, "w"), ensure_ascii=False)
print(f"TOTAL {len(allv)} videos since {SINCE} / quota ≈ {units} units")
