import test from 'node:test'
import assert from 'node:assert/strict'
import { SAMPLES, SAMPLE } from '../src/lib/samples.js'
import { splitIntoLetters, stripHarakat } from '../src/lib/arabic.js'

test('예문이 넉넉히 있고 칩 이름이 겹치지 않는다', () => {
  assert.ok(SAMPLES.length >= 30, `${SAMPLES.length}개`)
  const tags = SAMPLES.map((s) => s.tag)
  assert.equal(new Set(tags).size, tags.length, '칩 이름 중복')
  assert.equal(SAMPLE, SAMPLES[0])
})

test('모든 예문이 /api/read 응답 모양을 지킨다', () => {
  for (const sample of SAMPLES) {
    assert.ok(sample.tag && sample.t, `${sample.tag} 머리말 없음`)
    assert.ok(sample.w.length > 0 && sample.w.length <= 8, `${sample.tag} 단어 수`)
    for (const word of sample.w) {
      for (const field of ['a', 'k', 'r', 'm']) {
        assert.ok(word[field], `${word.a} 의 ${field} 없음`)
      }
      assert.ok(word.l.length > 0, `${word.a} 글자 분해 없음`)
      for (const letter of word.l) {
        assert.ok(letter.a, `${word.a} 빈 글자`)
        assert.ok(letter.k, `${word.a} 의 ${letter.a} 한글 없음`)
        assert.ok(letter.r, `${word.a} 의 ${letter.a} 로마자 없음`)
      }
    }
  }
})

test('글자를 이어붙이면 단어가 그대로 나온다', () => {
  // l 은 단어를 쪼갠 것이므로 합치면 원래 단어여야 한다.
  // 여기가 어긋나면 읽기판이 원문과 다른 글자를 그린다.
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      assert.equal(word.l.map((l) => l.a).join(''), word.a, `${word.a} 재조립 불일치`)
      assert.deepEqual(word.l.map((l) => l.a), splitIntoLetters(word.a), `${word.a} 분해 방식 불일치`)
    }
  }
})

test('모든 단어에 하라카트가 붙어 있다', () => {
  // 부호가 하나도 없으면 발음을 정할 수 없다. 한 글자짜리는 예외로 둔다.
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      if (word.l.length < 2) continue
      assert.notEqual(stripHarakat(word.a), word.a, `${word.a} 에 부호가 없다`)
    }
  }
})

test('장모음과 묵음 글자는 한글 자리가 ― 또는 묵음이다', () => {
  const carriers = new Set(['ا', 'و', 'ي', 'ة', 'ى'])
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      word.l.forEach((letter, i) => {
        const bare = letter.a.length === 1 && carriers.has(letter.a)
        if (!bare || i === 0) return
        assert.ok(['―', '묵음', '이', '우'].includes(letter.k),
          `${word.a} 의 ${letter.a}: ${letter.k}`)
      })
    }
  }
})
