import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReadingBoard from '../components/ReadingBoard.jsx'
import LetterCard from '../components/LetterCard.jsx'
import Controls from '../components/Controls.jsx'
import WordChips from '../components/WordChips.jsx'
import Uploader from '../components/Uploader.jsx'
import TextEditor from '../components/TextEditor.jsx'
import SamplePicker from '../components/SamplePicker.jsx'
import { readImage, readText } from '../lib/api.js'
import { downscaleImage } from '../lib/image.js'
import { canSpeakArabic, speak, watchVoices } from '../lib/speech.js'
import { SAMPLES } from '../lib/samples.js'

export default function ReaderPage() {
  const [result, setResult] = useState(SAMPLES[0])
  const [sampleIndex, setSampleIndex] = useState(0) // 고른 예문. 분석 결과를 받으면 -1
  const [wordIndex, setWordIndex] = useState(0)
  const [letterIndex, setLetterIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(800) // 글자 하나당 ms
  const [mode, setMode] = useState('sentence')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [speechReady, setSpeechReady] = useState(canSpeakArabic())

  const words = result.w
  const word = words[wordIndex] || null
  const letters = word?.l || []
  const letter = letters[letterIndex] || null

  const isLastLetter = letterIndex >= letters.length - 1
  const isLastWord = wordIndex >= words.length - 1
  const atEnd = isLastLetter && (mode === 'word' || isLastWord)

  useEffect(() => watchVoices(setSpeechReady), [])

  // ── 자동 재생 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !letters.length) return

    const id = setTimeout(() => {
      if (!isLastLetter) {
        setLetterIndex((i) => i + 1)
      } else if (mode === 'sentence' && !isLastWord) {
        setWordIndex((i) => i + 1)
        setLetterIndex(0)
      } else {
        setPlaying(false)
      }
    }, speed)

    return () => clearTimeout(id)
  }, [playing, speed, mode, letters.length, isLastLetter, isLastWord, wordIndex, letterIndex])

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

  const togglePlay = useCallback(() => {
    setPlaying((was) => {
      if (was) return false
      // 끝에서 다시 누르면 처음부터
      if (atEnd) {
        if (mode === 'sentence') setWordIndex(0)
        setLetterIndex(0)
      }
      return true
    })
  }, [atEnd, mode])

  const pickSample = useCallback((i) => {
    setResult(SAMPLES[i])
    setSampleIndex(i)
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
    setSampleIndex(-1)
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

  const sentence = useMemo(() => words.map((w) => w.a).join(' '), [words])

  return (
    <div className="page">
      <section className="panel">
        <Uploader onPick={handlePick} busy={busy} preview={preview} />
        {busy && <p className="status">사진을 읽고 하라카트를 붙이는 중… (10초쯤 걸립니다)</p>}
        {error && <p className="status status--error">{error}</p>}
      </section>

      <section className="panel">
        <span className="editor__label">예문</span>
        <SamplePicker samples={SAMPLES} index={sampleIndex} onSelect={pickSample} />
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
              mode={mode}
              onModeChange={setMode}
              canSpeak={speechReady}
              onSpeak={() => speak(word.a)}
            />

            <WordChips words={words} wordIndex={wordIndex} onSelect={selectWord} />
          </section>

          <section className="panel">
            <TextEditor value={sentence} onSubmit={handleText} busy={busy} />
          </section>
        </>
      )}
    </div>
  )
}
