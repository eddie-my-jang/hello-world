import test from 'node:test'
import assert from 'node:assert/strict'
import { pickVoice, isSilentPiece } from '../src/lib/speech.js'

const voice = (lang, name) => ({ lang, name })

test('pickVoice: ar-SA 를 가장 먼저 고른다', () => {
  const voices = [voice('en-US'), voice('ar-EG'), voice('ar-SA'), voice('ko-KR')]
  assert.equal(pickVoice(voices).lang, 'ar-SA')
})

test('pickVoice: ar-SA 가 없으면 다른 아랍어라도 고른다', () => {
  assert.equal(pickVoice([voice('en-US'), voice('ar-EG')]).lang, 'ar-EG')
})

test('pickVoice: 대소문자를 가리지 않는다', () => {
  assert.equal(pickVoice([voice('AR-sa')]).lang, 'AR-sa')
})

test('pickVoice: 아랍어가 없거나 목록이 비면 null', () => {
  // iOS 는 첫 발화 전까지 목록이 비어 있곤 한다. 그때 null 이 나오는 것은
  // 정상이고, 그렇다고 버튼을 숨기면 안 된다 — speak() 가 lang 만 넘겨서 시도한다.
  assert.equal(pickVoice([voice('en-US'), voice('ko-KR')]), null)
  assert.equal(pickVoice([]), null)
  assert.equal(pickVoice(undefined), null)
})

test('pickVoice: lang 이 없는 항목이 섞여도 터지지 않는다', () => {
  assert.equal(pickVoice([{ name: '이상한 음성' }, voice('ar-SA')]).lang, 'ar-SA')
})

test('isSilentPiece: 장모음과 묵음은 혼자 소리내지 않는다', () => {
  assert.equal(isSilentPiece({ a: 'ا', k: '―' }), true)
  assert.equal(isSilentPiece({ a: 'ة', k: '묵음' }), true)
  assert.equal(isSilentPiece({ a: 'كِ', k: '키' }), false)
  assert.equal(isSilentPiece(null), true)
})
