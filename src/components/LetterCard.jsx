/** 지금 읽고 있는 글자를 크게 + 한글 + 로마자 */
export default function LetterCard({ letter, index, total }) {
  if (!letter) return null

  return (
    <div className="letter-card">
      <div className="letter-card__glyph" dir="rtl" lang="ar">
        {letter.a}
      </div>
      <div className="letter-card__reading">
        <div className="letter-card__kr">{letter.k || '—'}</div>
        <div className="letter-card__ro">{letter.r || ''}</div>
      </div>
      <div className="letter-card__pos">
        {index + 1} / {total}
      </div>
    </div>
  )
}
