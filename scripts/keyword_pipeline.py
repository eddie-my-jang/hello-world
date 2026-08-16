"""키워드 태그 근거 검증 파이프라인 (discover / verify 2단계).

외부망은 googleapis.com만 열려 있어 YouTube Data API 기반으로 구성한다.
  A. 코퍼스 추세 — 추적 채널 백카탈로그에서 최근 7일 vs 8~60일 언급률 (정확·무료)
  B. 글로벌 검색 추세 — search.list totalResults. 단 이 값은 추정치라 동일 쿼리에도
     10배 넘게 흔들린다(실측). 창마다 2회 샘플링하고, 두 값의 배율이 2배를 넘으면
     추정이 불안정한 것으로 보고 2회 더 뽑아 중앙값을 쓴다. 그래도 흔들리면 등급을
     "불안정"으로 두고 글로벌 신호를 판정에서 배제한다 (A의 코퍼스 근거로만 판단).
     안정적일 때도 숫자가 아닌 등급으로만 판단.
  C. 공식 표기 출처 — 벤더 공식 채널 영상을 우선 인용해 표기의 근거를 남긴다.

사용법:
  python3 keyword_pipeline.py fetch                 # 코퍼스 수집 (15 units)
  python3 keyword_pipeline.py discover              # 급상승 교차채널 n-gram 후보 출력 (0 units)
  python3 keyword_pipeline.py verify cand.json      # 검증 (후보당 4 calls = 400 units)

cand.json 형식:
  [{"label":"오픈 모델","term":"open models","aliases":["open model","open models","오픈모델"]}, ...]
"""
import urllib.request, json, urllib.parse, os, re, sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta

# 데이터 파일은 SCR(작업 디렉터리)에 둔다. 레포에서 실행할 때는 YT_SCRATCH로 지정.
SCR = os.environ.get("YT_SCRATCH") or os.path.dirname(os.path.abspath(__file__))
# API 키는 레포에 두지 않는다 — 트리거 prompt가 환경변수로 넘겨준다.
API_KEY = os.environ["YT_API_KEY"]
CORPUS = f"{SCR}/corpus_history.json"
CACHE = f"{SCR}/trend_cache.json"

OFFICIAL = {"Anthropic", "OpenAI", "NVIDIA", "Scale AI", "Palantir"}
INSTITUTIONAL = {"a16z", "Y Combinator"}
NOW = datetime.now(timezone.utc)


def _api(url):
    return json.load(urllib.request.urlopen(url, timeout=25))


# ---------- fetch ----------
def cmd_fetch():
    """digest_data.json 의 channels 를 그대로 써서 채널별 최근 50개 업로드를 모은다."""
    chans = json.load(open(f"{SCR}/digest_data.json"))["channels"]
    pool = []
    for c in chans:
        pl = "UU" + c["channelId"][2:]          # UC... -> UU... (uploads playlist)
        u = ("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails"
             f"&playlistId={pl}&maxResults=50&key={API_KEY}")
        try:
            d = _api(u)
        except Exception as e:
            print("ERR", c["name"], e)
            continue
        for it in d.get("items", []):
            s = it["snippet"]
            pool.append({"channel": c["name"], "videoId": it["contentDetails"]["videoId"],
                         "publishedAt": s["publishedAt"], "title": s["title"],
                         "description": (s.get("description") or "")[:1200]})
    pool.sort(key=lambda v: v["publishedAt"], reverse=True)
    json.dump(pool, open(CORPUS, "w"), ensure_ascii=False, indent=1)
    print(f"corpus {len(pool)} videos / oldest {pool[-1]['publishedAt']}")


def load_pool():
    pool = json.load(open(CORPUS))
    for v in pool:
        v["_age"] = (NOW - datetime.fromisoformat(
            v["publishedAt"].replace("Z", "+00:00"))).total_seconds() / 86400
        v["_text"] = (v["title"] + " " + v["description"]).lower()
    return pool


STOP = set("""the a an and or but if then than that this these those of in on at to for with from by as is are was were be been
being it its you your we our they their he she his her i me my will would can could should may might must have has had do does
did not no nor so such only own same too very just now more most other some any each few all about into over under again further
once here there both between during before after above below up down out off what when where which who whom why how let s t don
episode full podcast subscribe watch video channel apply link links follow twitter linkedin instagram newsletter chapters intro
timestamps join us get learn work startup startups company companies build building built make making made use using used need
needs want going go goes talk talks talking say says said think thinks people time year years today week new one two three first
last next best top big great good better""".split())


