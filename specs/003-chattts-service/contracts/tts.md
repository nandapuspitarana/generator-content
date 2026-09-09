# REST API Contracts: ChatTTS Microservice & Next.js Gateway

## 1. Microservice API (`services/chattts/main.py`)

### `GET /health`
Mengembalikan status ketersediaan microservice dan flag kesiapan model AI.

- **URL**: `http://localhost:8765/health`
- **Method**: `GET`
- **Response 200 OK**:
  ```json
  {
    "status": "healthy",
    "service": "chattts-microservice",
    "model_loaded": true
  }
  ```

---

### `POST /synthesize`
Melakukan inferensi audio dari teks percakapan.

- **URL**: `http://localhost:8765/synthesize`
- **Method**: `POST`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: audio/wav
  ```
- **Request Body**:
  ```json
  {
    "text": "Halo, selamat datang di podcast AsikReview.",
    "voice_seed": 2222,
    "speed": 1.0,
    "temperature": 0.3,
    "top_P": 0.7,
    "top_K": 20
  }
  ```
- **Response 200 OK**:
  - `Content-Type`: `audio/wav`
  - `Content-Disposition`: `inline; filename="speech.wav"`
  - `X-Audio-Sample-Rate`: `24000`
  - Body: Binary WAV audio data.

---

## 2. Next.js Gateway API (`src/app/api/tts/route.ts`)

### `GET /api/tts`
Health-check proxy untuk memverifikasi status koneksi microservice dari frontend.

- **Response 200 OK**:
  ```json
  {
    "enabled": true,
    "status": "connected",
    "serviceUrl": "http://localhost:8765",
    "details": {
      "status": "healthy",
      "service": "chattts-microservice",
      "model_loaded": true
    }
  }
  ```
- **Response 503 Service Unavailable** (jika container offline):
  ```json
  {
    "enabled": true,
    "status": "unreachable",
    "message": "ChatTTS microservice is not reachable at http://localhost:8765."
  }
  ```

---

### `POST /api/tts`
Endpoint publik untuk sintesis audio dari UI editor atau client.

- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Rate Limit**: 20 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "text": "Naskah ulasan atau podcast yang akan disintesis...",
    "voice_seed": 2222,
    "speed": 1.0
  }
  ```
- **Response 200 OK**:
  - `Content-Type`: `audio/wav`
  - `Content-Disposition`: `inline; filename="chattts-speech.wav"`
  - `Content-Length`: `<buffer byte length>`
  - Body: Binary WAV audio stream.
