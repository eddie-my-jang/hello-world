// 데모 페이지의 서비스 워커.
//
// 데모는 파일 하나로 다 도는 정적 페이지라 서버가 필요 없다.
// 그래서 처음 한 번만 열어 두면 그 뒤로는 비행기 모드에서도 그대로 열린다.
//
// 경로를 전부 상대로 쓴다 — GitHub Pages 는 /<저장소이름>/ 아래에 붙기 때문에
// 절대 경로로 적으면 도메인 루트를 찾다가 실패한다.

const VERSION = 'v1'
const SHELL = `demo-shell-${VERSION}`
const FONTS = `demo-fonts-${VERSION}`
const KEEP = [SHELL, FONTS]

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
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

function cacheable(response) {
  return response && response.status === 200
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

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // 페이지를 열 때는 새 배포를 먼저 보고, 안 되면 담아 둔 것으로
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable(response)) {
            caches.open(SHELL).then((cache) => cache.put('./index.html', response.clone()))
          }
          return response
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./'))),
    )
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL))
    return
  }

  // 웹폰트는 처음 온라인에서 열 때 담아 둔다.
  // 못 받아 와도 글꼴 대체 목록이 있어 아랍어는 그려진다.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FONTS))
  }
})
