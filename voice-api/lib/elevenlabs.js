// ElevenLabs REST API 얇은 래퍼. SDK 없이 fetch 만 쓴다(의존성 0).
//
// - synthesize: 텍스트 → 내 목소리 mp3 (Buffer)
// - cloneVoice: 녹음 파일 → 새 voice_id (scripts/clone-voice.mjs 가 한 번 부른다)
//
// 키(ELEVENLABS_API_KEY)는 서버에만 있다. 이 파일은 클라이언트로 나가지 않는다.

export const API_BASE = 'https://api.elevenlabs.io/v1'

// eleven_multilingual_v2 는 한국어·영어를 모두 읽고, 복제한 목소리의 음색을
// 가장 잘 살린다. 언어는 텍스트를 보고 알아서 고른다.
export const DEFAULT_MODEL = 'eleven_multilingual_v2'
export const DEFAULT_FORMAT = 'mp3_44100_128'

// language_code 를 받아 주는 모델. multilingual_v2 는 이 값을 주면 거절하므로
// 이 목록에 있는 모델일 때만 언어를 강제한다.
const LANGUAGE_CODE_MODELS = new Set(['eleven_flash_v2_5', 'eleven_turbo_v2_5'])

export class ElevenLabsError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function failure(res) {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.detail?.message || body?.detail || JSON.stringify(body)
  } catch {
    detail = res.statusText
  }
  return new ElevenLabsError(res.status, typeof detail === 'string' ? detail : JSON.stringify(detail))
}

export async function synthesize({ apiKey, voiceId, text, language, model = DEFAULT_MODEL, format = DEFAULT_FORMAT, fetchImpl = fetch }) {
  const url = `${API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(format)}`
  const body = {
    text,
    model_id: model,
    // 복제한 목소리는 similarity 를 높게 둬야 내 목소리처럼 들린다.
    voice_settings: { stability: 0.5, similarity_boost: 0.85 },
  }
  if (language && LANGUAGE_CODE_MODELS.has(model)) body.language_code = language

  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await failure(res)
  return Buffer.from(await res.arrayBuffer())
}

// files: [{ name, data: Buffer, type }]
export async function cloneVoice({ apiKey, name, description, files, fetchImpl = fetch }) {
  const form = new FormData()
  form.append('name', name)
  if (description) form.append('description', description)
  form.append('remove_background_noise', 'true')
  for (const file of files) {
    form.append('files', new Blob([file.data], { type: file.type }), file.name)
  }

  const res = await fetchImpl(`${API_BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  })
  if (!res.ok) throw await failure(res)
  return res.json() // { voice_id, requires_verification }
}
