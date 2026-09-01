import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReadingBoard from '../components/ReadingBoard.jsx'
import LetterCard from '../components/LetterCard.jsx'
import Controls from '../components/Controls.jsx'
import WordChips from '../components/WordChips.jsx'
import Uploader from '../components/Uploader.jsx'
import TextEditor from '../components/TextEditor.jsx'
import SamplePicker from '../components/SamplePicker.jsx'
import { readImage, readText } from '../lib/api.js'
import { readText as transliterate } from '../lib/transliterate.js'
import { downscaleImage } from '../lib/image.js'
import { isSilentPiece, isSupported as canSpeak, primeFromUserGesture, speak, stop as stopSpeech } from '../lib/speech.js'
import { SAMPLES } from '../lib/samples.js'

export default function ReaderPage() {
  const [result, setResult] = useState(SAMPLES[0])
  const [kind, setKind] = useState('낱말') // 예문 갈래
  const [sampleTag, setSampleTag] = useState(SAMPLES[0].tag) // 고른 예문. 분석 결과를 받으면 null
  const [wordIndex, setWordIndex] = useState(0)
  const [letterIndex, setLetterIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(800) // 글자 하나당 ms
  const [unit, setUnit] = useState('letter') // 발음 단위: letter | word | sentence
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [sound, setSound] = useState(false) // 재생하면서 소리 낼지
  const speechAvailable = canSpeak()

  const words = result.w
  const word = words[wordIndex] || null
  const letters = word?.l || []
  const letter = letters[letterIndex] || null

  const isLastLetter = letterIndex >= letters.length - 1
  const isLastWord = wordIndex >= words.length - 1
  const atEnd = isLastLetter && isLastWord

  // ── 소리 ───────────────────────────────────────────────────────────────────
  // 고른 단위만 읽는다. 글자를 골랐으면 낱말이나 문장은 읽지 않는다.

  // 글자: 짚을 때마다. 장모음·묵음은 혼자서는 소리가 없어 건너뛴다.
  useEffect(() => {
    if (!sound || unit !== 'letter' || !letter || isSilentPiece(letter)) return
    speak(letter.a, { rate: 0.75 })
  }, [sound, unit, letter])

  // 낱말: 낱말이 바뀔 때 한 번
  useEffect(() => {
    if (!sound || unit !== 'word' || !word) return
    speak(word.a)
  }, [sound, unit, word])

  // ── 자동 재생 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !letters.length) return

    const id = setTimeout(() => {
      if (!isLastLetter) {
        setLetterIndex((i) => i + 1)
      } else if (!isLastWord) {
        setWordIndex((i) => i + 1)
        setLetterIndex(0)
      } else {
        setPlaying(false)
      }
    }, speed)

    return () => clearTimeout(id)
  }, [playing, speed, letters.length, isLastLetter, isLastWord, wordIndex, letterIndex])

  // ── 이동 ───────────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!isLastLetter) setLetterIndex((i) => i + 1)
    else if (!isLastWord) {
      setWordIndex((i) => i + 1)
      setLetterIndex(0)
    }
  }, [isLastLetter, isLastWord])

  const goPrev = useCallback(() => {
    if (letterIndex > 0) setLetterIndex((i) => i - 1)
    else if (wordIndex > 0) {
      const prev = wordIndex - 1
      setWordIndex(prev)
      setLetterIndex(Math.max(0, (words[prev]?.l.length || 1) - 1))
    }
  }, [letterIndex, wordIndex, words])

  const visibleSamples = useMemo(() => SAMPLES.filter((sample) => sample.kind === kind), [kind])
  const kinds = useMemo(() => {
    const counts = new Map()
    SAMPLES.forEach((sample) => counts.set(sample.kind, (counts.get(sample.kind) || 0) + 1))
    return [...counts.entries()]
  }, [])

  const sentence = useMemo(() => words.map((w) => w.a).join(' '), [words])

  /** 지금 고른 단위로 읽어 준다 */
  const speakUnit = useCallback(() => {
    if (unit === 'sentence') return speak(sentence)
    if (unit === 'word') return word && speak(word.a)
    if (letter && !isSilentPiece(letter)) return speak(letter.a, { rate: 0.75 })
    return false
  }, [unit, sentence, word, letter])

  const togglePlay = useCallback(() => {
    primeFromUserGesture() // iOS: 사람이 누른 이 자리에서 한 번 깨워 둔다
    setPlaying((was) => {
      if (was) {
        stopSpeech()
        return false
      }
      // 끝에서 다시 누르면 처음부터
      if (atEnd) {
        setWordIndex(0)
        setLetterIndex(0)
      }
      // 시작할 때 지금 단위를 한 번 읽어 준다. 그 뒤로는 위의 효과들이
      // 글자·낱말이 바뀔 때마다 이어서 읽는다.
      // 문장은 자리와 무관하므로 언제나 읽고, 글자·낱말은 끝에서 되감는
      // 경우만 건너뛴다 — 되감으면 효과가 알아서 새 자리를 읽는다.
      if (sound) {
        if (unit === 'sentence') speak(sentence)
        else if (!atEnd) speakUnit()
      }
      return true
    })
  }, [atEnd, sound, unit, sentence, speakUnit])

  const pickSample = useCallback((tag) => {
    const found = SAMPLES.find((sample) => sample.tag === tag)
    if (!found) return
    setResult(found)
    setSampleTag(tag)
    setWordIndex(0)
    setLetterIndex(0)
    setPlaying(false)
    setError('')
  }, [])

  const selectWord = useCallback((i) => {
    setWordIndex(i)
    setLetterIndex(0)
  }, [])

  // 키보드: ← → 이동, 스페이스 재생/멈춤
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft') goNext() // RTL: 왼쪽이 다음 글자
      else if (e.key === 'ArrowRight') goPrev()
      else if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, togglePlay])

  // ── 분석 ───────────────────────────────────────────────────────────────────
  const applyResult = (data) => {
    if (!data.w.length) {
      setError('아랍어를 찾지 못했습니다. 글자가 더 또렷한 사진을 쓰거나 원문을 직접 입력해 보세요.')
      return
    }
    setResult(data)
    setSampleTag(null)
    setWordIndex(0)
    setLetterIndex(0)
    setPlaying(false)
    setError('')
  }

  const runningRef = useRef(false)
  const run = async (task) => {
    if (runningRef.current) return
    runningRef.current = true
    setBusy(true)
    setError('')
    try {
      applyResult(await task())
    } catch (err) {
      setError(err.message || '분석에 실패했습니다.')
    } finally {
      runningRef.current = false
      setBusy(false)
    }
  }

  const handlePick = (file) =>
    run(async () => {
      const image = await downscaleImage(file)
      setPreview(image.previewUrl)
      return readImage(image)
    })

  const handleText = (text) =>
    run(async () => {
      setPreview(null)
      return readText(text)
    })

  /** 서버를 거치지 않고, 붙어 있는 부호대로만 읽는다 */
  const handleLocalRead = (text) => {
    const out = transliterate(text)
    if (!out.w.length) {
      setError('아랍어를 찾지 못했습니다.')
      return
    }
    setPreview(null)
    setResult({
      t: out.unknown
        ? `붙어 있는 부호대로만 읽었습니다. 모음을 알 수 없는 자리가 ${out.unknown}곳 있습니다.`
        : '붙어 있는 부호대로 읽었습니다.',
      w: out.w,
    })
    setSampleTag(null)
    setWordIndex(0)
    setLetterIndex(0)
    setPlaying(false)
    setError('')
  }

  return (
    <div className="page">
      <section className="panel">
        <Uploader onPick={handlePick} busy={busy} preview={preview} />
        {busy && <p className="status">사진을 읽고 하라카트를 붙이는 중… (10초쯤 걸립니다)</p>}
        {error && <p className="status status--error">{error}</p>}
      </section>

      <section className="panel">
        <span className="editor__label">예문</span>
        <SamplePicker
          samples={visibleSamples}
          activeTag={sampleTag}
          onSelect={pickSample}
          kind={kind}
          kinds={kinds}
          onKindChange={setKind}
        />
      </section>

      {word && (
        <>
          <section className="panel panel--reader">
            {result.t && <p className="meaning meaning--all">{result.t}</p>}

            <ReadingBoard word={word} letterIndex={letterIndex} onSelectLetter={setLetterIndex} />

            <div className="word-meta">
              <span className="word-meta__kr">{word.k}</span>
              <span className="word-meta__ro">{word.r}</span>
              {word.m && <span className="word-meta__m">{word.m}</span>}
            </div>

            <LetterCard letter={letter} index={letterIndex} total={letters.length} />

            <Controls
              playing={playing}
              onTogglePlay={togglePlay}
              onPrev={goPrev}
              onNext={goNext}
              canPrev={letterIndex > 0 || wordIndex > 0}
              canNext={!isLastLetter || !isLastWord}
              speed={speed}
              onSpeedChange={setSpeed}
              unit={unit}
              onUnitChange={(next) => {
                setUnit(next)
                stopSpeech()
              }}
              canSpeak={speechAvailable}
              onSpeak={speakUnit}
              sound={sound}
              onSoundChange={(next) => {
                setSound(next)
                if (!next) stopSpeech()
                else primeFromUserGesture()
              }}
            />

            <WordChips words={words} wordIndex={wordIndex} onSelect={selectWord} />
          </section>

          <section className="panel">
            <TextEditor
              value={sentence}
              onAnalyze={handleText}
              onReadLocal={handleLocalRead}
              busy={busy}
            />
          </section>
        </>
      )}
    </div>
  )
}
