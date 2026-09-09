// 오프라인 사전에 얹을 낱말 목록을 만든다. 손으로 돌리는 일회성 스크립트다.
//
//   node tools/build-lexicon.mjs <말뭉치.txt> [개수]   →  src/lib/lexicon.js
//
// 말뭉치는 Tashkeela 벤치마크(MIT)를 쓴다. 34MB 라 저장소에 넣지 않는다:
//   curl -sSLO https://raw.githubusercontent.com/AliOsm/arabic-text-diacritization/master/dataset/train.txt
//
// 하는 일은 넷이다.
//   1. 부호가 붙은 낱말만 고른다
//   2. 앱의 표기 관례에 맞춘다 (아래 normalize)
//   3. 읽기 엔진이 물음표 없이 읽어 내는 것만 남긴다 — 이것이 품질 관문이다
//   4. 잦은 것부터 잘라 낸다

import { readFileSync, writeFileSync } from 'node:fs'
import { readWord } from '../src/lib/transliterate.js'
import { stripHarakat } from '../src/lib/arabic.js'

const MARK = /[ً-ْٰ]/
const ARABIC_ONLY = /^[ء-يً-ْٰـ]+$/
const CASE_MARK = /[ًٌٍَُِ]/
const FATHA = 'َ'
const SUKUN = 'ْ'

/**
 * 낱말 끝의 격어미를 떼어 표제형으로 되돌린다.
 *
 * 말뭉치는 문장에서 뽑은 것이라 명사에 거의 언제나 격어미가 붙어 있다 —
 * `بِنْتِ` `بِنْتُ` 는 있어도 `بِنْت` 는 드물다. 그대로 두면 앱이 「빈티」를
 * 가르치게 된다. 자모표와 예문은 멈춰 읽는 꼴(빈트)로 가르치므로 맞춘다.
 *
 * 다만 과거 동사의 끝 파트하는 격어미가 아니라 낱말의 일부다 (كَتَبَ 카타바).
 * 짧고 · 수쿤이 없고 · 파트하로 끝나면 동사로 보고 그대로 둔다.
 */
function toCitation(word) {
  let w = word
  // 끝에 겹쳐 붙은 부호를 훑는다 (샷다+탄윈 차례가 뒤집힌 것도 있다)
  while (w.length > 1 && CASE_MARK.test(w[w.length - 1])) {
    const last = w[w.length - 1]
    const bare = w.replace(/[ً-ْٰ]/g, '')
    const looksLikeVerb = last === FATHA && bare.length <= 5 && !w.includes(SUKUN)
    if (looksLikeVerb) break
    w = w.slice(0, -1)
    if (w.endsWith('ّ')) break // 겹자음 표시는 낱말의 일부라 남긴다
  }
  return w
}

/**
 * 말뭉치 표기를 앱 표기로 맞춘다. 맞출 수 없으면 null.
 *
 * 정관사가 관건이다. 말뭉치는 `الْكِتَاب` 처럼 알리프에 부호를 안 찍는데,
 * 그러면 엔진이 첫 글자를 못 읽는다(물음표). 앱은 `اَلْكِتَاب` 로 적는다.
 */
function normalize(raw) {
  let w = raw.normalize('NFC').replace(/ـ/g, '') // 타트윌(늘임표) 제거
  if (!w || !ARABIC_ONLY.test(w)) return null
  w = toCitation(w)

  const chars = [...w]
  if (chars[0] === 'ا' && chars[1] && !MARK.test(chars[1])) {
    // 낱말 첫머리의 맨 알리프 — 부호를 찍어 줘야 읽힌다.
    // 정관사면 파트하, 그밖(اِسْم اِثْنَان اِنْتَظَرَ)이면 카스라가 관례다.
    const article = chars[1] === 'ل'
    w = chars[0] + (article ? 'َ' : 'ِ') + chars.slice(1).join('')
  }
  return w
}

const [file, limitArg] = process.argv.slice(2)
if (!file) {
  console.error('쓰임: node tools/build-lexicon.mjs <말뭉치.txt> [개수]')
  process.exit(1)
}
const LIMIT = Number(limitArg) || 20000

const freq = new Map()
let seen = 0
for (const line of readFileSync(file, 'utf8').split('\n')) {
  for (const rawToken of line.split(/\s+/)) {
    const token = rawToken.replace(/^[^ء-ي]+|[^ء-ْٰ]+$/g, '')
    if (!token || !MARK.test(token)) continue
    seen += 1
    const w = normalize(token)
    if (!w) continue
    freq.set(w, (freq.get(w) || 0) + 1)
  }
}

// 품질 관문 — 엔진이 온전히 읽어 내지 못하는 것은 사전에 넣어 봐야 물음표만 는다
const readable = []
for (const [w, count] of freq) {
  if (stripHarakat(w).length < 2) continue
  if (readWord(w).unknown === 0) readable.push([w, count])
}
readable.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

// 뼈대 하나에 너무 많은 후보가 붙으면 고르기 화면이 못 쓰게 된다
const PER_SKELETON = 3
const perBare = new Map()
const kept = []
for (const [w, count] of readable) {
  const bare = stripHarakat(w)
  const n = perBare.get(bare) || 0
  if (n >= PER_SKELETON) continue
  perBare.set(bare, n + 1)
  kept.push(w)
  if (kept.length >= LIMIT) break
}

const out = `// 말뭉치에서 뽑은 낱말 목록. 손으로 고치지 말 것 —
// tools/build-lexicon.mjs 가 만든다 (Tashkeela 벤치마크, MIT).
//
// 잦은 것부터 ${kept.length}개. 부호는 앱 표기에 맞췄고, 읽기 엔진이
// 물음표 없이 읽어 내는 것만 남겼다. 뜻은 없다 — 발음을 채우는 것이 목적이다.
// 손으로 적은 예문(samples.js)이 언제나 앞선다.

export const LEXICON = ${JSON.stringify(kept)}
`
writeFileSync(new URL('../src/lib/lexicon.js', import.meta.url), out, 'utf8')

console.log(`훑은 낱말 ${seen.toLocaleString()}개 · 서로 다른 꼴 ${freq.size.toLocaleString()}`)
console.log(`엔진이 읽어 냄 ${readable.length.toLocaleString()} (${((readable.length / freq.size) * 100).toFixed(0)}%)`)
console.log(`남긴 것 ${kept.length.toLocaleString()} · 뼈대 ${perBare.size.toLocaleString()}`)
console.log(`src/lib/lexicon.js ${(out.length / 1024).toFixed(0)}KB`)
