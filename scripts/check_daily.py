import urllib.request, json, os
from datetime import datetime, timezone, timedelta
API_KEY = os.environ["YT_API_KEY"]
STATE = [
 ("AI Frontier Korea (노정석)","UUz-BiVywYdO6iXhjXkw_Kgw","9Qf_QLt7IWY"),
 ("OpenAI","UUXZCJLdBC09xxGZ6gcdrc6A","QDLlQ5IL2Bk"),
 ("No Priors","UUSI7h9hydQ40K5MJHnCrQvw","MxM7Wr_NU9Q"),
 ("Y Combinator","UUcefcZRL2oaA_uBNeo5UOWg","n9xKblqyQ28"),
 ("AI Engineer","UULKPca3kwwd-B59HNr-_lvA","5Cxe5dv2Xlw"),
 ("Palantir","UUwed6_f0WcDIioXvMQfcP2Q","ga0GPkO21dU"),
 ("a16z","UU9cn0TuPq4dnbTY-CBsm8XA","x5oPLU4Wi0E"),
 ("Anthropic","UUrDwWp7EBBv4NwvScIpBDOA","uVS88gnaxcg"),
 ("NVIDIA","UUHuiy8bXnmK5nisYHUd1J5g","TaqNUvMCRBs"),
 ("Turing Post TV","UU5M-w62kRmrD3-Saf-qGTug","erhL3qo5HOM"),
 ("Dwarkesh Patel","UUXl4i9dYBrFOabk0xGmbkRA","imodZWltU8Q"),
 ("AI Explained","UUNJ1Ymd5yFuUPtn21xtRbbw","Spuza-KwTJ4"),
 ("Matt Turck","UUQID78IY6EOojr5RUdD47MQ","KHfVcu4J-Is"),
 ("Scale AI","UUAHS4cP-uIXdrpCsSfGq_OA","j9Qr5aUfqNU"),
 ("sudoremove","UUdwVtI_TclbVf7QRC_hvc_Q","iuO7tqGBOh0"),
]
def fetch(pl, n):
    u = ("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails"
         f"&playlistId={pl}&maxResults={n}&key={API_KEY}")
    return json.load(urllib.request.urlopen(u, timeout=25)).get("items", [])
def scan(items, last):
    out, found = [], False
    for it in items:
        vid = it["contentDetails"]["videoId"]
        if vid == last:
            found = True; break
        s = it["snippet"]
        out.append({"videoId": vid, "title": s["title"], "publishedAt": s["publishedAt"]})
    return out, found
try:
    PREV = {v["videoId"] for v in json.load(open("digest_data.json"))["videos"]}
except Exception:
    PREV = set()
CUT2 = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat().replace("+00:00","Z")
res, total = {}, 0
for name, pl, last in STATE:
    items = fetch(pl, 10)
    new, found = scan(items, last)
    if len(new) == 10:
        items = fetch(pl, 50); new, found = scan(items, last)
        print(f"  ({name}: 10개 상한에 걸려 50개로 재조회 → {len(new)}건)")
    if not found:
        kept = [v for v in new if v["videoId"] not in PREV and v["publishedAt"] >= CUT2]
        print(f"  ! {name}: 기준 영상 {last} 이 목록에 없음(삭제·비공개 추정). "
              f"{len(new)}건 → 기보고분 제외·최근 2일 기준 {len(kept)}건")
        new = kept
    else:
        new = [v for v in new if v["videoId"] not in PREV]
    res[name] = {"new": new, "latest": items[0]["contentDetails"]["videoId"] if items else last}
    total += len(new)
    print(f"{name:28} {len(new)} new")
json.dump(res, open("daily_check_results.json","w"), ensure_ascii=False, indent=1)
print("TOTAL NEW:", total)
