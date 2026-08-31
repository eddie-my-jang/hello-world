import { letterConnectsForward } from '../lib/arabic.js'

/** 자모표 격자의 글자 한 칸 */
export default function LetterTile({ letter, open, onToggle }) {
  return (
    <button
      type="button"
      className="tile"
      aria-expanded={open}
      onClick={() => onToggle(letter.a)}
    >
      <span className="tile__ar" lang="ar">{letter.a}</span>
      <span className="tile__name">{letter.name}</span>
      <span className="tile__ro">{letter.ro}</span>
      {!letterConnectsForward(letter.a) && (
        <span className="tile__stop" title="뒤로 이어지지 않는 글자" />
      )}
    </button>
  )
}
