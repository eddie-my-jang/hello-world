import test from 'node:test'
import assert from 'node:assert/strict'
import { readLetter, readWord, readText } from '../src/lib/transliterate.js'
import { SAMPLES } from '../src/lib/samples.js'

test('예시 단어의 글자별 발음을 그대로 다시 만들어 낸다', () => {
  // samples.js 는 이 규칙으로 만들고 눈으로 확인한 것이다.
  // 여기가 어긋나면 둘 중 하나를 누가 손으로 고친 것이니 확인해야 한다.
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      const built = readWord(word.a)
      assert.deepEqual(
        built.l.map(({ a, k, r }) => ({ a, k, r })),
        word.l.map(({ a, k, r }) => ({ a, k, r })),
        `${word.a} (${sample.tag})`,
      )
    }
  }
})

test('예시 단어의 로마자도 다시 만들어 낸다', () => {
  // 단어 수준 로마자는 사람이 고른 값이라 관례적으로 첫머리 함자를 빼기도 한다
  // (أَنَا → anā). 함자 표시만 걷어내고 나머지가 같은지 본다.
  const noHamza = (s) => s.replace(/ʾ/g, '')
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      assert.equal(noHamza(readWord(word.a).r), noHamza(word.r), word.a)
    }
  }
})

test('장모음은 앞 단모음을 잡아먹는다', () => {
  assert.equal(readWord('كِتَاب').r, 'kitāb') // kitaāb 이 아니다
  assert.equal(readWord('نُور').r, 'nūr')
  assert.equal(readWord('صَدِيق').r, 'ṣadīq')
})

test('탄윈은 받침 ㄴ 으로 붙는다', () => {
  assert.equal(readWord('كِتَابٌ').k, '키타분')
  assert.equal(readWord('كِتَابٍ').k, '키타빈')
  assert.equal(readWord('شُكْرًا').k, '슈크란')
})

test('샷다는 자음을 두 번 읽는다', () => {
  const shadda = readWord('مُدَرِّس').l.find((l) => l.a.includes('ّ'))
  assert.equal(shadda.k, '르리')
  assert.equal(shadda.r, 'rri')
})

test('부호가 없는 가운데 글자는 모르는 자리로 표시한다', () => {
  // كتب 는 kataba / kutiba / kutub 중 무엇이든 될 수 있다.
  // 만들어 내지 말고 자음만 남겨야 한다.
  const bare = readWord('كتب')
  assert.equal(bare.unknown, 2)
  assert.deepEqual(bare.l.map((l) => l.k), ['ㅋ', 'ㅌ', '브'])

  // 부호를 붙이면 모르는 자리가 사라진다
  assert.equal(readWord('كَتَبَ').unknown, 0)
})

test('부호 없이 끝나는 마지막 글자는 수쿤으로 읽는다', () => {
  // 멈춰 읽는 형태라 كِتَاب 의 ب 는 「브」가 맞다
  const last = readWord('كِتَاب').l.at(-1)
  assert.equal(last.k, '브')
  assert.equal(readWord('كِتَاب').unknown, 0)
})

test('readText: 여러 단어와 개수 세기', () => {
  const out = readText('أَنَا طَالِب')
  assert.equal(out.w.length, 2)
  assert.equal(out.unknown, 0)
  assert.equal(out.total, 7)

  // كتب 에서 둘, سلام 에서 셋 — 마지막 글자는 멈춰 읽는 형태라 모르는 자리가 아니다
  assert.equal(readText('كتب سلام').unknown, 5)
  assert.equal(readText('').w.length, 0)
})

test('readText: 한 번에 여덟 단어까지', () => {
  const many = readText(Array(12).fill('بَاب').join(' '))
  assert.equal(many.w.length, 8)
})

test('readLetter: 앞 글자에 따라 장모음인지 자음인지 갈린다', () => {
  assert.equal(readLetter('و', 'سُ', false).k, '―')   // 담마 뒤 → 장모음 우—
  assert.equal(readLetter('وْ', 'يَ', false).k, '우')  // 파트하 뒤 → 이중모음 aw
  assert.equal(readLetter('ي', 'لِ', false).k, '―')   // 카스라 뒤 → 장모음 이—
  assert.equal(readLetter('ي', 'شَ', true).k, '이')    // 그 밖에는 자음 y
})
