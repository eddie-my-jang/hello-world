// 자음과 부호가 결합한 글자의 발음표.
//
// 아랍어 조각만 적어 두고 한글·로마자는 transliterate.js 가 만든다.
// 손으로 적으면 자모표와 읽기판이 서로 다르게 가르치게 된다 — 이 앱이
// 처음부터 피하려던 일이다.

import { readWord } from './transliterate.js'

/** 자음 하나에 붙는 짝들. [붙이는 것, 칸 이름] */
const GROUPS = [
  ['짧은 소리', [['َ', '파트하'], ['ِ', '카스라'], ['ُ', '담마'], ['ْ', '수쿤']]],
  ['길게 늘인 소리', [['َا', '알리프'], ['ِي', '야'], ['ُو', '와우']]],
  ['미끄러지는 소리', [['َيْ', '아이'], ['َوْ', '아우']]],
  ['끝에 ㄴ 이 붙는 소리', [['ً', '탄윈 아'], ['ٍ', '탄윈 이'], ['ٌ', '탄윈 우']]],
  ['겹쳐 나는 소리', [['َّ', '샷다 아'], ['ِّ', '샷다 이'], ['ُّ', '샷다 우']]],
]

/**
 * 알리프는 자음이 아니다. 혼자서는 소리가 없고 함자를 얹는 받침대로 쓰이므로,
 * 부호를 붙인 표 대신 받침대로 선 모습을 보여 준다.
 */
const ALIF = [
  ['함자를 얹으면', [['أَ', '위에'], ['أُ', '위에'], ['إِ', '아래에'], ['آ', '맏다 (길게)']]],
  ['앞 모음을 늘이면', [['بَا', '파트하 뒤']]],
]

/** 한 조각을 읽는다. 한글은 글자별 값을 이어 붙여 장모음(―)이 보이게 둔다. */
function cell(a, name) {
  const built = readWord(a)
  return {
    a,
    name,
    k: built.l.map((letter) => letter.k).join(''),
    r: built.r,
    unknown: built.unknown,
  }
}

/**
 * 자음 하나의 결합표.
 * @param {string} base 자음 한 글자
 * @returns {{group: string, cells: {a, name, k, r}[]}[]}
 */
export function syllablesFor(base) {
  const groups = base === 'ا' ? ALIF : GROUPS
  return groups
    .map(([group, of]) => ({
      group,
      cells: of
        .map(([tail, name]) => cell(base === 'ا' ? tail : base + tail, name))
        // 엔진이 못 읽는 짝은 없는 셈 친다 — 물음표를 가르칠 수는 없다
        .filter((c) => !c.unknown),
    }))
    .filter((g) => g.cells.length)
}

/** 28자에 들지 않는 글자들의 발음. 글자마다 짝이 다르므로 따로 적는다. */
const EXTRA = {
  'ة': [['ةُ', '주격'], ['ةِ', '소유격'], ['ةَ', '목적격'], ['ة', '멈춰 읽을 때']],
  'ء': [['ءَ', '아'], ['ءِ', '이'], ['ءُ', '우']],
  'أ إ آ': [['أَ', '아'], ['أُ', '우'], ['إِ', '이'], ['آ', '아—']],
  // 알리프 막수라는 홀로 서지 않는다. 파트하 뒤에서 앞 모음을 늘이는 것이 전부다.
  'ى': [['بَى', '파트하 뒤']],
  'لا': [['لَا', '람알리프']],
}

/** 그밖의 글자 한 줄의 발음 칸들. 없으면 빈 배열. */
export function syllablesOfExtra(a) {
  return (EXTRA[a] || []).map(([piece, name]) => cell(piece, name)).filter((c) => !c.unknown)
}

/** 표에 실린 모든 조각 (테스트가 훑는다) */
export function allPieces() {
  return [
    ...GROUPS.flatMap(([, of]) => of.map(([tail]) => tail)),
    ...ALIF.flatMap(([, of]) => of.map(([piece]) => piece)),
  ]
}
