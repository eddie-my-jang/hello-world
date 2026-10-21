import { MODES, SCOPES } from '../lib/quiz.js'

const COUNTS = [5, 10, 20]

/** 퀴즈를 시작하기 전 — 무엇을(글자/낱말/문장), 무엇을 묻는지(읽기/뜻), 몇 문제 */
export default function QuizSettings({ scope, mode, count, max, onScope, onMode, onCount, onStart, error }) {
  return (
    <section className="panel quiz-settings">
      <div className="quiz-settings__row">
        <span className="quiz-settings__label">무엇을 낼까요</span>
        <div className="segmented" role="group" aria-label="범위">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`segmented__btn${scope === s.id ? ' is-active' : ''}`}
              onClick={() => onScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-settings__row">
        <span className="quiz-settings__label">무엇을 물을까요</span>
        <div className="segmented" role="group" aria-label="물음 갈래">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`segmented__btn${mode === m.id ? ' is-active' : ''}`}
              onClick={() => onMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-settings__row">
        <span className="quiz-settings__label">몇 문제</span>
        <div className="segmented" role="group" aria-label="문제 수">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              className={`segmented__btn${count === n ? ' is-active' : ''}`}
              onClick={() => onCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <p className="quiz-settings__hint">
        {max > 0
          ? `이 설정으로 최대 ${max}문제까지 낼 수 있습니다. 글자는 뜻이 없어 「읽기」로만 묻습니다.`
          : '이 설정으로는 문제를 낼 수 없습니다. 「무엇을 물을까요」를 바꿔 보세요 — 글자는 뜻을 묻지 않습니다.'}
      </p>
      {error && <p className="status status--error">{error}</p>}

      <button type="button" className="btn btn--primary" onClick={onStart} disabled={max === 0}>
        시작하기
      </button>
    </section>
  )
}
