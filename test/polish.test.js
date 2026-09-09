import test from 'node:test'
import assert from 'node:assert/strict'
import { polish, roman } from '../src/lib/polish.js'
import { readWord } from '../src/lib/transliterate.js'
import { SAMPLES } from '../src/lib/samples.js'

const read = (a) => polish(readWord(a).l)

test('글자별 발음을 낱말 수준으로 다듬는다', () => {
  const cases = [
    ['بِنْت', '빈트'],      // 수쿤 ن 은 받침으로
    ['قَدِيم', '카딤'],     // 낱말 끝 م 도
    ['اَلْخَيْر', '알카이르'], // 정관사의 ل 도
    ['طَالِب', '탈리브'],    // 장모음에 붙은 ل 은 ㄹㄹ 로
    ['اَلسَّلَام', '앗살람'], // 겹자음은 앞 반쪽을 받침으로
    ['مُدَرِّس', '무다르리스'], // 다만 ر 은 자모표가 가르치는 대로 둘 다
    ['حَارّ', '하르'],      // 낱말 끝의 겹자음은 한 번만
    ['مَاء', '마'],        // 모음 없는 함자는 적지 않는다
    ['صَعْب', '사아브'],     // 모음 없는 ع 은 앞 모음을 한 번 더
    ['طِفْل', '티플'],       // 낱말을 닫는 ل 은 받침으로
    ['مِلْح', '미르흐'],      // 다만 낱말 끝이 아니면 그대로 둔다
    ['قَلْب', '카르브'],      // 정관사가 아닌 수쿤 ل 도 그대로
  ]
  for (const [arabic, want] of cases) {
    assert.equal(read(arabic), want, arabic)
  }
})

test('첫머리 함자는 로마자에서 뗀다', () => {
  assert.equal(roman(readWord('أَب').r), 'ab')
  assert.equal(roman(readWord('كِتَاب').r), 'kitāb') // 없으면 그대로
})

test('손으로 적은 예문을 대부분 그대로 재현한다', () => {
  // 이 규칙은 사람이 적어 온 관례를 옮긴 것이다. 재현율이 떨어지면
  // 말뭉치에서 들여온 낱말이 손으로 적은 것과 다르게 읽히기 시작한다는 뜻이다.
  let same = 0, total = 0
  for (const sample of SAMPLES) {
    for (const word of sample.w) {
      total += 1
      const built = readWord(word.a)
      if (polish(built.l) === word.k && roman(built.r) === word.r) same += 1
    }
  }
  const rate = same / total
  assert.ok(rate >= 0.9, `재현율 ${(rate * 100).toFixed(0)}% (${same}/${total})`)
})

test('빈 입력에도 넘어지지 않는다', () => {
  assert.equal(polish([]), '')
  assert.equal(roman(''), '')
})
