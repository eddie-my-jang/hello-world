// 숫자.
//
// 한 줄에 세 가지를 담는다 — 아랍어(부호 붙인 것), 한글, 로마자.
// 셋 다 낱말 수가 같아야 한다. 읽기판 예문을 만들 때 낱말끼리 짝지어
// 쓰기 때문이다 (test/numbers.test.js 가 지킨다).
//
// 한글은 자모표(letters.js)의 발음표에서 나온 값을 다듬은 것이다.
// 다듬는 규칙은 samples.js 와 같다 — 수쿤 자음은 받침으로 내리고
// (비느트 → 빈트), 모음 사이의 ل 은 ㄹㄹ 로 적는다 (사라사 → 살라사).

import { readWord } from './transliterate.js'

/** 아라비아 숫자를 아랍 동부에서 쓰는 글자로 바꾼다 (25 → ٢٥) */
export function toArabicDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

/**
 * 숫자 글자 열 개.
 * 아랍어로 ٠١٢٣ 은 「인도 숫자」, 0123 은 「아랍 숫자」라고 부른다.
 * 이집트 동쪽에서는 ٠١٢٣ 을, 모로코·튀니지 쪽에서는 0123 을 쓴다.
 */
export const DIGITS = [
  { v: 0, a: 'صِفْر', k: '시프르', r: 'ṣifr' },
  { v: 1, a: 'وَاحِد', k: '와히드', r: 'wāḥid' },
  { v: 2, a: 'اِثْنَان', k: '이스난', r: 'ithnān' },
  { v: 3, a: 'ثَلَاثَة', k: '살라사', r: 'thalātha' },
  { v: 4, a: 'أَرْبَعَة', k: '아르바아', r: 'arbaʿa' },
  { v: 5, a: 'خَمْسَة', k: '캄사', r: 'khamsa' },
  { v: 6, a: 'سِتَّة', k: '싯타', r: 'sitta' },
  { v: 7, a: 'سَبْعَة', k: '사브아', r: 'sabʿa' },
  { v: 8, a: 'ثَمَانِيَة', k: '사마니야', r: 'thamāniya' },
  { v: 9, a: 'تِسْعَة', k: '티스아', r: 'tisʿa' },
]

/** 하나에서 열까지 */
export const ONES = [
  ...DIGITS.slice(1),
  { v: 10, a: 'عَشَرَة', k: '아샤라', r: 'ʿashara' },
]

/** 열하나에서 열아홉까지 — 앞자리를 그대로 두고 뒤에 عَشَرَ 를 붙인다 */
export const TEENS = [
  { v: 11, a: 'أَحَدَ عَشَرَ', k: '아하다 아샤라', r: 'aḥada ʿashara',
    wm: ['하나', '열'],
    note: '열하나만 وَاحِد 이 아니라 أَحَدَ 를 씁니다.' },
  { v: 12, a: 'اِثْنَا عَشَرَ', k: '이스나 아샤라', r: 'ithnā ʿashara',
    wm: ['둘', '열'],
    note: '둘도 꼴이 바뀌어 اِثْنَا 가 됩니다. 이 둘만 외워 두면 나머지는 규칙대로입니다.' },
  { v: 13, a: 'ثَلَاثَةَ عَشَرَ', k: '살라사타 아샤라', r: 'thalāthata ʿashara', wm: ['셋', '열'] },
  { v: 14, a: 'أَرْبَعَةَ عَشَرَ', k: '아르바아타 아샤라', r: 'arbaʿata ʿashara', wm: ['넷', '열'] },
  { v: 15, a: 'خَمْسَةَ عَشَرَ', k: '캄사타 아샤라', r: 'khamsata ʿashara', wm: ['다섯', '열'] },
  { v: 16, a: 'سِتَّةَ عَشَرَ', k: '싯타타 아샤라', r: 'sittata ʿashara', wm: ['여섯', '열'] },
  { v: 17, a: 'سَبْعَةَ عَشَرَ', k: '사브아타 아샤라', r: 'sabʿata ʿashara', wm: ['일곱', '열'] },
  { v: 18, a: 'ثَمَانِيَةَ عَشَرَ', k: '사마니야타 아샤라', r: 'thamāniyata ʿashara', wm: ['여덟', '열'] },
  { v: 19, a: 'تِسْعَةَ عَشَرَ', k: '티스아타 아샤라', r: 'tisʿata ʿashara', wm: ['아홉', '열'] },
]

