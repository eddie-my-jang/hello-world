// 내 녹음 파일로 ElevenLabs 에 목소리를 한 번 만들고 voice_id 를 출력한다.
//
//   ELEVENLABS_API_KEY=... node scripts/clone-voice.mjs "내 목소리" samples/*.mp3
//
// 출력된 voice_id 를 VOICE_ID 환경변수에 넣으면 /api/speak 가 그 목소리로 말한다.
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { cloneVoice } from '../lib/elevenlabs.js'

const TYPES = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm' }

const [name, ...paths] = process.argv.slice(2)
const apiKey = process.env.ELEVENLABS_API_KEY

if (!apiKey || !name || !paths.length) {
  console.error('사용법: ELEVENLABS_API_KEY=... node scripts/clone-voice.mjs "<목소리 이름>" <녹음 파일>...')
  process.exit(1)
}

const files = []
for (const path of paths) {
  const type = TYPES[extname(path).toLowerCase()]
  if (!type) {
    console.error(`지원하지 않는 형식입니다: ${path} (${Object.keys(TYPES).join(', ')})`)
    process.exit(1)
  }
  files.push({ name: basename(path), type, data: await readFile(path) })
}

try {
  const voice = await cloneVoice({ apiKey, name, description: '한국어·영어 본인 목소리', files })
  console.log(`voice_id: ${voice.voice_id}`)
  if (voice.requires_verification) {
    console.log('ElevenLabs 에서 본인 확인을 요구합니다. 웹 대시보드의 Voices 화면에서 확인을 마쳐 주세요.')
  }
} catch (err) {
  console.error(`목소리를 만들지 못했습니다 (${err.status ?? '?'}): ${err.message}`)
  process.exit(1)
}
