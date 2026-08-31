// 서비스 워커. 한 번 열어 본 뒤에는 비행기 모드에서도 앱이 뜬다.
//
// 자모표·예문 36개·부호대로 읽기는 전부 브라우저 안에서 도는 일이라
// 인터넷 없이 그대로 동작한다. 사진 분석(/api/read)만 서버가 필요하고,
// 그건 캐시하지 않는다 — 오래된 응답을 돌려주면 안 되고, 애초에
// 오프라인에서는 할 수 없는 일이다.

const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`
const FONTS = `fonts-${VERSION}`
const KEEP = [SHELL, ASSETS, FONTS]

// 빌드마다 이름이 바뀌는 파일들(dist/assets/*)은 여기 적을 수 없다.
// 처음 방문할 때 fetch 쪽에서 하나씩 담는다.
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
]

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

/** 받아 온 응답이 담아 둘 만한 것인가 */
function cacheable(response) {
  return response && response.status === 200 && response.type !== 'opaqueredirect'
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (cacheable(response)) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

/** 새 배포를 놓치지 않도록 껍데기는 네트워크를 먼저 본다 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (cacheable(response)) {
      const cache = await caches.open(SHELL)
      cache.put('/', response.clone())
    }
    return response
  } catch (err) {
    const cached = await caches.match('/')
    if (cached) return cached
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 사진 분석은 언제나 서버로. 캐시하지 않는다.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return

  // 페이지 이동 — SPA 라 언제나 '/' 껍데기를 돌려주면 된다
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.origin === self.location.origin) {
    // 빌드 산출물은 이름에 해시가 붙어 있어 캐시가 낡을 일이 없다
    event.respondWith(cacheFirst(request, ASSETS))
    return
  }

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FONTS))
  }
})
