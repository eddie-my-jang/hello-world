// 데모 페이지 한 장을 조립한다.
//
//   node demo/build.mjs        →  demo/dist/arabic-app.html
//
// 읽기판과 자모표를 탭 하나로 합친, 서버 없이 열리는 단일 HTML 이다.
// 사진 분석과 하라카트 복원은 서버가 필요해서 빠져 있고, 나머지는 앱과 같다.
//
// 데이터와 팔레트를 앱 소스에서 그대로 읽어 오는 것이 요점이다.
// 데모에 다시 옮겨 적으면 앱을 고칠 때마다 어긋난다.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LETTERS, FAMILIES, MARKS, LONGS, EXTRAS } from '../src/lib/letters.js'
import { DECKS } from './decks.js'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..')
const out = join(here, 'dist', 'arabic-app.html')

const read = (path) => readFile(join(repo, path), 'utf8')

// 팔레트와 레이아웃은 앱 스타일시트를 그대로 쓴다.
// @import 만 걷어낸다 — 폰트는 template.html 의 <link> 로 불러온다.
function baseCss(css) {
  return css
    .split('\n')
    .filter((line) => !line.startsWith('@import'))
    .join('\n')
    .trim()
}

const data = { DECKS, LETTERS, FAMILIES, MARKS, LONGS, EXTRAS }

// <script> 안에 들어가므로 '<' 를 막아 둔다. 지금 데이터에는 없지만,
// 나중에 설명글에 "</script>" 같은 문자열이 들어가면 페이지가 깨진다.
function inlineJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003C')
}

const [template, appJs, styles] = await Promise.all([
  read('demo/template.html'),
  read('demo/app.js'),
  read('src/styles.css'),
])

const page = template
  .replace('/*__BASE_CSS__*/', () => baseCss(styles))
  .replace('/*__DATA__*/', () => inlineJson(data))
  .replace('/*__APP_JS__*/', () => appJs)

const leftover = page.match(/\/\*__[A-Z_]+__\*\//g)
if (leftover) throw new Error(`치환되지 않은 자리가 있습니다: ${leftover.join(', ')}`)

await mkdir(dirname(out), { recursive: true })
await writeFile(out, page, 'utf8')

const kb = (n) => `${(n / 1024).toFixed(1)}KB`
console.log(`demo/dist/arabic-app.html  ${kb(page.length)}`)
console.log(`  예문 ${DECKS.length} · 자음 ${LETTERS.length} · 무리 ${FAMILIES.length} ·`
  + ` 부호 ${MARKS.length} · 장모음 ${LONGS.length} · 그밖 ${EXTRAS.length}`)
