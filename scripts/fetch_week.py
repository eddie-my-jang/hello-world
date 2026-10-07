"""추적 채널의 최근 7일 영상을 모두 모아 week_videos_raw.json 생성.

7일 이내 건수가 정확히 maxResults와 같으면 목록이 잘린 것이므로 그 채널만 50개로 재조회하고,
50개로도 창이 안 닫히면(= 50번째 항목이 아직 7일 안) nextPageToken으로 계속 받는다.
2026-10-07에 AI Engineer가 7일 창 52건이어서 50건으로 잘렸던 것을 잡기 위한 처리다.
"""
import urllib.request, json, os
from datetime import datetime, timezone, timedelta

SCR = os.environ["YT_SCRATCH"]
API_KEY = os.environ["YT_API_KEY"]
CUT = datetime.now(timezone.utc) - timedelta(days=7)

CHANS = json.load(open(f"{SCR}/digest_data.json"))["channels"]

def fetch(pl, n, token=None):
    u = ("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails"
         f"&playlistId={pl}&maxResults={n}&key={API_KEY}")
    if token:
        u += f"&pageToken={token}"
    d = json.load(urllib.request.urlopen(u, timeout=25))
    return d.get("items", []), d.get("nextPageToken")


def fetch_until_window_closes(pl, n):
    """7일 창이 닫힐 때까지 페이지를 이어 받는다. 안전장치로 최대 5페이지."""
    items, token = fetch(pl, n)
    pages = 1
    while token and pages < 5 and items:
        last = datetime.fromisoformat(items[-1]["snippet"]["publishedAt"].replace("Z", "+00:00"))
        if last < CUT:
            break
        more, token = fetch(pl, n, token)
        if not more:
            break
        items += more
        pages += 1
    return items, pages

def within(items, name):
    out = []
    for it in items:
        s = it["snippet"]
        pub = datetime.fromisoformat(s["publishedAt"].replace("Z", "+00:00"))
        if pub < CUT:
            continue
        vid = it["contentDetails"]["videoId"]
        out.append({"channel": name, "videoId": vid, "title": s["title"],
                    "description": (s.get("description") or "")[:1500],
                    "publishedAt": s["publishedAt"],
                    "link": f"https://www.youtube.com/watch?v={vid}"})
    return out

allv = []
for c in CHANS:
    pl = "UU" + c["channelId"][2:]
    items, _ = fetch(pl, 20)
    got = within(items, c["name"])
    if len(got) == 20:
        items, pages = fetch_until_window_closes(pl, 50)
        got = within(items, c["name"])
        extra = f", {pages}페이지" if pages > 1 else ""
        print(f"  ({c['name']}: 20건 상한 → 50개 재조회{extra} → {len(got)}건)")
    print(f"{c['name']:28} {len(got)}")
    allv += got

allv.sort(key=lambda v: v["publishedAt"], reverse=True)
json.dump(allv, open(f"{SCR}/week_videos_raw.json", "w"), ensure_ascii=False, indent=1)
print("TOTAL", len(allv))
