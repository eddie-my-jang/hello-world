import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cloneVoice, synthesize } from '../lib/elevenlabs.js'

test('cloneVoice 는 녹음 파일을 multipart 로 올리고 voice_id 를 돌려준다', async () => {
  let seen
  const fetchImpl = async (url, init) => {
    seen = { url, init }
    return Response.json({ voice_id: 'new-voice', requires_verification: false })
  }
  const voice = await cloneVoice({
    apiKey: 'xi-test',
    name: '내 목소리',
    files: [{ name: 'a.mp3', type: 'audio/mpeg', data: Buffer.from('mp3') }],
    fetchImpl,
  })

  assert.equal(voice.voice_id, 'new-voice')
  assert.equal(seen.url, 'https://api.elevenlabs.io/v1/voices/add')
  assert.equal(seen.init.headers['xi-api-key'], 'xi-test')
  const form = seen.init.body
  assert.equal(form.get('name'), '내 목소리')
  assert.equal(form.getAll('files').length, 1)
  assert.equal(form.get('files').name, 'a.mp3')
})

test('language_code 를 받는 모델에서만 언어를 강제한다', async () => {
  const bodies = []
  const fetchImpl = async (url, init) => {
    bodies.push(JSON.parse(init.body))
    return new Response(Buffer.from('mp3'))
  }
  await synthesize({ apiKey: 'k', voiceId: 'v', text: 'hi', language: 'en', model: 'eleven_flash_v2_5', fetchImpl })
  await synthesize({ apiKey: 'k', voiceId: 'v', text: 'hi', language: 'en', model: 'eleven_multilingual_v2', fetchImpl })
  assert.equal(bodies[0].language_code, 'en')
  assert.equal(bodies[1].language_code, undefined)
})
