"""챕터 키워드 엔진 — '이번 주의 키워드 / 이번 달의 키워드'를 고른다.

왜 바꿨나 (2026-10-22 개편)
  예전 방식(최근 7일 코퍼스 급등 × 검색량 전년비)은 '많이 언급된 범주'를 골랐고, 그래서
  "에이전트 평가", "에이전트 거버넌스", "AI 사이버보안" 같은 일반어로 흘렀다. 글로벌 검색량
  추정치는 같은 쿼리에도 10배씩 흔들려 대조군(AI 에이전트)까지 채택되곤 했다.
  우리가 원하는 것은 하네스·RLVR·컨텍스트 엔지니어링·Claw·RSI·AI 롤업처럼 '새 챕터를 연'
  이름 붙은 개념이다. 이런 개념은 시계열 모양이 같다: 몇 달 공백 → 여러 채널에서 동시에
  출현 → 몇 주·몇 달 동안 유지. 일주일 반짝(모델 출시, 사건)은 출현 후 바로 꺼진다.

구조
  1. 개념 사전(concepts.json) — 등재 기준: ① 이름 붙은 용어(신조어·약어·장르명)로 정의가 가능할 것
     ② '무엇 이후의 무엇'이라는 전환을 표시할 것 ③ 제품·모델·회사·인물·사건 이름이 아닐 것
     (단 제품명이 장르명이 된 경우는 허용: Claw) ④ 범주어(보안·평가·거버넌스·코딩 에이전트 등,
     generic_block)가 아닐 것.
  2. 이력 코퍼스(corpus_full.json, backfill_corpus.py) — 20개 채널의 2025-01 이후 전체 업로드.
  3. 언급 판정 — 채널마다 반복되는 문구(구독 안내·스폰서·행사 홍보)를 자동 제거하고, URL·@핸들을
     지운 뒤, 위치별 가중치(제목 2, 본문 1, 타임스탬프 목차 줄 0.5, 해시태그 0.5)를 더해 1 이상일 때만
     '언급'으로 친다. 목차 한 줄·해시태그 하나·출처 링크 슬러그로는 언급이 성립하지 않는다.
  4. 생애주기 — 주(최근 7일 단위) × 채널 시계열로 출현 시점(4주 안에 2개 채널 이상이 처음 모인 때)과
     최근 8주 중 활동 주 수를 재서 등장 / 부상 / 챕터 / 정착 / 퇴조 / 잠잠 으로 나눈다.
  5. 선정 — 이주의 키워드: 이번 주 채널 수 + 지난주 이어짐 + 생각 리더 채널(드와케쉬·노정석 등) 가중,
     새로움(부상·챕터 우대, 정착 감점), 4주 가속도. 이달의 키워드: 최근 4주 지속 주 수·채널 수·
     생각 리더 채널 수. 둘 다 '2개 채널 이상 + 지속'이 문턱이라 한 채널의 몰아 올리기(컨퍼런스)나
     한 주 반짝은 올라오지 못한다.
  6. 새 용어 채굴(mine) — 사전에 없는 용어 후보를 최근 14일에서 뽑아 사람이(또는 일일 실행의 Claude가)
     등재 기준으로 심사한다. 자동 등재는 하지 않는다.

사용법 (YT_SCRATCH 필요)
  python3 chapter_keywords.py analyze          # 시계열·상태·선정 → chapters.json, 요약 출력
  python3 chapter_keywords.py audit <id> [n]    # 개념별 매칭 문맥 확인(오탐 점검)
  python3 chapter_keywords.py history          # 달마다 '그 시점의 이달의 키워드' 재현(백테스트)
  python3 chapter_keywords.py mine [days]       # 사전 밖 신규 용어 후보
  python3 chapter_keywords.py apply             # digest_data.json에 태그·이주/이달/오늘 키워드·연표 기록
"""
import json, os, re, sys
from collections import defaultdict, Counter
from datetime import datetime, timezone, timedelta

