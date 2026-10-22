import json, base64

import os
# 스크래치패드 절대경로. 트리거 실행 시 YT_SCRATCH로 넘겨준다.
SCR = os.environ["YT_SCRATCH"]

def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

fonts = {
    "bsd600": b64(f"{SCR}/fonts/bsd600.ttf"),
    "bsd800": b64(f"{SCR}/fonts/bsd800.ttf"),
    "ps400": b64(f"{SCR}/fonts/ps400.ttf"),
    "ps500": b64(f"{SCR}/fonts/ps500.ttf"),
    "ps600": b64(f"{SCR}/fonts/ps600.ttf"),
    "jbm400": b64(f"{SCR}/fonts/jbm400.ttf"),
    "jbm600": b64(f"{SCR}/fonts/jbm600.ttf"),
}

digest = json.load(open(f"{SCR}/digest_data.json"))
videos = digest["videos"]
generated_at = digest["generatedAt"]
channels = digest["channels"]
daily_summary = digest.get("dailySummary", "")
weekly_summary = digest.get("weeklySummary", "")
daily_keywords = digest.get("dailyKeywords", [])
weekly_keywords = digest.get("weeklyKeywords", [])
monthly_keywords = digest.get("monthlyKeywords", [])
watch_keywords = digest.get("watchKeywords", [])
concept_index = digest.get("conceptIndex", {})
monthly_history = digest.get("monthlyHistory", [])
chapter_timeline = digest.get("chapterTimeline", {"months": [], "items": []})

CATEGORY_LABELS = {
    "offering": "오퍼링 후보",
    "competitor": "경쟁사·레퍼런스",
    "trend": "기술 트렌드",
}

videos_json = json.dumps(videos, ensure_ascii=False)
channels_json = json.dumps(channels, ensure_ascii=False)
daily_summary_json = json.dumps(daily_summary, ensure_ascii=False)
weekly_summary_json = json.dumps(weekly_summary, ensure_ascii=False)
daily_keywords_json = json.dumps(daily_keywords, ensure_ascii=False)
weekly_keywords_json = json.dumps(weekly_keywords, ensure_ascii=False)
monthly_keywords_json = json.dumps(monthly_keywords, ensure_ascii=False)
watch_keywords_json = json.dumps(watch_keywords, ensure_ascii=False)
concept_index_json = json.dumps(concept_index, ensure_ascii=False)
monthly_history_json = json.dumps(monthly_history, ensure_ascii=False)
chapter_timeline_json = json.dumps(chapter_timeline, ensure_ascii=False)

