import { useEffect, useRef, useState } from 'react'
import LetterTile from '../components/LetterTile.jsx'
import LetterDetail from '../components/LetterDetail.jsx'
import ItemCard from '../components/ItemCard.jsx'
import SyllableTable from '../components/SyllableTable.jsx'
import { LETTERS, FAMILIES, MARKS, LONGS, EXTRAS } from '../lib/letters.js'
import { syllablesOfExtra } from '../lib/syllables.js'

/** 격자가 지금 몇 열인지 잰다. 펼친 카드를 그 줄 끝에 넣어야 구멍이 안 생긴다. */
function useColumnCount(ref) {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const measure = () => {
      const template = getComputedStyle(node).gridTemplateColumns
      setColumns(template.split(' ').filter(Boolean).length || 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return columns
}

function LetterGrid({ letters, open, onToggle }) {
  const ref = useRef(null)
  const columns = useColumnCount(ref)

  const openIndex = letters.findIndex((letter) => letter.a === open)
  // 펼친 글자가 속한 줄의 끝
  const insertAt = openIndex < 0
    ? -1
    : Math.min(letters.length, (Math.floor(openIndex / columns) + 1) * columns)

  const children = []
  letters.forEach((letter, i) => {
    children.push(
      <LetterTile key={`t-${letter.a}`} letter={letter} open={letter.a === open} onToggle={onToggle} />,
    )
    if (i + 1 === insertAt) {
      children.push(<LetterDetail key={`d-${letters[openIndex].a}`} letter={letters[openIndex]} />)
    }
  })

  return <div className="grid" ref={ref}>{children}</div>
}

const LEDE = {
  order: '아랍어 사전과 자모표가 쓰는 차례입니다. 익숙해질 때까지는 이 순서를 외워 두면 편합니다.',
  shape: '뼈대가 같아 점으로만 갈라지는 글자끼리 묶었습니다. 초심자가 실제로 헷갈리는 지점은 순서가 아니라 여기입니다.',
}

export default function LettersPage() {
  const [view, setView] = useState('order')
  const [open, setOpen] = useState(null)

  const toggle = (ch) => setOpen((was) => (was === ch ? null : ch))
  const byChar = (ch) => LETTERS.find((letter) => letter.a === ch)

  return (
    <div className="page">
      <section className="section">
        <div className="section__head">
          <h2>자음 28자</h2>
          <span>눌러서 결합표 보기</span>
        </div>

        <div className="segmented" role="group" aria-label="정렬 방식">
          <button
            type="button"
            className={`segmented__btn${view === 'order' ? ' is-active' : ''}`}
            onClick={() => setView('order')}
          >
            순서대로
          </button>
          <button
            type="button"
            className={`segmented__btn${view === 'shape' ? ' is-active' : ''}`}
            onClick={() => setView('shape')}
          >
            모양끼리
          </button>
        </div>

        <p className="lede">{LEDE[view]}</p>

        <p className="legend">
          <span className="legend__dot" />
          <span>
            이 표시가 붙은 글자는 <b>뒤 글자로 이어지지 않습니다.</b> 그래서 첫·가운데 모양이 없고,
            바로 다음 글자는 단어 중간이라도 새로 시작하는 모양이 됩니다.
          </span>
        </p>

        {view === 'order' ? (
          <LetterGrid letters={LETTERS} open={open} onToggle={toggle} />
        ) : (
          <div className="families">
            {FAMILIES.map((family) => (
              <div className="family" key={family.title}>
                <div className="family__head">
                  <span className="family__title" lang="ar" dir="rtl">{family.title}</span>
                  <span className="family__hint">{family.hint}</span>
                </div>
                <LetterGrid letters={family.of.map(byChar).filter(Boolean)} open={open} onToggle={toggle} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>모음 부호</h2>
          <span>하라카트</span>
        </div>

        <p className="note">
          아랍어는 이 부호들을 <b>거의 쓰지 않습니다.</b> 어린이책·꾸란·교재에만 붙고 신문이나 간판에는
          없습니다. 그래서 <span className="inline-ar" lang="ar">كتب</span> 하나가 kataba(그가 썼다)·
          kutiba(쓰여졌다)·kutub(책들) 중 무엇인지는 문맥으로 가려내야 합니다.
        </p>

        <div className="items">
          {MARKS.map((mark) => (
            <ItemCard
              key={mark.name}
              glyph={mark.m}
              name={mark.name}
              sound={mark.ko}
              ex={{ a: mark.ex, k: mark.exk }}
              note={mark.note}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>장모음과 이중모음</h2>
          <span>부호 + 글자</span>
        </div>

        <p className="lede">
          단모음 뒤에 짝이 되는 글자가 오면 소리가 길어집니다. 이 글자들은 자음이 아니라 앞 모음을
          늘이는 역할만 하므로, 읽기판에서 한글 자리에 <b className="mark-long">―</b> 로 표시됩니다.
        </p>

        <p className="note">
          자음 스물여덟 자마다 이 짝들을 다 붙여 본 표가 있습니다 — <b>위 격자에서 글자를 누르면</b>
          짧은 소리·길게 늘인 소리·미끄러지는 소리·탄윈·샷다까지 열다섯 칸이 펼쳐지고,
          칸을 누르면 그 소리를 들려줍니다.
        </p>

        <div className="items">
          {LONGS.map((long) => (
            <ItemCard
              key={long.form}
              glyph={long.form}
              name={long.ko}
              sound={long.how}
              ex={{ a: long.ex, k: long.exk, m: long.m }}
            />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>그밖의 글자</h2>
          <span>28자에는 들어가지 않지만 자주 만납니다</span>
        </div>

        <div className="items">
          {EXTRAS.map((extra) => (
            <ItemCard
              key={extra.name}
              glyph={extra.a}
              ink
              wide={extra.wide}
              name={extra.name}
              ex={extra.ex}
              note={extra.note}
            >
              <SyllableTable cells={syllablesOfExtra(extra.a)} />
            </ItemCard>
          ))}
        </div>
      </section>

      <p className="footnote">
        네 가지 모양은 미리 그려 둔 그림이 아니라, 글자 앞뒤에 ZWJ(U+200D)를 붙여 브라우저가 그
        자리에 맞는 모양을 고르게 한 것입니다 — 읽기판이 쓰는 방법과 같습니다. 한글 표기는 아랍어에
        없는 소리를 억지로 옮긴 근사치라, 특히 ح خ ع غ ق 와 강세 글자(ص ض ط ظ)는 설명을 함께 읽어
        주세요.
      </p>
    </div>
  )
}
