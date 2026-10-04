// 로컬 개발 서버. Vercel 없이 api/speak.js 를 그대로 띄운다.
//
//   node --env-file=.env.local scripts/dev.mjs     # http://localhost:3000/api/speak
import { createServer } from 'node:http'
import speak from '../api/speak.js'

const PORT = Number(process.env.PORT || 3000)

createServer((req, res) => {
  if (new URL(req.url, 'http://localhost').pathname === '/api/speak') return speak(req, res)
  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: '없는 경로입니다. POST /api/speak 를 쓰세요.' }))
}).listen(PORT, () => console.log(`http://localhost:${PORT}/api/speak`))
