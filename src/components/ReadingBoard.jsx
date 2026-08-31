import { useMemo } from 'react'
import { joinPieces } from '../lib/arabic.js'

/**
 * 읽기판. 단어를 RTL 로 그리고 오른쪽 글자부터 하이라이트한다.
 *
 * 렌더링 규칙 (건드리면 필기체 이음선이 깨진다):
 *  - 컨테이너는 dir="rtl"
 *  - 글자 span 은 display:inline 유지 (inline-block 금지)
 *  - 하이라이트는 color / background-color 만 (transform, letter-spacing 금지)
 *  - 각 조각은 joinPieces 가 앞뒤에 ZWJ 를 붙여 어중형/어말형을 강제한다
 */
export default function ReadingBoard({ word, letterIndex, onSelectLetter }) {
  const pieces = useMemo(() => joinPieces(word.l.map((letter) => letter.a)), [word])

  return (
    <div className="board" dir="rtl" lang="ar">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className={`board__letter is-${i === letterIndex ? 'now' : i < letterIndex ? 'done' : 'todo'}`}
          onClick={() => onSelectLetter(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectLetter(i)
            }
          }}
          aria-label={`${i + 1}번째 글자 ${word.l[i].k}`}
        >
          {piece}
        </span>
      ))}
    </div>
  )
}