def toks(t):
    t = re.sub(r"https?://\S+", " ", t.lower())
    t = re.sub(r"[^a-z0-9가-힣\s\-]", " ", t)
    return [w for w in t.split() if len(w) > 1]


def grams(v):
    ws = toks(v["title"] + " . " + v["description"][:400])
    out = set()
    for n in (2, 3):
        for i in range(len(ws) - n + 1):
            g = ws[i:i + n]
            if any(w in STOP for w in g):
                continue
            out.add(" ".join(g))
    return out


# ---------- discover ----------
def cmd_discover():
    """최근 7일에 여러 채널에 걸쳐 급증한 표현을 뽑는다.
    교차채널 조건이 인물명·행사명 같은 고유명사를 걸러준다."""
    pool = load_pool()
    recent = [v for v in pool if v["_age"] <= 7]
    base = [v for v in pool if 7 < v["_age"] <= 60]
    R, B = len(recent), len(base)
    r_n, r_ch, b_n = defaultdict(int), defaultdict(set), defaultdict(int)
    for v in recent:
        for g in grams(v):
            r_n[g] += 1
            r_ch[g].add(v["channel"])
    for v in base:
        for g in grams(v):
            b_n[g] += 1
    rows = []
    for g, n in r_n.items():
        if n < 2 or len(r_ch[g]) < 2:
            continue
        lift = (n / R) / (b_n[g] / B) if b_n.get(g) else float("inf")
        rows.append((g, n, len(r_ch[g]), b_n.get(g, 0), lift, sorted(r_ch[g])))
    rows.sort(key=lambda x: (-x[4], -x[1]))
    print(f"최근 7일 {R}개 / 기준 8~60일 {B}개 영상")
    print(f"{'phrase':<34} {'영상':<4} {'채널':<4} {'기준':<5} {'lift':<7} 등장 채널")
    print("-" * 104)
    for g, n, nc, b, lift, chs in rows[:30]:
        lv = "신규" if lift == float("inf") else f"{lift:.1f}x"
        print(f"{g:<34} {n:<4} {nc:<4} {b:<5} {lv:<7} {', '.join(chs)[:44]}")


# ---------- verify ----------
def _search(q, a, b, n, cache):
    key = f"{q}|{a}|{n}"
    if key in cache:
        return cache[key]
    u = ("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1"
         f"&q={urllib.parse.quote(q)}&publishedAfter={a}&publishedBefore={b}&key={API_KEY}")
    try:
        cache[key] = _api(u)["pageInfo"]["totalResults"]
    except Exception as e:
        print("  search ERR", q, e)
        cache[key] = None
    json.dump(cache, open(CACHE, "w"))
    return cache[key]


def _median(xs):
    s = sorted(xs)
    n = len(s)
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


def _window(q, a, b, cache):
    """한 창을 2회 샘플링하고, 두 값이 2배 넘게 벌어지면 2회 더 뽑는다.
    대표값은 중앙값. 안정 판정은 최댓값/최솟값이 아니라 '중앙값 주변에 몇 개가 모이는지'로 한다
    — 4개 중 1개만 튀는 경우(실측 다수)를 불안정으로 오판하지 않기 위함.
    반환: (대표값 or None, 샘플들, 안정 여부)"""
    xs = [x for x in (_search(q, a, b, i, cache) for i in (1, 2)) if x is not None]
    if len(xs) >= 2 and max(xs) / min(xs) > 2:      # 흔들림 → 추가 샘플링 (200 units)
        xs += [x for x in (_search(q, a, b, i, cache) for i in (3, 4)) if x is not None]
    if not xs:
        return None, xs, False
    med = _median(xs)
    core = [x for x in xs if med / 1.5 <= x <= med * 1.5]
    return med, xs, len(core) >= max(2, len(xs) - 1)


