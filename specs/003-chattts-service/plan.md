# Implementation Plan: Fish-Speech & Dialogue Speech Microservice (Upgraded from ChatTTS)

**Branch**: `003-chattts-service` | **Date**: 2026-09-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `spec.md`

> [!NOTE]
> **Update 2026-09-10**: Layanan TTS telah di-upgrade dari ChatTTS ke **[Fish-Speech](https://github.com/fishaudio/fish-speech)** (`services/fish-speech/`) dengan integrasi penuh dataset **[X-lord/Dataset-Text-To-Speech-Indonesia](https://huggingface.co/datasets/X-lord/Dataset-Text-To-Speech-Indonesia)** (4.531 file, 16.4 jam audio narasi Bahasa Indonesia 24kHz), akselerasi native GPU GTX 1650, dan zero-shot voice cloning.

## Summary

Mengintegrasikan model AI generatif suara dialog multilingual & Bahasa Indonesia (**Fish-Speech**) sebagai **service terpisah**. Sistem mendukung:
1. **Mode Direct Python Script**: Dijalankan langsung dengan Python (`npm run tts:dev` atau `python services/fish-speech/main.py`) dengan akselerasi native NVIDIA GPU (GTX 1650 4GB FP16).
2. **Mode Docker Container**: Dijalankan via Docker Compose (`docker compose up fish-speech -d`).
3. **Dataset & Training Pipeline**: Script pengunduhan dan pra-pemrosesan dataset Indonesia (`npm run tts:download`) serta notebook training Google Colab GPU T4 gratis.

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
