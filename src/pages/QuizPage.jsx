import { useEffect, useMemo, useState } from 'react'
import QuizSettings from '../components/QuizSettings.jsx'
import QuizQuestion from '../components/QuizQuestion.jsx'
import QuizResults from '../components/QuizResults.jsx'
import { buildPool, buildQuestion, makeQuiz, poolSize } from '../lib/quiz.js'
import { SAMPLES } from '../lib/samples.js'
import { LETTERS } from '../lib/letters.js'

/**
 * 퀴즈 — 글자·낱말·문장을 보고 「어떻게 읽는가」·「무슨 뜻인가」를 맞혀 본다.
 * settings(설정) → running(풀기) → results(성적) 세 단계를 오간다.
 */
export default function QuizPage() {
  const [scope, setScope] = useState('all')
  const [mode, setMode] = useState('both')
  const [count, setCount] = useState(10)
  const [phase, setPhase] = useState('settings')
  const [pool, setPool] = useState([])
  const [quiz, setQuiz] = useState([])
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  // 이 설정으로 실제 몇 문제까지 낼 수 있는지 — 시작하기 전에 보여 준다
  const scopedPool = useMemo(() => buildPool(scope, { samples: SAMPLES, letters: LETTERS }), [scope])
  const max = useMemo(() => poolSize(scopedPool, mode), [scopedPool, mode])

  const start = (fromPool, size) => {
    const quizzed = makeQuiz(fromPool, { mode, count: size })
    if (!quizzed.length) {
      setError('이 설정으로는 문제를 만들지 못했습니다. 다른 범위나 물음 갈래를 골라 보세요.')
      return
    }
    setPool(fromPool)
    setQuiz(quizzed)
    setIndex(0)
    setChosen(null)
    setHistory([])
    setError('')
    setPhase('running')
  }

  const answer = (option) => {
    if (chosen !== null) return
    setChosen(option)
  }

  const next = () => {
    const current = quiz[index]
    const entry = { question: current, chosen, correct: chosen === current.answer }
    setHistory((was) => [...was, entry])
    if (index + 1 < quiz.length) {
      setIndex((i) => i + 1)
      setChosen(null)
    } else {
      setPhase('results')
    }
  }

  const retryMissed = () => {
    const missed = history.filter((h) => !h.correct)
    const rebuilt = missed
      .map((h) => buildQuestion(h.question.item, h.question.type, pool, Math.random))
      .filter(Boolean)
    if (!rebuilt.length) return
    setQuiz(rebuilt)
    setIndex(0)
    setChosen(null)
    setHistory([])
    setPhase('running')
  }

  // 키보드: 숫자 1-4 로 선택지를 고르고, 고른 뒤엔 엔터로 다음 문제
  useEffect(() => {
    if (phase !== 'running') return
    const current = quiz[index]
    const onKey = (e) => {
      if (chosen === null && ['1', '2', '3', '4'].includes(e.key)) {
        const option = current?.options[Number(e.key) - 1]
        if (option) answer(option)
      } else if (chosen !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quiz, index, chosen])

  if (phase === 'results') {
    return (
      <div className="page">
        <QuizResults history={history} onRetryMissed={retryMissed} onNewQuiz={() => setPhase('settings')} />
      </div>
    )
  }

  if (phase === 'running' && quiz[index]) {
    const score = history.filter((h) => h.correct).length
    return (
      <div className="page">
        <QuizQuestion
          question={quiz[index]}
          number={index + 1}
          total={quiz.length}
          score={score}
          chosen={chosen}
          onAnswer={answer}
          onNext={next}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <QuizSettings
        scope={scope}
        mode={mode}
        count={count}
        max={max}
        onScope={setScope}
        onMode={setMode}
        onCount={setCount}
        onStart={() => start(scopedPool, count)}
        error={error}
      />
    </div>
  )
}
