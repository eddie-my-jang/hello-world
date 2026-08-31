import test from 'node:test'
import assert from 'node:assert/strict'
import { LETTERS, FAMILIES, MARKS, LONGS, EXTRAS } from '../src/lib/letters.js'
import { letterConnectsForward } from '../src/lib/arabic.js'

test('자음은 28자다', () => {
  assert.equal(LETTERS.length, 28)
  assert.equal(new Set(LETTERS.map((l) => l.a)).size, 28)
})

test('모든 글자에 이름·로마자·예시가 있다', () => {
  for (const letter of LETTERS) {
    assert.ok(letter.name, `${letter.a} 이름 없음`)
    assert.ok(letter.ro, `${letter.a} 로마자 없음`)
    assert.ok(letter.ex?.a && letter.ex?.k && letter.ex?.m, `${letter.a} 예시 불완전`)
  }
})

test('reads 는 파트하·카스라·담마·수쿤 네 개', () => {
  for (const letter of LETTERS) {
    if (letter.reads === null) continue // 알리프는 혼자 소리가 없다
    assert.equal(letter.reads.length, 4, `${letter.a}`)
    letter.reads.forEach((r) => assert.ok(r, `${letter.a} 빈 발음`))
  }
})

test('뒤로 이어지지 않는 글자는 정확히 여섯 (28자 안에서)', () => {
  const stops = LETTERS.filter((l) => !letterConnectsForward(l.a)).map((l) => l.a)
  assert.deepEqual(stops, ['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
})

test('모양끼리 보기가 28자를 빠짐없이 한 번씩 담는다', () => {
  const grouped = FAMILIES.flatMap((f) => f.of)
  assert.equal(grouped.length, 28)
  assert.deepEqual([...grouped].sort(), LETTERS.map((l) => l.a).sort())
})

test('부호·장모음·그밖의 글자 표가 비어 있지 않다', () => {
  assert.equal(MARKS.length, 8)
  assert.equal(LONGS.length, 5)
  assert.ok(EXTRAS.length >= 5)
  for (const row of MARKS) assert.ok(row.name && row.ko && row.ex && row.note)
  for (const row of LONGS) assert.ok(row.form && row.ko && row.ex && row.m)
})
