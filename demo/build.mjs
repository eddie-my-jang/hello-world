// 데모 사이트를 만든다.
//
//   node demo/build.mjs        →  demo/dist/
//
// 읽기판과 자모표를 탭 하나로 합친, 서버 없이 도는 정적 페이지다.
// 사진 분석과 하라카트 복원은 서버가 필요해서 빠져 있고, 나머지는 앱과 같다.
//
// 결과물이 둘이다.
//   index.html     GitHub Pages 에 올리는 온전한 문서. 홈 화면에 추가하면
//                  주소창 없이 뜨고, 서비스 워커가 담아 둬서 오프라인에서도 열린다.
//   build/artifact.html  아티팩트로 올릴 조각. 그쪽은 <head> 를 호스트가 쥐고
//                  있어 manifest 나 서비스 워커를 넣을 수 없다. 사이트에는
//                  들어가지 않게 따로 뺀다.
//
// 데이터와 팔레트를 앱 소스에서 그대로 읽어 오는 것이 요점이다.
// 데모에 다시 옮겨 적으면 앱을 고칠 때마다 어긋난다.

import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LETTERS, FAMILIES, MARKS, LONGS, EXTRAS } from '../src/lib/letters.js'
import { SAMPLES } from '../src/lib/samples.js'
import { BIG, COMPOSED, DIGITS, HUNDREDS, NUMBER_WORDS, ONES, PLACES, TEENS, TENS } from '../src/lib/numbers.js'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..')
const dist = join(here, 'dist')       // Pages 에 올라가는 사이트
const build = join(here, 'build')     // 아티팩트용 (사이트에는 안 들어간다)

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

// 발음 옮기기 엔진을 데모 안으로 그대로 넣는다.
// import/export 만 걷어낸다 — LETTERS·isMark·splitIntoLetters 는 app.js 에 이미 있다.
function inlineModule(source) {
  const stripped = source
    .split('\n')
    .filter((line) => !line.startsWith('import '))
    .join('\n')
    .replace(/^export /gm, '')
  if (stripped.includes('import ') || /^export /m.test(stripped)) {
    throw new Error('transliterate.js 에서 걷어내지 못한 import/export 가 있습니다')
  }
  return stripped.trim()
}

/** import 줄에서 가져오는 이름만 뽑는다 */
function importedNames(source) {
  return source
    .split('\n')
    .filter((line) => line.startsWith('import '))
    .flatMap((line) => {
      const inside = line.match(/\{([^}]*)\}/)
      return inside ? inside[1].split(',').map((name) => name.trim()).filter(Boolean) : []
    })
}

// <script> 안에 들어가므로 '<' 를 막아 둔다. 지금 데이터에는 없지만,
// 나중에 설명글에 "</script>" 같은 문자열이 들어가면 페이지가 깨진다.
function inlineJson(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003C')
}

// WORDS 는 화면에 그리지 않는다 — 사전이 쓴다 (아래 inlineDictionary 참고)
const NUMBERS = { DIGITS, ONES, TEENS, TENS, HUNDREDS, BIG, PLACES, COMPOSED, WORDS: NUMBER_WORDS }
const data = { SAMPLES, LETTERS, FAMILIES, MARKS, LONGS, EXTRAS, NUMBERS }

// 소리 모듈도 그대로 넣는다. 읽기판에도 stop() 이 있어서 이름이 겹치므로
// 객체로 감싸 Speech.speak(...) 처럼 쓰게 한다.
function inlineSpeech(source) {
  const api = ['isSupported', 'pickVoice', 'speak', 'stop', 'primeFromUserGesture', 'isSilentPiece']
  for (const name of api) {
    if (!source.includes(`export function ${name}`)) {
      throw new Error(`speech.js 에 ${name} 이 없습니다`)
    }
  }
  return `(function () {\n${inlineModule(source)}\n  return { ${api.join(', ')} };\n})()`
}

// 결합표도 그대로 넣는다. readWord 는 위 엔진에 이미 있다.
function inlineSyllables(source) {
  const api = ['syllablesFor', 'syllablesOfExtra', 'allPieces']
  for (const name of api) {
    if (!source.includes(`export function ${name}`)) {
      throw new Error(`syllables.js 에 ${name} 이 없습니다`)
    }
  }
  for (const name of importedNames(source)) {
    if (name !== 'readWord') {
      throw new Error(`syllables.js 가 새로 가져오는 ${name} 을 데모에서 이어 주지 않았습니다`)
    }
  }
  return `(function () {\n${inlineModule(source)}\n  return { ${api.join(', ')} };\n})()`
}

