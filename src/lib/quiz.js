// 복습 퀴즈 — 예문·자모표에서 문제를 뽑아 「어떻게 읽는가」·「무슨 뜻인가」를 묻는다.
//
// 정답·오답 모두 앱이 이미 손으로 적어 둔 자료(samples.js, letters.js)에서만
// 가져온다 — 지어내지 않는다. 글자는 뜻이 없으므로 읽기(이름 맞히기)만 묻고,
// 낱말·문장은 읽기·뜻 둘 다 묻는다. 숫자(kind: '숫자')는 다루지 않는다 —
// 숫자 페이지가 이미 따로 가르친다.
//
// 데모(demo/)에도 그대로 끌어 쓰므로 이 파일은 다른 모듈을 끌어오지 않는다 —
// 자모·예문 목록은 부르는 쪽이 건네준다.

export const SCOPES = [
  { id: 'all', label: '전체' },
  { id: 'letter', label: '글자' },
  { id: '낱말', label: '낱말' },
  { id: '문장', label: '문장' },
]

export const MODES = [
  { id: 'both', label: '읽기 + 뜻' },
  { id: 'reading', label: '읽기만' },
  { id: 'meaning', label: '뜻만' },
]

const TYPES_OF_MODE = {
  both: ['reading', 'meaning'],
  reading: ['reading'],
  meaning: ['meaning'],
}

/** 자모표를 퀴즈 항목으로 바꾼다. 글자는 뜻이 없어 reading(이름)만 찬다. */
export function poolFromLetters(letters) {
  return letters.map((letter) => ({
    kind: 'letter',
    arabic: letter.a,
    reading: letter.name,
    meaning: null,
    letter,
  }))
}

/** 예문을 퀴즈 항목으로 바꾼다. kinds 에 든 갈래(낱말·문장)만 받는다. */
export function poolFromSamples(samples, kinds) {
  return samples
    .filter((s) => kinds.has(s.kind) && s.tag && s.w?.length && s.w.every((w) => w.a && w.k))
    .map((s) => ({
      kind: s.kind,
      arabic: s.w.map((w) => w.a).join(' '),
      reading: s.w.map((w) => w.k).join(' '),
      meaning: s.tag,
      sample: s,
    }))
}

export function buildPool(scope, { samples, letters }) {
  if (scope === 'letter') return poolFromLetters(letters)
  if (scope === '낱말' || scope === '문장') return poolFromSamples(samples, new Set([scope]))
  return [...poolFromLetters(letters), ...poolFromSamples(samples, new Set(['낱말', '문장']))]
}

function labelOf(item, type) {
  return type === 'reading' ? item.reading : item.meaning
}

/** 항목이 지금 모드에서 받을 수 있는 물음 갈래 */
function typesFor(item, allowedTypes) {
  const types = []
  if (item.reading && allowedTypes.includes('reading')) types.push('reading')
  if (item.meaning && allowedTypes.includes('meaning')) types.push('meaning')
  return types
}

/** 지금 모드로 실제 몇 문제까지 낼 수 있는지 — 설정 화면에 보여 준다 */
export function poolSize(pool, mode = 'both') {
  const allowed = TYPES_OF_MODE[mode] || TYPES_OF_MODE.both
  return pool.filter((item) => typesFor(item, allowed).length).length
}

function shuffled(list, rng) {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * 같은 갈래(글자/낱말/문장) 안에서만 오답을 고른다 — 갈래가 섞이면
 * 글자 이름(한두 음절)과 문장 뜻(여러 어절)이 길이만으로 갈라져 보여
 * 퀴즈가 안 된다. 정답과 이름이 같은 것(예: ت·ط 모두 「타」)도 뺀다.
 */
function distractorsFor(item, type, pool, count, rng) {
  const correct = labelOf(item, type)
  const candidates = shuffled(
    pool.filter((other) =>
      other !== item && other.kind === item.kind &&
      labelOf(other, type) && labelOf(other, type) !== correct),
    rng,
  )
  const picked = []
  const seen = new Set()
  for (const candidate of candidates) {
    const label = labelOf(candidate, type)
    if (seen.has(label)) continue
    seen.add(label)
    picked.push(label)
    if (picked.length >= count) break
  }
  return picked
}

function promptFor(item, type) {
  if (item.kind === 'letter') return '이 글자의 이름은 무엇일까요?'
  return type === 'reading' ? '어떻게 읽을까요?' : '무슨 뜻일까요?'
}

/** 오답 세 개를 못 채우면 null — 같은 갈래가 네 개는 있어야 문제가 된다 */
export function buildQuestion(item, type, pool, rng = Math.random) {
  const correct = labelOf(item, type)
  const distractors = distractorsFor(item, type, pool, 3, rng)
  if (distractors.length < 3) return null
  return {
    item,
    type,
    prompt: promptFor(item, type),
    options: shuffled([correct, ...distractors], rng),
    answer: correct,
  }
}

/**
 * 퀴즈 한 판을 만든다. 문제마다 항목을 하나 뽑고, 그 항목이 받을 수 있는
 * 물음 갈래(읽기/뜻) 중 하나를 골라 선택지 네 개를 만든다.
 */
export function makeQuiz(pool, { mode = 'both', count = 10, rng = Math.random } = {}) {
  const allowed = TYPES_OF_MODE[mode] || TYPES_OF_MODE.both
  const candidates = pool
    .map((item) => ({ item, types: typesFor(item, allowed) }))
    .filter(({ types }) => types.length)

  const picked = shuffled(candidates, rng).slice(0, Math.max(0, Math.min(count, candidates.length)))

  const out = []
  for (const { item, types } of picked) {
    const type = types[Math.floor(rng() * types.length)]
    const question = buildQuestion(item, type, pool, rng)
    if (question) out.push(question)
  }
  return out
}
