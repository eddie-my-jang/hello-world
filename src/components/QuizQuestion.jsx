import QuizExplain from './QuizExplain.jsx'
import { isSupported as canSpeak, speak } from '../lib/speech.js'

/** 문제 하나 — 고르기 전엔 선택지만, 고른 뒤엔 맞았는지와 풀이까지 */
export default function QuizQuestion({ question, number, total, score, chosen, onAnswer, onNext }) {
  const { item, prompt, options, answer } = question
  const answered = chosen !== null
  const speakable = canSpeak()

  return (
    <section className="panel quiz-question">
      <div className="quiz-progress">
        <span>{number} / {total}</span>
        <span>맞음 {score}</span>
      </div>

      <div className="quiz-prompt">
        <span className="quiz-prompt__ar" dir="rtl" lang="ar">{item.arabic}</span>
        {speakable && (
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => speak(item.arabic, { rate: item.kind === 'letter' ? 0.75 : 0.85 })}
          >
            🔊 듣기
          </button>
        )}
      </div>
      <p className="quiz-prompt__label">{prompt}</p>

      <div className="quiz-options">
        {options.map((option) => {
          const isAnswer = option === answer
          const isChosen = option === chosen
          let state = ''
          if (answered && isAnswer) state = ' is-correct'
          else if (answered && isChosen) state = ' is-wrong'
          return (
            <button
              key={option}
              type="button"
              className={`quiz-option${state}`}
              disabled={answered}
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <p className={`quiz-feedback${chosen === answer ? ' is-correct' : ' is-wrong'}`}>
            {chosen === answer ? '정답입니다.' : `아쉽네요 — 정답은 「${answer}」입니다.`}
          </p>
          <QuizExplain item={item} />
          <button type="button" className="btn btn--primary" onClick={onNext}>
            {number < total ? '다음 문제' : '결과 보기'}
          </button>
        </>
      )}
    </section>
  )
}
