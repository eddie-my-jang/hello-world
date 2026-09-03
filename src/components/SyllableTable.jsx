import { isSupported as canSpeak, speak } from '../lib/speech.js'

/** 결합한 글자 한 칸. 소리를 낼 수 있으면 눌러서 듣는다. */
function Cell({ cell, speakable }) {
  const body = (
    <>
      <div className="read__mark" lang="ar" dir="rtl">{cell.a}</div>
      <div className="read__ko">{cell.k}</div>
      <div className="read__ro">{cell.r}</div>
      <div className="read__name">{cell.name}</div>
    </>
  )
  return speakable ? (
    <button
      type="button"
      className="read read--tap"
      onClick={() => speak(cell.a, { rate: 0.7 })}
      title={`${cell.a} 듣기`}
    >
      {body}
    </button>
  ) : (
    <div className="read">{body}</div>
  )
}

/**
 * 자음과 부호가 결합한 글자의 발음표.
 * groups 를 주면 이름표를 단 여러 묶음으로, cells 만 주면 한 줄로 그린다.
 */
export default function SyllableTable({ groups, cells }) {
  const speakable = canSpeak()
  if (cells) {
    return (
      <div className="reads">
        {cells.map((cell) => <Cell key={cell.a} cell={cell} speakable={speakable} />)}
      </div>
    )
  }

  return (
    <div className="syls">
      {groups.map((group) => (
        <div className="syl" key={group.group}>
          <div className="syl__label">{group.group}</div>
          <div className="reads">
            {group.cells.map((cell) => <Cell key={cell.a} cell={cell} speakable={speakable} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