SCR = os.environ["YT_SCRATCH"]
HERE = os.path.dirname(os.path.abspath(__file__))
LEX_PATH = os.path.join(HERE, "concepts.json") if os.path.exists(os.path.join(HERE, "concepts.json")) \
    else f"{SCR}/concepts.json"
LEX = json.load(open(LEX_PATH))
CONCEPTS = LEX["concepts"]
THINKERS = set(LEX["thinker_channels"])
NOW = datetime.now(timezone.utc)

# ---------------------------------------------------------------- 텍스트 준비
URL = re.compile(r"https?://\S+|www\.\S+")
HANDLE = re.compile(r"(?<![\w.])@[\w.\-]+")
TS_LINE = re.compile(r"^\s*[-•▶*]?\s*\(?\d{1,2}:\d{2}(:\d{2})?\)?")
HASHTAG = re.compile(r"#[^\s#]+")


def norm_line(l):
    return re.sub(r"\d+", "#", l.strip().lower())


def boilerplate_by_channel(corpus):
    """채널 영상의 15% 이상(최소 4건)에 반복되는 줄은 채널 고정 문구로 보고 지운다.

    전체 이력과 최근 8주를 따로 본다 — 최근에 새로 붙기 시작한 홍보 문구(새 책·새 강의 광고)는
    전체 이력 기준으로는 15%가 안 돼서 빠져나가기 때문이다.
    """
    bp = defaultdict(set)
    for recent in (False, True):
        cnt, n = defaultdict(Counter), Counter()
        for v in corpus:
            if recent and week_idx(v) >= 8:
                continue
            n[v["channel"]] += 1
            lines = {norm_line(l) for l in v["description"].splitlines() if len(l.strip()) >= 8}
            cnt[v["channel"]].update(lines)
        for ch, c in cnt.items():
            th = max(4, 0.15 * n[ch])
            bp[ch] |= {l for l, k in c.items() if k >= th}
    return bp


def segments(v, bp):
    """[(가중치, 텍스트)] — 제목 2, 본문 줄 1, 타임스탬프 목차 줄·짧은 링크 라벨 줄 0.5, 해시태그 0.5"""
    segs = [(2.0, v["title"])]
    tags = []
    for l in v["description"].splitlines():
        if not l.strip() or norm_line(l) in bp.get(v["channel"], ()):
            continue
        had_url = bool(URL.search(l))
        l = HANDLE.sub(" ", URL.sub(" ", l))
        tags += HASHTAG.findall(l)
        l = HASHTAG.sub(" ", l)
        if not l.strip():
            continue
        # 'OOO 강의: <링크>' 같은 짧은 링크 라벨 줄은 목차 줄처럼 반만 센다
        link_label = had_url and len(l.strip()) < 60
        segs.append((0.5 if TS_LINE.match(l) or link_label else 1.0, l))
    if tags:
        segs.append((0.5, " ".join(t[1:].replace("_", " ") for t in tags)))
    return segs


def compile_concept(c):
    pats = [re.compile(p, re.I) for p in c.get("patterns", [])]
    pats += [re.compile(p) for p in c.get("cs", [])]
    excl = [re.compile(p, re.I) for p in c.get("exclude", [])]
    return pats, excl


COMPILED = {c["id"]: compile_concept(c) for c in CONCEPTS}


