/** 끝나고 보는 성적표 — 틀린 것만 모아 다시 볼 수 있다 */
export default function QuizResults({ history, onRetryMissed, onNewQuiz }) {
  const total = history.length
  const score = history.filter((h) => h.correct).length
  const missed = history.filter((h) => !h.correct)
  const pct = total ? Math.round((score / total) * 100) : 0

  return (
    <section className="panel quiz-results">
      <div className="quiz-results__score">
        <span className="quiz-results__num">{score} / {total}</span>
        <span className="quiz-results__pct">{pct}%</span>
      </div>

      {missed.length > 0 && (
        <div className="quiz-results__list">
          <p className="quiz-settings__hint">틀린 {missed.length}문제</p>
          {missed.map(({ question, chosen }, i) => (
            <div className="quiz-miss" key={i}>
              <span className="quiz-miss__ar" dir="rtl" lang="ar">{question.item.arabic}</span>
              <span className="quiz-miss__wrong">{chosen}</span>
              <span className="quiz-miss__right">{question.answer}</span>
            </div>
          ))}
        </div>
      )}

      <div className="editor__actions">
        {missed.length > 0 && (
          <button type="button" className="btn btn--primary" onClick={onRetryMissed}>
            틀린 것만 다시 풀기
          </button>
        )}
        <button type="button" className="btn" onClick={onNewQuiz}>
          새 퀴즈
        </button>
      </div>
    </section>
  )
}
