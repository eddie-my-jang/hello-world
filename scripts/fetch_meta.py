"""digest_data.json 의 영상들에 durationSec / views 를 채운다 (videos.list, 50개씩 배치)."""
import urllib.request, json, os, re

SCR = os.environ["YT_SCRATCH"]; API_KEY = os.environ["YT_API_KEY"]
d = json.load(open(f"{SCR}/digest_data.json"))
ids = [v["videoId"] for v in d["videos"]]

def iso(s):
    if not s: return 0
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s)
    if not m: return 0
    dd, h, mi, se = (int(x) if x else 0 for x in m.groups())
    return ((dd * 24 + h) * 60 + mi) * 60 + se

meta = {}
for i in range(0, len(ids), 50):
    batch = ",".join(ids[i:i+50])
    u = ("https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics"
         f"&id={batch}&key={API_KEY}")
    for it in json.load(urllib.request.urlopen(u, timeout=25)).get("items", []):
        # 진행 중·예정 라이브, 방금 올라온 영상은 contentDetails에 duration이 아예 없다
        meta[it["id"]] = (iso(it["contentDetails"].get("duration")),
                          int(it.get("statistics", {}).get("viewCount", 0) or 0))

miss = 0
for v in d["videos"]:
    ds, vw = meta.get(v["videoId"], (0, 0))
    if v["videoId"] not in meta: miss += 1
    v["durationSec"] = ds; v["views"] = vw

json.dump(d, open(f"{SCR}/digest_data.json", "w"), ensure_ascii=False, indent=1)
print(f"meta {len(meta)}/{len(ids)}  missing={miss}  zero-duration="
      f"{sum(1 for v in d['videos'] if not v['durationSec'])}")
