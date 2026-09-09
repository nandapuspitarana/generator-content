# Implementation Plan: ChatTTS Generative Dialogue Speech Microservice

**Branch**: `003-chattts-service` | **Date**: 2026-09-09 | **Spec**: [spec.md](file:///c:/Users/nanda/Documents/playground/content/generator-content/specs/003-chattts-service/spec.md)
**Input**: Feature specification from `/specs/003-chattts-service/spec.md`

## Summary

Mengintegrasikan model AI generatif suara dialog **ChatTTS** (oleh 2noise) sebagai **service terpisah**. Sistem mendukung **dua mode eksekusi fleksibel**:
1. **Mode Direct Python Script (Rekomendasi untuk Development & Debugging)**: Dijalankan langsung dengan Python (`python services/chattts/main.py` atau `npm run chattts:dev`) untuk kemudahan debugging, live logs, dan penggunaan native GPU host tanpa overhead container.
2. **Mode Docker Container (Rekomendasi untuk Staging & Production)**: Dijalankan via Docker Compose (`docker compose up chattts -d`) untuk isolasi lingkungan total.

Next.js App Router bertindak sebagai API gateway/bridge melalui route `/api/tts` yang berkomunikasi ke `http://localhost:8765` secara transparan, dilengkapi validasi Zod, rate limiting sliding-window, dan antarmuka UI modal studio audio interaktif di editor artikel/podcast.

## Technical Context

**Language/Version**: Python 3.11/3.12 (Service) + TypeScript 5 / Node.js 18+ (Next.js Gateway)  
**Primary Dependencies**:
- Service: `fastapi==0.115.0`, `uvicorn==0.32.0`, `ChatTTS==0.2.1`, `torch>=2.2.0`, `torchaudio>=2.2.0`, `soundfile>=0.12.1`, `scipy>=1.13.0`
- Next.js Web App: Next.js 16 (App Router), React 19, Zod, Tailwind CSS v4  
**Storage**: Ephemeral in-memory audio buffers (`io.BytesIO` WAV 24kHz 16-bit PCM); model weights cached di `~/.cache/huggingface` (host) atau Docker named volume `chattts_cache` (`/root/.cache`)  
**Testing**: Vitest (`tests/unit/tts-api.test.ts`), Direct CLI debugger (`services/chattts/cli_debug.py`)  
**Target Platform**: Host Python (Windows/Linux/Mac) atau Docker Container + Node.js Web Server (Port 3300)  
**Project Type**: Microservice + Full-stack Web Application  
**Performance Goals**:
- Health check ping < 100ms
- CPU audio synthesis: ~15–30s untuk teks 500–1000 karakter (lebih cepat jika host memiliki CUDA GPU)
- Zero memory leakage via in-memory stream without disk accumulation
**Constraints**:
- Max payload 5000 karakter per request
- Rate limiting 20 req/menit per IP
- SSRF-safe fixed backend communication (`CHATTTS_SERVICE_URL`)
- Non-blocking: failure in service must never crash the Next.js process


## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
- **Clean Architecture & Separation of Concerns**: ✅ Deep learning runtime (Python/PyTorch) is completely isolated in a standalone Docker container; Next.js only handles web routing, validation, and UI presentation.
- **Resilience & Graceful Fallback**: ✅ If ChatTTS is offline, Next.js returns HTTP 503 with friendly status, without breaking the article writing experience.
- **Zero Placeholder Audio**: ✅ Synthesizes true WAV PCM streams or diagnostic audio tones when weights are compiling.
- **Consistent Swiss Design UI**: ✅ Audio Studio modal styled with Swiss monochromatic tokens, crisp 1px borders, and clear typographic hierarchy.

## Project Structure

### Documentation (this feature)

```text
specs/003-chattts-service/
├── spec.md              # Feature specification & user stories
├── plan.md              # This architecture and implementation plan
├── research.md          # Technical research on ChatTTS, weights & licensing
├── data-model.md        # Data models, Zod schema & audio stream specs
├── quickstart.md        # How to run container, execute API, and verify UI
├── contracts/
│   └── tts.md           # REST API Contract for FastAPI & Next.js bridge
└── checklists/
    └── requirements.md  # Quality verification checklist
```

### Source Code Architecture

```text
# 1. Microservice Layer (Python FastAPI)
services/chattts/
├── main.py              # FastAPI app: /health, /synthesize, SSML preprocessor
├── requirements.txt     # Locked Python dependencies
├── Dockerfile           # Python 3.11-slim container with libsndfile & ffmpeg
└── .dockerignore        # Ignore git, venv, and cache files

# 2. Gateway / Next.js Bridge Layer
src/
├── app/
│   └── api/
│       └── tts/
│           └── route.ts # GET health check & POST audio proxy bridge
├── components/
│   ├── audio-player-modal.tsx  # Interactive UI studio modal & player
│   └── article-editor.tsx      # Sidebar trigger card integration
├── lib/
│   └── validation/
│       └── schemas.ts          # TtsSynthesizeSchema (Zod validation)
└── middleware.ts               # 20 req/min rate limiter for /api/tts

# 3. Infrastructure & Automation
docker-compose.yml       # chattts service definition & chattts_cache volume
.env.example             # CHATTTS_ENABLED & CHATTTS_SERVICE_URL
tests/unit/
└── tts-api.test.ts      # 14 Vitest unit tests covering route and schema
```

## Data Flow & Architecture

```
[User Browser (Audio Studio Modal)]
         │
         │  1. POST /api/tts { text, voice_seed, speed }
         ▼
[Next.js 16 Gateway (App Router)]
         │
         ├─► [middleware.ts]: Rate Limit Check (20 req/min)
         ├─► [schemas.ts]: Zod Validation (1 <= chars <= 5000)
         │
         │  2. Forward HTTP POST /synthesize
         ▼
[Docker Container: asikreview-chattts (Port 8765)]
         │
         ├─► [main.py]: Preprocess SSML (<break> -> [break_4])
         ├─► [PyTorch/ChatTTS]: Generate 24kHz Audio Waveform
         ├─► [SoundFile]: Encode to WAV in-memory buffer
         │
         │  3. Stream binary audio/wav
         ▼
[Next.js Gateway Bridge]
         │
         │  4. Stream response to client with Content-Type: audio/wav
         ▼
[HTML5 Audio Player & Download .WAV]
```
