"""keyword_evidence.json(채택분) → digest_data.json 의 dailyKeywords/weeklyKeywords/videos[].tags"""
import json, os
from datetime import datetime, timezone, timedelta

SCR = os.environ["YT_SCRATCH"]
GEN = datetime.now(timezone.utc)
d = json.load(open(f"{SCR}/digest_data.json"))
d["generatedAt"] = GEN.isoformat(timespec="seconds").replace("+00:00", "Z")
raw = {v["videoId"]: v for v in json.load(open(f"{SCR}/week_videos_raw.json"))}
ev = [k for k in json.load(open(f"{SCR}/keyword_evidence.json"))
      if k["verdict"] == "채택" and k["label"] != "AI 에이전트"]   # 대조군은 태그로 쓰지 않는다

def entry(k):
    c, g = k["corpus"], k["global"]
    return {"label": k["label"], "term": k["term"], "tier": k["tier"],
            "evidence": {"corpusRecent": c["recentHits"], "corpusBase": c["baseHits"],
                         "corpusChannels": len(c["channels"]), "corpusLift": c["lift"],
                         "corpusSurge": c["surge"], "trendTier": g["tier"],
                         "trendRatio": g["ratio"], "trendStable": g["stable"],
                         "source": k["source"]}}

def text(vid):
    r = raw.get(vid)
    v = next(x for x in d["videos"] if x["videoId"] == vid)
    return ((r["title"] + " " + r["description"]) if r else (v["title"] + " " + v["summary"])).lower()

# 영상별 태그
for v in d["videos"]:
    t = text(v["videoId"])
    v["tags"] = [k["label"] for k in ev if any(a in t for a in k["aliases"])]

CUT = GEN - timedelta(hours=24)
today = [v for v in d["videos"]
         if datetime.fromisoformat(v["publishedAt"].replace("Z", "+00:00")) >= CUT]
today_labels = {l for v in today for l in v["tags"]}

RANK = {"급상승": 0, "상승": 1}
srt = sorted(ev, key=lambda k: (RANK[k["tier"]], -len(k["corpus"]["channels"]),
                                -(k["corpus"]["lift"] or 99)))
d["dailyKeywords"]  = [entry(k) for k in srt if k["label"] in today_labels][:3]
d["weeklyKeywords"] = [entry(k) for k in srt][:4]
json.dump(d, open(f"{SCR}/digest_data.json", "w"), ensure_ascii=False, indent=1)

print("generatedAt", d["generatedAt"], "/ 오늘 영상", len(today))
print("daily :", [k["label"] for k in d["dailyKeywords"]])
print("weekly:", [k["label"] + "(" + k["tier"] + ")" for k in d["weeklyKeywords"]])
print("태그 붙은 영상", sum(1 for v in d["videos"] if v["tags"]), "/", len(d["videos"]))
for k in ev:
    print(" ", k["label"], "→", [v["videoId"] + " " + v["title"][:48] for v in d["videos"] if k["label"] in v["tags"]][:8])
