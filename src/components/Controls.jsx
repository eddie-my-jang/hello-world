/** 재생/멈춤·이전/다음·속도·모드·듣기 */
export default function Controls({
  playing,
  onTogglePlay,
  onPrev,
  onNext,
  canPrev,
  canNext,
  speed,
  onSpeedChange,
  mode,
  onModeChange,
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

        <div className="segmented" role="group" aria-label="읽기 범위">
          <button
            type="button"
            className={`segmented__btn${mode === 'word' ? ' is-active' : ''}`}
            onClick={() => onModeChange('word')}
          >
            단어 하나
          </button>
          <button
            type="button"
            className={`segmented__btn${mode === 'sentence' ? ' is-active' : ''}`}
            onClick={() => onModeChange('sentence')}
          >
            문장 전체
          </button>
        </div>
      </div>
    </div>
  )
}
