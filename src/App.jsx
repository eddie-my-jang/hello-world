import { useEffect, useState } from 'react'
import ReaderPage from './pages/ReaderPage.jsx'
import LettersPage from './pages/LettersPage.jsx'
import NumbersPage from './pages/NumbersPage.jsx'
import FontPicker from './components/FontPicker.jsx'
import { applyFont, readStored } from './lib/font.js'
import { ROUTES, useRoute } from './lib/router.js'

export default function App() {
  const [route, go] = useRoute()
  const [font, setFont] = useState(readStored)
  const active = ROUTES.find((r) => r.path === route) || ROUTES[0]

  // 글꼴은 :root 에 표시로만 붙는다 — 스타일시트가 그것을 보고 갈아 끼운다
  useEffect(() => { applyFont(font) }, [font])

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">아랍어 읽기</h1>
        <nav className="tabs" aria-label="페이지">
          {ROUTES.map((tab) => (
            <button
              key={tab.path}
              type="button"
              className={`tab${tab.path === active.path ? ' is-active' : ''}`}
              aria-current={tab.path === active.path ? 'page' : undefined}
              onClick={() => go(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="subhead">
        <p className="header__sub">{active.hint}</p>
        <FontPicker font={font} onChange={setFont} />
      </div>

      {active.path === 'letters' && <LettersPage />}
      {active.path === 'numbers' && <NumbersPage />}
      {active.path === '' && <ReaderPage />}

      <footer className="footer">
        <p>오른쪽 → 왼쪽 순서로 읽습니다. 장모음(―)은 앞 모음을 길게 늘여 주세요.</p>
      </footer>
    </div>
  )
}
