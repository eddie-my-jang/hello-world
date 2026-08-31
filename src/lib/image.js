// 업로드 전 이미지 축소. 토큰과 지연을 줄이는 가장 큰 한 방이다.
// 원본 4000px 사진을 그대로 보내면 비용도 응답 시간도 몇 배가 된다.

const MAX_SIZE = 1000
const QUALITY = 0.8

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // 휴대폰 사진의 EXIF 회전 정보를 반영한다
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // 일부 브라우저는 옵션을 모른다 — 옵션 없이 재시도
      try {
        return await createImageBitmap(file)
      } catch {
        /* 아래 <img> 경로로 넘어간다 */
      }
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * 파일을 긴 변 기준 최대 1000px, JPEG 품질 0.8 로 줄인다.
 * @returns {Promise<{data: string, mediaType: string, previewUrl: string, width: number, height: number}>}
 *          data 는 base64 본문 (data: URL 접두사 없음)
 */
export async function downscaleImage(file, { maxSize = MAX_SIZE, quality = QUALITY } = {}) {
  const source = await loadBitmap(file)
  const sw = source.width
  const sh = source.height
  if (!sw || !sh) throw new Error('이미지 크기를 알 수 없습니다.')

  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const width = Math.max(1, Math.round(sw * scale))
  const height = Math.max(1, Math.round(sh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // 투명 PNG 가 JPEG 에서 검게 나오지 않도록
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)
  if (typeof source.close === 'function') source.close()

  const previewUrl = canvas.toDataURL('image/jpeg', quality)
  return {
    data: previewUrl.slice(previewUrl.indexOf(',') + 1),
    mediaType: 'image/jpeg',
    previewUrl,
    width,
    height,
  }
}