def cmd_verify(path):
    pool = load_pool()
    cands = json.load(open(path))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    today = NOW.date()
    R_A = (today - timedelta(days=30)).isoformat() + "T00:00:00Z"
    R_B = today.isoformat() + "T00:00:00Z"
    P_A = (today - timedelta(days=395)).isoformat() + "T00:00:00Z"
    P_B = (today - timedelta(days=365)).isoformat() + "T00:00:00Z"

    recent = [v for v in pool if v["_age"] <= 7]
    base = [v for v in pool if 7 < v["_age"] <= 60]

    print(f"{'라벨':<18} {'공식표기':<26} {'코퍼스':<14} {'채널':<4} {'lift':<7}{'급등':<5} "
          f"{'글로벌':<9} {'배율':<6} {'등급':<6} {'판정':<20} 출처")
    print("-" * 150)
    out = []
    for c in cands:
        pat = [a.lower() for a in c["aliases"]]
        hit = lambda v: any(p in v["_text"] for p in pat)
        rh, bh = [v for v in recent if hit(v)], [v for v in base if hit(v)]
        r_rate = len(rh) / len(recent) if recent else 0
        b_rate = len(bh) / len(base) if base else 0

        q = f'"{c["term"]}"'
        r_med, rs, r_ok = _window(q, R_A, R_B, cache)
        p_med, ps, p_ok = _window(q, P_A, P_B, cache)
        stable = r_ok and p_ok
        if r_med and p_med and stable:
            ratio = r_med / p_med
            g_tier = ("급상승" if ratio >= 5 else "상승" if ratio >= 2
                      else "정착" if ratio >= 0.7 else "포화·하락")
        elif r_med and p_med:
            # 재샘플링해도 추정이 안 잡히면 글로벌 신호는 버린다 (잘못된 등급보다 무등급이 낫다)
            ratio, g_tier = None, "불안정"
        else:
            ratio, g_tier = None, "unknown"

        src = None
        for grp, nm in ((OFFICIAL, "official"), (INSTITUTIONAL, "institutional")):
            for v in rh:
                if v["channel"] in grp:
                    src = {"tier": nm, "channel": v["channel"], "title": v["title"],
                           "link": f"https://www.youtube.com/watch?v={v['videoId']}"}
                    break
            if src:
                break
        if not src and rh:
            src = {"tier": "community", "channel": rh[0]["channel"], "title": rh[0]["title"],
                   "link": f"https://www.youtube.com/watch?v={rh[0]['videoId']}"}

        # 두 축을 각각 독립적으로 판정하고 점수로 합산한다.
        #  · 코퍼스 급등 — 추적 채널 15개를 전수 조사한 값이라 신뢰도가 가장 높다.
        #                 직전 8~60일에 아예 없었거나(신규), 언급률이 3배 이상 뛴 경우.
        #  · 글로벌 상승 — search.list 추정치. 노이즈가 커서 보조 신호로만 쓴다.
        # 어느 한 축도 안 움직이면 '변화를 보여준다'는 태그의 목적에 맞지 않으므로 제외.
        n_ch = len({v["channel"] for v in rh})
        corpus_lift = (r_rate / b_rate) if b_rate else None
        corpus_surge = len(rh) >= 2 and n_ch >= 2 and (b_rate == 0 or corpus_lift >= 3)
        global_rising = g_tier in ("급상승", "상승")

        if len(rh) < 2:
            vd, tier = "제외(코퍼스 근거 부족)", None
        elif corpus_surge and global_rising:
            vd, tier = "채택", "급상승"
        elif corpus_surge or global_rising:
            vd, tier = "채택", "상승"
        else:
            vd, tier = "제외(범용어·변화없음)", None

        out.append({**c, "tier": tier, "verdict": vd,
                    "corpus": {"recentHits": len(rh), "recentTotal": len(recent),
                               "baseHits": len(bh), "baseTotal": len(base),
                               "channels": sorted({v["channel"] for v in rh}),
                               "lift": round(corpus_lift, 2) if corpus_lift else None,
                               "surge": corpus_surge},
                    "global": {"tier": g_tier, "ratio": round(ratio, 1) if ratio else None,
                               "stable": stable, "rising": global_rising,
                               "recentSamples": rs, "priorSamples": ps},
                    "source": src})
        cp = f"{len(rh)}/{len(recent)} vs {len(bh)}/{len(base)}"
        s = f"{src['tier']}:{src['channel']}" if src else "-"
        lf = "신규" if b_rate == 0 else f"{corpus_lift:.1f}x"
        print(f"{c['label']:<18} {c['term']:<26} {cp:<14} {len(set(v['channel'] for v in rh)):<4} "
              f"{lf:<7}{'Y' if corpus_surge else '·':<5} {g_tier:<9} "
              f"{str(round(ratio,1) if ratio else '-'):<6} {str(tier):<6} {vd:<20} {s}")

    json.dump(out, open(f"{SCR}/keyword_evidence.json", "w"), ensure_ascii=False, indent=2)
    print("\n→ keyword_evidence.json 저장")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "discover"
    if cmd == "fetch":
        cmd_fetch()
    elif cmd == "discover":
        cmd_discover()
    elif cmd == "verify":
        cmd_verify(sys.argv[2])
    else:
        print(__doc__)