/** 십의 자리 — 낱개 숫자에 ـُون 을 붙인 꼴이다 */
export const TENS = [
  { v: 20, a: 'عِشْرُون', k: '이쉬룬', r: 'ʿishrūn',
    note: '스물만 عَشَرَة 에서 모음이 바뀝니다. 서른부터는 낱개 숫자가 그대로 보입니다.' },
  { v: 30, a: 'ثَلَاثُون', k: '살라순', r: 'thalāthūn' },
  { v: 40, a: 'أَرْبَعُون', k: '아르바운', r: 'arbaʿūn' },
  { v: 50, a: 'خَمْسُون', k: '캄순', r: 'khamsūn' },
  { v: 60, a: 'سِتُّون', k: '싯툰', r: 'sittūn' },
  { v: 70, a: 'سَبْعُون', k: '사브운', r: 'sabʿūn' },
  { v: 80, a: 'ثَمَانُون', k: '사마눈', r: 'thamānūn' },
  { v: 90, a: 'تِسْعُون', k: '티스운', r: 'tisʿūn' },
]

/** 백의 자리 — 낱개 숫자와 مِئَة 를 한 낱말로 붙여 쓴다 */
export const HUNDREDS = [
  { v: 100, a: 'مِئَة', k: '미아', r: 'miʾa',
    note: 'مِائَة 로도 씁니다. 그 알리프는 쓰기만 하고 읽지 않는, 옛 표기가 굳은 자리입니다.' },
  { v: 200, a: 'مِئَتَان', k: '미아탄', r: 'miʾatān',
    note: '이백은 「두 백」이 아니라 مِئَة 의 쌍수(둘을 가리키는 꼴)입니다.' },
  { v: 300, a: 'ثَلَاثُمِئَة', k: '살라수미아', r: 'thalāthumiʾa' },
  { v: 400, a: 'أَرْبَعُمِئَة', k: '아르바우미아', r: 'arbaʿumiʾa' },
  { v: 500, a: 'خَمْسُمِئَة', k: '캄수미아', r: 'khamsumiʾa' },
  { v: 600, a: 'سِتُّمِئَة', k: '싯투미아', r: 'sittumiʾa' },
  { v: 700, a: 'سَبْعُمِئَة', k: '사브우미아', r: 'sabʿumiʾa' },
  { v: 800, a: 'ثَمَانُمِئَة', k: '사마누미아', r: 'thamānumiʾa' },
  { v: 900, a: 'تِسْعُمِئَة', k: '티스우미아', r: 'tisʿumiʾa' },
]

/** 천의 자리와 그 위 */
export const BIG = [
  { v: 1000, a: 'أَلْف', k: '알프', r: 'alf' },
  { v: 2000, a: 'أَلْفَان', k: '알판', r: 'alfān',
    note: '이천도 쌍수입니다 — 이백과 같은 방식입니다.' },
  { v: 3000, a: 'ثَلَاثَةُ آلَاف', k: '살라사투 알라프', r: 'thalāthatu ālāf',
    wm: ['셋', '천들'],
    note: '삼천부터는 「셋의 천들」처럼 أَلْف 의 복수 آلَاف 를 뒤에 둡니다.' },
  { v: 10000, a: 'عَشَرَةُ آلَاف', k: '아샤라투 알라프', r: 'ʿasharatu ālāf', wm: ['열', '천들'] },
  { v: 100000, a: 'مِئَةُ أَلْف', k: '미아투 알프', r: 'miʾatu alf', wm: ['백', '천'] },
  { v: 1000000, a: 'مِلْيُون', k: '밀윤', r: 'milyūn',
    note: '백만부터는 유럽 말에서 그대로 들여온 낱말을 씁니다.' },
]

