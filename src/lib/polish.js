// 엔진이 낸 글자별 한글을 낱말 수준으로 다듬는다.
//
// transliterate.js 는 글자를 하나씩 읽으므로 بِنْت 가 「비느트」로 나온다.
// 사람은 「빈트」라고 적는다. 그 차이를 메우는 규칙이 여기 있다 —
// 손으로 적은 예문을 훑어 관례를 뽑아낸 것이고, 그 가운데 93%가 이 규칙으로
// 그대로 재현된다 (test/polish.test.js 가 그 비율을 지킨다).
//
// 손으로 적은 예문에는 쓰이지 않는다. 그쪽은 사람이 고른 값이 이미 있다.
// 말뭉치에서 들여온 낱말처럼 사람 손이 닿지 않은 것에 쓴다.
const BASE = 0xac00, LAST = 0xd7a3
const JONG = { 'ㄱ': 1, 'ㄴ': 4, 'ㄹ': 8, 'ㅁ': 16, 'ㅂ': 17, 'ㅅ': 19, 'ㅇ': 21 }
// 홀로 설 수 없는 「받침감」 음절 → 어떤 받침이 되는가
const AS_JONG = { '느': 'ㄴ', '므': 'ㅁ', '르': 'ㄹ', '스': 'ㅅ', '트': 'ㅅ', '브': 'ㅂ', '크': 'ㄱ' }
const MARK = /[ً-ْٰ]/
const HAMZA = new Set(['ء', 'أ', 'إ', 'ئ', 'ؤ'])

const addJong = (syl, jong) => {
  const code = syl.codePointAt(syl.length - 1)
  if (code < BASE || code > LAST) return null
  if ((code - BASE) % 28 !== 0) return null // 이미 받침이 있으면 손대지 않는다
  return syl.slice(0, -1) + String.fromCodePoint(code + JONG[jong])
}

const baseOf = (a) => [...a].find((ch) => !MARK.test(ch))
const has = (a, m) => [...a].includes(m)

export function polish(letters) {
  const units = letters.map((l, i) => ({
    ...l,
    i,
    base: baseOf(l.a),
    shadda: has(l.a, 'ّ'),
    sukun: has(l.a, 'ْ'),
    last: i === letters.length - 1,
    longAfter: letters[i + 1]?.k === '―',
    longBefore: letters[i - 1]?.k === '―',
  }))

  const out = [] // 한글 음절들
  const push = (s) => out.push(s)
  const prev = () => (out.length ? out[out.length - 1] : null)
  const setPrev = (s) => { out[out.length - 1] = s }

  for (const u of units) {
    if (u.k === '―' || u.k === '묵음') continue

    // 낱말 끝의 겹자음은 한 번만 적는다 — 멈춰 읽으면 겹친 것이 들리지 않는다
    // (حَارّ 하르르 → 하르, مُهِمّ → 무힘).
    if (u.shadda && u.last && u.k.length === 2) {
      u.k = [...u.k][0]
    }

    // 겹자음(샷다): 앞 반쪽을 앞 음절 받침으로 내리고, 안 되면 버린다.
    // ر 만 예외로 둘 다 적는다 — 자모표가 مُدَرِّس 를 「무다르리스」로 가르친다.
    if (u.shadda && u.k.length === 2) {
      const [first, second] = [...u.k]
      if (u.base === 'ر') { push(first); push(second); continue }
      const jong = AS_JONG[first]
      const merged = jong && prev() ? addJong(prev(), jong) : null
      if (merged) setPrev(merged)
      push(second)
      continue
    }

    // 받침감 한 음절을 앞 음절로 내린다.
    //   ن  은 늘 (بِنْت 비느트 → 빈트)
    //   ل  은 정관사 اَلْ 일 때만 (اَلْخَيْر → 알카이르, 다만 طِفْل 은 티프르)
    //   م  은 낱말 끝에서, 앞이 제 모음을 가진 음절일 때만 (قَدِيم → 카딤, لَحْم 은 라흐므)
    const jong = AS_JONG[u.k]
    if (jong && prev()) {
      const article = u.base === 'ل' && u.i === 1 && units[0].base === 'ا'
      // 제 모음을 가진 음절 뒤의 م 은 받침으로 (شَمْس → 샴스, أَمْس → 암스)
      const mergeM = u.base === 'م' && !AS_JONG[units[u.i - 1]?.k]
      // 낱말을 닫는 ل — 앞이 제 모음을 가진 음절일 때만 받침으로 내린다
      // (مَال → 말, هَلْ → 할, 다만 طِفْل 은 티프르, سَهْل 은 사흐르)
      const endL = u.base === 'ل' && u.last && !AS_JONG[units[u.i - 1]?.k]
      if (u.base === 'ن' || article || mergeM || endL) {
        const merged = addJong(prev(), jong)
        if (merged) { setPrev(merged); continue }
      }
    }

    // 수쿤 얹은 ش 는 「슈」로 적는다 (مُشْكِلَة → 무슈키라)
    if (u.k === '쉬') { push('슈'); continue }

    // 모음 없는 함자는 적지 않는다 — 받침대일 뿐 소리가 따로 없다
    // (مَاء → 마, رَأْس → 라스, شَاطِئ → 샤티)
    if (HAMZA.has(u.base) && u.k === '으' && prev()) continue

    // 모음 없는 ع 은 앞 모음을 한 번 더 적는다 (صَعْب → 사아브)
    if (u.base === 'ع' && u.k === '으' && prev()) { push('아'); continue }

    // 장모음이나 이중모음에 붙은 ل 은 ㄹㄹ 로
    // (طَالِب → 탈리브, حَلِيب → 할리브, لَيْلَة → 라일라).
    // 제 모음이 없는 ل(르)은 두지 않는다 — طَوِيل 은 타위르다.
    const diphthong = ['ي', 'و'].includes(units[u.i - 1]?.base) && units[u.i - 1]?.sukun
    if (u.base === 'ل' && !AS_JONG[u.k] && (u.longBefore || u.longAfter || diphthong) && prev()) {
      const merged = addJong(prev(), 'ㄹ')
      if (merged) setPrev(merged)
    }

    push(u.k)
  }
  return out.join('')
}

/** 관례대로 첫머리 함자를 뗀 로마자 */
export const roman = (r) => r.replace(/^ʾ/, '')
