/**
 * 부호 없이 입력한 낱말 가운데 읽기가 여럿인 것들.
 * 없는 답을 지어내지 않고 고르게 한다 — كتب 는 kataba 일 수도 kutub 일 수도 있다.
 */
export default function DictPicks({ picks, choices, onChoose }) {
  if (!picks.length) return null

  return (
    <div className="picks">
      <p className="picks__lead">
        부호가 없어 읽기가 갈리는 낱말이 있습니다. 눌러서 고르세요.
      </p>
      {picks.map((pick) => (
        <div className="pick" key={pick.index}>
          <span className="pick__bare" lang="ar" dir="rtl">{pick.bare}</span>
          <div className="pick__options">
            {pick.candidates.map((candidate) => {
              const active = (choices[pick.index] || pick.chosen) === candidate.a
              return (
                <button
                  key={candidate.a}
                  type="button"
                  className={`pick__option${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onChoose(pick.index, candidate.a)}
                >
                  <span className="pick__ar" lang="ar" dir="rtl">{candidate.a}</span>
                  <span className="pick__ko">{candidate.k}</span>
                  {candidate.m && <span className="pick__m">{candidate.m}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
