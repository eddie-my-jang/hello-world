// 서버리스 프록시. ANTHROPIC_API_KEY 는 여기(서버)에만 존재한다.
// 클라이언트는 base64 이미지 또는 아랍어 텍스트를 이곳으로만 보낸다.
//
// Vercel(Node 런타임)의 (req, res) 시그니처를 따르지만,
// vite.config.js 의 개발 서버 미들웨어에서도 그대로 재사용된다.
import Anthropic from '@anthropic-ai/sdk'

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

// ── 입력 제한 ────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 디코딩 기준 4MB (클라이언트는 보통 300KB 이하로 줄여 보냄)
const MAX_TEXT_CHARS = 2000
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// ── 호출 횟수 제한 ───────────────────────────────────────────────────────────
// 서버리스 인스턴스 메모리 기반이라 완벽하지는 않다(인스턴스마다 따로 센다).
// 실수로 폭주하는 것을 막는 1차 방어선이고, 정식 운영에는 KV/Redis 로 교체할 것.
const RATE_LIMIT = Number(process.env.READ_RATE_LIMIT || 20)
const RATE_WINDOW_MS = Number(process.env.READ_RATE_WINDOW_MS || 10 * 60 * 1000)
const hits = new Map() // ip -> number[] (호출 시각)

function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (hits.size > 5000) hits.clear() // 메모리 폭주 방지
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE_LIMIT
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

// Vercel 은 JSON 본문을 파싱해 req.body 에 넣어준다. Vite 개발 미들웨어는 그렇지 않다.
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body)
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_IMAGE_BYTES * 2) throw new HttpError(413, '요청 본문이 너무 큽니다.')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are an Arabic reading tutor for native Korean speakers who have just started learning the Arabic script.

Your job: take Arabic text (from an image, or given directly), fully vocalize it, break each word into readable letter units, and give the Korean pronunciation of every unit.

Rules:
1. Read only the Arabic. Ignore logos, page numbers, Latin text and other noise. Take at most 8 words — the most prominent / first ones.
2. Restore ALL short vowels (harakat). Unvocalized Arabic is ambiguous (كتب = kataba / kutiba / kutub), so choose the reading that is correct for the context you see and write it out with fatha/kasra/damma/sukun/shadda/tanwin. The "a" field of each word MUST be fully vocalized.
3. Split each word into letter units ("l"), in logical order — the FIRST element is the RIGHTMOST letter of the word.
   - One unit = one consonant plus the marks attached to it (fatha/kasra/damma/sukun/shadda/tanwin, and the definite-article alif).
   - A shadda'd consonant stays ONE unit (e.g. مَدَرِّسَة → ... رِّ ...).
   - A long vowel (ا after fatha, و after damma, ي after kasra) is its OWN unit and its "k" is exactly "―" (U+2015), because it only stretches the previous vowel.
   - Silent letters (e.g. the alif of وا) are their own unit with "k" of "―".
4. "k" is the Korean reading of that unit written in Hangul: كَ→"카", كِ→"키", كُ→"쿠", كْ→"크", مَ→"마", سْ→"스", ةُ→"툰"… Use the Hangul that a Korean learner would actually say. Never leave "k" empty.
5. "r" is a simple romanization of the same unit (ka, ki, ku, k, ma, s …).
6. Word level: "a" = vocalized word, "k" = Korean reading of the whole word, "r" = romanization, "m" = the word's meaning in Korean.
7. "t" = the meaning of the whole text in one Korean sentence. If it is a single word, just give its meaning.
8. If there is no Arabic at all, return {"t":"","w":[]}.

Answer with the JSON object only. No prose, no markdown fences.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    t: { type: 'string', description: '전체 뜻 (한국어)' },
    w: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          a: { type: 'string', description: '하라카트를 모두 붙인 단어' },
          k: { type: 'string', description: '단어 전체의 한글 발음' },
          r: { type: 'string', description: '단어 전체의 로마자' },
          m: { type: 'string', description: '단어 뜻 (한국어)' },
          l: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                a: { type: 'string', description: '글자 + 붙은 부호' },
                k: { type: 'string', description: '한글 발음, 장모음은 ―' },
                r: { type: 'string', description: '로마자' },
              },
              required: ['a', 'k', 'r'],
              additionalProperties: false,
            },
          },
        },
        required: ['a', 'k', 'r', 'm', 'l'],
        additionalProperties: false,
      },
    },
  },
  required: ['t', 'w'],
  additionalProperties: false,
}

