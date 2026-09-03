import { FONTS } from '../lib/font.js'

/** 아랍어 글꼴 고르기. 세 페이지가 같이 쓴다. */
export default function FontPicker({ font, onChange }) {
  return (
    <div className="fonts" role="group" aria-label="아랍어 글꼴">
      <span className="fonts__label">글꼴</span>
      {FONTS.map(([name, label, hint]) => (
        <button
          key={name}
          type="button"
          className={`fonts__btn${font === name ? ' is-active' : ''}`}
          aria-pressed={font === name}
          aria-label={label}
          title={hint}
          onClick={() => onChange(name)}
        >
          <span className="fonts__ar" lang="ar" dir="rtl" style={{ fontFamily: `var(--f-ar-${name})` }}>
            عَرَبِي
          </span>
          <span className="fonts__name">{label}</span>
        </button>
      ))}
    </div>
  )
}
