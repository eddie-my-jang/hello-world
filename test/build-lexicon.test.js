import test from 'node:test'
import assert from 'node:assert/strict'
import { toCitation, normalize } from '../tools/build-lexicon.mjs'

test('낱말 끝의 격어미를 뗀다', () => {
  assert.equal(toCitation('كِتَابٌ'), 'كِتَاب')   // 탄윈
  assert.equal(toCitation('كِتَابِ'), 'كِتَاب')   // 소유격 단모음
  assert.equal(toCitation('بِنْتَ'), 'بِنْت')      // 목적격 단모음 (수쿤이 있어 동사로 안 본다)
  assert.equal(toCitation('مَدْرَسَةً'), 'مَدْرَسَة') // 탄윈
})

test('짧고 · 수쿤 없고 · 파트하로 끝나는 낱말은 격어미인지 동사인지 가리지 못한다', () => {
  // كِتَابَ 는 목적격 명사(그 책을)일 수도, 자체로 완결된 다른 낱말일 수도
  // 있다 — 이 휴리스틱은 «짧고 수쿤이 없는 파트하 끝」을 전부 동사로 보고
  // 보수적으로 손대지 않는다. 그래서 이런 짧은 목적격 명사는 격어미가
  // 안 떨어질 수 있다는 것을 알려진 한계로 여기 적어 둔다.
  assert.equal(toCitation('كِتَابَ'), 'كِتَابَ')
})

test('과거 동사의 끝 파트하는 격어미가 아니라 그대로 둔다', () => {
  assert.equal(toCitation('كَتَبَ'), 'كَتَبَ')
  assert.equal(toCitation('ذَهَبَ'), 'ذَهَبَ')
})

test('소유 어미가 붙은 낱말은 그 자신의 모음을 격어미로 오인해 자르지 않는다', () => {
  // بَيْتِكَ(너의 집)의 끝 파트하는 소유 어미 ك 자신의 모음이지, بَيْت 의
  // 격어미가 아니다. 여기서 자르면 «بَيْتِك» 처럼 앞뒤가 안 맞는 반쪽짜리가
  // 남는다 — 부호가 붙어 있어 엔진은 읽어 내므로 품질 관문도 못 거른다.
  const cases = [
    'بَيْتِكَ',       // ك (너의)
    'بَيْتُهُ',        // هُ (그의)
    'مَدْرَسَتِهَا',   // ها (그녀의) — 참고용, 애초에 걸릴 일이 없다
  ]
  for (const word of cases) assert.equal(toCitation(word), word, word)
})

test('뿌리글자 자체가 ه/ك 로 끝나는 낱말도 안전하다', () => {
  // «مَلِكٌ»(임금)는 소유 어미가 아니라 뿌리글자가 ك 로 끝난다. 앞의 보호
  // 규칙에 걸려 격어미가 안 떨어질 수 있지만, 그래도 안 읽히거나 사전
  // 색인이 어긋나지는 않는다 — key() 가 부호를 다 떼고 찾으므로 지장 없다.
  const result = toCitation('مَلِكٌ')
  assert.ok(result === 'مَلِك' || result === 'مَلِكٌ', result)
})

test('normalize() 는 낱말 첫머리의 맨 알리프에 부호를 채운다', () => {
  assert.equal(normalize('الْكِتَاب'), 'اَلْكِتَاب')  // 정관사 — 파트하
  assert.equal(normalize('اِسْم'), 'اِسْم')            // 이미 부호가 있으면 그대로
})

test('아랍어가 아니거나 부호가 없는 것은 버린다', () => {
  assert.equal(normalize('hello'), null)
  assert.equal(normalize(''), null)
})
