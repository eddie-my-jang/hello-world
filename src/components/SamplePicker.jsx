/**
 * 예문 고르기. 사진 없이도 눌러 볼 수 있게 미리 넣어 둔 것들.
 * 66개나 되므로 낱말과 문장을 갈라서 보여 준다.
 */
export default function SamplePicker({ samples, activeTag, onSelect, kind, kinds, onKindChange }) {
  return (
    <>
      <div className="segmented" role="group" aria-label="예문 갈래">
        {kinds.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className={`segmented__btn${kind === name ? ' is-active' : ''}`}
            aria-pressed={kind === name}
            onClick={() => onKindChange(name)}
          >
            {name} <span className="segmented__count">{count}</span>
          </button>
        ))}
      </div>

      <div className="decks" role="group" aria-label="예문">
        {samples.map((sample) => (
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
    </>
  )
}
