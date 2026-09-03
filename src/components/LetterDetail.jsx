import { letterConnectsForward, letterForms } from '../lib/arabic.js'
import { isSupported as canSpeak, speak } from '../lib/speech.js'
import { syllablesFor } from '../lib/syllables.js'
import SyllableTable from './SyllableTable.jsx'

const FORM_LABELS = [
  ['alone', '홀로'],
  ['init', '첫'],
  ['mid', '가운데'],
  ['fin', '끝'],
]

/** 격자에서 펼쳐지는 글자 상세 — 네 가지 모양과, 부호가 붙은 모든 짝의 발음 */
export default function LetterDetail({ letter }) {
  const forms = letterForms(letter.a)
  const speakable = canSpeak()
  const syllables = syllablesFor(letter.a)

  return (
    <div className="detail">
      <div className="detail__top">
        <span className="detail__ar" lang="ar">{letter.a}</span>
        <span className="detail__name">{letter.name}</span>
        <span className="detail__ro">{letter.ro}</span>
      </div>

      <div className="forms">
        {FORM_LABELS.map(([key, label]) => (
          <div className="form" key={key}>
            <div className="form__label">{label}</div>
            {forms[key] ? (
              <div className="form__ar" lang="ar">{forms[key]}</div>
            ) : (
              <div className="form__ar is-none">없음</div>
            )}
          </div>
        ))}
      </div>

      {!letterConnectsForward(letter.a) && (
        <p className="detail__note">
          뒤 글자로 이어지지 않습니다. 그래서 첫·가운데 모양이 없고, 이 글자 다음에 오는 글자는
          단어 중간이라도 새로 시작하는 모양이 됩니다.
        </p>
      )}

      <SyllableTable groups={syllables} />

      {letter.note && <p className="detail__note">{letter.note}</p>}

      {letter.ex && (
        <div className="detail__ex">
          <span className="w" lang="ar">{letter.ex.a}</span>
          <span className="k">{letter.ex.k}</span>
          <span className="m">{letter.ex.m}</span>
          {speakable && (
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => speak(letter.ex.a)}
              title={`${letter.ex.a} 듣기`}
            >
              🔊 듣기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
