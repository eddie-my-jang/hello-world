import { useEffect, useMemo, useRef, useState } from 'react'
import { countUnmarked } from '../lib/transliterate.js'
import { stripHarakat } from '../lib/arabic.js'

/**
 * 원문 편집창.
 * 인식 결과를 고쳐 다시 분석하는 용도이자, 아랍어를 그냥 붙여넣어 쓰는 입구다.
 *
 * 읽는 길이 둘이다.
 *  - 바로 읽기: 붙어 있는 부호대로 브라우저 안에서 읽는다. 즉시, 공짜.
 *  - 서버 분석: 빠진 하라카트까지 채워 넣는다. 부호 없는 글을 읽으려면 이쪽이다.
 */
// 직접 붙일 수 있는 부호들. 커서 자리에 끼워 넣는다.
const MARKS = [
  ['\u064E', '파트하', '아'],
  ['\u0650', '카스라', '이'],
  ['\u064F', '담마', '우'],
  ['\u0652', '수쿤', '모음 없음'],
  ['\u0651', '샷다', '겹자음'],
  ['\u064B', '탄윈 파트흐', '안'],
  ['\u064D', '탄윈 카스르', '인'],
  ['\u064C', '탄윈 담므', '운'],
]

export default function TextEditor({ value, onAnalyze, onReadLocal, busy }) {
  const [text, setText] = useState(value)
  const boxRef = useRef(null)

  // 새 인식 결과가 오면 편집창도 따라 바뀐다
  useEffect(() => setText(value), [value])

  /** 커서 자리에 부호를 끼워 넣는다. 앞 글자에 붙는다. */
  const insertMark = (mark) => {
    const box = boxRef.current
    const at = box?.selectionStart ?? text.length
    const to = box?.selectionEnd ?? at
    const next = text.slice(0, at) + mark + text.slice(to)
    setText(next)
    // 넣은 부호 바로 뒤로 커서를 옮겨 이어서 칠 수 있게
    requestAnimationFrame(() => {
      box?.focus()
      box?.setSelectionRange(at + mark.length, at + mark.length)
    })
  }

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
        ref={boxRef}
        className="editor__input"
        dir="rtl"
        lang="ar"
        rows={2}
        value={text}
        placeholder="아랍어를 붙여넣어도 됩니다"
        onChange={(e) => setText(e.target.value)}
      />

      {/* 부호 붙이기 — 커서 앞 글자에 붙는다.
          서버 없이도 읽히게 만드는 가장 확실한 방법이자, 그 자체로 연습이다. */}
      <div className="marks">
        <span className="marks__label">부호 붙이기</span>
        <div className="marks__row">
          {MARKS.map(([mark, name, sound]) => (
            <button
              key={name}
              type="button"
              className="mark"
              title={`${name} · ${sound}`}
              onClick={() => insertMark(mark)}
            >
              <span className="mark__glyph" lang="ar">{'\u0640' + mark}</span>
              <span className="mark__name">{name}</span>
            </button>
          ))}
          <button
            type="button"
            className="mark mark--clear"
            title="붙은 부호를 모두 지웁니다"
            onClick={() => setText(stripHarakat(text))}
          >
            <span className="mark__glyph">✕</span>
            <span className="mark__name">지우기</span>
          </button>
        </div>
      </div>

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
