import { useEffect, useMemo, useState } from 'react'
import { countUnmarked } from '../lib/transliterate.js'

/**
 * 원문 편집창.
 * 인식 결과를 고쳐 다시 분석하는 용도이자, 아랍어를 그냥 붙여넣어 쓰는 입구다.
 *
 * 읽는 길이 둘이다.
 *  - 바로 읽기: 붙어 있는 부호대로 브라우저 안에서 읽는다. 즉시, 공짜.
 *  - 서버 분석: 빠진 하라카트까지 채워 넣는다. 부호 없는 글을 읽으려면 이쪽이다.
 */
export default function TextEditor({ value, onAnalyze, onReadLocal, busy }) {
  const [text, setText] = useState(value)

  // 새 인식 결과가 오면 편집창도 따라 바뀐다
  useEffect(() => setText(value), [value])

  const trimmed = text.trim()
  const { unknown, total } = useMemo(() => countUnmarked(trimmed), [trimmed])
  const dirty = trimmed !== value.trim()

  return (
    <form
      className="editor"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onAnalyze(trimmed)
      }}
    >
      <label className="editor__label" htmlFor="editor-text">
        원문 수정 · 직접 입력
      </label>
      <textarea
        id="editor-text"
        className="editor__input"
        dir="rtl"
        lang="ar"
        rows={2}
        value={text}
        placeholder="아랍어를 붙여넣어도 됩니다"
        onChange={(e) => setText(e.target.value)}
      />

      <div className="editor__actions">
        <button type="submit" className="btn btn--primary" disabled={busy || !trimmed}>
          {busy ? '분석 중…' : '하라카트 붙여 분석'}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!trimmed}
          onClick={() => onReadLocal(trimmed)}
        >
          부호대로 바로 읽기
        </button>
        {dirty && <span className="editor__hint">수정됨</span>}
      </div>

      {total > 0 && (
        <p className="editor__gauge">
          {unknown === 0
            ? '부호가 다 붙어 있습니다. 서버 없이 바로 읽을 수 있습니다.'
            : `모음을 알 수 없는 자리가 ${unknown}곳 있습니다 — 「하라카트 붙여 분석」이 문맥을 보고 채워 줍니다.`}
        </p>
      )}
    </form>
  )
}
