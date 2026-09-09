// 접사(정관사·전치사·접속사·소유 어미)를 떼고 사전에서 줄기를 찾는다.
//
// 사전은 표제형만 안다. 그런데 실제로 손에 들어오는 글은 부호가 없을 뿐 아니라
// «الكتاب»(그 책)·«كتابي»(내 책)·«بالمدرسة»(학교에서) 처럼 접사가 붙어 있는
// 경우가 흔하다. 사전에 «كِتَاب» 이 있어도 뼈대가 다른 «الكتاب» 은 못 찾는다.
//
// 여기서는 흔한 접사를 떼고 남는 자리로 다시 찾는다. 정식 형태소 분석기가
// 아니라, 학습자가 흔히 마주치는 조합만 다루는 가벼운 목록이다 — 이중 접두사
// (이스티프알 같은 동사 파생꼴)나 쌍수·복수 어미는 다루지 않는다.
//
// 붙이는 부호가 정확한 문법 격이 아니라 관례적인 값(교재가 흔히 쓰는 「중립」
// 모음)이라는 점도 밝혀 둔다 — 예를 들어 소유 어미 앞의 모음은 문장 속 격에
// 따라 갈리지만, 여기서는 담마 하나로 통일한다(다만 ـي 앞은 카스라, ـني 앞은
// 파트하 — 동사 뒤 1인칭 목적어 어미의 흔한 꼴이다).
// 마찬가지로 «بِالْمَدْرَسَة» 처럼 접두사 뒤에서 정관사의 알리프가 실제로는
// 소리 나지 않는데(하마자 알 와슬), 이 앱은 어디서도 그 축약을 다루지 않으므로
// 여기서도 다루지 않는다 — 그대로 읽으면 다소 또박또박하게 들리는 정도다.

const SUN = new Set(['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ل', 'ن'])
const LETTER = /[ء-ي]/

// 앞에 붙는 것. [뗄 글자, 부호를 붙인 꼴, 정관사를 함께 먹었는가]
// 긴 것부터 — 짧은 것이 먼저 걸리면 「بال」을 「ب」+「ال」로 잘못 가르게 된다.
const PREFIXES = [
  ['وبال', 'وَبِ', true], ['فبال', 'فَبِ', true],
  ['وكال', 'وَكَ', true], ['فكال', 'فَكَ', true],
  ['بال', 'بِ', true], ['كال', 'كَ', true], ['وال', 'وَ', true], ['فال', 'فَ', true],
  ['لل', 'لِ', true], ['ال', '', true],
  ['و', 'وَ', false], ['ف', 'فَ', false],
  ['ب', 'بِ', false], ['ك', 'كَ', false], ['ل', 'لِ', false],
]

// 뒤에 붙는 소유 어미. [뗄 글자, 붙일 부호+글자]
const SUFFIXES = [
  ['هما', 'ُهُمَا'], ['كما', 'ُكُمَا'],
  ['هم', 'ُهُمْ'], ['هن', 'ُهُنَّ'], ['كم', 'ُكُمْ'], ['كن', 'ُكُنَّ'],
  ['ها', 'ُهَا'], ['نا', 'ُنَا'], ['ني', 'َنِي'],
  ['ي', 'ِي'], ['ك', 'ُكَ'], ['ه', 'ُهُ'],

  // 소유 어미가 아니다 — 부정 목적격 명사의 흔적이다. ة 나 함자로 끝나지
  // 않는 명사는 목적격(~를/을) 부정형에서 끝에 소리 없는 알리프를 하나
  // 더 쓴다 — «فُنْدُق»(호텔)이 목적어 자리에서 «فُنْدُقًا»(호텔을)이 되는
  // 식이다. 부호 없이 치면 그 자리가 그냥 «فندقا」로 보여 뼈대가
  // 갈리므로, 알리프 하나를 떼고 탄윈 파트흐를 붙여 되짚는다.
  ['ا', 'ًا'],
]

const MIN_STEM = 2

/**
 * 정관사를 붙인다. 태양문자 앞에서는 ل 이 죽고 다음 자음이 겹친다 — 겹치는
 * 표시(샷다)는 그 자음이 이미 달고 있는 모음 뒤에 놓는다. 앞에 놓으면
 * (부호 차례가 뒤집히면) 앱의 다른 곳(예문 등)과 표기가 어긋난다 — 소리는
 * 똑같이 나도 나중에 문자열을 그대로 견줄 때 다른 낱말처럼 보인다.
 */
function withArticle(vocalized) {
  const first = [...vocalized].find((ch) => LETTER.test(ch))
  if (!SUN.has(first)) return `اَلْ${vocalized}`
  const afterFirst = new RegExp(`^${first}[ً-ْٰ]*`)
  return `اَل${vocalized.replace(afterFirst, (m) => `${m}ّ`)}`
}

/** 소유 어미를 붙인다. 여성 표지 ة 는 어미 앞에서 ت 로 바뀐다. */
function withSuffix(vocalized, tail) {
  const stem = vocalized.endsWith('ة') ? `${vocalized.slice(0, -1)}ت` : vocalized
  return stem + tail
}

/**
 * 뼈대에서 접사를 뗄 수 있는 자리를 모두 찾는다. 결과는 「몇 글자를 뗐는가」로
 * 묶은 단(tier)들의 배열이다 — 긴 접두사가 앞선 단, 그 안에서는 긴 접미사가
 * 앞선다. 부르는 쪽이 한 단에서 사전 결과를 찾으면 거기서 멈추는 것을
 * 전제로 한 순서다 (많이 뗀 조합을 먼저 시도하되, 그보다 짧게 떼도 되는데
 * 뗄 수 있는 걸 다 떼 버려서 못 찾는 일은 없게).
 *
 * @param {string} bare 부호를 뗀 뼈대 (dictionary.js 의 key() 를 거친 것)
 * @returns {{stem: string, apply: (vocalizedStem: string) => string}[][]}
 */
export function segmentations(bare) {
  const heads = [['', '', false], ...PREFIXES]
  const tails = [['', ''], ...SUFFIXES]

  return heads
    .filter(([cut]) => !cut || bare.startsWith(cut))
    .map(([cut, head, article]) => {
      const afterHead = bare.slice(cut.length)
      return tails
        .filter(([tailCut]) => !tailCut || afterHead.endsWith(tailCut))
        .map(([tailCut, tail]) => {
          const stem = tailCut ? afterHead.slice(0, -tailCut.length) : afterHead
          return { stem, tail, article, head }
        })
        .filter((seg) => seg.stem.length >= MIN_STEM)
        .map((seg) => ({
          stem: seg.stem,
          apply(vocalizedStem) {
            let word = vocalizedStem
            if (seg.tail) word = withSuffix(word, seg.tail)
            if (seg.article) word = withArticle(word)
            return seg.head + word
          },
        }))
    })
    .filter((tier) => tier.length)
}
