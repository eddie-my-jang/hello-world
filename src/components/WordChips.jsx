/** 단어 목록. 눌러서 그 단어로 바로 이동한다. RTL 이라 읽는 순서와 같다. */
export default function WordChips({ words, wordIndex, onSelect }) {
  if (words.length < 2) return null

  return (
    <div className="chips" dir="rtl">
      {words.map((word, i) => (
        <button
          key={i}
          type="button"
          className={`chip${i === wordIndex ? ' is-active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span className="chip__ar" lang="ar">{word.a}</span>
          <span className="chip__kr" dir="ltr">{word.k}</span>
        </button>
      ))}
    </div>
  )
}
