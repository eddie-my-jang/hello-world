# 내 목소리 API (voice-api)

텍스트를 보내면 **내 목소리로 읽은 mp3** 를 돌려주는 API 입니다. 한국어·영어를 읽습니다.

```
POST /api/speak
Authorization: Bearer <VOICE_API_TOKEN>
{ "text": "안녕하세요. Nice to meet you." }
→ 200 audio/mpeg
```

옆의 아랍어 읽기 앱과는 별개의 Vercel 프로젝트입니다. 같은 저장소에 있을 뿐 코드를 나누지 않고,
의존성도 없습니다(Node 내장 `fetch` 만 씀).

## 왜 ElevenLabs 인가

Claude API 는 글과 이미지를 다루고 음성 합성·목소리 복제 기능이 없습니다. 그래서 목소리는
**ElevenLabs** 의 즉석 목소리 복제(Instant Voice Cloning)로 만듭니다.

- 1~몇 분 분량 녹음이면 복제가 되고, 한국어와 영어를 같은 목소리로 읽습니다.
- REST 호출 하나라서 Vercel 서버리스 함수에서 그대로 부를 수 있습니다(GPU 서버가 필요 없음).

엔진을 바꾸고 싶으면 `lib/elevenlabs.js` 의 `synthesize` 만 갈아 끼우면 됩니다.

---

## 처음 한 번: 내 목소리 만들기

1. **녹음.** 조용한 곳에서 1~3분 정도, 평소 말투로 한국어와 영어를 섞어 읽습니다.
   mp3/wav/m4a 파일 여러 개로 나눠도 됩니다. 잡음·음악·다른 사람 목소리가 없을수록 좋습니다.
2. **키 준비.**
   ```bash
   cd voice-api
   cp .env.example .env.local
   ```
   ElevenLabs 대시보드에서 API 키를 만들어 `ELEVENLABS_API_KEY` 에 넣습니다.
   목소리 복제는 ElevenLabs 유료 요금제(Starter 이상)에서 열립니다.
3. **복제.**
   ```bash
   npm run clone -- "내 목소리" samples/*.mp3
   # voice_id: AbC123...
   ```
   출력된 값을 `.env.local` 의 `VOICE_ID` 에 넣습니다.
   본인 확인을 요구하면 대시보드의 Voices 화면에서 마치면 됩니다.
4. **토큰.** 이 API 를 부를 때 쓸 비밀 토큰을 만들어 `VOICE_API_TOKEN` 에 넣습니다.
   ```bash
   node -e "console.log(crypto.randomBytes(32).toString('base64url'))"
   ```

## 로컬에서 실행

```bash
npm run dev     # http://localhost:3000/api/speak

curl -X POST http://localhost:3000/api/speak \
  -H "Authorization: Bearer $VOICE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"안녕하세요, 제 목소리입니다. This is my voice."}' \
  -o hello.mp3
```

```bash
npm test        # ElevenLabs 를 부르지 않는 가짜 fetch 로 도는 테스트
```

## Vercel 에 올리기

1. Vercel 에서 이 저장소로 **새 프로젝트**를 만들고 **Root Directory 를 `voice-api`** 로 지정합니다.
   (루트로 두면 아랍어 읽기 앱이 올라갑니다.)
2. Settings → Environment Variables 에 `ELEVENLABS_API_KEY`, `VOICE_ID`, `VOICE_API_TOKEN` 을 넣습니다.
3. 배포하면 `https://<프로젝트>.vercel.app/api/speak` 로 부를 수 있습니다.

---

## API

### `POST /api/speak`

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `text` | 예 | 읽을 글. 최대 1000자(`SPEAK_MAX_CHARS`) |
| `language` | 아니오 | `ko` 또는 `en`. 기본 모델은 글을 보고 알아서 고르므로 보통 비워 둡니다. `eleven_flash_v2_5` 처럼 언어 지정을 받는 모델일 때만 실제로 전달됩니다 |

| 응답 | 뜻 |
| --- | --- |
| `200 audio/mpeg` | mp3 (44.1kHz, 128kbps) |
| `400` | `text` 가 없거나 너무 길거나, `language` 가 틀림 |
| `401` | 토큰이 없거나 틀림 |
| `429` | IP 당 호출 제한(기본 10분에 30번) 또는 ElevenLabs 사용량 제한 |
| `500` | 서버 환경변수 누락, 또는 ElevenLabs 키가 틀림 |
| `502` | ElevenLabs 가 다른 오류를 냄 (예: `VOICE_ID` 가 없음) |

오류는 모두 `{ "error": "..." }` 형태의 JSON 입니다.

### 브라우저에서 부르기

토큰이 들어가므로 **공개 웹페이지에서 직접 부르지 마세요.** 토큰이 그대로 노출되어 누구나 내 목소리를
만들 수 있게 됩니다. 내 서버, 단축어(iOS Shortcuts), 스크립트처럼 토큰을 숨길 수 있는 곳에서 부릅니다.

```js
const res = await fetch('https://<프로젝트>.vercel.app/api/speak', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.VOICE_API_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello from my voice API' }),
})
await fs.writeFile('out.mp3', Buffer.from(await res.arrayBuffer()))
```

## 지켜 둔 것

- **토큰 없이는 열리지 않습니다.** `VOICE_API_TOKEN` 이 비어 있으면 모든 요청을 500 으로 거절합니다.
  설정을 빠뜨려서 공개 API 가 되는 일을 막기 위해서입니다. 비교는 시간 차가 나지 않게 해시끼리 합니다.
- **글자 수가 곧 요금입니다.** 한 번에 1000자, IP 당 10분에 30번으로 막아 둡니다. 이 제한은 인스턴스
  메모리에서 세므로 완벽하지 않습니다. 사용량이 늘면 Vercel KV/Upstash 같은 저장소로 옮기고,
  ElevenLabs 대시보드에서 월 사용량 한도도 걸어 두세요.
- **ElevenLabs 키는 서버에만 있습니다.** 응답에는 오디오만 나갑니다.
