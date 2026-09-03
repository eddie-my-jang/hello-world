// 부호 없이 입력한 글을 앱이 아는 낱말에서 찾아 준다.
//
// 아랍어는 부호를 생략해 쓰므로 كتب 하나가 kataba / kutiba / kutub 중
// 무엇인지 글자만으로는 정해지지 않는다. 문맥을 읽어야 갈리는 일이라
// 진짜로 알아내는 것은 /api/read 의 몫이다.
//
// 다만 앱에는 이미 부호가 붙은 낱말이 수백 개 들어 있다. 부호를 뗀 모양(뼈대)으로
// 색인을 만들어 두면, 그 가운데 하나를 입력했을 때는 서버 없이도 찾아 줄 수 있다.
// 뼈대 하나에 읽기가 여럿이면 고르게 한다 — 없는 답을 지어내지 않는다.
//
// 한계는 분명하다. 앱이 아는 낱말만 된다.

import { SAMPLES } from './samples.js'
import { LETTERS, LONGS, MARKS } from './letters.js'
import { NUMBER_WORDS } from './numbers.js'
import { isArabicLetter, stripHarakat } from './arabic.js'
import { readWord } from './transliterate.js'

/**
 * 찾을 때 쓰는 열쇠.
 *
 * 부호를 떼는 것만으로는 모자란다. 아랍어 자판과 붙여넣은 글은 함자를 흔히
 * 흘려 쓴다 — أَيْنَ 를 اين 으로, سُؤَال 을 سوال 로 친다. 받침대만 남기고
 * 함자를 지워 맞춰 두면 그렇게 친 글도 찾힌다. 읽어 줄 때는 사전에 든
 * 원래 표기를 쓰므로, 화면에는 함자가 제대로 붙어 나온다.
 */
function key(word) {
  return stripHarakat(word || '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
}

function buildIndex() {
  const index = new Map() // 뼈대 → [{ a, k, r, m }]

  const add = (a, k, r, m) => {
    if (!a) return
    const bare = key(a)
    // 부호가 하나도 없는 것은 색인에 넣어 봐야 소용이 없다
    if (!bare || bare === a) return
    if (!index.has(bare)) index.set(bare, [])
    const bucket = index.get(bare)
    if (bucket.some((entry) => entry.a === a)) return
    bucket.push({ a, k: k || readWord(a).k, r: r || readWord(a).r, m: m || '' })
  }

  SAMPLES.forEach((sample) => sample.w.forEach((word) => add(word.a, word.k, word.r, word.m)))
  LETTERS.forEach((letter) => letter.ex && add(letter.ex.a, letter.ex.k, '', letter.ex.m))
  LONGS.forEach((row) => add(row.ex, row.exk, '', row.m))
  MARKS.forEach((row) => add(row.ex, row.exk, '', ''))
  NUMBER_WORDS.forEach((row) => add(row.a, row.k, row.r, row.m))

  return index
}

const INDEX = buildIndex()

/** 색인에 든 뼈대 수와 낱말 수 */
export function size() {
  let words = 0
  INDEX.forEach((bucket) => { words += bucket.length })
  return { skeletons: INDEX.size, words }
}

/**
 * 부호를 뗀 모양으로 찾는다.
 * @returns {{a: string, k: string, r: string, m: string}[]} 없으면 빈 배열
 */
export function lookup(word) {
  return INDEX.get(key(word)) || []
}

/** 이 낱말에 부호가 하나라도 붙어 있는가 */
export function isVocalized(word) {
  return Boolean(word) && stripHarakat(word) !== word
}

/**
 * 붙여넣은 글을 읽되, 부호가 없는 낱말은 사전에서 찾아 채운다.
 *
 * @returns {{
 *   w: object[],                                   읽기판에 넘길 낱말들
 *   found: number,                                 사전에서 찾아 채운 낱말 수
 *   picks: {index: number, bare: string, chosen: string, candidates: object[]}[]
 * }}                                               읽기가 여럿인 자리
 */
export function readTextSmart(text, { maxWords = 8, choices = {} } = {}) {
  const raw = (text || '')
    .trim()
    .split(/\s+/)
    .filter((token) => Array.from(token).some(isArabicLetter)) // 아랍어가 아닌 것은 버린다
    .slice(0, maxWords)

  let found = 0
  const picks = []
  const w = []

  raw.forEach((token, index) => {
    if (isVocalized(token)) {
      w.push(readWord(token))
      return
    }

    const candidates = lookup(token)
    if (!candidates.length) {
      w.push(readWord(token)) // 모르는 자리는 모른다고 남긴다
      return
    }

    // 사용자가 고른 것이 있으면 그것을, 없으면 첫 번째를
    const chosen = candidates.find((c) => c.a === choices[index]) || candidates[0]
    const read = readWord(chosen.a)
    w.push({ ...read, k: chosen.k || read.k, r: chosen.r || read.r, m: chosen.m || '' })
    found += 1
    if (candidates.length > 1) picks.push({ index, bare: token, chosen: chosen.a, candidates })
  })

  return { w: w.filter((word) => word.l.length), found, picks }
}
