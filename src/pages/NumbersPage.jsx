import { isSupported as canSpeak, primeFromUserGesture, speak } from '../lib/speech.js'
import {
  BIG, COMPOSED, DIGITS, HUNDREDS, ONES, PLACES, TEENS, TENS, toArabicDigits,
} from '../lib/numbers.js'

/** 숫자 한 줄. 소리를 낼 수 있으면 눌러서 듣는다. */
function NumberRow({ row, speakable }) {
  const body = (
    <>
      {/* 십만·백만은 자릿수가 길어 한 줄에 안 들어간다. 그때만 작게 그린다. */}
      <span className={`num__d${String(row.v).length >= 6 ? ' num__d--long' : ''}`}>
        <b lang="ar">{toArabicDigits(row.v)}</b>
        <i>{row.v.toLocaleString('ko')}</i>
      </span>
      <span className="num__body">
        <span className="num__ar" lang="ar" dir="rtl">{row.a}</span>
        <span className="num__say">
          <b>{row.k}</b>
          <i>{row.r}</i>
        </span>
        {row.note && <span className="num__note">{row.note}</span>}
      </span>
    </>
  )

  return speakable ? (
    <button
      type="button"
      className="num num--tap"
      onClick={() => {
        primeFromUserGesture()
        speak(row.a)
      }}
      title={`${row.a} 듣기`}
    >
      {body}
    </button>
  ) : (
    <div className="num">{body}</div>
  )
}

function NumberList({ rows, speakable }) {
  return (
    <div className="nums">
      {rows.map((row) => <NumberRow key={row.v} row={row} speakable={speakable} />)}
    </div>
  )
}

export default function NumbersPage() {
  const speakable = canSpeak()

  return (
    <div className="page">
      <section className="section">
        <div className="section__head">
          <h2>숫자 글자</h2>
          <span lang="ar">٠١٢٣٤٥٦٧٨٩</span>
        </div>

        <p className="note">
          아랍어에서 <b>숫자는 왼쪽에서 오른쪽으로 씁니다.</b> 글은 오른쪽부터 읽지만 숫자만은
          우리와 같은 방향입니다. <span className="inline-ar" lang="ar">١٩٩٥</span> 는 거꾸로가 아니라
          그대로 1995 입니다.
        </p>

        <div className="digits">
          {DIGITS.map((digit) => (
            <div className="digit" key={digit.v}>
              <span className="digit__ar" lang="ar">{toArabicDigits(digit.v)}</span>
              <span className="digit__n">{digit.v}</span>
              <span className="digit__ko">{digit.k}</span>
            </div>
          ))}
        </div>

        <p className="lede">
          아랍어는 <span className="inline-ar" lang="ar">٠١٢٣</span> 을 「인도 숫자」,
          우리가 쓰는 <b>0123</b> 을 「아랍 숫자」라고 부릅니다. 이집트 동쪽에서는 앞의 것을,
          모로코·튀니지 쪽에서는 뒤의 것을 씁니다. 어느 쪽을 쓰든 읽는 말은 같습니다.
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>하나에서 열까지</h2>
          <span>{speakable ? '눌러서 듣기' : '기본 꼴'}</span>
        </div>

        <p className="note">
          3부터 10까지는 뒤에 오는 낱말의 성에 따라 <span className="inline-ar" lang="ar">ة</span> 가
          붙기도 떨어지기도 합니다. 여기 실은 것은 <b>수를 셀 때 그냥 부르는 꼴</b>입니다 —
          전화번호·가격·나이를 말할 때 쓰는 것이 이 꼴이라 먼저 익혀 두면 됩니다.
        </p>

        <NumberList rows={ONES} speakable={speakable} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>열하나에서 열아홉까지</h2>
          <span>+ عَشَرَ</span>
        </div>

        <p className="lede">
          낱개 숫자 뒤에 <span className="inline-ar" lang="ar">عَشَرَ</span>(열)를 덧붙입니다.
          우리말 「열셋」과 순서가 반대라고 보면 쉽습니다 — 「셋 열」입니다.
        </p>

        <NumberList rows={TEENS} speakable={speakable} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>십의 자리</h2>
          <span>낱개 + ـُون</span>
        </div>

        <p className="lede">
          낱개 숫자 끝에 <b>‑ūn</b> 을 붙이면 십의 자리가 됩니다. 셋
          <span className="inline-ar" lang="ar">ثَلَاثَة</span> → 서른
          <span className="inline-ar" lang="ar">ثَلَاثُون</span> 처럼 뼈대가 그대로 보이므로,
          낱개 열 개만 알면 여기는 거의 저절로 읽힙니다.
        </p>

        <NumberList rows={TENS} speakable={speakable} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>백의 자리</h2>
          <span>낱개 + مِئَة</span>
        </div>

        <p className="lede">
          백은 <span className="inline-ar" lang="ar">مِئَة</span> 입니다. 삼백부터는 낱개 숫자와
          한 낱말로 붙여 씁니다 — 사이를 띄우지 않습니다.
        </p>

        <NumberList rows={HUNDREDS} speakable={speakable} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>천의 자리와 그 위</h2>
          <span>أَلْف</span>
        </div>

        <NumberList rows={BIG} speakable={speakable} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>자리를 이어 붙이기</h2>
          <span>큰 자리부터, 끝에서 뒤집힌다</span>
        </div>

        <div className="places">
          {PLACES.map((place) => (
            <div className="place" key={place.name}>
              <span className="place__name">{place.name}</span>
              <span className="place__ar" lang="ar" dir="rtl">{place.a}</span>
              <span className="place__ko">{place.k}</span>
            </div>
          ))}
        </div>

        <p className="note">
          자리는 큰 것부터 놓고 <span className="inline-ar" lang="ar">وَ</span>(그리고)로 잇습니다.
          다만 <b>21부터 99까지는 일의 자리를 십의 자리보다 먼저</b> 읽습니다 — 「스물다섯」이 아니라
          「다섯 그리고 스물」입니다. 독일어 fünfundzwanzig 와 같은 방식입니다.
        </p>

        <NumberList rows={COMPOSED} speakable={speakable} />
      </section>

      <p className="footnote">
        여기 실은 숫자는 읽기판 예문에도 들어 있습니다. 예문에서 <b>숫자</b>를 고르면 글자 하나씩
        짚어 가며 읽을 수 있고, 직접 입력한 글에서도 앱이 이 낱말들을 알아봅니다. 한글 표기는
        근사치입니다 — <span className="inline-ar" lang="ar">خ</span> 를 「ㅋ」로,
        <span className="inline-ar" lang="ar"> ث</span> 를 「ㅅ」로 적은 것은 자모표와 같은 기준입니다.
      </p>
    </div>
  )
}
