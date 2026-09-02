(function () {
  'use strict';

  /* ═══ 아랍어 결합 ═════════════════════════════════════════════════════════
     저장소의 src/lib/arabic.js 와 같은 규칙이다.
     각 조각 앞뒤에 ZWJ(U+200D)를 넣어 어중형·어말형을 강제한다.
     ═══════════════════════════════════════════════════════════════════════ */
  var ZWJ = '‍';
  var HARAKAT_RE = /[ً-ْٰٓ-ٟۖ-ۭـ]/;
  var LETTER_RE = /[ء-يٮ-ۓۺ-ۿ]/;
  var NON_CONNECTING = ['ا', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ',
                        'أ', 'إ', 'آ', 'ة', 'ى', 'ء', 'ٱ'];

  function isMark(ch) { return HARAKAT_RE.test(ch); }
  function isLetter(ch) { return LETTER_RE.test(ch) && !isMark(ch); }
  function bases(piece) { return Array.prototype.filter.call(piece || '', isLetter); }

  function connectsForward(piece) {
    var b = bases(piece);
    var last = b[b.length - 1];
    return !!last && NON_CONNECTING.indexOf(last) === -1;
  }
  function connectsBackward(piece) {
    var first = bases(piece)[0];
    return !!first && first !== 'ء'; // 함자는 어느 쪽에도 붙지 않는다
  }

  function joinPieces(pieces) {
    return pieces.map(function (piece, i) {
      var prev = i > 0 ? pieces[i - 1] : null;
      var next = i < pieces.length - 1 ? pieces[i + 1] : null;
      var lead = prev && connectsForward(prev) && connectsBackward(piece) ? ZWJ : '';
      var trail = next && connectsForward(piece) && connectsBackward(next) ? ZWJ : '';
      return lead + piece + trail;
    });
  }

  function stripHarakat(text) {
    return (text || '').replace(new RegExp(HARAKAT_RE.source, 'g'), '');
  }
  var isArabicLetter = isLetter; // 사전 쪽 이름에 맞춘다

  function splitIntoLetters(word) {
    var out = [];
    Array.prototype.forEach.call(word || '', function (ch) {
      if (isMark(ch) && out.length) out[out.length - 1] += ch;
      else if (ch.trim()) out.push(ch);
    });
    return out;
  }

  /* 글자 하나의 네 가지 모양. 없는 모양은 저절로 null 이 된다. */
  function letterForms(ch) {
    var forward = connectsForward(ch);
    var backward = connectsBackward(ch);
    return {
      alone: ch,
      init: forward ? ch + ZWJ : null,
      mid: forward && backward ? ZWJ + ch + ZWJ : null,
      fin: backward ? ZWJ + ch : null
    };
  }

  /* ═══ 데이터 ══════════════════════════════════════════════════════════════
     build.mjs 가 src/lib/letters.js 와 src/lib/samples.js 를 읽어 앞선 script 에
     window.__ARABIC_DATA__ 로 넣어 준다. 여기서 다시 옮겨 적지 않는다.
     ═══════════════════════════════════════════════════════════════════════ */
  var DATA = window.__ARABIC_DATA__ || {};
  var DECKS = DATA.SAMPLES || [];
  var LETTERS = DATA.LETTERS || [];
  var FAMILIES = DATA.FAMILIES || [];
  var VOWEL_MARKS = DATA.MARKS || [];
  var LONGS = DATA.LONGS || [];
  var EXTRAS = DATA.EXTRAS || [];

  /* ═══ 발음 옮기기 ══════════════════════════════════════════════════════════
     build.mjs 가 src/lib/transliterate.js 를 여기에 그대로 넣는다.
     앱과 같은 코드라 붙여넣은 글을 앱과 똑같이 읽는다.
     ═══════════════════════════════════════════════════════════════════════ */
/*__TRANSLITERATE__*/

  /* ═══ 소리 ════════════════════════════════════════════════════════════════
     build.mjs 가 src/lib/speech.js 를 여기에 넣는다. 이름이 겹치지 않게
     (읽기판에도 stop 이 있다) 객체로 감싼다.
     ═══════════════════════════════════════════════════════════════════════ */
  var Speech = /*__SPEECH__*/ {};

  /* ═══ 사전 ════════════════════════════════════════════════════════════════
     build.mjs 가 src/lib/dictionary.js 를 여기에 넣는다. 데모에서는 예문이
     DECKS·VOWEL_MARKS 라는 이름이라 앞에서 맞춰 준다.
     ═══════════════════════════════════════════════════════════════════════ */
  var Dict = /*__DICTIONARY__*/ {};

  function $(id) { return document.getElementById(id); }

  /* ═══ 읽기판 ══════════════════════════════════════════════════════════════ */
  var reader = (function () {
    var state = {
      data: DECKS[0], tag: DECKS[0] && DECKS[0].tag, kind: '낱말', wi: 0, li: 0,
      typed: '', choices: {},
      playing: false, speed: 800, unit: 'off', zwjOff: false, codes: false
    };
    var timer = null;

    function word() { return state.data.w[state.wi] || null; }
    function letters() { return word() ? word().l : []; }
    function lastLetter() { return state.li >= letters().length - 1; }
    function lastWord() { return state.wi >= state.data.w.length - 1; }

    /* 예문이 예순 개가 넘어 낱말과 문장을 갈라서 보여 준다 */
    function kindCounts() {
      var counts = [];
      DECKS.forEach(function (deck) {
        var hit = counts.filter(function (c) { return c[0] === deck.kind; })[0];
        if (hit) hit[1]++; else counts.push([deck.kind, 1]);
      });
      return counts;
    }

    function renderKinds() {
      var host = $('kinds');
      host.innerHTML = '';
      kindCounts().forEach(function (pair) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'segmented__btn' + (pair[0] === state.kind ? ' is-active' : '');
        b.setAttribute('aria-pressed', String(pair[0] === state.kind));
        b.innerHTML = '<span></span> <span class="segmented__count"></span>';
        b.children[0].textContent = pair[0];
        b.children[1].textContent = pair[1];
        b.addEventListener('click', function () {
          state.kind = pair[0];
          renderKinds();
          renderDecks();
        });
        host.appendChild(b);
      });
    }

    function renderDecks() {
      var host = $('decks');
      host.innerHTML = '';
      DECKS.filter(function (deck) { return deck.kind === state.kind; }).forEach(function (deck) {
        var b = document.createElement('button');
        b.className = 'deck';
        b.type = 'button';
        b.setAttribute('aria-pressed', String(deck.tag === state.tag));
        b.innerHTML = '<span class="deck__ar" lang="ar" dir="rtl"></span><span class="deck__ko"></span>';
        b.querySelector('.deck__ar').textContent = deck.w.map(function (w) { return w.a; }).join(' ');
        b.querySelector('.deck__ko').textContent = deck.tag;
        b.addEventListener('click', function () { pickDeck(deck.tag); });
        host.appendChild(b);
      });
    }

    function renderBoard() {
      var w = word();
      var board = $('board');
      board.innerHTML = '';
      if (!w) return;

      var raw = w.l.map(function (l) { return l.a; });
      var pieces = state.zwjOff ? raw : joinPieces(raw);

      pieces.forEach(function (piece, i) {
        var span = document.createElement('span');
        span.className = 'board__letter';
        span.textContent = piece;
        span.setAttribute('role', 'button');
        span.setAttribute('tabindex', '0');
        span.setAttribute('aria-label', (i + 1) + '번째 글자 ' + (w.l[i].k || w.l[i].a));
        span.addEventListener('click', function () { goTo(state.wi, i); });
        span.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(state.wi, i); }
        });
        board.appendChild(span);
      });

      renderCodes(pieces);
      paint();
    }

    function paint() {
      var spans = $('board').children;
      for (var i = 0; i < spans.length; i++) {
        spans[i].className = 'board__letter' +
          (i === state.li ? ' is-now' : i < state.li ? ' is-done' : '');
      }

      var w = word();
      var l = letters()[state.li];
      if (!w || !l) return;

      $('gloss').textContent = state.data.t || '';

      var meta = $('wordmeta');
      meta.innerHTML = '';
      [['word-meta__kr', w.k], ['word-meta__ro', w.r], ['word-meta__m', w.m]].forEach(function (pair) {
        if (!pair[1]) return;
        var s = document.createElement('span');
        s.className = pair[0];
        s.textContent = pair[1];
        meta.appendChild(s);
      });

      if (state.unit === 'letter' && !Speech.isSilentPiece(l)) {
        Speech.speak(l.a, { rate: 0.75 });
      }

      $('focusGlyph').textContent = l.a;
      $('focusKo').textContent = l.k || '발음 정보 없음';
      $('focusKo').style.fontSize = l.k ? '' : '15px';
      $('focusRo').textContent = (l.r || '') + (l.unknown ? '  · 부호가 없어 모음을 알 수 없습니다' : '');
      $('focusCount').textContent = (state.li + 1) + ' / ' + letters().length;

      $('prev').disabled = state.li === 0 && state.wi === 0;
      $('next').disabled = lastLetter() && lastWord();

      renderChips();
    }

    function renderChips() {
      var many = state.data.w.length > 1;
      var host = $('chips');
      host.hidden = !many;
      if (!many) return;

      host.innerHTML = '';
      host.setAttribute('dir', 'rtl');
      state.data.w.forEach(function (w, i) {
        var b = document.createElement('button');
        b.className = 'chip' + (i === state.wi ? ' is-active' : '');
        b.type = 'button';
        b.innerHTML = '<span class="chip__ar" lang="ar"></span><span class="chip__kr" dir="ltr"></span>';
        b.querySelector('.chip__ar').textContent = w.a;
        b.querySelector('.chip__kr').textContent = w.k || w.m || '';
        b.addEventListener('click', function () { goTo(i, 0); });
        host.appendChild(b);
      });
    }

    function renderCodes(pieces) {
      var host = $('codes');
      host.hidden = !state.codes;
      if (!state.codes) return;
      host.innerHTML = '';
      pieces.forEach(function (piece) {
        var d = document.createElement('div');
        d.className = 'code';
        d.innerHTML = Array.from(piece).map(function (ch) {
          var hex = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
          return ch === ZWJ ? '<b>' + hex + '</b>' : hex;
        }).join('\n');
        host.appendChild(d);
      });
    }

    function sentenceText() {
      return state.data.w.map(function (w) { return w.a; }).join(' ');
    }

    /** 지금 고른 단위로 읽어 준다 */
    function speakUnit() {
      var w = word();
      var l = letters()[state.li];
      if (state.unit === 'sentence') return Speech.speak(sentenceText());
      if (state.unit === 'letter' && l && !Speech.isSilentPiece(l)) {
        return Speech.speak(l.a, { rate: 0.75 });
      }
      // 단어이거나 꺼 뒀을 때 — 듣기 단추는 그래도 동작해야 하므로 낱말을 읽는다
      return w ? Speech.speak(w.a) : false;
    }

    function goTo(wi, li) {
      var changed = wi !== state.wi;
      state.wi = wi;
      state.li = li;
      if (changed) {
        renderBoard();
        // 낱말 단위면 낱말이 바뀔 때 한 번 읽는다
        if (state.unit === 'word') {
          var w = word();
          if (w) Speech.speak(w.a);
        }
      } else {
        paint();
      }
    }

    function next() {
      if (!lastLetter()) { state.li++; paint(); }
      else if (!lastWord()) goTo(state.wi + 1, 0);
    }
    function prev() {
      if (state.li > 0) { state.li--; paint(); }
      else if (state.wi > 0) goTo(state.wi - 1, state.data.w[state.wi - 1].l.length - 1);
    }

    function stop() {
      state.playing = false;
      clearTimeout(timer);
      $('play').textContent = '▶ 재생';
    }

    function tick() {
      clearTimeout(timer);
      if (!state.playing) return;
      timer = setTimeout(function () {
        if (!lastLetter()) { state.li++; paint(); }
        else if (!lastWord()) goTo(state.wi + 1, 0);
        else { stop(); return; }
        tick();
      }, state.speed);
    }

    function togglePlay() {
      Speech.primeFromUserGesture(); // iOS: 사람이 누른 이 자리에서 깨워 둔다
      if (state.playing) { stop(); Speech.stop(); return; }
      var atEnd = lastLetter() && lastWord();
      if (atEnd) goTo(0, 0);
      // 시작할 때 지금 단위를 한 번 읽어 준다. 문장은 자리와 무관하므로
      // 언제나, 글자·낱말은 끝에서 되감는 경우만 건너뛴다 (goTo 가 읽는다).
      if (state.unit === 'sentence') Speech.speak(sentenceText());
      else if (state.unit !== 'off' && !atEnd) speakUnit();
      state.playing = true;
      $('play').textContent = '멈춤';
      tick();
    }

    /* 직접 입력한 글을 읽는다. 부호가 없으면 앱이 아는 낱말에서 찾아 채운다. */
    function readTyped(text, choices) {
      var out = Dict.readTextSmart(text, { choices: choices || {} });
      if (!out.w.length) return;
      var unknown = out.w.reduce(function (n, w) { return n + (w.unknown || 0); }, 0);
      var parts = [];
      if (out.found) parts.push(out.found + '개는 앱이 아는 낱말에서 찾았습니다');
      if (unknown) parts.push('모음을 알 수 없는 자리가 ' + unknown + '곳 남았습니다');

      stop();
      state.tag = null;
      state.typed = text;
      state.choices = choices || {};
      state.data = {
        t: parts.length ? parts.join('. ') + '.' : '붙어 있는 부호대로 읽었습니다.',
        w: out.w
      };
      state.wi = 0;
      state.li = 0;
      renderDecks();
      renderBoard();
      renderPicks(out.picks);
      $('board').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* 읽기가 갈리는 낱말은 지어내지 않고 고르게 한다 */
    function renderPicks(picks) {
      var host = $('picks');
      host.innerHTML = '';
      host.hidden = !picks.length;
      if (!picks.length) return;

      var lead = document.createElement('p');
      lead.className = 'picks__lead';
      lead.textContent = '부호가 없어 읽기가 갈리는 낱말이 있습니다. 눌러서 고르세요.';
      host.appendChild(lead);

      picks.forEach(function (pick) {
        var row = document.createElement('div');
        row.className = 'pick';
        var bare = document.createElement('span');
        bare.className = 'pick__bare';
        bare.setAttribute('lang', 'ar');
        bare.setAttribute('dir', 'rtl');
        bare.textContent = pick.bare;
        row.appendChild(bare);

        var options = document.createElement('div');
        options.className = 'pick__options';
        pick.candidates.forEach(function (candidate) {
          var active = (state.choices[pick.index] || pick.chosen) === candidate.a;
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'pick__option' + (active ? ' is-active' : '');
          b.setAttribute('aria-pressed', String(active));
          b.innerHTML = '<span class="pick__ar" lang="ar" dir="rtl"></span>'
            + '<span class="pick__ko"></span><span class="pick__m"></span>';
          b.children[0].textContent = candidate.a;
          b.children[1].textContent = candidate.k;
          b.children[2].textContent = candidate.m || '';
          b.addEventListener('click', function () {
            var next = {};
            Object.keys(state.choices).forEach(function (k) { next[k] = state.choices[k]; });
            next[pick.index] = candidate.a;
            readTyped(state.typed, next);
          });
          options.appendChild(b);
        });
        row.appendChild(options);
        host.appendChild(row);
      });
    }

    function pickDeck(tag) {
      var found = DECKS.filter(function (deck) { return deck.tag === tag; })[0];
      if (!found) return;
      stop();
      state.tag = tag;
      state.data = found;
      state.wi = 0;
      state.li = 0;
      renderDecks();
      renderBoard();
      renderPicks([]);
    }

    /* 이 브라우저가 span 경계를 넘어 이어 그리는지 직접 재 본다.
       CSS Text 명세는 허용하되 강제하지 않아서 엔진마다 다르다. */
    function engineName() {
      var ua = navigator.userAgent;
      if (/firefox|fxios/i.test(ua)) return 'Gecko (파이어폭스)';
      if (/edg\//i.test(ua)) return 'Chromium (엣지)';
      if (/chrome|chromium|crios/i.test(ua)) return 'Chromium (크롬 계열)';
      if (/safari/i.test(ua)) return 'WebKit (사파리)';
      return '알 수 없음';
    }

    function probeShaping() {
      var raw = ['كِ', 'تَ', 'ا', 'ب'];
      var host = document.createElement('div');
      host.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;' +
        'font-family:var(--f-ar);font-size:80px;line-height:1.6;direction:rtl;white-space:nowrap;';

      function build(pieces) {
        var box = document.createElement('div');
        box.style.display = 'inline-block';
        pieces.forEach(function (piece) {
          var s = document.createElement('span');
          s.textContent = piece;
          box.appendChild(s);
        });
        return box;
      }

      var plain = build(raw);
      var zwj = build(joinPieces(raw));
      host.appendChild(plain);
      host.appendChild(document.createElement('br'));
      host.appendChild(zwj);
      document.body.appendChild(host);
      var wPlain = plain.getBoundingClientRect().width;
      var wZwj = zwj.getBoundingClientRect().width;
      document.body.removeChild(host);

      var same = Math.abs(wPlain - wZwj) < 0.5;
      $('probe').className = 'probe ' + (same ? 'is-native' : 'is-zwj');
      $('probeText').innerHTML = same
        ? '<b>' + engineName() + '</b> — ZWJ 없이도 알아서 잇습니다. 쪼갠 span 을 넘어 이어 그리는 엔진이라 ZWJ 를 빼도 화면이 같습니다 (폭 <code>' +
          wPlain.toFixed(0) + 'px</code> 동일). ZWJ 는 그렇지 않은 엔진을 위한 보험입니다.'
        : '<b>' + engineName() + '</b> — ZWJ 가 실제로 일하고 있습니다. 빼면 글자가 고립형으로 끊깁니다 (폭 <code>' +
          wPlain.toFixed(0) + 'px</code> → <code>' + wZwj.toFixed(0) + 'px</code>).';
    }

    function init() {
      $('play').addEventListener('click', togglePlay);
      $('next').addEventListener('click', function () { stop(); next(); });
      $('prev').addEventListener('click', function () { stop(); prev(); });

      $('speed').addEventListener('input', function () {
        state.speed = 2250 - Number($('speed').value);
        $('speedVal').textContent = (state.speed / 1000).toFixed(2) + '초';
        if (state.playing) tick();
      });

      var UNITS = [['off', 'unitOff'], ['letter', 'unitLetter'], ['word', 'unitWord'], ['sentence', 'unitSentence']];
      function setUnit(unit) {
        state.unit = unit;
        Speech.stop();
        if (unit !== 'off') Speech.primeFromUserGesture(); // iOS: 사람이 누른 자리에서 깨워 둔다
        UNITS.forEach(function (pair) {
          var on = pair[0] === unit;
          $(pair[1]).className = 'segmented__btn' + (on ? ' is-active' : '');
          $(pair[1]).setAttribute('aria-pressed', String(on));
        });
      }
      UNITS.forEach(function (pair) {
        $(pair[1]).addEventListener('click', function () { setUnit(pair[0]); });
      });

      $('zwjOff').addEventListener('change', function () {
        state.zwjOff = $('zwjOff').checked;
        $('inspectNote').textContent = state.zwjOff
          ? 'ZWJ 를 뺐습니다. 위 판정이 「알아서 잇습니다」라면 화면이 그대로인 것이 정상입니다 — 이 엔진이 span 경계를 넘어 이어 그린다는 뜻입니다. 아이폰 사파리 등 다른 브라우저에서 같은 스위치를 켜 보면 결과가 다를 수 있습니다.'
          : '글자를 span 으로 쪼개면 브라우저가 각 조각을 고립형으로 그릴 수 있습니다. 앱은 조각 앞뒤에 ZWJ(U+200D)를 넣어 이어지도록 강제합니다. 위 스위치로 실제로 무엇이 들어갔는지, 빼면 어떻게 되는지 볼 수 있습니다.';
        renderBoard();
      });

      $('codesOn').addEventListener('change', function () {
        state.codes = $('codesOn').checked;
        renderBoard();
      });

      // 부호 붙이기 단추 — 커서 자리에 끼워 넣는다
      var MARK_BUTTONS = [
        ['\u064E', '파트하'], ['\u0650', '카스라'], ['\u064F', '담마'], ['\u0652', '수쿤'],
        ['\u0651', '샷다'], ['\u064B', '탄윈 파트흐'], ['\u064D', '탄윈 카스르'], ['\u064C', '탄윈 담므'],
      ];
      MARK_BUTTONS.forEach(function (pair) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mark';
        b.title = pair[1];
        b.innerHTML = '<span class="mark__glyph" lang="ar"></span><span class="mark__name"></span>';
        b.children[0].textContent = '\u0640' + pair[0];
        b.children[1].textContent = pair[1];
        b.addEventListener('click', function () { insertMark(pair[0]); });
        $('markRow').appendChild(b);
      });
      var clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'mark mark--clear';
      clear.title = '붙은 부호를 모두 지웁니다';
      clear.innerHTML = '<span class="mark__glyph">✕</span><span class="mark__name">지우기</span>';
      clear.addEventListener('click', function () {
        $('composeText').value = stripHarakat($('composeText').value);
        $('composeText').focus();
      });
      $('markRow').appendChild(clear);

      function insertMark(mark) {
        var box = $('composeText');
        var at = box.selectionStart == null ? box.value.length : box.selectionStart;
        var to = box.selectionEnd == null ? at : box.selectionEnd;
        box.value = box.value.slice(0, at) + mark + box.value.slice(to);
        box.focus();
        box.setSelectionRange(at + mark.length, at + mark.length);
      }

      $('compose').addEventListener('submit', function (e) {
        e.preventDefault();
        var text = $('composeText').value.trim();
        if (!text) return;
        readTyped(text, {});
        state.wi = 0;
        state.li = 0;
        renderDecks();
        renderBoard();
        $('board').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      document.addEventListener('keydown', function (e) {
        if (document.getElementById('pageReader').hidden) return;
        var tag = e.target && e.target.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (e.key === 'ArrowLeft') { stop(); next(); }
        else if (e.key === 'ArrowRight') { stop(); prev(); }
        else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      });

      // 음성 목록이 비어 있어도 버튼은 보여 준다 — iOS 는 첫 발화 전까지
      // 목록이 비는 일이 흔해서, 목록으로 판단하면 버튼이 영영 안 나온다.
      // 소리를 낼 수 없으면 발음 단위 줄도 의미가 없다
      $('unitRow').hidden = !Speech.isSupported();

      $('speak').addEventListener('click', speakUnit);

      renderKinds();
      renderDecks();
      renderBoard();

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(probeShaping).catch(probeShaping);
      } else {
        setTimeout(probeShaping, 500);
      }
    }

    return { init: init, stop: stop };
  })();

  /* ═══ 자모표 ══════════════════════════════════════════════════════════════ */
  var chart = (function () {
    var state = { view: 'order', open: null };
    var pending = [];

    var LEDE = {
      order: '아랍어 사전과 자모표가 쓰는 차례입니다. 익숙해질 때까지는 이 순서를 외워 두면 편합니다.',
      shape: '뼈대가 같아 점으로만 갈라지는 글자끼리 묶었습니다. 초심자가 실제로 헷갈리는 지점은 순서가 아니라 여기입니다.'
    };
    var FORM_LABELS = [['alone', '홀로'], ['init', '첫'], ['mid', '가운데'], ['fin', '끝']];
    var MARK_LABELS = [['َ', '파트하'], ['ِ', '카스라'], ['ُ', '담마'], ['ْ', '수쿤']];

    function byChar(ch) {
      for (var i = 0; i < LETTERS.length; i++) if (LETTERS[i].a === ch) return LETTERS[i];
      return null;
    }

    function tile(letter) {
      var b = document.createElement('button');
      b.className = 'tile';
      b.type = 'button';
      b.setAttribute('aria-expanded', String(state.open === letter.a));
      b.innerHTML = '<span class="tile__ar" lang="ar"></span><span class="tile__name"></span><span class="tile__ro"></span>';
      b.querySelector('.tile__ar').textContent = letter.a;
      b.querySelector('.tile__name').textContent = letter.name;
      b.querySelector('.tile__ro').textContent = letter.ro;
      if (!connectsForward(letter.a)) {
        var dot = document.createElement('span');
        dot.className = 'tile__stop';
        dot.title = '뒤로 이어지지 않는 글자';
        b.appendChild(dot);
      }
      b.addEventListener('click', function () {
        state.open = state.open === letter.a ? null : letter.a;
        render();
      });
      return b;
    }

    function detail(letter) {
      var f = letterForms(letter.a);
      var box = document.createElement('div');
      box.className = 'detail';

      var top = document.createElement('div');
      top.className = 'detail__top';
      top.innerHTML = '<span class="detail__ar" lang="ar"></span><span class="detail__name"></span><span class="detail__ro"></span>';
      top.querySelector('.detail__ar').textContent = letter.a;
      top.querySelector('.detail__name').textContent = letter.name;
      top.querySelector('.detail__ro').textContent = letter.ro;
      box.appendChild(top);

      var formRow = document.createElement('div');
      formRow.className = 'forms';
      FORM_LABELS.forEach(function (pair) {
        var cell = document.createElement('div');
        cell.className = 'form';
        cell.innerHTML = '<div class="form__label"></div><div class="form__ar" lang="ar"></div>';
        cell.querySelector('.form__label').textContent = pair[1];
        var glyph = cell.querySelector('.form__ar');
        if (f[pair[0]]) {
          glyph.textContent = f[pair[0]];
        } else {
          glyph.className = 'form__ar is-none';
          glyph.textContent = '없음';
        }
        formRow.appendChild(cell);
      });
      box.appendChild(formRow);

      if (!connectsForward(letter.a)) {
        var stopNote = document.createElement('p');
        stopNote.className = 'detail__note';
        stopNote.textContent = '뒤 글자로 이어지지 않습니다. 그래서 첫·가운데 모양이 없고, 이 글자 다음에 오는 글자는 단어 중간이라도 새로 시작하는 모양이 됩니다.';
        box.appendChild(stopNote);
      }

      if (letter.reads) {
        var speakable = Speech.isSupported();
        var readRow = document.createElement('div');
        readRow.className = 'reads';
        MARK_LABELS.forEach(function (pair, i) {
          var syllable = letter.a + pair[0];
          // 소리를 낼 수 있으면 눌러서 듣게 한다
          var cell = document.createElement(speakable ? 'button' : 'div');
          cell.className = 'read' + (speakable ? ' read--tap' : '');
          if (speakable) {
            cell.type = 'button';
            cell.title = syllable + ' 듣기';
            cell.addEventListener('click', function () { Speech.speak(syllable, { rate: 0.7 }); });
          }
          cell.innerHTML = '<div class="read__mark" lang="ar"></div><div class="read__ko"></div><div class="read__name"></div>';
          cell.querySelector('.read__mark').textContent = syllable;
          cell.querySelector('.read__ko').textContent = letter.reads[i];
          cell.querySelector('.read__name').textContent = pair[1];
          readRow.appendChild(cell);
        });
        box.appendChild(readRow);
      }

      if (letter.note) {
        var note = document.createElement('p');
        note.className = 'detail__note';
        note.textContent = letter.note;
        box.appendChild(note);
      }

      if (letter.ex) {
        var ex = document.createElement('div');
        ex.className = 'detail__ex';
        ex.innerHTML = '<span class="w" lang="ar"></span><span class="k"></span><span class="m"></span>';
        ex.querySelector('.w').textContent = letter.ex.a;
        ex.querySelector('.k').textContent = letter.ex.k;
        ex.querySelector('.m').textContent = letter.ex.m;
        if (Speech.isSupported()) {
          var listen = document.createElement('button');
          listen.type = 'button';
          listen.className = 'btn btn--quiet';
          listen.textContent = '🔊 듣기';
          listen.title = letter.ex.a + ' 듣기';
          listen.addEventListener('click', function () { Speech.speak(letter.ex.a); });
          ex.appendChild(listen);
        }
        box.appendChild(ex);
      }

      return box;
    }

    /* 격자에는 타일만 넣고, DOM 에 붙은 뒤에 펼친 카드 자리를 잡는다 —
       실제 열 개수를 알아야 그 줄 끝에 넣을 수 있다. */
    function grid(letters) {
      var g = document.createElement('div');
      g.className = 'grid';
      letters.forEach(function (letter) { g.appendChild(tile(letter)); });
      pending.push({ g: g, letters: letters });
      return g;
    }

    function placeDetails() {
      pending.forEach(function (entry) {
        if (!state.open) return;
        var idx = -1;
        entry.letters.forEach(function (l, i) { if (l.a === state.open) idx = i; });
        if (idx < 0) return;
        var cols = getComputedStyle(entry.g).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
        var at = Math.min(entry.letters.length, (Math.floor(idx / cols) + 1) * cols);
        var node = detail(entry.letters[idx]);
        if (at >= entry.g.children.length) entry.g.appendChild(node);
        else entry.g.insertBefore(node, entry.g.children[at]);
      });
      pending = [];
    }

    function render() {
      var host = $('letters');
      host.innerHTML = '';
      pending = [];
      $('viewLede').textContent = LEDE[state.view];

      if (state.view === 'order') {
        host.appendChild(grid(LETTERS));
        placeDetails();
        return;
      }

      var stack = document.createElement('div');
      stack.className = 'families';
      FAMILIES.forEach(function (fam) {
        var block = document.createElement('div');
        block.className = 'family';
        var head = document.createElement('div');
        head.className = 'family__head';
        head.innerHTML = '<span class="family__title" lang="ar" dir="rtl"></span><span class="family__hint"></span>';
        head.querySelector('.family__title').textContent = fam.title;
        head.querySelector('.family__hint').textContent = fam.hint;
        block.appendChild(head);
        block.appendChild(grid(fam.of.map(byChar).filter(Boolean)));
        stack.appendChild(block);
      });
      host.appendChild(stack);
      placeDetails();
    }

    function item(opts) {
      var box = document.createElement('div');
      box.className = 'item';

      var glyph = document.createElement('div');
      glyph.className = 'item__glyph' + (opts.ink ? ' item__glyph--ink' : '') + (opts.wide ? ' item__glyph--wide' : '');
      glyph.setAttribute('lang', 'ar');
      glyph.textContent = opts.glyph;
      box.appendChild(glyph);

      var body = document.createElement('div');
      body.className = 'item__body';

      var title = document.createElement('div');
      title.className = 'item__title';
      title.innerHTML = '<span class="item__name"></span><span class="item__sound"></span>';
      title.querySelector('.item__name').textContent = opts.name;
      title.querySelector('.item__sound').textContent = opts.sound || '';
      body.appendChild(title);

      if (opts.ex) {
        var ex = document.createElement('div');
        ex.className = 'item__ex';
        ex.innerHTML = '<span class="w" lang="ar"></span><span class="k"></span><span class="m"></span>';
        ex.querySelector('.w').textContent = opts.ex.a;
        ex.querySelector('.k').textContent = opts.ex.k || '';
        ex.querySelector('.m').textContent = opts.ex.m || '';
        body.appendChild(ex);
      }

      if (opts.note) {
        var note = document.createElement('p');
        note.className = 'item__note';
        note.textContent = opts.note;
        body.appendChild(note);
      }

      box.appendChild(body);
      return box;
    }

    function fillTables() {
      VOWEL_MARKS.forEach(function (row) {
        $('marks').appendChild(item({
          glyph: row.m, name: row.name, sound: row.ko,
          ex: { a: row.ex, k: row.exk }, note: row.note
        }));
      });
      LONGS.forEach(function (row) {
        $('longs').appendChild(item({
          glyph: row.form, name: row.ko, sound: row.how,
          ex: { a: row.ex, k: row.exk, m: row.m }
        }));
      });
      EXTRAS.forEach(function (row) {
        $('extras').appendChild(item({
          glyph: row.a, ink: true, wide: row.wide,
          name: row.name, ex: row.ex, note: row.note
        }));
      });
    }

    function setView(view) {
      state.view = view;
      $('viewOrder').className = 'segmented__btn' + (view === 'order' ? ' is-active' : '');
      $('viewShape').className = 'segmented__btn' + (view === 'shape' ? ' is-active' : '');
      $('viewOrder').setAttribute('aria-pressed', String(view === 'order'));
      $('viewShape').setAttribute('aria-pressed', String(view === 'shape'));
      render();
    }

    function init() {
      $('viewOrder').addEventListener('click', function () { setView('order'); });
      $('viewShape').addEventListener('click', function () { setView('shape'); });

      var lastWidth = window.innerWidth;
      var resizeTimer = null;
      window.addEventListener('resize', function () {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
      });

      fillTables();
      render();
    }

    return { init: init };
  })();

  /* ═══ 라우팅 ══════════════════════════════════════════════════════════════
     해시 라우팅. 저장소의 src/lib/router.js 와 같은 방식이다.
     ═══════════════════════════════════════════════════════════════════════ */
  var PAGES = {
    '': { page: 'pageReader', tab: 'tabReader', sub: '사진 속 단어를 한 글자씩' },
    'letters': { page: 'pageLetters', tab: 'tabLetters', sub: '자음 28자와 모음 부호' }
  };

  function currentRoute() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    return PAGES[raw] ? raw : '';
  }

  function applyRoute() {
    var route = currentRoute();
    Object.keys(PAGES).forEach(function (key) {
      var conf = PAGES[key];
      var on = key === route;
      $(conf.page).hidden = !on;
      $(conf.tab).className = 'tab' + (on ? ' is-active' : '');
      if (on) $(conf.tab).setAttribute('aria-current', 'page');
      else $(conf.tab).removeAttribute('aria-current');
    });
    $('headerSub').textContent = PAGES[route].sub;
    if (route !== '') reader.stop(); // 다른 탭으로 가면 재생을 멈춘다
  }

  $('tabReader').addEventListener('click', function () { window.location.hash = '#/'; });
  $('tabLetters').addEventListener('click', function () { window.location.hash = '#/letters'; });
  window.addEventListener('hashchange', function () { applyRoute(); window.scrollTo({ top: 0 }); });

  reader.init();
  chart.init();
  applyRoute();
})();
