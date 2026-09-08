"""추적 채널의 최근 7일 영상을 모두 모아 week_videos_raw.json 생성.

7일 이내 건수가 정확히 maxResults와 같으면 목록이 잘린 것이므로 그 채널만 50개로 재조회한다.
"""
import urllib.request, json, os
from datetime import datetime, timezone, timedelta

SCR = os.environ["YT_SCRATCH"]
API_KEY = os.environ["YT_API_KEY"]
CUT = datetime.now(timezone.utc) - timedelta(days=7)

CHANS = json.load(open(f"{SCR}/digest_data.json"))["channels"]

def fetch(pl, n):
    u = ("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails"
         f"&playlistId={pl}&maxResults={n}&key={API_KEY}")
    return json.load(urllib.request.urlopen(u, timeout=25)).get("items", [])

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
    items = fetch(pl, 20)
    got = within(items, c["name"])
    if len(got) == 20:
        items = fetch(pl, 50)
        got = within(items, c["name"])
        print(f"  ({c['name']}: 20건 상한 → 50개 재조회 → {len(got)}건)")
    print(f"{c['name']:28} {len(got)}")
    allv += got

allv.sort(key=lambda v: v["publishedAt"], reverse=True)
json.dump(allv, open(f"{SCR}/week_videos_raw.json", "w"), ensure_ascii=False, indent=1)
print("TOTAL", len(allv))
