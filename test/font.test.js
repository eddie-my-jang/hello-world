import test from 'node:test'
import assert from 'node:assert/strict'

// font.js 는 window 와 document 를 만진다. 브라우저 없이 돌리려고 흉내만 낸다.
function stubDom({ throwing = false, stored = null } = {}) {
  const box = { value: stored }
  globalThis.window = {
    localStorage: {
      getItem() { if (throwing) throw new Error('막힘'); return box.value },
      setItem(_, v) { if (throwing) throw new Error('막힘'); box.value = v },
    },
  }
  globalThis.document = { documentElement: { dataset: {} } }
  return box
}

const load = async () => import(`../src/lib/font.js?${Math.random()}`)

test('글꼴은 두 벌이고 필사체가 기본이다', async () => {
  stubDom()
  const { FONTS, readStored } = await load()
  assert.deepEqual(FONTS.map((f) => f[0]), ['naskh', 'kufi'])
  assert.equal(readStored(), 'naskh')
  for (const [, label, hint] of FONTS) {
    assert.ok(label && hint, '이름과 설명이 있어야 한다')
  }
})

test('고른 것을 적어 두고 다시 읽는다', async () => {
  const box = stubDom()
  const { applyFont, readStored } = await load()
  assert.equal(applyFont('kufi'), 'kufi')
  assert.equal(document.documentElement.dataset.font, 'kufi')
  assert.equal(box.value, 'kufi', '다음에 열 때를 위해 적어 둔다')
  assert.equal(readStored(), 'kufi')
})

test('모르는 이름은 필사체로 되돌린다', async () => {
  stubDom({ stored: '없는이름' })
  const { applyFont, readStored } = await load()
  assert.equal(readStored(), 'naskh', '적혀 있던 것이 이상하면 기본으로')
  assert.equal(applyFont('없는글꼴'), 'naskh')
  assert.equal(document.documentElement.dataset.font, 'naskh')
})

test('적어 둘 수 없어도 이번 판에는 그대로 쓴다', async () => {
  // 사생활 보호 창은 localStorage 를 읽고 쓰는 것부터 막는다
  stubDom({ throwing: true })
  const { applyFont, readStored } = await load()
  assert.equal(readStored(), 'naskh')
  assert.equal(applyFont('kufi'), 'kufi')
  assert.equal(document.documentElement.dataset.font, 'kufi', '화면에는 그래도 입혀야 한다')
})

test("잠깐 'sans' 이던 때에 고른 것을 지킨다", async () => {
  // 표지판체를 Noto Sans Arabic 으로 냈다가 쿠피로 바꿨다. 그 사이에 고른
  // 사람의 선택이 조용히 필사체로 되돌아가면 고장난 것처럼 보인다.
  stubDom({ stored: 'sans' })
  const { readStored } = await load()
  assert.equal(readStored(), 'kufi')
})
