// Web Speech API 로 아랍어를 들려준다.
//
// 예전에는 getVoices() 에 아랍어 음성이 있을 때만 버튼을 보여 줬는데,
// 그러면 아이폰에서 버튼이 영영 나타나지 않는다. iOS 사파리는 한 번이라도
// 발화하기 전까지 목록이 비어 있는 일이 흔하고 voiceschanged 도 늦게 온다.
//
// 그래서 판단을 뒤로 미룬다. 버튼은 speechSynthesis 가 있으면 보여 주고,
// 실제로 말할 때 아랍어 음성을 고른다. 못 고르면 lang 만 ar-SA 로 넘겨
// 기기가 알아서 고르게 둔다.

const LANG = 'ar-SA'

function synth() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

/** 이 기기에서 소리를 낼 수 있는가 (음성 목록과 무관하게) */
export function isSupported() {
  return Boolean(synth())
}

/**
 * 음성 목록에서 아랍어를 고른다.
 * ar-SA 를 가장 먼저, 없으면 아무 아랍어나, 그것도 없으면 null.
 */
export function pickVoice(voices) {
  if (!Array.isArray(voices) || !voices.length) return null
  const arabic = voices.filter((voice) => voice?.lang?.toLowerCase().startsWith('ar'))
  if (!arabic.length) return null
  return arabic.find((voice) => voice.lang.toLowerCase() === LANG.toLowerCase()) || arabic[0]
}

function currentVoice() {
  const s = synth()
  if (!s) return null
  try {
    return pickVoice(s.getVoices())
  } catch {
    return null
  }
}

/** 읽던 것을 멈춘다 */
export function stop() {
  const s = synth()
  if (!s) return
  try {
    s.cancel()
  } catch {
    /* 멈추기에 실패해도 할 수 있는 일이 없다 */
  }
}

/**
 * 아랍어를 읽어 준다.
 * @param {string} text 읽을 아랍어
 * @param {{rate?: number}} [options]
 * @returns {boolean} 발화를 넘겼는지 (실제로 소리가 났는지는 알 수 없다)
 */
export function speak(text, { rate = 0.85 } = {}) {
  const s = synth()
  if (!s || !text?.trim()) return false

  stop()
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = currentVoice()
  if (voice) utterance.voice = voice
  // 음성을 못 골랐어도 언어는 알려 준다 — 기기가 알아서 고르는 경우가 많다
  utterance.lang = voice?.lang || LANG
  utterance.rate = rate

  try {
    s.speak(utterance)
    return true
  } catch {
    return false
  }
}

/**
 * iOS 는 사용자가 누른 동작에서 한 번 발화해 두어야 그 뒤 타이머로 부른 것도 난다.
 * 재생 버튼처럼 사람이 누르는 자리에서 한 번 불러 둔다.
 */
export function primeFromUserGesture() {
  const s = synth()
  if (!s) return
  try {
    // 빈 문자열은 브라우저가 무시하기도 해서 공백 하나를 아주 작은 소리로 흘린다
    const warmup = new SpeechSynthesisUtterance(' ')
    warmup.volume = 0
    s.speak(warmup)
  } catch {
    /* 준비에 실패해도 버튼으로 직접 누르는 건 여전히 동작한다 */
  }
}

/** 장모음·묵음처럼 혼자서는 소리가 없는 조각인가 */
export function isSilentPiece(letter) {
  return !letter || letter.k === '―' || letter.k === '묵음'
}