// 사전도 그대로 넣는다. 데모에서는 예문이 DECKS, 모음 부호가 VOWEL_MARKS 라는
// 이름이라 앞머리에서 맞춰 준다.
function inlineDictionary(source) {
  const api = ['size', 'lookup', 'isVocalized', 'readTextSmart']
  for (const name of api) {
    if (!source.includes(`export function ${name}`)) {
      throw new Error(`dictionary.js 에 ${name} 이 없습니다`)
    }
  }
  // 걷어낸 import 를 앞머리에서 하나씩 다시 이어 준다.
  // 데모에서는 예문이 DECKS, 모음 부호가 VOWEL_MARKS 라는 이름이다.
  const prologue = {
    SAMPLES: 'DECKS',
    MARKS: 'VOWEL_MARKS',
    NUMBER_WORDS: 'NUMBERS.WORDS',
    // 아래 셋은 app.js 에 이미 같은 이름으로 있다
    LETTERS: null, LONGS: null, isArabicLetter: null, stripHarakat: null, readWord: null,
  }
  for (const name of importedNames(source)) {
    if (!(name in prologue)) {
      throw new Error(`dictionary.js 가 새로 가져오는 ${name} 을 데모에서 이어 주지 않았습니다`)
    }
  }
  const head = Object.entries(prologue)
    .filter(([, from]) => from)
    .map(([name, from]) => `  var ${name} = ${from};`)
    .join('\n')
  return `(function () {\n${head}\n${inlineModule(source)}\n  return { ${api.join(', ')} };\n})()`
}

const [template, appJs, styles, engine, speech, dictionary, syllables] = await Promise.all([
  read('demo/template.html'),
  read('demo/app.js'),
  read('src/styles.css'),
  read('src/lib/transliterate.js'),
  read('src/lib/speech.js'),
  read('src/lib/dictionary.js'),
  read('src/lib/syllables.js'),
])

const page = template
  .replace('/*__BASE_CSS__*/', () => baseCss(styles))
  .replace('/*__DATA__*/', () => inlineJson(data))
  .replace('/*__APP_JS__*/', () => appJs
    .replace('/*__TRANSLITERATE__*/', () => inlineModule(engine))
    .replace('/*__SPEECH__*/ {}', () => inlineSpeech(speech))
    .replace('/*__DICTIONARY__*/ {}', () => inlineDictionary(dictionary))
    .replace('/*__SYLLABLES__*/ {}', () => inlineSyllables(syllables)))

const leftover = page.match(/\/\*__[A-Z_]+__\*\//g)
if (leftover) throw new Error(`치환되지 않은 자리가 있습니다: ${leftover.join(', ')}`)

const [head, body] = page.split('<!--__SPLIT__-->')
if (!body) throw new Error('template.html 에서 <!--__SPLIT__--> 를 찾지 못했습니다')

// 경로를 전부 상대로 둔다 — Pages 는 /<저장소이름>/ 아래에 붙는다
const document = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="아랍 문자를 오른쪽 글자부터 한 글자씩 한글 발음으로 읽는 학습 도구">

<meta name="theme-color" content="#E7EAE3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111513" media="(prefers-color-scheme: dark)">

<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" href="./icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="./apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="아랍어 읽기">
${head.trim()}
</head>
<body>
${body.trim()}

<script>
// 한 번 열어 두면 비행기 모드에서도 열린다.
// 실패해도 페이지는 그대로 돌아간다 — 오프라인만 안 될 뿐이다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {})
  })
}
</script>
</body>
</html>
`

await mkdir(dist, { recursive: true })
await mkdir(build, { recursive: true })
await writeFile(join(dist, 'index.html'), document, 'utf8')
await writeFile(join(build, 'artifact.html'), page.replace('<!--__SPLIT__-->', ''), 'utf8')
await writeFile(join(dist, '.nojekyll'), '', 'utf8') // Pages 가 Jekyll 로 훑지 않게

await copyFile(join(here, 'manifest.webmanifest'), join(dist, 'manifest.webmanifest'))
await copyFile(join(here, 'sw.js'), join(dist, 'sw.js'))

const ICONS = ['icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']
for (const icon of ICONS) {
  await copyFile(join(repo, 'public', icon), join(dist, icon))
}

const kb = (n) => `${(n / 1024).toFixed(1)}KB`
console.log(`demo/dist/index.html     ${kb(document.length)}  (Pages 용, 오프라인)`)
console.log(`demo/build/artifact.html ${kb(page.length)}  (아티팩트 용)`)
console.log(`  아이콘 ${ICONS.length}개 + manifest + sw.js`)
console.log(`  예문 ${SAMPLES.length} · 자음 ${LETTERS.length} · 무리 ${FAMILIES.length} ·`
  + ` 부호 ${MARKS.length} · 장모음 ${LONGS.length} · 그밖 ${EXTRAS.length}`)
console.log(`  숫자 ${[DIGITS, ONES, TEENS, TENS, HUNDREDS, BIG, PLACES, COMPOSED]
  .reduce((n, rows) => n + rows.length, 0)} · 사전에 든 숫자 낱말 ${NUMBER_WORDS.length}`)
