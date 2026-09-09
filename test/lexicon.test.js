import test from 'node:test'
import assert from 'node:assert/strict'
import { LEXICON } from '../src/lib/lexicon.js'
import { readWord } from '../src/lib/transliterate.js'
import { stripHarakat } from '../src/lib/arabic.js'
import { lookup } from '../src/lib/dictionary.js'
import { SAMPLES } from '../src/lib/samples.js'

test('말뭉치 낱말이 넉넉히 들어 있다', () => {
  assert.ok(LEXICON.length >= 15000, `${LEXICON.length}개`)
  assert.equal(new Set(LEXICON).size, LEXICON.length, '겹치는 낱말이 있다')
})

test('모든 낱말을 엔진이 물음표 없이 읽는다', () => {
  // 못 읽는 낱말을 사전에 넣으면 「모르는 자리」만 늘어난다.
  // tools/build-lexicon.mjs 의 품질 관문이 실제로 걸러졌는지 여기서 지킨다.
  const broken = LEXICON.filter((w) => readWord(w).unknown > 0)
  assert.deepEqual(broken.slice(0, 5), [], `${broken.length}개가 안 읽힌다`)
})

test('모든 낱말에 부호가 붙어 있다', () => {
  // آ 는 부호를 따로 달지 않고 제 안에 모음을 품은 글자라 예외다 (آل آت).
  const bare = LEXICON.filter((w) => stripHarakat(w) === w && !w.includes('آ'))
  assert.deepEqual(bare.slice(0, 5), [], `${bare.length}개에 부호가 없다`)
})

test('낱말 첫머리의 맨 알리프를 남기지 않는다', () => {
  // 말뭉치는 정관사를 الْ 로 적는데 그러면 엔진이 첫 글자를 못 읽는다.
  // 만드는 쪽에서 اَلْ 로 맞춰 두어야 한다.
  const raw = LEXICON.filter((w) => {
    const chars = [...w]
    return chars[0] === 'ا' && chars[1] && !/[ً-ْٰ]/.test(chars[1])
  })
  assert.deepEqual(raw.slice(0, 5), [], `${raw.length}개가 맨 알리프로 시작한다`)
})

test('손으로 적은 낱말이 말뭉치보다 앞선다', () => {
  // 뜻과 다듬은 한글이 붙어 있는 쪽이 먼저 나와야 한다.
  for (const arabic of ['كِتَاب', 'مَدْرَسَة', 'بَيْت', 'مَطَار']) {
    const found = lookup(stripHarakat(arabic))
    assert.equal(found[0].a, arabic, `${arabic} 가 첫 번째가 아니다`)
    assert.ok(found[0].m, `${arabic} 에 뜻이 없다 — 손으로 적은 것이 아니다`)
  }
})

test('사전 밖이던 흔한 낱말을 이제 읽는다', () => {
  // 이 목록을 들여온 까닭이다. 하나하나를 못 박으면 말뭉치를 다시 자를 때마다
  // 깨지므로, 흔한 낱말 묶음이 얼마나 걸리는지로 지킨다.
  const common = ['الناس', 'الحياة', 'العالم', 'الوقت', 'الأمر', 'الشيء', 'قال', 'كان',
    'يكون', 'شركة', 'بعد', 'قبل', 'عند', 'بين', 'تحت', 'فوق', 'حتى', 'يذهب', 'يكتب', 'يقرأ']
  const hit = common.filter((bare) => {
    const found = lookup(bare)
    return found.length && found[0].k && readWord(found[0].a).unknown === 0
  })
  assert.ok(hit.length / common.length >= 0.7,
    `${hit.length}/${common.length} 만 읽힌다 — 못 읽는 것: ${common.filter((w) => !hit.includes(w)).join(' ')}`)
})

test('말뭉치 낱말도 손으로 적은 것과 같은 관례로 읽는다', () => {
  // 다듬기 규칙을 거치지 않으면 「비느트」 같은 글자별 발음이 그대로 나온다.
  const handStyle = new Set(SAMPLES.flatMap((s) => s.w.map((w) => w.k)))
  const sample = lookup('الناس')[0]
  assert.equal(sample.k, '안나스')
  assert.ok(!sample.k.includes('느'), '수쿤 ن 이 받침으로 내려가지 않았다')
  assert.ok(handStyle.size > 100) // 견줄 대상이 실제로 있는지
})
