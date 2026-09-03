/**
 * 모음 부호·장모음·그밖의 글자를 담는 줄 카드.
 * 좁은 화면에서 표는 설명 칸이 눌려 못 읽게 되므로 카드로 쌓는다.
 */
export default function ItemCard({ glyph, ink, wide, name, sound, ex, note, children }) {
  return (
    <div className="item">
      <div
        className={`item__glyph${ink ? ' item__glyph--ink' : ''}${wide ? ' item__glyph--wide' : ''}`}
        lang="ar"
      >
        {glyph}
      </div>
      <div className="item__body">
        <div className="item__title">
          <span className="item__name">{name}</span>
          {sound && <span className="item__sound">{sound}</span>}
        </div>
        {ex && (
          <div className="item__ex">
            <span className="w" lang="ar">{ex.a}</span>
            {ex.k && <span className="k">{ex.k}</span>}
            {ex.m && <span className="m">{ex.m}</span>}
          </div>
        )}
        {note && <p className="item__note">{note}</p>}
        {children}
      </div>
    </div>
  )
}
