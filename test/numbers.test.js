import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BIG, COMPOSED, DIGITS, HUNDREDS, NUMBER_WORDS, ONES, PLACES, TEENS, TENS,
  numberDecks, toArabicDigits,
} from '../src/lib/numbers.js'
import { readWord } from '../src/lib/transliterate.js'
import { lookup } from '../src/lib/dictionary.js'
import { stripHarakat } from '../src/lib/arabic.js'

const ROWS = [...ONES, ...TEENS, ...TENS, ...HUNDREDS, ...BIG, ...COMPOSED, ...PLACES]

test('아라비아 숫자를 아랍 글자로 바꾼다', () => {
  assert.equal(toArabicDigits(0), '٠')
  assert.equal(toArabicDigits(25), '٢٥')
  assert.equal(toArabicDigits(1000), '١٠٠٠')
  // 왼쪽에서 오른쪽 — 자리 순서는 그대로다
  assert.equal(toArabicDigits(1995), '١٩٩٥')
})

test('아랍어·한글·로마자의 낱말 수가 같다', () => {
  // 읽기판 예문을 만들 때 낱말끼리 짝지어 쓰므로 어긋나면 엉뚱한 발음이 붙는다
  for (const row of ROWS) {
    const counts = [row.a, row.k, row.r].map((s) => s.split(' ').length)
    assert.equal(new Set(counts).size, 1, `${row.a}: ${counts.join('/')}`)
    if (row.wm) assert.equal(row.wm.length, counts[0], `${row.a} 뜻 개수`)
  }
})

test('모든 숫자에 부호가 붙어 있고 엔진이 읽을 수 있다', () => {
  for (const row of ROWS) {
    for (const word of row.a.split(' ')) {
      assert.notEqual(stripHarakat(word), word, `${word} 에 부호가 없다`)
      assert.equal(readWord(word).unknown, 0, `${word} 에 못 읽는 자리가 있다`)
    }
  }
})

test('한글 표기가 자모표의 발음표에서 벗어나지 않는다', () => {
  // 다듬긴 한다 — 수쿤 자음은 받침으로 내려가 음절이 하나 줄고(이스나느 → 이스난),
  // 모음 사이의 ل 은 ㄹㄹ 로 적는다(사라사 → 살라사). 그래도 남은 음절의 초성은
  // 자모표가 가르친 그대로여야 한다. 여기가 어긋나면 다른 글자를 가르치는 셈이다.
  const onsets = (s) => [...s.replace(/[^가-힣]/g, '')]
    .map((ch) => Math.floor((ch.codePointAt(0) - 0xac00) / 588))

  const isSubsequence = (small, big) => {
    let i = 0
    for (const x of big) if (x === small[i]) i += 1
    return i === small.length
  }

  for (const row of ROWS) {
    const built = row.a.split(' ').map((w) => readWord(w).k).join(' ')
    assert.ok(
      isSubsequence(onsets(row.k), onsets(built)),
      `${row.a}: ${row.k} 의 초성이 ${built} 에 없다`,
    )
  }
})

test('낱개 열 개가 모두 있다', () => {
  assert.deepEqual(DIGITS.map((d) => d.v), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  assert.deepEqual(ONES.map((d) => d.v), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(TEENS.map((d) => d.v), [11, 12, 13, 14, 15, 16, 17, 18, 19])
  assert.deepEqual(TENS.map((d) => d.v), [20, 30, 40, 50, 60, 70, 80, 90])
  assert.deepEqual(HUNDREDS.map((d) => d.v), [100, 200, 300, 400, 500, 600, 700, 800, 900])
  assert.ok(BIG.some((d) => d.v === 1000), '천이 없다')
})

test('예문 칩 이름이 겹치지 않고 자릿수를 고루 담는다', () => {
  const decks = numberDecks()
  const tags = decks.map((d) => d.tag)
  assert.equal(new Set(tags).size, tags.length, '칩 이름 중복')
  assert.ok(decks.every((d) => d.kind === '숫자'))
  assert.ok(decks.length >= 40, `${decks.length}개`)
})

test('사전이 숫자 낱말을 부호 없이도 찾아 준다', () => {
  for (const word of NUMBER_WORDS) {
    const found = lookup(stripHarakat(word.a))
    assert.ok(found.some((entry) => entry.a === word.a), `${word.a} 를 못 찾는다`)
  }
  // 실제로 입력할 법한 꼴
  assert.ok(lookup('ثلاثون').length, 'ثلاثون')
  assert.ok(lookup('مئة').length, 'مئة')
  assert.ok(lookup('ألف').length, 'ألف')
})