def match_video(v, bp, with_ctx=False):
    """{concept_id: weight} (weight>=1만), with_ctx면 {id: (weight, [문맥])}"""
    segs = segments(v, bp)
    full = "\n".join(s for _, s in segs)
    out = {}
    for c in CONCEPTS:
        pats, excl = COMPILED[c["id"]]
        if any(x.search(full) for x in excl):
            continue
        w, ctx, used = 0.0, [], set()
        for sw, s in segs:
            for p in pats:
                m = p.search(s)
                if m:
                    key = "title" if sw == 2.0 else ("ts" if sw == 0.5 else "body")
                    # 같은 위치 유형은 여러 번 나와도 본문만 최대 2까지 누적
                    if key in ("title",) and key in used:
                        break
                    used.add(key)
                    w += sw
                    if with_ctx:
                        a = max(0, m.start() - 60)
                        ctx.append(f"[{key}] …{s[a:m.end() + 50]}…".replace("\n", " "))
                    break
        w = min(w, 4.0)
        if w >= 1.0:
            out[c["id"]] = (w, ctx) if with_ctx else w
    return out


# ---------------------------------------------------------------- 시계열
def load_corpus():
    p = f"{SCR}/corpus_full.json"
    corpus = json.load(open(p))
    # 7일 창 원본(설명 1500자)보다 이력 코퍼스(5000자)를 우선한다. 7일 창에만 있는 영상은 보탠다.
    have = {v["videoId"] for v in corpus}
    wp = f"{SCR}/week_videos_raw.json"
    if os.path.exists(wp):
        for v in json.load(open(wp)):
            if v["videoId"] not in have:
                corpus.append({k: v[k] for k in ("channel", "videoId", "title", "description", "publishedAt")})
    return corpus


def pub(v):
    return datetime.fromisoformat(v["publishedAt"].replace("Z", "+00:00"))