html = f"""<title>AI 브리핑 · 화학전지사업부</title>
<style>
@font-face {{
  font-family: 'Big Shoulders Display';
  font-weight: 600;
  src: url(data:font/ttf;base64,{fonts['bsd600']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'Big Shoulders Display';
  font-weight: 800;
  src: url(data:font/ttf;base64,{fonts['bsd800']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'Public Sans';
  font-weight: 400;
  src: url(data:font/ttf;base64,{fonts['ps400']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'Public Sans';
  font-weight: 500;
  src: url(data:font/ttf;base64,{fonts['ps500']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'Public Sans';
  font-weight: 600;
  src: url(data:font/ttf;base64,{fonts['ps600']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'JetBrains Mono';
  font-weight: 400;
  src: url(data:font/ttf;base64,{fonts['jbm400']}) format('truetype');
  font-display: swap;
}}
@font-face {{
  font-family: 'JetBrains Mono';
  font-weight: 600;
  src: url(data:font/ttf;base64,{fonts['jbm600']}) format('truetype');
  font-display: swap;
}}

:root {{
  --bg: #FFFFFF;
  --bar: #FFFFFF;
  --surface: #F2F2F2;
  --surface-2: #E5E5E5;
  --ink: #0F0F0F;
  --ink-dim: #606060;
  --line: #E5E5E5;
  --chip-bg: #F2F2F2;
  --chip-on-bg: #0F0F0F;
  --chip-on-ink: #FFFFFF;
  --accent: #C86A1B;
  --accent-strong: #A6570F;
  --accent-tint: #FBEEE0;
  --new-dot: #065FD4;
  --alert: #CC0000;
  --cat-offering: #2B6E63;
  --cat-trend: #3D5A80;
  --cat-competitor: #6B5B7B;
  --thumb-ink: rgba(255,255,255,0.92);
}}

@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #0F0F0F;
    --bar: #0F0F0F;
    --surface: #212121;
    --surface-2: #303030;
    --ink: #F1F1F1;
    --ink-dim: #AAAAAA;
    --line: #272727;
    --chip-bg: #272727;
    --chip-on-bg: #F1F1F1;
    --chip-on-ink: #0F0F0F;
    --accent: #E8944A;
    --accent-strong: #F0A868;
    --accent-tint: #2A1D10;
    --new-dot: #3EA6FF;
    --alert: #FF4E45;
    --cat-offering: #6FBFAE;
    --cat-trend: #8FB0D6;
    --cat-competitor: #B9A6CB;
    --thumb-ink: rgba(255,255,255,0.94);
  }}
}}

:root[data-theme="dark"] {{
  --bg: #0F0F0F;
  --bar: #0F0F0F;
  --surface: #212121;
  --surface-2: #303030;
  --ink: #F1F1F1;
  --ink-dim: #AAAAAA;
  --line: #272727;
  --chip-bg: #272727;
  --chip-on-bg: #F1F1F1;
  --chip-on-ink: #0F0F0F;
  --accent: #E8944A;
  --accent-strong: #F0A868;
  --accent-tint: #2A1D10;
  --new-dot: #3EA6FF;
  --alert: #FF4E45;
  --cat-offering: #6FBFAE;
  --cat-trend: #8FB0D6;
  --cat-competitor: #B9A6CB;
  --thumb-ink: rgba(255,255,255,0.94);
}}

* {{ box-sizing: border-box; -webkit-tap-highlight-color: transparent; }}

html, body {{
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Public Sans', -apple-system, sans-serif;
  overflow-x: hidden;
}}

body {{
  max-width: 560px;
  margin: 0 auto;
  min-height: 100vh;
  padding-bottom: 84px;
}}

/* ---------- app bar ---------- */
.appbar {{
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bar);
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 16px 9px;
}}

.mark {{
  flex: none;
  width: 30px;
  height: 21px;
  border-radius: 6px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}}
.mark::after {{
  content: "";
  border-left: 8px solid #fff;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  margin-left: 2px;
}}

.wordmark {{
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 800;
  font-size: 25px;
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
}}

.bar-sub {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--ink-dim);
  margin-left: auto;
  text-align: right;
  white-space: nowrap;
}}

/* ---------- channel rail ---------- */
.rail {{
  display: flex;
  gap: 14px;
  padding: 4px 16px 12px;
  overflow-x: auto;
  scrollbar-width: none;
}}
.rail::-webkit-scrollbar {{ display: none; }}

.rail-item {{
  flex: none;
  width: 62px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}}

.rail-av {{
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 800;
  font-size: 23px;
  line-height: 1;
  color: #fff;
  letter-spacing: 0.02em;
}}

.rail-item[aria-pressed="true"] .rail-av {{
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}}

.rail-av .dot {{
  position: absolute;
  right: 1px;
  bottom: 3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--new-dot);
  border: 2px solid var(--bg);
}}

.rail-name {{
  font-size: 11px;
  line-height: 1.25;
  color: var(--ink-dim);
  max-width: 62px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}}
.rail-item[aria-pressed="true"] .rail-name {{ color: var(--ink); font-weight: 600; }}

.rail-manage .rail-av {{
  background: var(--surface);
  color: var(--ink-dim);
  font-family: 'Public Sans', sans-serif;
  font-size: 22px;
  font-weight: 400;
}}

/* ---------- chips ---------- */
.chips {{
  position: sticky;
  top: 45px;
  z-index: 19;
  background: var(--bar);
  display: flex;
  gap: 8px;
  padding: 6px 16px 12px;
  overflow-x: auto;
  scrollbar-width: none;
}}
.chips::-webkit-scrollbar {{ display: none; }}

.chip {{
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  background: var(--chip-bg);
  color: var(--ink);
  font-family: 'Public Sans', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}}
.chip[aria-pressed="true"] {{
  background: var(--chip-on-bg);
  color: var(--chip-on-ink);
}}
.chip .n {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  opacity: 0.62;
}}
.chip .reddot {{
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--alert);
}}

/* ---------- brief ---------- */
.brief {{
  margin: 2px 16px 16px;
  padding: 13px 14px;
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  gap: 11px;
  align-items: flex-start;
}}

.brief-icon {{ flex: none; width: 28px; height: 28px; line-height: 0; margin-top: 1px; }}
.brief-body {{ flex: 1; min-width: 0; }}

.brief-label {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--accent-strong);
  font-weight: 600;
  margin-bottom: 5px;
}}

.kw-row {{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
}}

.kw {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid var(--line);
  color: var(--ink-dim);
  background: var(--bg);
  white-space: nowrap;
  cursor: pointer;
}}
/* 생애주기: 등장·부상은 채움, 챕터는 테두리만, 정착·퇴조 등은 기본 */
.kw.st-new {{
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-tint);
}}
.kw.st-chapter {{
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--bg);
}}
.kw::after {{
  content: "ⓘ";
  margin-left: 4px;
  opacity: 0.5;
  font-size: 9px;
}}

.kw.watch {{ border-style: dashed; }}
.kw-sec {{ margin-bottom: 8px; }}
.kw-sec:last-child {{ margin-bottom: 10px; }}
.kw-sec-lbl {{
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-dim);
  margin-bottom: 4px;
}}
.kw-sec .kw-row {{ margin-bottom: 0; align-items: center; }}
.kw-empty {{ font-size: 11.5px; color: var(--ink-dim); }}
.tl-link {{
  border: none;
  background: none;
  padding: 0;
  font-family: 'Public Sans', sans-serif;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--accent-strong);
  cursor: pointer;
  white-space: nowrap;
}}

.ev-status {{
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--accent-tint);
  color: var(--accent-strong);
  margin-right: 6px;
}}
.ev-def {{ font-size: 13.5px; line-height: 1.55; margin: 0 0 8px; }}
.ev-lineage {{ font-size: 12px; color: var(--ink-dim); margin: 0 0 12px; }}
.ev-why {{ font-size: 12.5px; line-height: 1.5; margin: 0 0 12px; color: var(--ink); }}
.spark {{ display: block; margin: 2px 0 2px; }}
.spark rect {{ fill: var(--accent); }}
.spark rect.zero {{ fill: var(--line); }}
.spark-cap {{ font-size: 10.5px; color: var(--ink-dim); display: flex; justify-content: space-between; width: 168px; }}
.ev-srcs {{ display: flex; flex-direction: column; gap: 8px; }}

.tl-sec {{ font-size: 12px; font-weight: 600; color: var(--ink-dim); margin: 14px 0 8px; }}
.tl-hist {{ display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 12.5px; }}
.tl-hist dt {{ font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--ink-dim); padding-top: 3px; }}
.tl-hist dd {{ margin: 0; display: flex; flex-wrap: wrap; gap: 5px; }}
.tl-hist dd.partial::after {{ content: "진행 중"; font-size: 10.5px; color: var(--ink-dim); align-self: center; }}
.hm {{ display: grid; grid-template-columns: 104px 1fr; gap: 3px 8px; align-items: center; }}
.hm-name {{ font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }}
.hm-row {{ display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; }}
.hm-row i {{ display: block; height: 12px; border-radius: 2px; background: var(--accent); }}
.hm-row i.z {{ background: var(--surface); }}
.hm-axis {{ display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--ink-dim); }}

.ev-term {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--accent-strong);
  margin-bottom: 12px;
}}
.ev-grid {{
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 7px 14px;
  font-size: 12.5px;
  margin-bottom: 14px;
}}
.ev-grid dt {{ color: var(--ink-dim); white-space: nowrap; }}
.ev-grid dd {{ margin: 0; color: var(--ink); }}
.ev-src {{
  display: block;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  text-decoration: none;
  color: inherit;
}}
.ev-src .lbl {{
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--accent-strong);
  font-weight: 600;
}}
.ev-src .ttl {{ font-size: 13px; margin-top: 4px; line-height: 1.4; }}
.ev-note {{ margin: 12px 0 0; font-size: 11px; line-height: 1.5; color: var(--ink-dim); }}

.brief-text {{ font-size: 13px; line-height: 1.55; color: var(--ink); }}

.brief-more {{
  margin-top: 7px;
  border: none;
  background: none;
  padding: 0;
  font-family: 'Public Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-dim);
  cursor: pointer;
}}

.clamp3 {{
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

/* ---------- feed ---------- */
#feed {{ display: flex; flex-direction: column; gap: 20px; }}

/* 카드 = <article>. 링크는 안쪽 .card-link 하나뿐이고, 더보기 버튼과 태그 칩은
   .card-foot 으로 링크 바깥에 둔다. <a> 안에 버튼을 넣으면 스펙 위반인 데다,
   탭이 링크 활성화로 먼저 처리되는 환경에서 preventDefault가 늦어 유튜브로 넘어간다. */
.card {{ display: block; }}
.card-link {{ display: block; text-decoration: none; color: inherit; }}

.card-foot {{ padding: 0 16px 0 64px; }}   /* 16 + 아바타 36 + gap 12 = 제목 라인에 맞춤 */

.thumb {{
  position: relative;
  aspect-ratio: 16 / 9;
  background: linear-gradient(128deg, var(--c1) 0%, var(--c2) 100%);
  display: flex;
  align-items: center;
  padding: 0 18px;
  overflow: hidden;
}}

.thumb-ch {{
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 800;
  font-size: 40px;
  line-height: 0.92;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: var(--thumb-ink);
  max-width: 74%;
  z-index: 1;
}}

.thumb-play {{
  position: absolute;
  right: -14px;
  bottom: -26px;
  width: 0;
  height: 0;
  border-left: 96px solid rgba(255,255,255,0.13);
  border-top: 56px solid transparent;
  border-bottom: 56px solid transparent;
}}

.dur {{
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}}

.meta {{ display: flex; gap: 12px; padding: 11px 16px 0; }}

.av {{
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Big Shoulders Display', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
}}

.meta-body {{ flex: 1; min-width: 0; }}

.title {{
  font-size: 15px;
  font-weight: 600;
  line-height: 1.32;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

.subline {{
  margin-top: 3px;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--ink-dim);
}}

.summary {{
  margin-top: 7px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-dim);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

/* 카드 펼치기 — 제목 2줄, 요약 3줄 클램프를 함께 푼다.
   넘치는 카드에만 버튼이 뜨므로(markMore), 짧은 카드엔 아무것도 안 보임. */
.card.expanded .title,
.card.expanded .summary {{
  -webkit-line-clamp: none;
  overflow: visible;
}}

.more-btn {{
  margin-top: 5px;
  display: block;
  border: none;
  background: none;
  padding: 0;
  font-family: 'Public Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-dim);
  cursor: pointer;
}}
.more-btn[hidden] {{ display: none; }}

.tags-row {{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}}

.tag {{
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid var(--cat-color);
  color: var(--cat-color);
}}

.empty {{ text-align: center; color: var(--ink-dim); padding: 56px 20px; font-size: 14px; }}

/* ---------- bottom bar ---------- */
.bottombar {{
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 560px;
  z-index: 30;
  display: flex;
  gap: 8px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: var(--bar);
  border-top: 1px solid var(--line);
}}

.cta {{
  flex: 1;
  min-width: 0;
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--accent);
  color: #fff;
  font-family: 'Public Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}}
.cta:active {{ background: var(--accent-strong); }}

.icon-btn {{
  flex: none;
  width: 46px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
}}
.icon-btn:active {{ background: var(--surface-2); }}
.icon-btn[aria-expanded="true"] {{ background: var(--accent-tint); border-color: var(--accent); }}

/* ---------- sheet ---------- */
.scrim {{
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0,0,0,0.55);
}}
.scrim[hidden] {{ display: none; }}

.sheet {{
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 560px;
  z-index: 41;
  max-height: 82vh;
  overflow-y: auto;
  background: var(--bg);
  border-radius: 16px 16px 0 0;
  padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
}}
.sheet[hidden] {{ display: none; }}

.grabber {{
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-2);
  margin: 4px auto 12px;
}}

.sheet h2 {{ margin: 0 0 10px; font-size: 15px; font-weight: 600; }}

.sheet-text {{
  margin: 0 0 9px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--ink);
}}

.sheet-hint {{ margin: 0 0 12px; font-size: 11.5px; line-height: 1.45; color: var(--ink-dim); }}

.btn {{
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px;
  background: var(--accent);
  color: #fff;
  font-family: 'Public Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}}

.ch-row {{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}}
.ch-row:last-of-type {{ border-bottom: none; }}
.ch-row .av {{ width: 30px; height: 30px; font-size: 14px; }}
.ch-row .nm {{ flex: 1; min-width: 0; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}

.mini {{
  flex: none;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  cursor: pointer;
}}

.add-row {{ display: flex; gap: 8px; margin-top: 14px; }}

.add-input {{
  flex: 1;
  min-width: 0;
  padding: 10px 11px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-family: 'Public Sans', sans-serif;
  font-size: 13.5px;
}}
.add-input:focus {{ outline: 2px solid var(--accent); outline-offset: 1px; }}

.add-btn {{
  flex: none;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--accent);
  color: #fff;
  font-family: 'Public Sans', sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}}

/* ---------- toast ---------- */
.toast {{
  position: fixed;
  left: 50%;
  bottom: 92px;
  transform: translate(-50%, 12px);
  z-index: 50;
  background: var(--ink);
  color: var(--bg);
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  max-width: calc(100% - 48px);
  text-align: center;
}}
.toast.show {{ opacity: 1; transform: translate(-50%, 0); }}
</style>

<div class="appbar">
  <span class="mark"></span>
  <span class="wordmark">AI 브리핑</span>
  <span class="bar-sub" id="bar-sub"></span>
</div>

<div class="rail" id="rail"></div>

<nav class="chips" id="chips"></nav>

<section class="brief">
  <div class="brief-icon" id="brief-icon"></div>
  <div class="brief-body">
    <div class="brief-label" id="brief-label"></div>
    <div class="kw-row" id="brief-keywords"></div>
    <div class="brief-text clamp3" id="brief-text"></div>
    <button class="brief-more" id="brief-more">더보기</button>
  </div>
</section>

<main id="feed"></main>

<div class="bottombar">
  <button class="cta" id="nb-btn"><span id="nb-label"></span></button>
  <button class="icon-btn" id="nb-links" aria-label="링크만 복사" title="링크만 복사 — 크롬 확장 프로그램이나 PC에서 쓸 때">🔗</button>
  <button class="icon-btn" id="prompt-btn" aria-expanded="false" aria-label="오디오 생성 프롬프트" title="오디오 생성 프롬프트">🎙</button>
</div>

<div class="scrim" id="scrim" hidden></div>

<div class="sheet" id="prompt-sheet" hidden>
  <div class="grabber"></div>
  <h2>NotebookLM 오디오 생성 프롬프트</h2>
  <p class="sheet-text" id="prompt-text"></p>
  <p class="sheet-hint">기본 버튼은 요약 텍스트를 복사합니다. <b>소스 추가 → 복사된 텍스트</b>에 붙여넣으세요. 링크를 여러 개 넣는 방식은 'YouTube'와 '링크/웹사이트' 양쪽에서 실패했습니다(첫 개만 등록되거나 오류). 🔗 버튼은 크롬 확장이나 PC 작업용 링크 목록입니다. 소스를 넣은 뒤 Audio Overview의 커스터마이즈 입력창에 이 프롬프트를 넣으세요.</p>
  <button class="btn" id="prompt-copy">복사하기</button>
</div>

<div class="sheet" id="ev-sheet" hidden>
  <div class="grabber"></div>
  <h2 id="ev-label"></h2>
  <div class="ev-term" id="ev-term"></div>
  <p class="ev-def" id="ev-def"></p>
  <p class="ev-lineage" id="ev-lineage"></p>
  <p class="ev-why" id="ev-why"></p>
  <dl class="ev-grid" id="ev-grid"></dl>
  <div class="ev-srcs" id="ev-src-wrap"></div>
  <p class="ev-note">키워드는 이름 붙은 개념 사전(약 60개)에서만 뽑습니다. '보안·평가·거버넌스' 같은 범주어는 사전에 넣지 않습니다. 추적 채널의 2025년 1월 이후 전체 영상을 주 단위로 세어, 몇 달 공백 뒤 여러 채널에서 동시에 나타나 몇 주 이상 이어지는 개념을 새 챕터로 봅니다. 업로드가 많은 채널(컨퍼런스·뉴스)의 언급은 덜 세고, 드와케쉬·노정석 등 생각 리더 채널은 더 셉니다. 영상 설명·제목만 보므로 대화 속에서만 나온 말은 잡히지 않습니다.</p>
</div>

<div class="sheet" id="tl-sheet" hidden>
  <div class="grabber"></div>
  <h2>AI 챕터 연표 2025–2026</h2>
  <div class="tl-sec">달마다 뽑힌 이달의 키워드</div>
  <dl class="tl-hist" id="tl-hist"></dl>
  <div class="tl-sec">개념별 월간 언급 채널 수</div>
  <div class="hm" id="tl-hm"></div>
  <p class="ev-note">지난달까지는 그 달 말일 시점으로 시계를 돌려 같은 규칙으로 다시 뽑은 결과입니다(그 이후 데이터는 보지 않음). 칸이 진할수록 그 달 그 개념을 다룬 채널이 많습니다.</p>
</div>

<div class="sheet" id="ch-sheet" hidden>
  <div class="grabber"></div>
  <h2 id="ch-title">출처 채널</h2>
  <div id="ch-list"></div>
  <div class="add-row">
    <input type="text" class="add-input" id="ch-input" placeholder="채널명 또는 핸들 입력">
    <button class="add-btn" id="ch-add">추가 요청</button>
  </div>
  <p class="sheet-hint" style="margin-top:12px">삭제·추가 버튼을 누르면 요청 문구가 클립보드에 복사됩니다. 클로드 대화창에 붙여넣으면 바로 반영됩니다.</p>
</div>

<div class="toast" id="toast"></div>

<script>
const VIDEOS = {videos_json};
const CHANNELS = {channels_json};
const CATEGORY_LABELS = {json.dumps(CATEGORY_LABELS, ensure_ascii=False)};
const GENERATED_AT = "{generated_at}";
const DAILY_SUMMARY = {daily_summary_json};
const WEEKLY_SUMMARY = {weekly_summary_json};
const DAILY_KEYWORDS = {daily_keywords_json};
const WEEKLY_KEYWORDS = {weekly_keywords_json};
const MONTHLY_KEYWORDS = {monthly_keywords_json};
const WATCH_KEYWORDS = {watch_keywords_json};
const CONCEPT_INDEX = {concept_index_json};
const MONTHLY_HISTORY = {monthly_history_json};
const CHAPTER_TIMELINE = {chapter_timeline_json};
const KEYWORD_BY_LABEL = new Map([
  ...Object.entries(CONCEPT_INDEX),
  ...[...DAILY_KEYWORDS, ...WEEKLY_KEYWORDS, ...MONTHLY_KEYWORDS, ...WATCH_KEYWORDS].map((k) => [k.label, k]),
]);
function kwClass(label) {{
  const k = KEYWORD_BY_LABEL.get(label);
  if (!k) return 'kw';
  return 'kw ' + (k.status === '등장' || k.status === '부상' ? 'st-new' : k.status === '챕터' ? 'st-chapter' : '');
}}

const DAY_MS = 86400000;
const NOW = new Date(GENERATED_AT).getTime();
const TODAY_CUTOFF = NOW - DAY_MS;

let activeChip = "all";
let activeChannel = null;

/* ---------- helpers ---------- */
function isToday(v) {{ return new Date(v.publishedAt).getTime() >= TODAY_CUTOFF; }}

function hue(name) {{
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}}
function avColor(name) {{ return `hsl(${{hue(name)}} 42% 42%)`; }}
function thumbColors(name, cat) {{
  const h = hue(name);
  const lift = cat === 'offering' ? 12 : cat === 'competitor' ? -14 : 0;
  return [`hsl(${{(h + 360 + lift) % 360}} 38% 30%)`, `hsl(${{(h + 34 + lift) % 360}} 44% 17%)`];
}}
function initials(name) {{
  const clean = name.replace(/\\(.*?\\)/g, '').trim();
  const parts = clean.split(/[\\s·]+/).filter(Boolean);
  if (parts.length > 1 && /^[A-Za-z]/.test(parts[0]) && /^[A-Za-z]/.test(parts[1])) {{
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }}
  return clean.slice(0, 2).toUpperCase();
}}
function fmtDur(s) {{
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${{h}}:${{p(m)}}:${{p(sec)}}` : `${{m}}:${{p(sec)}}`;
}}
function fmtViews(n) {{
  if (!n) return '조회수 —';
  if (n >= 10000) {{
    const v = (n / 10000).toFixed(1).replace(/\\.0$/, '');
    return `조회수 ${{v}}만회`;
  }}
  return `조회수 ${{n.toLocaleString('ko-KR')}}회`;
}}
function fmtAgo(iso) {{
  const diff = NOW - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '방금 전';
  if (h < 24) return `${{h}}시간 전`;
  return `${{Math.floor(h / 24)}}일 전`;
}}
function fmtGen(iso) {{
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  return `${{d.getFullYear()}}.${{p(d.getMonth() + 1)}}.${{p(d.getDate())}}(${{W[d.getDay()]}}) ${{p(d.getHours())}}:${{p(d.getMinutes())}}`;
}}
function esc(s) {{ return String(s).replace(/[<>&"]/g, (c) => ({{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}})[c]); }}

const DAY_ICON = `<svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="10" fill="var(--accent)"/>
  <g stroke="var(--accent)" stroke-width="3" stroke-linecap="round">
    <line x1="24" y1="4" x2="24" y2="10"/><line x1="24" y1="38" x2="24" y2="44"/>
    <line x1="4" y1="24" x2="10" y2="24"/><line x1="38" y1="24" x2="44" y2="24"/>
    <line x1="9" y1="9" x2="13" y2="13"/><line x1="35" y1="35" x2="39" y2="39"/>
    <line x1="9" y1="39" x2="13" y2="35"/><line x1="35" y1="13" x2="39" y2="9"/>
  </g></svg>`;

const WEEK_ICON = `<svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="10" width="36" height="32" rx="4" fill="none" stroke="var(--accent-strong)" stroke-width="3"/>
  <line x1="6" y1="18" x2="42" y2="18" stroke="var(--accent-strong)" stroke-width="3"/>
  <line x1="14" y1="4" x2="14" y2="14" stroke="var(--accent-strong)" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="4" x2="34" y2="14" stroke="var(--accent-strong)" stroke-width="3" stroke-linecap="round"/>
  <g fill="var(--accent-strong)">
    <circle cx="14" cy="26" r="2"/><circle cx="20" cy="26" r="2"/><circle cx="26" cy="26" r="2"/>
    <circle cx="32" cy="26" r="2"/><circle cx="14" cy="34" r="2"/><circle cx="20" cy="34" r="2"/>
    <circle cx="26" cy="34" r="2"/>
  </g></svg>`;

/* ---------- selection ---------- */
function byChip(list) {{
  if (activeChip === 'all') return list;
  if (activeChip === 'today') return list.filter(isToday);
  return list.filter((v) => v.category === activeChip);
}}
function selected() {{
  let list = byChip(VIDEOS);
  if (activeChannel) list = list.filter((v) => v.channel === activeChannel);
  return list;
}}

/* NotebookLM으로 넘길 목록. 60초 이하 짧은 클립은 뺀다 —
   자막이 없어 소스 등록에서 실패하고, 내용도 홍보성이라 소스 가치가 없다.
   피드에는 그대로 보여주고 복사 목록에서만 제외한다. */
function notebookList() {{
  return selected().filter((v) => !v.durationSec || v.durationSec > 60);
}}

/* ---------- render ---------- */
function renderRail() {{
  const rail = document.getElementById('rail');
  rail.innerHTML = '';
  const todayByCh = {{}};
  for (const v of VIDEOS) if (isToday(v)) todayByCh[v.channel] = true;

  for (const ch of CHANNELS) {{
    const b = document.createElement('button');
    b.className = 'rail-item';
    b.setAttribute('aria-pressed', activeChannel === ch.name ? 'true' : 'false');
    b.innerHTML = `<span class="rail-av" style="background:${{avColor(ch.name)}}">${{esc(initials(ch.name))}}` +
      (todayByCh[ch.name] ? '<span class="dot"></span>' : '') +
      `</span><span class="rail-name">${{esc(ch.name)}}</span>`;
    b.onclick = () => {{
      activeChannel = activeChannel === ch.name ? null : ch.name;
      renderAll();
    }};
    rail.appendChild(b);
  }}

  const m = document.createElement('button');
  m.className = 'rail-item rail-manage';
  m.innerHTML = '<span class="rail-av">＋</span><span class="rail-name">채널 관리</span>';
  m.onclick = openChannels;
  rail.appendChild(m);
}}

function renderChips() {{
  const scope = activeChannel ? VIDEOS.filter((v) => v.channel === activeChannel) : VIDEOS;
  const todayN = scope.filter(isToday).length;
  const defs = [
    {{ key: 'all', label: '전체', n: scope.length }},
    {{ key: 'today', label: '오늘', n: todayN, hot: todayN > 0 }},
  ];
  for (const k of Object.keys(CATEGORY_LABELS)) {{
    const n = scope.filter((v) => v.category === k).length;
    if (n) defs.push({{ key: k, label: CATEGORY_LABELS[k], n }});
  }}
  if (!defs.some((d) => d.key === activeChip)) activeChip = 'all';

  const nav = document.getElementById('chips');
  nav.innerHTML = '';
  for (const d of defs) {{
    const b = document.createElement('button');
    b.className = 'chip';
    b.setAttribute('aria-pressed', d.key === activeChip ? 'true' : 'false');
    b.innerHTML = (d.hot ? '<span class="reddot"></span>' : '') +
      `${{d.label}} <span class="n">${{d.n}}</span>`;
    b.onclick = () => {{ activeChip = d.key; renderAll(); }};
    nav.appendChild(b);
  }}
}}

function renderBrief() {{
  const today = activeChip === 'today';
  document.getElementById('brief-icon').innerHTML = today ? DAY_ICON : WEEK_ICON;
  document.getElementById('brief-label').textContent = today ? '오늘 전체 요약' : '이번 주 전체 요약';
  const el = document.getElementById('brief-text');
  el.textContent = (today ? DAILY_SUMMARY : WEEKLY_SUMMARY) || '요약이 아직 없습니다.';
  el.classList.add('clamp3');
  document.getElementById('brief-more').textContent = '더보기';

  const box = document.getElementById('brief-keywords');
  box.innerHTML = '';
  const sections = today
    ? [['오늘', DAILY_KEYWORDS, '오늘 영상에 걸린 챕터 키워드 없음']]
    : [['이주의', WEEKLY_KEYWORDS, '이번 주 문턱을 넘은 개념 없음'],
       ['이달의', MONTHLY_KEYWORDS, '최근 4주 문턱을 넘은 개념 없음'],
       ['주목', WATCH_KEYWORDS, null]];
  for (const [name, list, empty] of sections) {{
    if (!list.length && !empty) continue;
    const sec = document.createElement('div');
    sec.className = 'kw-sec';
    sec.innerHTML = `<span class="kw-sec-lbl">${{name}} 키워드</span><div class="kw-row"></div>`;
    const row = sec.querySelector('.kw-row');
    for (const k of list) {{
      const span = document.createElement('span');
      span.className = kwClass(k.label) + (name === '주목' ? ' watch' : '');
      span.textContent = k.label;
      span.onclick = () => openEvidence(k.label);
      row.appendChild(span);
    }}
    if (!list.length) row.innerHTML = `<span class="kw-empty">${{empty}}</span>`;
    if (name === '이달의' || (today && name === '오늘')) {{
      const b = document.createElement('button');
      b.className = 'tl-link';
      b.textContent = '연표 ›';
      b.onclick = openTimeline;
      sec.querySelector('.kw-sec-lbl').appendChild(b);
    }}
    box.appendChild(sec);
  }}
}}

function renderFeed() {{
  const feed = document.getElementById('feed');
  const list = selected();
  feed.innerHTML = '';
  if (!list.length) {{
    feed.innerHTML = '<div class="empty">이 조건에 해당하는 영상이 없습니다.</div>';
    return;
  }}
  for (const v of list) {{
    const cols = thumbColors(v.channel, v.category);
    const card = document.createElement('article');
    card.className = 'card';
    card.style.setProperty('--cat-color', `var(--cat-${{v.category}})`);
    card.innerHTML = `
      <a class="card-link" href="${{esc(v.link)}}" target="_blank" rel="noopener">
        <div class="thumb" style="--c1:${{cols[0]}};--c2:${{cols[1]}}">
          <span class="thumb-ch">${{esc(v.channel)}}</span>
          <span class="thumb-play"></span>
          ${{v.durationSec ? `<span class="dur">${{fmtDur(v.durationSec)}}</span>` : ''}}
        </div>
        <div class="meta">
          <span class="av" style="background:${{avColor(v.channel)}}">${{esc(initials(v.channel))}}</span>
          <div class="meta-body">
            <div class="title">${{esc(v.title)}}</div>
            <div class="subline">${{esc(v.channel)}} · ${{fmtViews(v.views)}} · ${{fmtAgo(v.publishedAt)}}</div>
            ${{v.summary ? `<div class="summary">${{esc(v.summary)}}</div>` : ''}}
          </div>
        </div>
      </a>
      <div class="card-foot">
        <button class="more-btn" data-more type="button" hidden>더보기</button>
        <div class="tags-row">
          <span class="tag">${{CATEGORY_LABELS[v.category]}}</span>
          ${{(v.tags || []).map((t) => `<span class="${{kwClass(t)}}" data-kw="${{esc(t)}}">${{esc(t)}}</span>`).join('')}}
        </div>
      </div>`;
    feed.appendChild(card);
  }}
  markMore();
}}

/* 실제로 잘린 카드에만 "더보기"를 띄운다. 임베드 폰트가 늦게 붙으면
   줄 수가 달라지므로 폰트 로드 후 한 번 더 잰다. */
function markMore() {{
  const over = (el) => el && el.scrollHeight > el.clientHeight + 1;
  for (const card of document.querySelectorAll('#feed .card')) {{
    if (card.classList.contains('expanded')) continue;
    const btn = card.querySelector('.more-btn');
    if (btn) btn.hidden = !(over(card.querySelector('.title')) || over(card.querySelector('.summary')));
  }}
}}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(markMore);

function renderBar() {{
  document.getElementById('bar-sub').textContent =
    `${{VIDEOS.length}}개 · ${{fmtGen(GENERATED_AT)}}`;
  document.getElementById('nb-label').textContent =
    `NotebookLM · ${{notebookList().length}}개 요약 복사`;
}}

function renderAll() {{
  renderRail();
  renderChips();
  renderBrief();
  renderFeed();
  renderBar();
}}

/* ---------- interactions ---------- */
function showToast(msg) {{
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
}}

async function copyText(text, msg) {{
  try {{
    await navigator.clipboard.writeText(text);
    showToast(msg);
  }} catch (e) {{
    showToast('복사 실패 — 직접 선택해 복사해주세요');
  }}
}}

document.getElementById('brief-more').onclick = () => {{
  const el = document.getElementById('brief-text');
  const on = el.classList.toggle('clamp3');
  document.getElementById('brief-more').textContent = on ? '더보기' : '접기';
}};

/* 붙여넣을 곳이 중요하다. NotebookLM의 'YouTube' 소스는 URL을 하나만 받아서
   여러 개를 넣으면 덩어리 전체를 URL 하나로 읽고 실패한다(실측).
   '링크 / 웹사이트(URL)' 소스에 넣어야 각각의 소스로 파싱된다.

   거기서도 watch?v= 형태로는 첫 URL만 등록됐다(줄바꿈·공백 모두 실패).
   쿼리스트링(?, =, &)이 섞이면 파서가 URL 경계를 못 잡는 것으로 보여,
   쿼리가 아예 없는 youtu.be/<id> 경로 형태로 바꾸고 줄바꿈으로 구분한다. */
const NB_SEP = '\\n';
function nbLink(v) {{ return 'https://youtu.be/' + v.videoId; }}

/* 기본 경로: 제목·채널·요약·링크를 한 덩어리 텍스트로 만들어 '복사된 텍스트' 소스에 넣는다.
   URL 파서를 아예 거치지 않으므로 확실히 등록된다.
   링크를 여러 개 넣는 방식은 'YouTube' 소스(URL 1개만 받음)와 '링크/웹사이트' 소스 양쪽에서,
   줄바꿈·공백·쉼표, watch?v= 형태와 youtu.be 형태를 모두 시도했지만 전부 실패했다. */
function notebookText(list) {{
  const head = `AI 브리핑 · ${{fmtGen(GENERATED_AT)}} 기준 ${{list.length}}건\\n` +
    (activeChip === 'today' ? DAILY_SUMMARY : WEEKLY_SUMMARY) + '\\n';
  const body = list.map((v) =>
    `[${{CATEGORY_LABELS[v.category]}}] ${{v.title}} — ${{v.channel}}\\n` +
    (v.summary ? v.summary + '\\n' : '') + nbLink(v)).join('\\n\\n');
  return head + '\\n' + body;
}}

document.getElementById('nb-btn').onclick = async () => {{
  const list = notebookList();
  if (!list.length) return;
  await copyText(notebookText(list),
    `${{list.length}}개 요약 복사됨 · 소스 추가 → '복사된 텍스트'에 붙여넣기`);
  window.open('https://notebooklm.google.com/', '_blank', 'noopener');
}};

// 링크만 필요한 경우(크롬 확장, PC 작업 등)를 위해 남겨둔다
document.getElementById('nb-links').onclick = async () => {{
  const list = notebookList();
  if (!list.length) return;
  const dropped = selected().length - list.length;
  const note = dropped ? ` (짧은 클립 ${{dropped}}개 제외)` : '';
  await copyText(list.map(nbLink).join(NB_SEP), `${{list.length}}개 링크 복사됨${{note}}`);
}};

const AUDIO_PROMPT = `당신은 LG CNS 화학전지사업부 소속 B2B AI/IT 오퍼링 전략 담당자를 위한 팟캐스트 진행자입니다. 방금 추가한 소스들을 정리해서 기억할만한 변화나 중요 용어 등을 포함하여 종합 정리 공유해주고, 정유·석화·소재·제약바이오·에너지·화장품·음료 산업 관점에서 분석해서 아래 세 가지를 추가 논의해주세요.
1) 오퍼링 후보 — 우리 고객사에 제안할 수 있는 새로운 AI/IT 오퍼링 아이디어
2) 경쟁사·레퍼런스 — 경쟁사나 유사 기업이 이미 시도한 사례와 그 시사점
3) 기술 트렌드 — 앞으로 6~12개월간 우리 사업부가 주목해야 할 기술 흐름

각항목마다 LG CNS 화학전지사업부장이 직접 Hands-on 해볼만한 것이나 화학전지사업부가 실행 가능한 액션 아이템을 최소 1개씩 제안하며 마무리해주세요.`;

document.getElementById('prompt-text').textContent = AUDIO_PROMPT;
document.getElementById('prompt-copy').onclick = () =>
  copyText(AUDIO_PROMPT, '프롬프트 복사됨 · Audio Overview 커스터마이즈에 붙여넣으세요');

const scrim = document.getElementById('scrim');
const promptSheet = document.getElementById('prompt-sheet');
const chSheet = document.getElementById('ch-sheet');
const evSheet = document.getElementById('ev-sheet');
const tlSheet = document.getElementById('tl-sheet');
const promptBtn = document.getElementById('prompt-btn');

function closeSheets() {{
  scrim.hidden = true;
  promptSheet.hidden = true;
  chSheet.hidden = true;
  evSheet.hidden = true;
  tlSheet.hidden = true;
  promptBtn.setAttribute('aria-expanded', 'false');
}}
scrim.onclick = closeSheets;

/* ---------- 키워드 근거 ---------- */
const STATUS_NOTE = {{
  '등장': '최근 4주 안에 여러 채널에서 처음 나타남',
  '부상': '등장 4개월 이내, 여러 주째 이어지는 중',
  '챕터': '1년 이내에 등장해 자리 잡은 새 챕터',
  '정착': '이미 업계 기본어 — 배경 개념',
  '퇴조': '한때 3개 채널 이상이 다뤘으나 최근 뜸함',
  '간헐': '띄엄띄엄 언급 — 아직 흐름이 약함',
  '잠잠': '최근 언급이 거의 없음',
}};

function sparkSvg(series) {{
  // 최근 12주 주별 언급 채널 수. 단일 시리즈라 범례 없이 제목으로 설명한다.
  const W = 168, H = 34, n = series.length, gap = 2;
  const bw = (W - gap * (n - 1)) / n;
  const max = Math.max(3, ...series);
  return `<svg class="spark" width="${{W}}" height="${{H}}" viewBox="0 0 ${{W}} ${{H}}" role="img" aria-label="최근 12주 주별 언급 채널 수: ${{series.join(', ')}}">` +
    series.map((x, i) => {{
      const h = x ? Math.max(3, (x / max) * (H - 2)) : 2;
      const wkAgo = n - 1 - i;
      return `<rect class="${{x ? '' : 'zero'}}" x="${{(i * (bw + gap)).toFixed(1)}}" y="${{(H - h).toFixed(1)}}" width="${{bw.toFixed(1)}}" height="${{h.toFixed(1)}}" rx="2"><title>${{wkAgo ? wkAgo + '주 전' : '이번 주'}} · ${{x}}개 채널</title></rect>`;
    }}).join('') + '</svg>';
}}

function openEvidence(label) {{
  const k = KEYWORD_BY_LABEL.get(label);
  if (!k) return;
  closeSheets();
  const e = k.evidence || {{}};
  document.getElementById('ev-label').textContent = k.label;
  document.getElementById('ev-term').innerHTML =
    `<span class="ev-status">${{esc(k.status || '')}}</span>${{esc(k.term || '')}} · ${{esc(k.kind || '')}}`;
  document.getElementById('ev-def').textContent = k.def || '';
  document.getElementById('ev-lineage').textContent = k.lineage ? `흐름: ${{k.lineage}}` : '';
  document.getElementById('ev-why').textContent = k.why || '';
  const born = e.emerged ? `${{e.emerged.slice(0, 4)}}년 ${{+e.emerged.slice(5)}}월` : (e.since ? `${{e.since.slice(0, 4)}}년 ${{+e.since.slice(5)}}월(용어 기준)` : '—');
  const rows = [
    ['생애주기', `${{k.status}} — ${{STATUS_NOTE[k.status] || ''}}`],
    ['추적 채널 첫 출현', born],
    ['이번 주 / 지난주', `${{e.channelsNow ?? 0}}개 / ${{e.channelsLastWeek ?? 0}}개 채널`],
    ['최근 4주', `${{e.active4 ?? 0}}주 활동 · ${{e.channels4 ?? 0}}개 채널`],
    ['생각 리더 채널', (e.thinkers || []).map((t) => t.split(' (')[0]).join(', ') || '—'],
  ];
  const grid = document.getElementById('ev-grid');
  grid.innerHTML = rows.map(([a, b]) => `<dt>${{esc(a)}}</dt><dd>${{esc(b)}}</dd>`).join('') +
    (e.weekly ? `<dt>12주 추이</dt><dd>${{sparkSvg(e.weekly)}}<div class="spark-cap"><span>12주 전</span><span>이번 주</span></div></dd>` : '');

  document.getElementById('ev-src-wrap').innerHTML = (e.sources || []).map((src) =>
    `<a class="ev-src" href="${{esc(src.link)}}" target="_blank" rel="noopener">` +
    `<span class="lbl">출처 · ${{esc(src.channel)}}</span>` +
    `<div class="ttl">${{esc(src.title)}}</div></a>`).join('');
  scrim.hidden = false;
  evSheet.hidden = false;
}}

function openTimeline() {{
  closeSheets();
  document.getElementById('tl-hist').innerHTML = MONTHLY_HISTORY.slice().reverse().map((h) =>
    `<dt>${{h.month.slice(2).replace('-', '.')}}</dt><dd class="${{h.partial ? 'partial' : ''}}">` +
    (h.picks.length ? h.picks.map((p) => `<span class="${{kwClass(p.label)}}" data-tl="${{esc(p.label)}}">${{esc(p.label)}}</span>`).join('') : '<span class="kw-empty">문턱을 넘은 개념 없음</span>') +
    '</dd>').join('');
  const months = CHAPTER_TIMELINE.months || [];
  const items = CHAPTER_TIMELINE.items || [];
  const max = Math.max(1, ...items.flatMap((it) => it.monthly));
  const cells = (it) => it.monthly.map((x, i) =>
    `<i class="${{x ? '' : 'z'}}" style="${{x ? `opacity:${{(0.25 + 0.75 * x / max).toFixed(2)}}` : ''}}" title="${{esc(it.label)}} · ${{months[i]}} · ${{x}}개 채널"></i>`).join('');
  document.getElementById('tl-hm').innerHTML = items.map((it) =>
    `<span class="hm-name" data-tl="${{esc(it.label)}}" title="${{esc(it.label)}}">${{esc(it.label)}}</span><div class="hm-row">${{cells(it)}}</div>`).join('') +
    (months.length ? `<span></span><div class="hm-axis"><span>${{months[0].replace('-', '.')}}</span><span>${{months[months.length - 1].replace('-', '.')}}</span></div>` : '');
  scrim.hidden = false;
  tlSheet.hidden = false;
}}
tlSheet.addEventListener('click', (ev) => {{
  const t = ev.target.closest('[data-tl]');
  if (t && KEYWORD_BY_LABEL.has(t.dataset.tl)) openEvidence(t.dataset.tl);
}});

document.getElementById('feed').addEventListener('click', (ev) => {{
  const more = ev.target.closest('[data-more]');
  if (more) {{
    // 버튼·칩은 .card-foot(링크 바깥)에 있어서 이 이벤트 경로엔 <a>가 없음.
    // preventDefault는 혹시 나중에 마크업이 바뀌어도 안전하도록 남겨둔 보호막.
    ev.preventDefault();
    const card = more.closest('.card');
    more.textContent = card.classList.toggle('expanded') ? '접기' : '더보기';
    return;
  }}
  const chip = ev.target.closest('[data-kw]');
  if (!chip) return;
  ev.preventDefault();
  openEvidence(chip.dataset.kw);
}});

promptBtn.onclick = () => {{
  const wasClosed = promptSheet.hidden;
  closeSheets();
  if (wasClosed) {{
    scrim.hidden = false;
    promptSheet.hidden = false;
    promptBtn.setAttribute('aria-expanded', 'true');
  }}
}};

function openChannels() {{
  closeSheets();
  document.getElementById('ch-title').textContent = `출처 채널 (${{CHANNELS.length}})`;
  const list = document.getElementById('ch-list');
  list.innerHTML = '';
  for (const ch of CHANNELS) {{
    const row = document.createElement('div');
    row.className = 'ch-row';
    row.innerHTML = `<span class="av" style="background:${{avColor(ch.name)}}">${{esc(initials(ch.name))}}</span>` +
      `<span class="nm">${{esc(ch.name)}}</span>`;
    const b = document.createElement('button');
    b.className = 'mini';
    b.textContent = '삭제';
    b.onclick = () => copyText(`이 채널 삭제해줘: ${{ch.name}}`, '요청 문구 복사됨 · 클로드 대화창에 붙여넣어주세요');
    row.appendChild(b);
    list.appendChild(row);
  }}
  scrim.hidden = false;
  chSheet.hidden = false;
}}

document.getElementById('ch-add').onclick = async () => {{
  const input = document.getElementById('ch-input');
  const val = input.value.trim();
  if (!val) return;
  await copyText(`이 채널 추가해줘: ${{val}}`, '요청 문구 복사됨 · 클로드 대화창에 붙여넣어주세요');
  input.value = '';
}};

renderAll();
</script>
"""

with open(f"{SCR}/ai_briefing.html", "w") as f:
    f.write(html)

print("HTML size (bytes):", len(html.encode()))
