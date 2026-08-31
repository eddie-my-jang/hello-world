/** 예문 고르기. 사진 없이도 눌러 볼 수 있게 미리 넣어 둔 단어들. */
export default function SamplePicker({ samples, index, onSelect }) {
  return (
    <div className="decks" role="group" aria-label="예문">
      {samples.map((sample, i) => (
        <button
          key={sample.tag}
          type="button"
          className="deck"
          aria-pressed={i === index}
          onClick={() => onSelect(i)}
        >
          <span className="deck__ar" lang="ar" dir="rtl">
            {sample.w.map((word) => word.a).join(' ')}
          </span>
          <span className="deck__ko">{sample.tag}</span>
        </button>
      ))}
    </div>
  )
}
