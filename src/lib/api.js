// /api/read 호출과 응답 파싱.
// API 키는 서버(api/read.js)에만 있고, 이 파일은 키를 전혀 모른다.

import { splitIntoLetters } from './arabic.js'

/**
 * 모델이 준 텍스트에서 JSON 을 뽑아낸다.
 * 스키마를 강제해도 가끔 ```json 펜스나 앞뒤 설명이 섞여 나올 수 있어 방어적으로 처리한다.
 */
export function parseModelJson(raw) {
  let text = (raw || '').trim()

  // ```json ... ``` 펜스 제거
  const fenced = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/)
  if (fenced) text = fenced[1].trim()

  try {
    return JSON.parse(text)
  } catch {
    // 앞뒤에 설명이 붙은 경우: 가장 바깥 중괄호 구간만 잘라 다시 시도
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1))
    }
    throw new Error('모델 응답을 JSON 으로 읽지 못했습니다.')
  }
}

/** 파싱된 응답을 앱이 기대하는 모양으로 정리한다 (누락 필드 보정 포함) */
export function normalizeResult(data) {
  const words = Array.isArray(data?.w) ? data.w : []

  return {
    t: typeof data?.t === 'string' ? data.t : '',
    w: words
      .filter((word) => word && typeof word.a === 'string' && word.a.trim())
      .map((word) => {
        const letters = Array.isArray(word.l) ? word.l.filter((l) => l && l.a) : []
        return {
          a: word.a.trim(),
          k: word.k || '',
          r: word.r || '',
          m: word.m || '',
          // l 이 비어 오면 앱에서 직접 쪼갠다 (발음 정보는 없음)
          l: letters.length
            ? letters.map((l) => ({ a: l.a, k: l.k || '', r: l.r || '' }))
            : splitIntoLetters(word.a).map((a) => ({ a, k: '', r: '' })),
        }
      }),
  }
}

async function postRead(payload) {
  let res
  try {
    res = await fetch('/api/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.')
  }

  let body
  try {
    body = await res.json()
  } catch {
    throw new Error(`서버 응답을 읽지 못했습니다. (HTTP ${res.status})`)
  }

  if (!res.ok) throw new Error(body?.error || `요청이 실패했습니다. (HTTP ${res.status})`)

  return normalizeResult(parseModelJson(body.text))
}

/** 사진 속 아랍어 읽기 */
export function readImage({ data, mediaType }) {
  return postRead({ image: { data, mediaType } })
}

/** 직접 입력/수정한 아랍어 읽기 */
export function readText(text) {
  return postRead({ text })
}
