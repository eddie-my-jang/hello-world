import test from 'node:test'
import assert from 'node:assert/strict'
import { segmentations } from '../src/lib/affix.js'
import { lookup, readTextSmart } from '../src/lib/dictionary.js'
import { readWord } from '../src/lib/transliterate.js'

test('segmentations() 는 접사를 뗄 수 있는 자리를 긴 것부터 내놓는다', () => {
  const tiers = segmentations('الكتاب')
  // 첫 단은 «접사 없음»(뼈대 그대로), 다음이 정관사를 뗀 자리
  assert.equal(tiers[0][0].stem, 'الكتاب')
  const withArticle = tiers.flat().find((seg) => seg.stem === 'كتاب')
  assert.ok(withArticle, '정관사를 뗀 자리가 있어야 한다')
})

test('apply() 는 정관사를 되돌려 붙인다 — 태양문자 앞에서는 ل 이 죽고 겹친다', () => {
  const seg = segmentations('الشمس').flat().find((s) => s.stem === 'شمس')
  assert.equal(seg.apply('شَمْس'), 'اَلشَّمْس') // ش 는 태양문자
  const segMoon = segmentations('البيت').flat().find((s) => s.stem === 'بيت')
  assert.equal(segMoon.apply('بَيْت'), 'اَلْبَيْت') // ب 는 달문자, 그대로 소리 낸다
})

test('apply() 는 소유 어미를 붙이고, 여성 표지 ة 는 ت 로 바꾼다', () => {
  const seg = segmentations('كتابي').flat().find((s) => s.stem === 'كتاب')
  assert.ok(seg, 'كتاب 로 남는 자리가 있어야 한다')
  assert.equal(seg.apply('كِتَاب'), 'كِتَابِي')

  // «مدرسة» 의 색인 뼈대는 ة→ه 로 바뀌어 있으므로, 소유 어미를 뗀 뒤 남는
  // stem 은 «مدرست» 다(ة 대신 ت). apply() 가 원래 낱말(ة 로 끝나는)에
  // 어미를 붙이며 ة 를 ت 로 바꿔 «مَدْرَسَتِي」를 만들어 내야 한다.
  const segTa = segmentations('مدرستي').flat().find((s) => s.stem === 'مدرست')
  assert.ok(segTa, 'مدرست 로 남는 자리가 있어야 한다')
  assert.equal(segTa.apply('مَدْرَسَة'), 'مَدْرَسَتِي')
})

test('짧은 뼈대는 접사로 다 뜯기지 않는다', () => {
  // 최소 두 글자는 남아야 한다 — 안 그러면 아무 글자에나 접사를 물려
  // 엉뚱한 걸 찾아 준다
  const tiers = segmentations('له') // ل(접두사) + ه, 남는 게 한 글자
  for (const seg of tiers.flat()) assert.ok(seg.stem.length >= 2, seg.stem)
})

test('dictionary.lookup() 이 접사 붙은 낱말을 사전 없이도 찾는다', () => {
  const cases = [
    ['الكتاب', 'كِتَاب'],   // 정관사
    ['بالمدرسة', 'مَدْرَسَة'], // 전치사 + 정관사
    ['وبيت', 'بَيْت'],       // 접속사
    ['كتابي', 'كِتَاب'],     // 소유 어미 -ي
    ['بيتك', 'بَيْت'],       // 소유 어미 -ك
    ['مدرستها', 'مَدْرَسَة'], // 여성 명사 + 소유 어미 -ها (ة→ت 전환)
  ]
  for (const [typed, stem] of cases) {
    const found = lookup(typed)
    assert.ok(found.length, `${typed} 를 못 찾는다`)
    assert.ok(found.some((e) => e.stem === stem || e.a.includes(stem.replace(/[ً-ْٰ]/g, '')[0])),
      `${typed} 의 후보에 ${stem} 에서 나온 것이 없다: ${JSON.stringify(found.map((e) => e.a))}`)
  }
})

test('찾아낸 후보는 전부 엔진이 물음표 없이 읽는다', () => {
  const cases = ['الكتاب', 'بالمدرسة', 'وبيت', 'كتابي', 'بيتك', 'مدرستها', 'والمطار', 'صديقي']
  for (const typed of cases) {
    for (const entry of lookup(typed)) {
      assert.equal(readWord(entry.a).unknown, 0, `${typed} → ${entry.a} 에 모르는 자리가 있다`)
      assert.ok(entry.k && entry.r, `${typed} → ${entry.a} 에 한글·로마자가 없다`)
    }
  }
})

test('접사 없이도 바로 찾히는 낱말은 접사 풀이를 거치지 않는다', () => {
  // lookup() 은 직접 찾히면 거기서 멈춘다 — 접사 자리를 뒤질 필요가 없다
  const direct = lookup('كتاب')
  assert.ok(direct.length)
  assert.ok(direct.every((e) => e.m || e.a === 'كِتَاب' || !('stem' in e)))
})

test('readTextSmart() 로 접사 붙은 문장을 통째로 읽는다', () => {
  const out = readTextSmart('ذهبت إلى المدرسة')
  assert.equal(out.w.length, 3)
  const unknown = out.w.reduce((n, w) => n + (w.unknown || 0), 0)
  assert.equal(unknown, 0, `모르는 자리가 남았다: ${JSON.stringify(out.w.map((w) => [w.a, w.unknown]))}`)
})

test('그래도 못 찾는 것은 지어내지 않는다', () => {
  const out = readTextSmart('زززززز')
  assert.ok(out.w[0].unknown > 0)
})
