// 아랍어 글꼴 고르기.
//
// 같은 글자도 글꼴에 따라 아주 달라 보인다. 필사체(Naskh)는 붓으로 쓴 곡선이라
// 교재와 꾸란이 쓰고, 표지판체(Kufi)는 자를 대고 그은 듯한 기하학적 획이라
// 공항 표지판과 책 표지가 쓴다. 교재로 익힌 글자를 길에서 못 알아보는 일이
// 흔해 두 벌을 다 싣는다.
//
// 고른 것은 :root 의 data-font 로만 나타낸다 — styles.css 가 그 표시를 보고
// --f-ar 하나를 갈아 끼우므로, 글꼴을 쓰는 자리를 따로 고칠 일이 없다.

export const FONTS = [
  ['naskh', '필사체', '교재와 꾸란이 쓰는 붓글씨체입니다.'],
  ['kufi', '표지판', '공항 표지판과 책 표지가 쓰는 기하학적인 쿠피체입니다.'],
]

const KEY = 'arabic-reader.font'
const NAMES = FONTS.map(([name]) => name)

/** 지난번에 고른 글꼴. 못 읽으면 필사체로 시작한다. */
export function readStored() {
  try {
    const saved = window.localStorage.getItem(KEY)
    // 표지판체가 잠깐 'sans' 이던 때가 있다. 그때 고른 사람의 선택을 지키고 넘어간다.
    const name = saved === 'sans' ? 'kufi' : saved
    return NAMES.includes(name) ? name : NAMES[0]
  } catch {
    return NAMES[0] // 사생활 보호 창 등에서는 읽기부터 막힌다
  }
}

/** 화면에 입히고, 다음에 열 때를 위해 적어 둔다 */
export function applyFont(name) {
  const font = NAMES.includes(name) ? name : NAMES[0]
  document.documentElement.dataset.font = font
  try {
    window.localStorage.setItem(KEY, font)
  } catch {
    /* 적어 두지 못해도 이번 판에는 그대로 쓴다 */
  }
  return font
}