function buildContent({ image, text }) {
  if (image) {
    return [
      { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
      { type: 'text', text: '이 사진 속 아랍어를 읽어 주세요.' },
    ]
  }
  return [{ type: 'text', text: `다음 아랍어를 읽어 주세요:\n\n${text}` }]
}

function validate(body) {
  const image = body?.image
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (image) {
    if (typeof image.data !== 'string' || !image.data) {
      throw new HttpError(400, '이미지 데이터가 없습니다.')
    }
    if (!ALLOWED_MEDIA_TYPES.includes(image.mediaType)) {
      throw new HttpError(400, `지원하지 않는 이미지 형식입니다: ${image.mediaType}`)
    }
    // base64 문자 수 → 대략적인 원본 바이트 수
    const bytes = Math.floor((image.data.length * 3) / 4)
    if (bytes > MAX_IMAGE_BYTES) {
      throw new HttpError(413, `이미지가 너무 큽니다. (${Math.round(bytes / 1024)}KB, 최대 ${MAX_IMAGE_BYTES / 1024 / 1024}MB)`)
    }
    return { image: { data: image.data, mediaType: image.mediaType } }
  }

  if (text) {
    if (text.length > MAX_TEXT_CHARS) {
      throw new HttpError(400, `텍스트가 너무 깁니다. (최대 ${MAX_TEXT_CHARS}자)`)
    }
    return { text }
  }

  throw new HttpError(400, '이미지 또는 텍스트를 보내주세요.')
}

async function callClaude(client, input) {
  const request = {
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    // 하라카트 복원은 판단이 필요한 작업이라 적응형 사고를 켜 둔다.
    // 응답 속도를 우선하고 싶으면 이 줄을 지우면 된다.
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: buildContent(input) }],
  }

  try {
    const res = await client.messages.create({
      ...request,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    })
    return res
  } catch (err) {
    // 구조화 출력을 못 쓰는 모델/계정이면 스키마 없이 한 번 더 시도한다.
    // (시스템 프롬프트가 이미 JSON 만 내도록 지시하고 있고, 클라이언트도 방어적으로 파싱한다)
    if (err instanceof Anthropic.BadRequestError) {
      return client.messages.create(request)
    }
    throw err
  }
}

export default async function handler(req, res) {
  const send = (status, payload) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return send(405, { error: 'POST 만 지원합니다.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return send(500, { error: '서버에 ANTHROPIC_API_KEY 가 설정되어 있지 않습니다. .env.local 을 확인하세요.' })
  }

  if (rateLimited(clientIp(req))) {
    return send(429, { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' })
  }

  try {
    const input = validate(await readBody(req))
    const client = new Anthropic({ apiKey })
    const message = await callClaude(client, input)

    const text = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

    if (message.stop_reason === 'refusal') {
      return send(422, { error: '이 이미지는 처리할 수 없습니다. 다른 사진을 사용해 주세요.' })
    }
    if (!text.trim()) {
      return send(502, { error: '모델이 빈 응답을 보냈습니다. 다시 시도해 주세요.' })
    }

    // 모델의 원문 텍스트를 그대로 넘긴다. 파싱은 클라이언트(src/lib/api.js)가 방어적으로 한다.
    return send(200, { text, model: message.model })
  } catch (err) {
    if (err instanceof HttpError) return send(err.status, { error: err.message })
    if (err instanceof SyntaxError) return send(400, { error: '요청 본문이 올바른 JSON 이 아닙니다.' })
    if (err instanceof Anthropic.AuthenticationError) return send(500, { error: 'API 키가 올바르지 않습니다.' })
    if (err instanceof Anthropic.RateLimitError) return send(429, { error: 'Claude API 사용량 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.' })
    if (err instanceof Anthropic.APIError) return send(502, { error: `Claude API 오류 (${err.status}): ${err.message}` })
    console.error('[api/read]', err)
    return send(500, { error: '알 수 없는 서버 오류가 발생했습니다.' })
  }
}
