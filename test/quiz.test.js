import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SCOPES, MODES, buildPool, buildQuestion, makeQuiz, poolFromLetters, poolFromSamples, poolSize,
} from '../src/lib/quiz.js'
import { SAMPLES } from '../src/lib/samples.js'
import { LETTERS } from '../src/lib/letters.js'

const data = { samples: SAMPLES, letters: LETTERS }

test('poolFromLetters() 는 글자마다 이름만 읽기로 채우고 뜻은 비워 둔다', () => {
  const pool = poolFromLetters(LETTERS)
  assert.equal(pool.length, LETTERS.length)
  for (const item of pool) {
    assert.equal(item.kind, 'letter')
    assert.ok(item.reading)
    assert.equal(item.meaning, null)
  }
})

test('poolFromSamples() 는 고른 갈래만, 숫자는 걸러 낸다', () => {
  const pool = poolFromSamples(SAMPLES, new Set(['낱말']))
  assert.ok(pool.length > 0)
  assert.ok(pool.every((item) => item.kind === '낱말'))
  assert.ok(!pool.some((item) => item.kind === '숫자'))
})

test('buildPool() 의 전체(all) 는 글자 + 낱말 + 문장만 모은다 — 숫자는 안 들어간다', () => {
  const pool = buildPool('all', data)
  const kinds = new Set(pool.map((item) => item.kind))
  assert.deepEqual(kinds, new Set(['letter', '낱말', '문장']))
})

test('SCOPES·MODES 목록이 비어 있지 않다', () => {
  assert.ok(SCOPES.length >= 4)
  assert.ok(MODES.length >= 3)
})

test('buildQuestion() 은 선택지 네 개를 내놓고 그 가운데 정답이 있다', () => {
  const pool = buildPool('문장', data)
  const q = buildQuestion(pool[0], 'reading', pool, Math.random)
  assert.ok(q, '문제를 만들지 못했다')
  assert.equal(q.options.length, 4)
  assert.ok(q.options.includes(q.answer))
  assert.equal(new Set(q.options).size, 4, '선택지가 겹친다')
})

test('글자 문제는 읽기만 나오고, 선택지에 같은 이름이 겹치지 않는다', () => {
  const pool = poolFromLetters(LETTERS)
  for (const item of pool) {
    const q = buildQuestion(item, 'reading', pool, Math.random)
    if (!q) continue // 오답 후보가 모자란 극히 드문 경우
    assert.equal(new Set(q.options).size, q.options.length)
    assert.equal(q.options.filter((o) => o === q.answer).length, 1)
  }
})

test('makeQuiz() 는 요청한 개수만큼(또는 그 안에서) 문제를 만든다', () => {
  const pool = buildPool('all', data)
  const quiz = makeQuiz(pool, { mode: 'both', count: 10, rng: Math.random })
  assert.ok(quiz.length > 0 && quiz.length <= 10)
  for (const q of quiz) {
    assert.ok(['reading', 'meaning'].includes(q.type))
    assert.equal(q.options.length, 4)
    assert.ok(q.options.includes(q.answer))
  }
})

test('모드가 뜻만일 때 글자는 섞이지 않는다 — 글자는 뜻이 없다', () => {
  const pool = buildPool('all', data)
  const quiz = makeQuiz(pool, { mode: 'meaning', count: 50, rng: Math.random })
  assert.ok(quiz.length > 0)
  assert.ok(quiz.every((q) => q.item.kind !== 'letter'))
  assert.ok(quiz.every((q) => q.type === 'meaning'))
})

test('모드가 읽기만일 때는 전부 읽기 문제다', () => {
  const pool = buildPool('all', data)
  const quiz = makeQuiz(pool, { mode: 'reading', count: 50, rng: Math.random })
  assert.ok(quiz.every((q) => q.type === 'reading'))
})

test('문제마다 뽑힌 항목이 겹치지 않는다', () => {
  const pool = buildPool('all', data)
  const quiz = makeQuiz(pool, { mode: 'both', count: 40, rng: Math.random })
  const seen = new Set(quiz.map((q) => q.item))
  assert.equal(seen.size, quiz.length)
})

test('poolSize() 는 뜻만 모드에서 글자를 빼고 센다', () => {
  const pool = buildPool('all', data)
  const both = poolSize(pool, 'both')
  const meaningOnly = poolSize(pool, 'meaning')
  const letters = pool.filter((item) => item.kind === 'letter').length
  assert.equal(both, pool.length)
  assert.equal(meaningOnly, pool.length - letters)
})

test('rng 를 고정하면 같은 결과가 나온다 — 난수 하나만 쓴다', () => {
  const pool = buildPool('낱말', data)
  const fixed = () => 0.42
  const a = makeQuiz(pool, { mode: 'both', count: 5, rng: fixed })
  const b = makeQuiz(pool, { mode: 'both', count: 5, rng: fixed })
  assert.deepEqual(a.map((q) => q.answer), b.map((q) => q.answer))
})

test('손으로 적지 않은 오답은 지어내지 않는다 — 선택지는 전부 실제 자료에서 나온다', () => {
  const pool = buildPool('all', data)
  const readingPool = new Set(pool.map((item) => item.reading).filter(Boolean))
  const meaningPool = new Set(pool.map((item) => item.meaning).filter(Boolean))
  const quiz = makeQuiz(pool, { mode: 'both', count: 60, rng: Math.random })
  for (const q of quiz) {
    const universe = q.type === 'reading' ? readingPool : meaningPool
    for (const option of q.options) assert.ok(universe.has(option), `${option} 은 자료에 없다`)
  }
})
