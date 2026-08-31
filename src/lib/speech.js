// Web Speech API 로 아랍어 단어를 들려준다.
// 아랍어 음성이 깔려 있지 않은 기기가 많으므로, 없으면 버튼 자체를 숨긴다.

const LANG = 'ar-SA'

function synth() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

function arabicVoice() {
  const s = synth()
  if (!s) return null
  return s.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ar')) || null
}

/** 아랍어를 읽어 줄 수 있는 상태인지 */
export function canSpeakArabic() {
  return Boolean(synth() && arabicVoice())
}

/**
 * 음성 목록은 비동기로 채워진다. 준비되면 콜백을 호출한다.
 * @returns 정리(cleanup) 함수
 */
export function watchVoices(onChange) {
  const s = synth()
  if (!s) return () => {}

  const notify = () => onChange(canSpeakArabic())
  notify()
  s.addEventListener?.('voiceschanged', notify)
  // 일부 브라우저는 이벤트를 늦게/한 번만 쏜다 — 한 번 더 확인
  const timer = setTimeout(notify, 600)

  return () => {
    clearTimeout(timer)
    s.removeEventListener?.('voiceschanged', notify)
  }
}

/** 단어 하나를 읽어 준다 */
export function speak(text) {
  const s = synth()
  const voice = arabicVoice()
  if (!s || !voice || !text) return

  s.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = voice.lang || LANG
  utterance.rate = 0.85
  s.speak(utterance)
}
