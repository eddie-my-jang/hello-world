import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'

process.env.ELEVENLABS_API_KEY = 'xi-test'
process.env.VOICE_ID = 'voice-123'
process.env.VOICE_API_TOKEN = 'secret-token'

const { default: speak, MAX_TEXT_CHARS } = await import('../api/speak.js')

// 진짜 ElevenLabs 대신 부른 기록을 남기는 가짜 fetch
let calls
let reply
const realFetch = globalThis.fetch
beforeEach(() => {
  calls = []
  reply = () => new Response(Buffer.from('ID3-fake-mp3'), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return reply()
  }
})
afterEach(() => {
  globalThis.fetch = realFetch
})

let ipCounter = 0
async function call({ method = 'POST', body, token = 'secret-token', ip } = {}) {
  const raw = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)
  const req = Readable.from(raw ? [Buffer.from(raw)] : [])
  req.method = method
  req.headers = { 'x-forwarded-for': ip || `10.0.0.${++ipCounter}` }
  if (token) req.headers.authorization = `Bearer ${token}`

  const headers = {}
  const res = {
    statusCode: 0,
    setHeader: (k, v) => { headers[k.toLowerCase()] = v },
  }
  const body$ = await new Promise((resolve) => {
    res.end = (data) => resolve(data)
    speak(req, res)
  })
  const isJson = String(headers['content-type']).startsWith('application/json')
  return { status: res.statusCode, headers, body: isJson ? JSON.parse(body$) : body$ }
}

test('토큰이 맞으면 내 목소리 mp3 를 돌려준다', async () => {
  const res = await call({ body: { text: '안녕하세요, 반갑습니다.' } })
  assert.equal(res.status, 200)
  assert.equal(res.headers['content-type'], 'audio/mpeg')
  assert.equal(res.body.toString(), 'ID3-fake-mp3')

  assert.equal(calls.length, 1)
  assert.match(calls[0].url, /\/v1\/text-to-speech\/voice-123\?output_format=mp3_44100_128$/)
  assert.equal(calls[0].init.headers['xi-api-key'], 'xi-test')
  const sent = JSON.parse(calls[0].init.body)
  assert.equal(sent.text, '안녕하세요, 반갑습니다.')
  assert.equal(sent.model_id, 'eleven_multilingual_v2')
  // multilingual_v2 는 language_code 를 받지 않는다
  assert.equal(sent.language_code, undefined)
})

test('영어도 그대로 넘긴다', async () => {
  const res = await call({ body: { text: 'Hello, nice to meet you.', language: 'en' } })
  assert.equal(res.status, 200)
  assert.equal(JSON.parse(calls[0].init.body).text, 'Hello, nice to meet you.')
})

test('토큰이 없거나 틀리면 ElevenLabs 를 부르지 않는다', async () => {
  assert.equal((await call({ body: { text: 'hi' }, token: null })).status, 401)
  assert.equal((await call({ body: { text: 'hi' }, token: 'wrong' })).status, 401)
  assert.equal(calls.length, 0)
})

test('서버에 토큰이 설정되지 않았으면 열지 않는다', async () => {
  const saved = process.env.VOICE_API_TOKEN
  delete process.env.VOICE_API_TOKEN
  try {
    const res = await call({ body: { text: 'hi' } })
    assert.equal(res.status, 500)
    assert.equal(calls.length, 0)
  } finally {
    process.env.VOICE_API_TOKEN = saved
  }
})

test('입력을 검사한다', async () => {
  assert.equal((await call({ method: 'GET' })).status, 405)
  assert.equal((await call({ body: { text: '   ' } })).status, 400)
  assert.equal((await call({ body: { text: 'a'.repeat(MAX_TEXT_CHARS + 1) } })).status, 400)
  assert.equal((await call({ body: { text: 'hi', language: 'ja' } })).status, 400)
  assert.equal((await call({ body: '{not json' })).status, 400)
  assert.equal(calls.length, 0)
})

test('ElevenLabs 오류를 알아볼 수 있게 바꿔 준다', async () => {
  reply = () => Response.json({ detail: { message: 'voice not found' } }, { status: 404 })
  const res = await call({ body: { text: 'hi' } })
  assert.equal(res.status, 502)
  assert.match(res.body.error, /404.*voice not found/)

  reply = () => Response.json({ detail: 'invalid key' }, { status: 401 })
  assert.equal((await call({ body: { text: 'hi' } })).status, 500)
})

test('같은 IP 가 너무 자주 부르면 막는다', async () => {
  let last
  for (let i = 0; i < 31; i++) last = await call({ body: { text: 'hi' }, ip: '192.0.2.1' })
  assert.equal(last.status, 429)
  assert.equal(calls.length, 30)
})
