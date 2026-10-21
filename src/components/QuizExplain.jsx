import ReadingBoard from './ReadingBoard.jsx'
import LetterDetail from './LetterDetail.jsx'
import { isSupported as canSpeak, speak } from '../lib/speech.js'

/** 답을 고른 뒤 보여 주는 풀이 — 글자는 자모표 상세를, 낱말·문장은 낱말마다 읽기판 + 뜻을 */
export default function QuizExplain({ item }) {
  if (item.kind === 'letter') return <LetterDetail letter={item.letter} />

  const sample = item.sample
  const speakable = canSpeak()

  return (
    <div className="quiz-explain">
      {sample.t && <p className="meaning meaning--all">{sample.t}</p>}
      <div className="quiz-explain__words">
        {sample.w.map((word, i) => (
          <div className="quiz-explain__word" key={i}>
            {/* letterIndex 를 글자 수만큼 줘서 전부 「다 읽음」 색으로 보여 준다 — 되짚는 게 아니라 결과를 보여 주는 자리라 글자 짚기는 필요 없다 */}
            <ReadingBoard word={word} letterIndex={word.l.length} onSelectLetter={() => {}} />
            <div className="word-meta">
              <span className="word-meta__kr">{word.k}</span>
              <span className="word-meta__ro">{word.r}</span>
              {word.m && <span className="word-meta__m">{word.m}</span>}
            </div>
          </div>
        ))}
      </div>
      {speakable && (
        <button type="button" className="btn btn--quiet" onClick={() => speak(item.arabic)}>
          🔊 듣기
        </button>
      )}
    </div>
  )
}
