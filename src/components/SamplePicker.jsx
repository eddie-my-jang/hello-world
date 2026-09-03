import { useMemo, useState } from 'react'
import { stripHarakat } from '../lib/arabic.js'

/** 칩 하나가 이 검색어에 걸리는가 — 한글 뜻으로도, 아랍어로도 찾는다 */
function matches(sample, query) {
  if (!query) return true
  const needle = query.toLowerCase()
  const bare = stripHarakat(needle)
  const hay = [
    sample.tag,
    sample.t,
    ...sample.w.flatMap((word) => [word.k, word.r, word.m, stripHarakat(word.a)]),
  ]
  return hay.some((text) => text && text.toLowerCase().includes(bare))
}

/**
 * 예문 고르기. 사진 없이도 눌러 볼 수 있게 미리 넣어 둔 것들.
 * 수백 개라 낱말·문장·숫자로 가르고, 그 안에서 다시 찾아 쓴다 —
 * 칩을 옆으로 밀어 훑기에는 너무 길다.
 */
export default function SamplePicker({ samples, activeTag, onSelect, kind, kinds, onKindChange }) {
  const [query, setQuery] = useState('')
  const shown = useMemo(() => samples.filter((s) => matches(s, query)), [samples, query])

  return (
    <>
      <div className="segmented" role="group" aria-label="예문 갈래">
        {kinds.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className={`segmented__btn${kind === name ? ' is-active' : ''}`}
            aria-pressed={kind === name}
            onClick={() => { onKindChange(name); setQuery('') }}
          >
            {name} <span className="segmented__count">{count}</span>
          </button>
        ))}
      </div>

      <div className="find">
        <input
          type="search"
          className="find__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="찾기 — 뜻이나 아랍어로"
          aria-label="예문 찾기"
        />
        {query && <span className="find__count">{shown.length}개</span>}
      </div>

      {shown.length === 0 ? (
        <p className="status">찾는 낱말이 없습니다. 아래 「직접 입력」에 붙여넣어 보세요.</p>
      ) : (
        <div className="decks" role="group" aria-label="예문">
          {shown.map((sample) => (
            <button
              key={sample.tag}
              type="button"
              className="deck"
              aria-pressed={sample.tag === activeTag}
              onClick={() => onSelect(sample.tag)}
            >
              <span className="deck__ar" lang="ar" dir="rtl">
                {sample.w.map((word) => word.a).join(' ')}
              </span>
              <span className="deck__ko">{sample.tag}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
