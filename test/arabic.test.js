import test from 'node:test'
import assert from 'node:assert/strict'
import { ZWJ, joinPieces, splitIntoLetters, stripHarakat, isMark, letterForms } from '../src/lib/arabic.js'

test('joinPieces: 이어지는 글자 뒤에는 ZWJ, 이어지지 않는 글자 뒤에는 없음', () => {
  // كِتَاب — ا 는 뒤로 이어지지 않으므로 그 다음 ب 앞에는 ZWJ 가 없어야 한다
  const out = joinPieces(['كِ', 'تَ', 'ا', 'ب'])
  assert.deepEqual(out, [
    'كِ' + ZWJ,
    ZWJ + 'تَ' + ZWJ,
    ZWJ + 'ا',
    'ب',
  ])
})

test('joinPieces: 글자 하나짜리 단어에는 ZWJ 가 붙지 않는다', () => {
  assert.deepEqual(joinPieces(['بَ']), ['بَ'])
})

test('joinPieces: 이어지지 않는 글자로만 이루어진 단어', () => {
  // وَرْد — و 도 ر 도 뒤로 이어지지 않는다
  assert.deepEqual(joinPieces(['وَ', 'رْ', 'د']), ['وَ', 'رْ', 'د'])
})

test('joinPieces: 원본 글자는 그대로 남고 ZWJ 만 덧붙는다', () => {
  const pieces = ['مَ', 'كْ', 'تَ', 'بَ', 'ة']
  const out = joinPieces(pieces)
  assert.equal(out.length, pieces.length)
  out.forEach((joined, i) => {
    assert.equal(joined.replaceAll(ZWJ, ''), pieces[i])
  })
})

test('splitIntoLetters: 부호는 앞 글자에 붙는다', () => {
  assert.deepEqual(splitIntoLetters('كِتَاب'), ['كِ', 'تَ', 'ا', 'ب'])
  assert.deepEqual(splitIntoLetters('مُدَرِّس'), ['مُ', 'دَ', 'رِّ', 'س'])
})

test('stripHarakat: 부호와 타트윌을 지운다', () => {
  assert.equal(stripHarakat('كِتَاب'), 'كتاب')
  assert.equal(stripHarakat('كَتَبَ'), 'كتب')
})

test('isMark', () => {
  assert.equal(isMark('َ'), true) // fatha
  assert.equal(isMark('ك'), false)
})

test('letterForms: 이어지는 글자는 네 모양이 다 나온다', () => {
  const f = letterForms('ب')
  assert.deepEqual(f, {
    alone: 'ب',
    init: 'ب' + ZWJ,
    mid: ZWJ + 'ب' + ZWJ,
    fin: ZWJ + 'ب',
  })
})

test('letterForms: 뒤로 안 이어지는 글자는 첫·가운데 모양이 없다', () => {
  for (const ch of ['ا', 'د', 'ذ', 'ر', 'ز', 'و']) {
    const f = letterForms(ch)
    assert.equal(f.init, null, `${ch} 는 첫 모양이 없어야 한다`)
    assert.equal(f.mid, null, `${ch} 는 가운데 모양이 없어야 한다`)
    assert.equal(f.fin, ZWJ + ch)
  }
})

test('letterForms: 함자는 어느 쪽으로도 붙지 않는다', () => {
  const f = letterForms('ء')
  assert.deepEqual([f.init, f.mid, f.fin], [null, null, null])
  assert.equal(f.alone, 'ء')
})
