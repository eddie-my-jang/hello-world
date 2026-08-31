import { useState, useEffect } from 'react'

/**
 * 원문 편집창.
 * 인식 결과를 고쳐 다시 분석하는 용도이자,
 * 사진 없이 아랍어를 그냥 붙여넣어 쓰는 입구이기도 하다.
 */
export default function TextEditor({ value, onSubmit, busy }) {
  const [text, setText] = useState(value)

  // 새 인식 결과가 오면 편집창도 따라 바뀐다
  useEffect(() => setText(value), [value])

  const dirty = text.trim() !== value.trim()

  return (
    <form
      className="editor"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) onSubmit(text.trim())
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
        <button type="submit" className="btn" disabled={busy || !text.trim()}>
          {busy ? '분석 중…' : '이 글로 다시 분석'}
        </button>
        {dirty && <span className="editor__hint">수정됨</span>}
      </div>
    </form>
  )
}