def week_idx(v):
    return max(0, (NOW - pub(v)).days // 7)


def channel_weights(corpus, weeks=12):
    """업로드가 많은 채널의 언급은 덜 센다: w = sqrt(6 / 주당 업로드), 0.35~1.

    주 39건을 올리는 컨퍼런스 채널(AI Engineer)은 거의 모든 용어를 매주 한 번은 언급하므로,
    그 채널 하나만으로 '여러 주 지속'이 성립하지 않게 하려는 장치다.
    """
    n = Counter(v["channel"] for v in corpus if week_idx(v) < weeks)
    return {ch: max(0.35, min(1.0, (6 / max(k / weeks, 0.1)) ** 0.5)) for ch, k in n.items()}


def analyze(corpus=None, matches=None, bp=None):
    """matches(videoId -> {개념: 가중치})를 넘기면 매칭을 다시 하지 않는다(백테스트용)."""
    corpus = corpus or load_corpus()
    bp = bp or boilerplate_by_channel(corpus)
    cw = channel_weights(corpus)

    def ws(chs):
        return sum(cw.get(ch, 1.0) for ch in chs)

    W = max(week_idx(v) for v in corpus) + 1
    months = sorted({v["publishedAt"][:7] for v in corpus})
    hits = defaultdict(list)                       # id -> [(video, weight)]
    for v in corpus:
        m = matches[v["videoId"]] if matches is not None else match_video(v, bp)
        for cid, w in m.items():
            hits[cid].append((v, w))
    res = {}
    for c in CONCEPTS:
        cid = c["id"]
        wk = [set() for _ in range(W)]
        mo = defaultdict(set)
        for v, _ in hits[cid]:
            wk[week_idx(v)].add(v["channel"])
            mo[v["publishedAt"][:7]].add(v["channel"])
        # 출현: 4주 창(그 주 포함 이후 3주)에 서로 다른 채널 2개 이상(가중 합 1 이상)이 처음 모인 주
        em = None
        for w in range(W - 1, -1, -1):
            u = set().union(*wk[max(0, w - 3):w + 1])
            if len(u) >= 2 and ws(u) >= 1.0:
                em = w
                break
        # 활동 주: 그 주 언급 채널의 가중 합이 0.5 이상 (대량 업로드 채널 단독은 활동으로 안 침)
        pres = [1 if ws(s) >= 0.5 else 0 for s in wk]
        a4, a8 = sum(pres[:4]), sum(pres[:8])
        ch4 = set().union(*wk[:4])
        ch_prev4 = set().union(*wk[4:8])
        th4 = sorted(ch4 & THINKERS)
        mser = [len(mo.get(m, ())) for m in months]
        peak = max(mser) if mser else 0
        pre_window = em is not None and em >= W - 3       # 코퍼스 첫 3주에 이미 있었음
        if em is None:
            status = "잠잠"
        elif em <= 4 and not pre_window:
            status = "등장"
        elif a8 >= 3 and em <= 16 and not pre_window:
            status = "부상"
        elif a8 >= 4 and em <= 52 and not pre_window:
            status = "챕터"
        elif a8 >= 4:
            status = "정착"
        elif peak >= 3 and a8 <= 2:
            status = "퇴조"
        elif a8 >= 2:
            status = "간헐"
        else:
            status = "잠잠"
        # 반짝 여부: 출현 후 8주 동안 활동 주가 2주 이하
        fad = em is not None and em >= 8 and sum(pres[max(0, em - 7):em + 1]) <= 2
        res[cid] = {
            "emergedWeek": em, "emerged": (NOW - timedelta(weeks=em)).strftime("%Y-%m") if em is not None else None,
            "preWindow": pre_window, "status": status, "fadAtBirth": fad,
            "active4": a4, "active8": a8, "channels4": sorted(ch4), "thinkers4": th4,
            "channelsPrev4": len(ch_prev4), "channelsNow": sorted(wk[0]), "channelsLastWeek": sorted(wk[1]),
            "w4": round(ws(ch4), 2), "wPrev4": round(ws(ch_prev4), 2),
            "wNow": round(ws(wk[0]), 2), "wLast": round(ws(wk[1]), 2),
            "weekly": [len(s) for s in wk[:12]][::-1], "monthly": mser, "months": months,
            "peakMonthChannels": peak, "videos4": sum(1 for v, _ in hits[cid] if week_idx(v) < 4),
            "totalVideos": len(hits[cid]),
        }
    return res, hits, bp


NOVELTY = {"등장": 1.0, "부상": 1.3, "챕터": 1.15, "정착": 0.45, "퇴조": 0.5, "간헐": 0.7, "잠잠": 0.7}


def score(r):
    """주 점수 = (이번 주 가중 채널 + 리더 채널 + 0.5×지난주) × 새로움 × 4주 가속도
    월 점수 = (4주 가중 채널 + 리더 채널 + 0.5×활동 주 수) × 새로움"""
    th_now = len(set(r["channelsNow"]) & THINKERS)
    accel = min(1.5, max(0.7, ((r["w4"] + 1) / (r["wPrev4"] + 1)) ** 0.5))
    wk = (r["wNow"] + th_now + 0.5 * r["wLast"]) * NOVELTY[r["status"]] * accel
    mo = (r["w4"] + len(r["thinkers4"]) + 0.5 * r["active4"]) * NOVELTY[r["status"]]
    return round(wk, 2), round(mo, 2)


def picks(res):
    rows = []
    for c in CONCEPTS:
        r = res[c["id"]]
        sw, sm = score(r)
        r["scoreWeek"], r["scoreMonth"] = sw, sm
        rows.append((c, r))
    # 정착·퇴조·잠잠은 배경어다 — 다시 급증(가속 1.3 이상, 이번 주 가중 2 이상)할 때만 후보가 된다
    def fresh(r):
        if r["status"] in ("등장", "부상", "챕터"):
            return True
        return r["wNow"] >= 2 and (r["w4"] + 1) / (r["wPrev4"] + 1) >= 1.69
    # 이주: 이번 주 2개 채널 이상 + (지난 2주에도 있었거나, 처음이라면 3개 채널 이상)
    wk_ok = [(c, r) for c, r in rows if fresh(r) and len(r["channelsNow"]) >= 2 and r["wNow"] >= 1.0 and
             (r["weekly"][-2] or r["weekly"][-3] or len(r["channelsNow"]) >= 3)]
    wk = sorted(wk_ok, key=lambda x: -x[1]["scoreWeek"])[:3]
    # 이달: 최근 4주 중 2주 이상 활동 + 3개 채널 이상(가중 합 2 이상)
    mo_ok = [(c, r) for c, r in rows if fresh(r) and r["active4"] >= 2 and len(r["channels4"]) >= 3 and r["w4"] >= 2]
    mo = sorted(mo_ok, key=lambda x: -x[1]["scoreMonth"])[:3]
    # 주목 후보: 문턱은 못 넘었지만 새로 움직이는 개념(이번 주 언급 + 정착·퇴조 아님)
    taken = {c["id"] for c, _ in wk + mo}
    watch = [(c, r) for c, r in rows if c["id"] not in taken and r["channelsNow"] and
             r["status"] in ("등장", "부상", "챕터", "간헐") and r["scoreWeek"] >= 0.8]
    watch = sorted(watch, key=lambda x: -x[1]["scoreWeek"])[:4]
    return rows, wk, mo, watch


def monthly_history(corpus, bp, matches=None, start="2025-03"):
    """각 달 말일 시점으로 시계를 돌려 '그때 이 엔진이 뽑았을 이달의 키워드'를 재현한다.

    그 시점 이후 데이터는 보지 않는다(사전은 현재 것을 쓰므로 용어 이름이 생기기 전 달은 비어 나온다).
    """
    global NOW
    real_now = NOW
    matches = matches or {v["videoId"]: match_video(v, bp) for v in corpus}
    out = []
    y, m = map(int, start.split("-"))
    try:
        while True:
            ny, nm = (y + 1, 1) if m == 12 else (y, m + 1)
            cut = datetime(ny, nm, 1, tzinfo=timezone.utc)
            label = f"{y:04d}-{m:02d}"
            if cut > real_now:
                break
            NOW = cut
            sub = [v for v in corpus if pub(v) < cut]
            res, _, _ = analyze(sub, matches, bp)
            _, wk, mo, _ = picks(res)
            out.append({"month": label, "picks": [{"id": c["id"], "label": c["label"], "status": r["status"]}
                                                  for c, r in mo]})
            y, m = ny, nm
    finally:
        NOW = real_now
    return out


# ---------------------------------------------------------------- 출력 도우미
def why(c, r, mode):
    th = [t.split(" (")[0] for t in r["thinkers4"]]
    bits = []
    if mode == "week":
        bits.append(f"이번 주 {len(r['channelsNow'])}개 채널")
        if r["channelsLastWeek"]:
            bits.append(f"지난주 {len(r['channelsLastWeek'])}개 채널에서 이어짐")
    else:
        bits.append(f"최근 4주 중 {r['active4']}주 연속·{len(r['channels4'])}개 채널")
    if th:
        bits.append("생각 리더 채널(" + "·".join(th[:3]) + ")도 다룸")
    if r["emerged"] and not r["preWindow"]:
        bits.append(f"{r['emerged'][:4]}년 {int(r['emerged'][5:])}월 등장")
    bits.append(r["status"])
    return " · ".join(bits)


def sources(cid, hits, n=3, weeks=4):
    rec = [(v, w) for v, w in hits[cid] if week_idx(v) < weeks]
    # 그 개념을 제목·본문에서 정면으로 다룬 영상(가중치 높은 것) 먼저, 같으면 생각 리더 채널·최신 순
    rec.sort(key=lambda x: (-x[1], x[0]["channel"] not in THINKERS, -pub(x[0]).timestamp()))
    out, seen = [], set()
    for v, _ in rec:
        if v["channel"] in seen:
            continue
        seen.add(v["channel"])
        out.append({"channel": v["channel"], "title": v["title"],
                    "link": f"https://www.youtube.com/watch?v={v['videoId']}"})
        if len(out) >= n:
            break
    return out


def entry(c, r, hits, mode):
    return {"id": c["id"], "label": c["label"], "term": c["term"], "kind": c["kind"],
            "status": r["status"], "def": c["def"], "lineage": c.get("lineage", ""),
            "why": why(c, r, mode),
            "evidence": {"channelsNow": len(r["channelsNow"]), "channelsLastWeek": len(r["channelsLastWeek"]),
                         "active4": r["active4"], "active8": r["active8"], "channels4": len(r["channels4"]),
                         "thinkers": r["thinkers4"], "emerged": r["emerged"], "since": c.get("since"),
                         "weekly": r["weekly"], "sources": sources(c["id"], hits)}}


# ---------------------------------------------------------------- 명령
def cmd_analyze():
    res, hits, _ = analyze()
    rows, wk, mo, watch = picks(res)
    json.dump({"generatedAt": NOW.isoformat(timespec="seconds"), "concepts": res},
              open(f"{SCR}/chapters.json", "w"), ensure_ascii=False)
    print(f"{'개념':16} {'상태':4} {'출현':7} 4주 8주 채널4 리더 이번주 지난주  주점수 월점수 | 최근12주 채널수")
    for c, r in sorted(rows, key=lambda x: -x[1]["scoreWeek"]):
        print(f"{c['label'][:16]:16} {r['status']:4} {str(r['emerged'] or '-'):7} {r['active4']:2} {r['active8']:3} "
              f"{len(r['channels4']):4} {len(r['thinkers4']):4} {len(r['channelsNow']):5} {len(r['channelsLastWeek']):5} "
              f"{r['scoreWeek']:6} {r['scoreMonth']:6} | " + "".join(f"{x:2}" if x else " ." for x in r["weekly"]))
    print("\n이주의 키워드:", [c["label"] for c, _ in wk])
    print("이달의 키워드:", [c["label"] for c, _ in mo])
    print("주목 후보:", [c["label"] for c, _ in watch])


def cmd_audit(cid, n=12):
    corpus = load_corpus()
    bp = boilerplate_by_channel(corpus)
    rows = []
    for v in corpus:
        m = match_video(v, bp, with_ctx=True)
        if cid in m:
            rows.append((v, m[cid]))
    rows.sort(key=lambda x: x[0]["publishedAt"], reverse=True)
    print(f"{cid}: {len(rows)}건")
    for v, (w, ctx) in rows[:n]:
        print(f"- {v['publishedAt'][:10]} {v['channel'][:14]:14} w={w} | {v['title'][:70]}")
        for x in ctx[:2]:
            print("     ", x[:170])


def cmd_history():
    corpus = load_corpus()
    bp = boilerplate_by_channel(corpus)
    for h in monthly_history(corpus, bp):
        print(h["month"], " · ".join(f"{p['label']}({p['status']})" for p in h["picks"]) or "—")


def cmd_mine(days=14):
    """사전 밖 신규 용어 후보: 최근 N일 2개 채널 이상 + 60일 이전 이력이 드문 것.

    인명·행사명·모델명이 섞여 나오는 것은 정상이다. 출력은 심사용 후보 목록이고, 등재 여부는
    concepts.json 상단 기준으로 사람이(또는 일일 실행의 Claude가) 판단한다.
    """
    corpus = load_corpus()
    bp = boilerplate_by_channel(corpus)
    lex_rx = [p for pats, _ in COMPILED.values() for p in pats]
    block = set(LEX["generic_block"])
    # 연사 이름(제목의 ' — 이름, 소속')과 채널명은 후보에서 뺀다
    names = set()
    for v in corpus:
        m = re.search(r"\s[—–-]\s([A-Z][\w.'\-]+(?: [A-Z][\w.'\-]+){0,3})(?:,| &|$)", v["title"])
        if m:
            names |= {m.group(1)} | set(m.group(1).split())
    STOP = {"the", "to", "of", "as", "for", "and", "a", "an", "in", "on", "with", "how", "why", "what"}
    COIN = re.compile(r"\b([a-z]+(?:pocalypse|maxx\w*|maxing|flation)|[a-z]+[- ]native|[a-z]+ 2\.0|vibe[- ][a-z]+)\b", re.I)
    TC = re.compile(r"\b((?:[A-Z][a-z]+|[A-Z]{2,}[a-z]?)(?:[ -](?:[A-Z][a-z]+|[A-Z]{2,})){1,2})\b")
    ACR = re.compile(r"\b([A-Z][A-Z0-9]{2,5}s?)\b")
    QUO = re.compile(r"[\"“‘]([A-Za-z가-힣][^\"”’]{3,40})[\"”’]")
    KOEN = re.compile(r"([가-힣][가-힣 ]{1,18})\s?\(([A-Za-z][A-Za-z0-9 .\-]{2,40})\)")
    HEAD = re.compile(r"\b([a-z][a-z\-]+ (?:engineering|learning|loops?|factor(?:y|ies)|coding|protocol|economy|"
                      r"economics|pricing|identity|commerce|swarms?|paradigm|scaling|labs?|software|intelligence|"
                      r"psychosis|explosion|horizon|trifecta|rot|graphs?|maxxing|moment|era|wall|gap|tax|layer|stack))\b")
    rec, old, ctx = defaultdict(set), Counter(), {}
    for v in corpus:
        age = (NOW - pub(v)).days
        if days < age <= 60:
            continue
        text = "\n".join(s for _, s in segments(v, bp))
        cands = {m.strip() for m in TC.findall(text)} | set(ACR.findall(text)) | \
            {m.strip() for m in QUO.findall(text)} | {f"{a.strip()} ({b.strip()})" for a, b in KOEN.findall(text)} | \
            set(HEAD.findall(text.lower())) | {m.lower() for m in COIN.findall(text)}
        for t in cands:
            if age <= days:
                rec[t].add(v["channel"])
                if t not in ctx:
                    i = text.find(t) if t in text else text.lower().find(t.lower())
                    ctx[t] = text[max(0, i - 50):i + len(t) + 50].replace("\n", " ")
            else:
                old[t] += 1
    rows = []
    for t, chs in rec.items():
        w = t.lower().split()
        if len(chs) < 2 or old[t] > 2 or t.lower() in block or t in names or w[0] in STOP or w[-1] in STOP:
            continue
        if any(t.startswith(c.split(" (")[0]) for c in chs) or any(p.search(t) for p in lex_rx):
            continue
        rows.append((len(chs), len(chs & THINKERS), t, sorted(chs)))
    rows.sort(key=lambda x: (-x[0], -x[1], x[2]))
    print(f"사전 밖 신규 후보 (최근 {days}일, 2개 채널 이상, 60일 이전 이력 ≤2건) — 등재는 심사 후")
    for n, th, t, chs in rows[:40]:
        print(f"  {n}ch{'*' if th else ' '} {t[:40]:40} {', '.join(c.split(' (')[0] for c in chs)[:60]}")
        print(f"        …{ctx[t][:150]}…")


def cmd_apply():
    corpus = load_corpus()
    bp = boilerplate_by_channel(corpus)
    matches = {v["videoId"]: match_video(v, bp) for v in corpus}
    history = monthly_history(corpus, bp, matches)
    res, hits, _ = analyze(corpus, matches, bp)
    rows, wk, mo, watch = picks(res)
    d = json.load(open(f"{SCR}/digest_data.json"))
    d["generatedAt"] = NOW.isoformat(timespec="seconds").replace("+00:00", "Z")
    raw = {v["videoId"]: v for v in json.load(open(f"{SCR}/week_videos_raw.json"))}
    full = {v["videoId"]: v for v in json.load(open(f"{SCR}/corpus_full.json"))}
    by_id = {c["id"]: c for c in CONCEPTS}
    for v in d["videos"]:
        src = full.get(v["videoId"]) or raw.get(v["videoId"]) or \
            {"channel": v["channel"], "title": v["title"], "description": v.get("summary", "")}
        src = {"channel": v["channel"], "title": src["title"], "description": src["description"],
               "publishedAt": v["publishedAt"], "videoId": v["videoId"]}
        m = match_video(src, bp)
        v["tags"] = [by_id[cid]["label"] for cid in sorted(m, key=lambda k: -res[k]["scoreWeek"])]
    cut = NOW - timedelta(hours=24)
    today_ids = set()
    for v in d["videos"]:
        if pub(v) >= cut:
            today_ids |= {c["id"] for c in CONCEPTS if c["label"] in v["tags"]}
    daily = sorted([(by_id[i], res[i]) for i in today_ids if res[i]["status"] != "잠잠"],
                   key=lambda x: -x[1]["scoreWeek"])[:3]
    d["dailyKeywords"] = [entry(c, r, hits, "week") for c, r in daily]
    d["weeklyKeywords"] = [entry(c, r, hits, "week") for c, r in wk]
    d["monthlyKeywords"] = [entry(c, r, hits, "month") for c, r in mo]
    d["watchKeywords"] = [entry(c, r, hits, "week") for c, r in watch]
    # 영상 태그로 붙은 개념은 모두 근거 시트를 열 수 있어야 하므로 따로 색인한다
    tagged = {t for v in d["videos"] for t in v["tags"]}
    d["conceptIndex"] = {c["label"]: entry(c, res[c["id"]], hits, "week") for c in CONCEPTS if c["label"] in tagged}
    tl = []
    for c, r in rows:
        if r["emerged"] is None or r["peakMonthChannels"] < 3:
            continue
        tl.append({"id": c["id"], "label": c["label"], "term": c["term"], "kind": c["kind"],
                   "status": r["status"], "emerged": None if r["preWindow"] else r["emerged"],
                   "since": c.get("since"), "lineage": c.get("lineage", ""), "def": c["def"],
                   "monthly": r["monthly"], "fad": r["fadAtBirth"]})
    tl.sort(key=lambda x: (x["emerged"] or x["since"] or "0000"))
    d["chapterTimeline"] = {"months": rows[0][1]["months"], "items": tl}
    # 지난달까지는 백테스트 결과, 이번 달(진행 중)은 오늘 기준 선정
    history.append({"month": NOW.strftime("%Y-%m"), "partial": True,
                    "picks": [{"id": c["id"], "label": c["label"], "status": r["status"]} for c, r in mo]})
    d["monthlyHistory"] = history
    json.dump(d, open(f"{SCR}/digest_data.json", "w"), ensure_ascii=False, indent=1)
    print("이주의 키워드:", [(c["label"], r["status"], r["scoreWeek"]) for c, r in wk])
    print("이달의 키워드:", [(c["label"], r["status"], r["scoreMonth"]) for c, r in mo])
    print("주목 후보:", [(c["label"], r["status"], r["scoreWeek"]) for c, r in watch])
    print("오늘 등장:", [c["label"] for c, _ in daily])
    print("태그 붙은 영상", sum(1 for v in d["videos"] if v["tags"]), "/", len(d["videos"]),
          "| 연표 항목", len(tl))


if __name__ == "__main__":
    a = sys.argv[1:] or ["analyze"]
    if a[0] == "analyze":
        cmd_analyze()
    elif a[0] == "audit":
        cmd_audit(a[1], int(a[2]) if len(a) > 2 else 12)
    elif a[0] == "history":
        cmd_history()
    elif a[0] == "mine":
        cmd_mine(int(a[1]) if len(a) > 1 else 14)
    elif a[0] == "apply":
        cmd_apply()
    else:
        print(__doc__)
