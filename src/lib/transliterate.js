// 하라카트가 붙은 아랍어를 글자 단위 한글·로마자로 옮긴다.
//
// 자모표(letters.js)의 자음별 발음표를 그대로 쓴다. 그래서 자모표에서
// بِ 를 「비」라고 가르쳐 놓고 읽기판에서 달리 읽는 일이 생기지 않는다.
//
// 할 수 있는 것과 없는 것:
//   - 붙어 있는 부호는 그대로 읽는다. 서버도, 인터넷도 필요 없다.
//   - 부호가 없으면 모음을 만들어 내지 못한다. 아랍어는 원래 부호를 안 쓰므로
//     كتب 는 kataba/kutiba/kutub 중 무엇이든 될 수 있다. 그건 문맥을 읽어야 하는
//     일이라 /api/read 의 몫이다. 여기서는 모르는 자리를 초성 하나(ㅋ, ㅌ …)로
//     남겨 "자음은 알지만 모음은 모른다"는 것을 보여 준다.

import { LETTERS } from './letters.js'
import { isMark, splitIntoLetters } from './arabic.js'

const FATHA = 'َ'
const KASRA = 'ِ'
const DAMMA = 'ُ'
const SUKUN = 'ْ'
const SHADDA = 'ّ'
const TANWIN_FATH = 'ً' // ً  -an
const TANWIN_DAMM = 'ٌ' // ٌ  -un
const TANWIN_KASR = 'ٍ' // ٍ  -in

// 28자에 없지만 자주 나오는 글자들
const EXTRA = {
  // 낱말 첫머리의 알리프. 파트하 뒤에 홀로 선 장모음 ا 는 아래 분기가 먼저 잡으므로
  // 여기 값은 부호를 얹었거나 낱말 첫머리에 선 경우에만 쓰인다.
  'ا': { c: 'ʾ', reads: ['아', '이', '우', '아'] }, // ا
  'أ': { c: 'ʾ', reads: ['아', '이', '우', '으'] }, // أ
  'إ': { c: 'ʾ', reads: ['아', '이', '우', '으'] }, // إ
  'آ': { c: 'ʾā', reads: ['아', '아', '아', '아'] }, // آ
  'ء': { c: 'ʾ', reads: ['아', '이', '우', '으'] }, // ء — 함자도 얹힌 모음을 낸다
  // 함자는 홀로 서지 못할 때 받침대를 얻는다. 받침대는 소리가 없고
  // 함자에 얹힌 모음만 난다 — مِئَة(미아), سُؤَال(수알).
  'ئ': { c: 'ʾ', reads: ['아', '이', '우', '으'] }, // ئ — 야 받침대
  'ؤ': { c: 'ʾ', reads: ['아', '이', '우', '으'] }, // ؤ — 와우 받침대
}

const TABLE = {}
for (const letter of LETTERS) {
  if (letter.reads) TABLE[letter.a] = { c: letter.c, reads: letter.reads }
}
Object.assign(TABLE, EXTRA)

const HANGUL_BASE = 0xac00
const HANGUL_LAST = 0xd7a3
const JONG_NIEUN = 4
// 초성 색인 → 호환 자모 (모음을 모를 때 자음만 보여 준다)
const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

/** 한글 음절에 받침 ㄴ 을 더한다 (탄윈: 바 → 반) */
function addNieun(syllable) {
  const chars = Array.from(syllable)
  const code = chars[chars.length - 1].codePointAt(0)
  if (code < HANGUL_BASE || code > HANGUL_LAST) return syllable + 'ㄴ'
  if ((code - HANGUL_BASE) % 28 !== 0) return syllable + 'ㄴ' // 이미 받침이 있으면 둔다
  chars[chars.length - 1] = String.fromCodePoint(code + JONG_NIEUN)
  return chars.join('')
}

/** 음절에서 초성만 떼어 낸다 (크 → ㅋ) */
function onsetOf(syllable) {
  const code = Array.from(syllable)[0]?.codePointAt(0)
  if (code === undefined || code < HANGUL_BASE || code > HANGUL_LAST) return syllable
  return CHOSEONG[Math.floor((code - HANGUL_BASE) / 588)] || syllable
}

function inspect(unit) {
  const chars = Array.from(unit || '')
  return {
    base: chars.find((ch) => !isMark(ch)),
    marks: chars.filter(isMark),
    has(mark) { return this.marks.includes(mark) },
  }
}

/**
 * 글자 조각 하나를 읽는다.
 * @param {string} unit 자음 + 거기 붙은 부호
 * @param {string|null} prev 앞 조각 (장모음 판정에 쓴다)
 * @param {boolean} isLast 단어의 마지막 조각인가 (부호 없이 끝나면 수쿤으로 읽는다)
 */
