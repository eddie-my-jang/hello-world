import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 홈 화면에 추가해 두면 인터넷 없이도 뜨게 한다.
// 개발 중에는 캐시가 방해되므로 빌드된 앱에서만 등록한다.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 등록에 실패해도 앱은 그대로 돌아간다 — 오프라인만 안 될 뿐이다
    })
  })
}
