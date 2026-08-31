// 아랍어 글자 처리.
//
// 이 파일이 푸는 문제: 단어를 글자별 <span> 으로 쪼개면 브라우저가 각 span 을
// 독립된 텍스트 런으로 보고 전부 "고립형"으로 그린다. 그러면 이어져야 할 필기체가
// 뚝뚝 끊긴 글자들의 나열이 되어 버린다.
//
// 해결: 각 조각 앞뒤에 ZWJ(U+200D)를 넣어 "여기 앞/뒤로 글자가 더 있다"고 알려준다.
// 그러면 셰이핑 엔진이 어두형/어중형/어말형을 알아서 골라 준다.
//
// 주의: 하이라이트는 반드시 color/background 만 바꿔야 한다.
// transform, display:inline-block, letter-spacing 등을 주면 이음선이 다시 끊긴다.

export const ZWJ = '\u200D'

// 아랍어 부호(하라카트·탄윈·슈크·샷다·위첨자 알리프 등)와 타트윌
const MARKS = /[\u064B-\u0652\u0670\u0653-\u065F\u06D6-\u06ED\u0640]/

// 뒤 글자로 이어지지 않는(왼쪽으로 붙지 않는) 글자들.
// 이 글자 다음에 오는 글자는 앞에 ZWJ 를 붙이면 안 된다.
const NON_CONNECTING = new Set([
  'ا', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'أ', 'إ', 'آ', 'ة', 'ى', 'ء', 'ٱ',
])

const ARABIC_LETTER = /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/

/** 부호(하라카트)인가 */
export function isMark(ch) {
  return MARKS.test(ch)
}

/** 아랍 문자(자음/모음 글자)인가 */
export function isArabicLetter(ch) {
  return ARABIC_LETTER.test(ch) && !isMark(ch)
}

/** 하라카트와 타트윌을 모두 제거한다 */
export function stripHarakat(text) {
  return (text || '').replace(new RegExp(MARKS.source, 'g'), '')
}

/** 문자열에서 부호를 뺀 기본 글자들만 */
function baseLetters(piece) {
  return Array.from(piece || '').filter(isArabicLetter)
}

/** 이 조각이 다음 글자로 이어지는가 (조각의 마지막 기본 글자 기준) */
function connectsForward(piece) {
  const letters = baseLetters(piece)
  const last = letters[letters.length - 1]
  return Boolean(last) && !NON_CONNECTING.has(last)
}

/** 이 조각이 앞 글자와 이어질 수 있는가 (조각의 첫 기본 글자 기준) */
function canConnectBackward(piece) {
  // 앞으로 붙지 않는 글자도 대부분 어말형은 존재한다(ا د ر و …).
  // ء(함자) 만 어느 쪽으로도 붙지 않는다.
  const first = baseLetters(piece)[0]
  return Boolean(first) && first !== 'ء'
}

/**
 * 글자 조각 배열을 받아, 각 조각을 "이어진 모양"으로 그릴 수 있는 문자열로 만든다.
 *
 * @param {string[]} pieces 논리 순서(첫 원소 = 가장 오른쪽 글자)의 글자 조각들
 * @returns {string[]} 같은 길이의, ZWJ 가 덧대어진 표시용 문자열들
 */
export function joinPieces(pieces) {
  return pieces.map((piece, i) => {
    const prev = i > 0 ? pieces[i - 1] : null
    const next = i < pieces.length - 1 ? pieces[i + 1] : null

    // 앞 글자가 뒤로 이어지는 글자이고, 나도 앞으로 붙을 수 있을 때만 앞에 ZWJ
    const lead = prev && connectsForward(prev) && canConnectBackward(piece) ? ZWJ : ''
    // 내가 뒤로 이어지는 글자이고, 다음 글자가 있을 때만 뒤에 ZWJ
    const trail = next && connectsForward(piece) && canConnectBackward(next) ? ZWJ : ''

    return lead + piece + trail
  })
}

/**
 * 아랍어 단어를 "자음 + 거기 붙은 부호" 단위로 쪼갠다.
 * 보통은 API 가 l 배열을 주므로 쓸 일이 없고, l 이 없거나 비었을 때의 대비책이다.
 */
export function splitIntoLetters(word) {
  const out = []
  for (const ch of Array.from(word || '')) {
    if (isMark(ch) && out.length) {
      out[out.length - 1] += ch // 부호는 바로 앞 글자에 붙인다
    } else if (ch.trim()) {
      out.push(ch)
    }
  }
  return out
}