/** 자리 이름 */
export const PLACES = [
  { name: '일의 자리', a: 'آحَاد', k: '아하드', r: 'āḥād' },
  { name: '십의 자리', a: 'عَشَرَات', k: '아샤라트', r: 'ʿasharāt' },
  { name: '백의 자리', a: 'مِئَات', k: '미아트', r: 'miʾāt' },
  { name: '천의 자리', a: 'آلَاف', k: '알라프', r: 'ālāf' },
]

/** 자리를 이어 붙인 보기 */
export const COMPOSED = [
  { v: 25, a: 'خَمْسَة وَعِشْرُون', k: '캄사 와이쉬룬', r: 'khamsa wa-ʿishrūn',
    wm: ['다섯', '그리고 스물'],
    note: '「다섯 그리고 스물」. 21~99 는 일의 자리를 먼저 읽습니다.' },
  { v: 99, a: 'تِسْعَة وَتِسْعُون', k: '티스아 와티스운', r: 'tisʿa wa-tisʿūn',
    wm: ['아홉', '그리고 아흔'],
    note: '「아홉 그리고 아흔」. 역시 뒤집힙니다.' },
  { v: 345, a: 'ثَلَاثُمِئَة وَخَمْسَة وَأَرْبَعُون', k: '살라수미아 와캄사 와아르바운', r: 'thalāthumiʾa wa-khamsa wa-arbaʿūn',
    wm: ['삼백', '그리고 다섯', '그리고 마흔'],
    note: '백은 큰 자리부터, 일과 십은 뒤에서 뒤집힙니다 — 「삼백 그리고 다섯 그리고 마흔」.' },
  { v: 2026, a: 'أَلْفَان وَسِتَّة وَعِشْرُون', k: '알판 와싯타 와이쉬룬', r: 'alfān wa-sitta wa-ʿishrūn',
    wm: ['두 천', '그리고 여섯', '그리고 스물'],
    note: '올해입니다 — 「두 천 그리고 여섯 그리고 스물」.' },
]

/** 예문 칩에 올릴 것들. 자릿수를 고루 담는다. */
const DECKS = [
  ...ONES.map((row) => [row, '낱개']),
  ...TEENS.map((row) => [row, '십몇']),
  ...TENS.map((row) => [row, '십의 자리']),
  ...HUNDREDS.map((row) => [row, '백의 자리']),
  ...BIG.map((row) => [row, '천의 자리']),
  ...COMPOSED.map((row) => [row, '이어 붙이기']),
]

/**
 * 읽기판 예문 모양으로 바꾼다.
 * 글자 단위 분해는 transliterate.js 가 만든다 — 손으로 적으면 반드시 어긋난다.
 * 낱말 수준의 한글·로마자만 위에서 다듬어 둔 값으로 덮는다.
 */
export function numberDecks() {
  return DECKS.map(([row, group]) => {
    const arabic = row.a.split(' ')
    const korean = row.k.split(' ')
    const roman = row.r.split(' ')
    return {
      tag: `${toArabicDigits(row.v)} ${row.v}`,
      kind: '숫자',
      t: row.note ? `${row.v} — ${row.note}` : `${row.v} (${group})`,
      w: arabic.map((piece, i) => ({
        ...readWord(piece),
        k: korean[i],
        r: roman[i],
        m: row.wm ? row.wm[i] : String(row.v),
      })),
    }
  })
}

/** 사전에 넣을 낱말들 (한 낱말짜리만 — 뼈대 색인은 낱말 단위다) */
export const NUMBER_WORDS = [...ONES, ...TEENS, ...TENS, ...HUNDREDS, ...BIG, ...PLACES]
  .flatMap((row) => {
    const arabic = row.a.split(' ')
    const korean = row.k.split(' ')
    const roman = row.r.split(' ')
    return arabic.map((a, i) => ({
      a,
      k: korean[i],
      r: roman[i],
      m: row.wm ? row.wm[i] : (row.v === undefined ? row.name : String(row.v)),
    }))
  })
