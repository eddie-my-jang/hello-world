const UNITS = [
  ['letter', '글자'],
  ['word', '단어'],
  ['sentence', '문장'],
]

/** 재생/멈춤·이전/다음·속도·발음 단위·듣기 */
export default function Controls({
  playing,
  onTogglePlay,
  onPrev,
  onNext,
  canPrev,
  canNext,
  speed,
  onSpeedChange,
  unit,
  onUnitChange,
  canSpeak,
  onSpeak,
  sound,
  onSoundChange,
}) {
  return (
    <div className="controls">
      <div className="controls__row">
        <button type="button" className="btn" onClick={onPrev} disabled={!canPrev} aria-label="이전 글자">
          ‹ 이전
        </button>
        <button type="button" className="btn btn--primary" onClick={onTogglePlay}>
          {playing ? '멈춤' : '▶ 재생'}
        </button>
        <button type="button" className="btn" onClick={onNext} disabled={!canNext} aria-label="다음 글자">
          다음 ›
        </button>
        {canSpeak && (
          <button type="button" className="btn" onClick={onSpeak} title="이 단어를 들어봅니다">
            🔊 듣기
          </button>
        )}
      </div>

      <div className="controls__row controls__row--wrap">
        <label className="field">
          <span className="field__label">속도</span>
          <input
            type="range"
            min="250"
            max="2000"
            step="50"
            /* 슬라이더는 오른쪽으로 갈수록 빨라지게 뒤집어 표시한다 */
            value={2250 - speed}
            onChange={(e) => onSpeedChange(2250 - Number(e.target.value))}
          />
          <span className="field__value">{(speed / 1000).toFixed(2)}초</span>
        </label>

        {canSpeak && (
          <label className="switch" title="재생하면서 소리를 냅니다">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => onSoundChange(e.target.checked)}
            />
            소리
          </label>
        )}

        <div className="field">
          <span className="field__label">발음 단위</span>
          <div className="segmented" role="group" aria-label="발음 단위">
            {UNITS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`segmented__btn${unit === value ? ' is-active' : ''}`}
                aria-pressed={unit === value}
                onClick={() => onUnitChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
