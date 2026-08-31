import { useCallback, useEffect, useState } from 'react'

// 해시 라우팅을 쓴다. 정적 호스팅(Vercel, GitHub Pages)에서 서버 리라이트
// 설정 없이 그대로 동작하고, 라우터 라이브러리도 필요 없다.
export const ROUTES = [
  { path: '', label: '읽기판', hint: '사진 속 단어를 한 글자씩' },
  { path: 'letters', label: '자모표', hint: '자음 28자와 모음 부호' },
]

function readHash() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.some((r) => r.path === raw) ? raw : ''
}

export function useRoute() {
  const [route, setRoute] = useState(readHash)

  useEffect(() => {
    const sync = () => setRoute(readHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const go = useCallback((path) => {
    window.location.hash = path ? `#/${path}` : '#/'
    window.scrollTo({ top: 0 })
  }, [])

  return [route, go]
}
