// POST /api/speak  { "text": "안녕하세요", "language": "ko" }  →  audio/mpeg (내 목소리)
//
// 서버에만 있는 값:
//   ELEVENLABS_API_KEY   ElevenLabs 키
//   VOICE_ID             scripts/clone-voice.mjs 가 만들어 준 내 목소리 id
//   VOICE_API_TOKEN      이 API 를 부를 사람이 Authorization: Bearer 로 보내는 토큰
import { ElevenLabsError, synthesize } from '../lib/elevenlabs.js'
import { HttpError, checkToken, clientIp, createRateLimiter, readJson, sendJson } from '../lib/http.js'

// ── 입력 제한 ────────────────────────────────────────────────────────────────
// 글자 수가 곧 요금이다. 한 번에 긴 글을 보내지 못하게 막아 둔다.
export const MAX_TEXT_CHARS = Number(process.env.SPEAK_MAX_CHARS || 1000)
export const LANGUAGES = ['ko', 'en']

const rateLimited = createRateLimiter({
  limit: Number(process.env.SPEAK_RATE_LIMIT || 30),
  windowMs: Number(process.env.SPEAK_RATE_WINDOW_MS || 10 * 60 * 1000),
})

export function validate(body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) throw new HttpError(400, 'text 를 보내 주세요.')
  if (text.length > MAX_TEXT_CHARS) {
    throw new HttpError(400, `텍스트가 너무 깁니다. (${text.length}자, 최대 ${MAX_TEXT_CHARS}자)`)
  }

  const language = body?.language
  if (language !== undefined && !LANGUAGES.includes(language)) {
    throw new HttpError(400, `language 는 ${LANGUAGES.join(' 또는 ')} 이어야 합니다.`)
  }
  return { text, language }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'POST 만 지원합니다.' })
  }

  const { ELEVENLABS_API_KEY: apiKey, VOICE_ID: voiceId, VOICE_API_TOKEN: token } = process.env
  if (!apiKey || !voiceId || !token) {
    // 토큰이 비어 있을 때 열어 두면 누구나 내 목소리를 만들 수 있으므로 아예 거절한다.
    return sendJson(res, 500, { error: '서버에 ELEVENLABS_API_KEY · VOICE_ID · VOICE_API_TOKEN 이 모두 설정되어 있어야 합니다.' })
  }

  try {
    checkToken(req, token)
    if (rateLimited(clientIp(req))) {
      throw new HttpError(429, '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.')
    }

    const { text, language } = validate(await readJson(req, 64 * 1024))
    const audio = await synthesize({ apiKey, voiceId, text, language, model: process.env.ELEVENLABS_MODEL || undefined })

    res.statusCode = 200
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audio.length)
    res.setHeader('Cache-Control', 'no-store')
    return res.end(audio)
  } catch (err) {
    if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message })
    if (err instanceof SyntaxError) return sendJson(res, 400, { error: '요청 본문이 올바른 JSON 이 아닙니다.' })
    if (err instanceof ElevenLabsError) {
      if (err.status === 401) return sendJson(res, 500, { error: 'ELEVENLABS_API_KEY 가 올바르지 않습니다.' })
      if (err.status === 429) return sendJson(res, 429, { error: 'ElevenLabs 사용량 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.' })
      return sendJson(res, 502, { error: `ElevenLabs 오류 (${err.status}): ${err.message}` })
    }
    console.error('[api/speak]', err)
    return sendJson(res, 500, { error: '알 수 없는 서버 오류가 발생했습니다.' })
  }
}
