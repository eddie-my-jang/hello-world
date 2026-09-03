import test from 'node:test'
import assert from 'node:assert/strict'
import { syllablesFor, syllablesOfExtra, allPieces } from '../src/lib/syllables.js'
import { LETTERS, EXTRAS } from '../src/lib/letters.js'
import { readWord } from '../src/lib/transliterate.js'
import { stripHarakat } from '../src/lib/arabic.js'

test('자음 스물여덟 자가 모두 결합표를 가진다', () => {
  assert.equal(LETTERS.length, 28)
  for (const letter of LETTERS) {
    const groups = syllablesFor(letter.a)
    assert.ok(groups.length, `${letter.a} 에 결합표가 없다`)
    for (const group of groups) {
      assert.ok(group.group, '묶음 이름이 없다')
      assert.ok(group.cells.length, `${letter.a} 의 ${group.group} 이 비었다`)
    }
  }
})

test('모든 칸에 한글과 로마자가 다 적혀 있다', () => {
  // 「모든 글자의 발음을 다 표기한다」가 이 표의 존재 이유다.
  // 한 칸이라도 비면 배우는 사람이 그 자리에서 막힌다.
  const targets = [
    ...LETTERS.map((letter) => [letter.a, syllablesFor(letter.a).flatMap((g) => g.cells)]),
    ...EXTRAS.map((extra) => [extra.a, syllablesOfExtra(extra.a)]),
  ]
  for (const [name, cells] of targets) {
    assert.ok(cells.length, `${name} 에 발음 칸이 없다`)
    for (const cell of cells) {
      assert.ok(cell.a, `${name}: 아랍어가 없다`)
      assert.ok(cell.k, `${name} 의 ${cell.a}: 한글이 없다`)
      assert.ok(cell.name, `${name} 의 ${cell.a}: 칸 이름이 없다`)
      // 묵음은 로마자가 없는 것이 맞다
      if (cell.k !== '묵음') assert.ok(cell.r, `${name} 의 ${cell.a}: 로마자가 없다`)
      assert.ok(!cell.k.includes('?'), `${name} 의 ${cell.a}: 못 읽는 자리가 남았다`)
    }
  }
})

test('칸의 발음은 읽기판 엔진이 낸 그대로다', () => {
  // 자모표가 بِ 를 「비」라고 가르쳐 놓고 읽기판이 달리 읽으면 안 된다.
  for (const letter of LETTERS) {
    for (const group of syllablesFor(letter.a)) {
      for (const cell of group.cells) {
        const built = readWord(cell.a)
        assert.equal(cell.k, built.l.map((l) => l.k).join(''), cell.a)
        assert.equal(cell.r, built.r, cell.a)
      }
    }
  }
})

test('칸의 아랍어는 그 글자에 부호를 붙인 것이다', () => {
  for (const letter of LETTERS) {
    if (letter.a === 'ا') continue // 알리프는 자음이 아니라 받침대라 따로 다룬다
    for (const group of syllablesFor(letter.a)) {
      for (const cell of group.cells) {
        assert.ok(
          stripHarakat(cell.a).startsWith(letter.a),
          `${cell.a} 가 ${letter.a} 로 시작하지 않는다`,
        )
      }
    }
  }
})

test('짧은 소리 · 길게 · 미끄러짐 · 탄윈 · 샷다를 다 담는다', () => {
  const groups = syllablesFor('ب').map((g) => g.group)
  assert.deepEqual(groups, [
    '짧은 소리', '길게 늘인 소리', '미끄러지는 소리', '끝에 ㄴ 이 붙는 소리', '겹쳐 나는 소리',
  ])
  assert.equal(syllablesFor('ب').reduce((n, g) => n + g.cells.length, 0), 15)
  assert.ok(allPieces().length >= 15)
})

test('알리프는 받침대로 다룬다', () => {
  // 혼자서는 소리가 없으므로 부호를 붙인 표를 만들면 없는 소리를 가르치게 된다
  const cells = syllablesFor('ا').flatMap((g) => g.cells)
  assert.ok(cells.some((c) => c.a === 'أَ'), '함자를 얹은 모습이 있어야 한다')
  assert.ok(cells.some((c) => c.a === 'بَا'), '앞 모음을 늘이는 모습이 있어야 한다')
})

test('타 마르부타는 격에 따른 세 소리와 멈춤을 보여 준다', () => {
  const cells = syllablesOfExtra('ة')
  assert.deepEqual(cells.map((c) => c.k), ['투', '티', '타', '묵음'])
})
