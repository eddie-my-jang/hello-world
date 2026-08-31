import { useRef } from 'react'

/** 사진 업로드. 모바일에서는 카메라가 바로 열리는 버튼도 함께 준다. */
export default function Uploader({ onPick, busy, preview }) {
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)

  const handle = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 change 가 뜨도록
    if (file) onPick(file)
  }

  return (
    <div className="uploader">
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handle} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handle} />

      <div className="uploader__buttons">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => galleryRef.current?.click()}>
          🖼 사진 고르기
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => cameraRef.current?.click()}>
          📷 카메라
        </button>
      </div>

      {preview && (
        <img className="uploader__preview" src={preview} alt="분석한 사진" />
      )}
    </div>
  )
}
