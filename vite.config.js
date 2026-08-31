import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 서버에서 /api/read 를 서버리스 함수와 똑같이 띄워 주는 플러그인.
// 배포하면 같은 파일(api/read.js)이 Vercel 서버리스 함수로 그대로 실행된다.
function apiDevServer(env) {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      // 키는 서버 쪽 process.env 에만 넣는다. 클라이언트 번들로는 절대 나가지 않는다.
      for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL', 'READ_RATE_LIMIT', 'READ_RATE_WINDOW_MS']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }

      server.middlewares.use('/api/read', async (req, res, next) => {
        try {
          // ssrLoadModule 로 불러오면 api/read.js 를 고쳐도 서버 재시작 없이 반영된다.
          const mod = await server.ssrLoadModule('/api/read.js')
          await mod.default(req, res)
        } catch (err) {
          server.config.logger.error(`[api/read] ${err?.stack || err}`)
          next(err)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // 세 번째 인자를 '' 로 주면 VITE_ 접두사가 없는 변수까지 읽는다.
  // 읽기만 할 뿐 define 으로 노출하지 않으므로 번들에는 들어가지 않는다.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiDevServer(env)],
  }
})
