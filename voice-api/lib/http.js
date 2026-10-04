// 핸들러들이 같이 쓰는 HTTP 도구: 오류 형식, 본문 읽기, 인증, 호출 횟수 제한.
//
// Vercel(Node 런타임)의 (req, res) 시그니처를 따른다. scripts/dev.mjs 의
// node:http 서버도 같은 객체를 넘기므로 로컬에서도 그대로 돈다.
import { createHash, timingSafeEqual } from 'node:crypto'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

// Vercel 은 JSON 본문을 파싱해 req.body 에 넣어준다. node:http 는 그렇지 않다.
export async function readJson(req, maxBytes) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body)
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) throw new HttpError(413, '요청 본문이 너무 큽니다.')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// ── 인증 ─────────────────────────────────────────────────────────────────────
// 내 목소리를 아무나 만들어 내면 안 되므로 토큰 없이는 절대 열지 않는다.
// 길이가 달라도 비교 시간이 같도록 해시끼리 비교한다.
const digest = (value) => createHash('sha256').update(value).digest()

export function checkToken(req, expected) {
  const header = req.headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) throw new HttpError(401, 'Authorization: Bearer <토큰> 헤더가 필요합니다.')
  if (!timingSafeEqual(digest(match[1].trim()), digest(expected))) {
    throw new HttpError(401, '토큰이 올바르지 않습니다.')
  }
}

// ── 호출 횟수 제한 ───────────────────────────────────────────────────────────
// 서버리스 인스턴스 메모리 기반이라 완벽하지는 않다(인스턴스마다 따로 센다).
// 토큰이 새어 나갔을 때 요금 폭주를 늦추는 1차 방어선이고,
// 정식 운영에는 KV/Redis 로 교체할 것.
export function createRateLimiter({ limit, windowMs }) {
  const hits = new Map() // key -> number[] (호출 시각)
  return function rateLimited(key) {
    const now = Date.now()
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
    if (hits.size > 5000) hits.clear() // 메모리 폭주 방지
    recent.push(now)
    hits.set(key, recent)
    return recent.length > limit
  }
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}
