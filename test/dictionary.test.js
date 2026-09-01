import test from 'node:test'
import assert from 'node:assert/strict'
import { lookup, isVocalized, readTextSmart, size } from '../src/lib/dictionary.js'

test('색인이 넉넉히 쌓인다', () => {
  const { skeletons, words } = size()
  assert.ok(skeletons > 150, `뼈대 ${skeletons}개`)
  assert.ok(words >= skeletons, '낱말 수가 뼈대 수보다 적을 수 없다')
})

test('부호를 뗀 모양으로 찾는다', () => {
  const hits = lookup('كتاب')
  assert.ok(hits.some((h) => h.a === 'كِتَاب'), JSON.stringify(hits))
})

test('읽기가 여럿인 뼈대는 여럿을 돌려준다', () => {
  // 이 앱이 존재하는 이유가 되는 바로 그 낱말
  const hits = lookup('كتب').map((h) => h.a)
  assert.ok(hits.length > 1, `${hits.length}개`)
  assert.ok(hits.includes('كَتَبَ'))
})

test('없는 낱말은 빈 배열', () => {
  assert.deepEqual(lookup('زززز'), [])
})

test('isVocalized', () => {
  assert.equal(isVocalized('كِتَاب'), true)
  assert.equal(isVocalized('كتاب'), false)
  assert.equal(isVocalized(''), false)
})

test('부호 없는 글을 사전으로 채운다', () => {
  const out = readTextSmart('السلام عليكم')
  assert.equal(out.w.length, 2)
  assert.equal(out.found, 2)
  assert.equal(out.w[0].a, 'اَلسَّلَامُ')
  assert.equal(out.w[0].k, '앗살라무')
})

test('이미 부호가 붙어 있으면 그대로 읽는다', () => {
  const out = readTextSmart('كِتَاب')
  assert.equal(out.found, 0) // 사전을 쓰지 않았다
  assert.equal(out.w[0].a, 'كِتَاب')
})

test('읽기가 여럿이면 고를 것으로 남긴다', () => {
  const out = readTextSmart('كتب')
  assert.equal(out.picks.length, 1)
  assert.equal(out.picks[0].bare, 'كتب')
  assert.ok(out.picks[0].candidates.length > 1)

  // 고른 것을 넘기면 그것으로 읽는다
  const other = out.picks[0].candidates[1].a
  const picked = readTextSmart('كتب', { choices: { 0: other } })
  assert.equal(picked.w[0].a, other)
})

test('모르는 낱말은 지어내지 않는다', () => {
  const out = readTextSmart('زززز')
  assert.equal(out.found, 0)
  assert.ok(out.w[0].unknown > 0, '모르는 자리가 남아야 한다')
})

test('아랍어가 아닌 것은 버린다', () => {
  assert.equal(readTextSmart('hello world').w.length, 0)
  assert.equal(readTextSmart('hello كتاب').w.length, 1)
})

test('한 번에 여덟 낱말까지', () => {
  assert.equal(readTextSmart(Array(12).fill('كتاب').join(' ')).w.length, 8)
})
