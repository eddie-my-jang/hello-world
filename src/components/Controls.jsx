// 재생 중에 무엇을 읽을지. '끄기'가 예전의 소리 체크를 대신한다 —
// 따로 둘 이유가 없고, 이렇게 두면 무엇이 언제 소리 나는지가 한눈에 보인다.
const UNITS = [
  ['off', '끄기'],
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
      </div>

      <div className="controls__row controls__row--wrap">
        <label className="field">
          <span className="field__label">재생 속도</span>
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

      </div>

      {/* 발음 단위와 듣기는 한 묶음이다 — 듣기가 읽는 것이 바로 고른 단위다.
          소리를 낼 수 없는 기기에서는 둘 다 의미가 없으므로 줄째 감춘다. */}
      {canSpeak && (
        <div className="controls__row controls__row--wrap">
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

          <button type="button" className="btn" onClick={onSpeak} title="지금 자리를 들어봅니다">
            🔊 듣기
          </button>
        </div>
      )}
    </div>
  )
}