export function readLetter(unit, prev, isLast, next) {
  const u = inspect(unit)
  if (!u.base) return { a: unit, k: unit, r: unit }

  const entry = TABLE[u.base]
  const prevHas = (mark) => (prev ? inspect(prev).has(mark) : false)
  const plain = u.marks.length === 0
  const onlySukun = u.marks.length === 1 && u.has(SUKUN)

  // 태양문자 앞의 ل 은 쓰기만 하고 소리 내지 않는다. 뒤 자음이 겹쳐(샷다) 그
  // 몫을 대신한다 — اَلسَّلَام 은 「알살람」이 아니라 「앗살람」이다.
  // 뒤 조각에 샷다가 붙어 있는 것이 그 표시다.
  if (u.base === 'ل' && (plain || onlySukun) && next && inspect(next).has(SHADDA)) {
    return { a: unit, k: '묵음', r: '(-)' }
  }

  // 홀로 선 alif/waw/ya 는 자음이 아니라 앞 모음에 붙는다
  if (plain || onlySukun) {
    if (u.base === 'ا') { // ا
      if (prevHas(TANWIN_FATH)) return { a: unit, k: '묵음', r: '(-)' }
      if (prevHas(FATHA)) return { a: unit, k: '―', r: 'ā' }
    }
    if (u.base === 'و' && prevHas(DAMMA)) return { a: unit, k: '―', r: 'ū' } // و
    if (u.base === 'ي' && prevHas(KASRA)) return { a: unit, k: '―', r: 'ī' } // ي
  }
  // ة 는 멈춰 읽으면 소리가 없지만, 격어미가 붙으면 ت 로 살아난다
  // (اَلْقَهْوَة 카흐와 / اَلْقَهْوَةُ 카흐와투).
  if (u.base === 'ة') { // ة
    const marked = [FATHA, KASRA, DAMMA, TANWIN_FATH, TANWIN_KASR, TANWIN_DAMM].some((m) => u.has(m))
    if (!marked) return { a: unit, k: '묵음', r: '(a)' }
    // 읽기만 ت 에서 빌려 오고 글자는 그대로 둔다 — 글자판에 ة 가 그려져야 한다
    const asTa = readLetter(unit.replace('ة', 'ت'), prev, isLast, next)
    return { ...asTa, a: unit }
  }
  if (u.base === 'ى') return { a: unit, k: '―', r: 'ā' } // ى
  // آ 는 부호가 없어도 그 자체로 「아—」다
  if (u.base === 'آ') return { a: unit, k: '아', r: 'ʾā' } // آ

  if (!entry) return { a: unit, k: '?', r: '?', unknown: true }

  const { c, reads } = entry
  let k
  let r

  if (u.has(FATHA)) { k = reads[0]; r = c + 'a' }
  else if (u.has(KASRA)) { k = reads[1]; r = c + 'i' }
  else if (u.has(DAMMA)) { k = reads[2]; r = c + 'u' }
  else if (u.has(TANWIN_FATH)) { k = addNieun(reads[0]); r = c + 'an' }
  else if (u.has(TANWIN_KASR)) { k = addNieun(reads[1]); r = c + 'in' }
  else if (u.has(TANWIN_DAMM)) { k = addNieun(reads[2]); r = c + 'un' }
  else if (u.has(SUKUN) || isLast) {
    // 부호 없이 단어가 끝나면 멈춰 읽는 형태라 수쿤과 같다
    k = reads[3]
    r = c
  } else {
    // 단어 가운데인데 부호가 없다 — 모음을 알 수 없는 자리다
    return { a: unit, k: onsetOf(reads[3]), r: c, unknown: true }
  }

  // 샷다: 자음을 두 번 — 앞 음절 끝(수쿤형) + 뒤 음절
  if (u.has(SHADDA)) {
    k = reads[3] + k
    r = c + r
  }

  return { a: unit, k, r }
}

/**
 * 단어 전체의 로마자를 잇는다.
 * 장모음은 앞 단모음을 잡아먹는다 — ki + ta + ā + b 는 kitaāb 이 아니라 kitāb 이다.
 */
function joinRoman(letters) {
  const LONG = { 'ā': 'a', 'ī': 'i', 'ū': 'u' }
  let out = ''
  for (const { r } of letters) {
    if (r.startsWith('(')) continue // 묵음
    const short = LONG[r]
    if (short && out.endsWith(short)) out = out.slice(0, -1)
    out += r
  }
  return out
}

/** 단어 하나를 읽는다 */
export function readWord(word) {
  const units = splitIntoLetters(word)
  const l = units.map((unit, i) =>
    readLetter(unit, i > 0 ? units[i - 1] : null, i === units.length - 1, units[i + 1]))
  return {
    a: word,
    k: l.map((letter) => letter.k).filter((k) => k !== '―' && k !== '묵음').join(''),
    r: joinRoman(l),
    m: '',
    l,
    unknown: l.filter((letter) => letter.unknown).length,
  }
}

/**
 * 붙여넣은 글을 읽기판이 쓰는 모양으로 옮긴다.
 * @returns {{t: string, w: object[], unknown: number, total: number}}
 */
export function readText(text, { maxWords = 8 } = {}) {
  const words = (text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .map(readWord)
    .filter((word) => word.l.length)

  const unknown = words.reduce((sum, word) => sum + word.unknown, 0)
  const total = words.reduce((sum, word) => sum + word.l.length, 0)

  return { t: '', w: words, unknown, total }
}

/** 부호가 없어 모음을 정할 수 없는 자리가 몇 개인지 미리 센다 */
export function countUnmarked(text) {
  const { unknown, total } = readText(text)
  return { unknown, total }
}
