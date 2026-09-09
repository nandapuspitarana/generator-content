# Tasks: ChatTTS Generative Speech Microservice & Studio

**Input**: Design documents from `/specs/003-chattts-service/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Phase 1: Python Microservice Development (FastAPI)

**Purpose**: Build standalone ChatTTS speech synthesis engine in Python

- [X] T001 [P] Create `services/chattts/requirements.txt` with locked dependencies (`ChatTTS`, `torch`, `soundfile`, `fastapi`, `uvicorn`)
- [X] T002 Implement `services/chattts/main.py` with `/health` and `/synthesize` endpoints
- [X] T003 Implement SSML tag converter (`<break time="..."/>` to `[break_4]`) in `services/chattts/main.py`
- [X] T004 Implement deterministic speaker voice seed generator via `torch.manual_seed` and in-memory WAV buffer encoder

---

## Phase 2: Containerization & Infrastructure

**Purpose**: Package microservice into Docker with persistent model weight caching

- [X] T005 [P] Create `services/chattts/Dockerfile` (Python 3.11-slim, libsndfile1, curl, healthcheck)
- [X] T006 [P] Create `services/chattts/.dockerignore`
- [X] T007 Add `chattts` service definition and `chattts_cache` named volume in `docker-compose.yml`

---

## Phase 3: Gateway Integration & API Security (Next.js)

**Purpose**: Secure bridge between frontend web app and internal Python container

- [X] T008 [P] Define `TtsSynthesizeSchema` Zod validation schema in `src/lib/validation/schemas.ts`
- [X] T009 Implement Next.js API route bridge in `src/app/api/tts/route.ts` with `GET` (health) and `POST` (synthesize)
- [X] T010 Add timeout handling (90s AbortController) and friendly 503/504 status codes in `src/app/api/tts/route.ts`
- [X] T011 Enforce sliding-window rate limit (20 req/min) for `/api/tts` in `src/middleware.ts`
- [X] T012 Add `CHATTTS_ENABLED` and `CHATTTS_SERVICE_URL` to `.env.example`

---

## Phase 4: UI Studio & Playback Integration

**Purpose**: User-friendly audio player and voice customizer in the editorial studio

- [X] T013 [P] Build `AudioPlayerModal` component in `src/components/audio-player-modal.tsx` with preset seed selector and speed slider
- [X] T014 Embed "ChatTTS Audio Synthesizer" card and modal trigger into `src/components/article-editor.tsx`
- [X] T015 Implement browser audio playback and instant `.wav` download button in `AudioPlayerModal`

---

## Phase 5: Verification, Testing & Documentation

**Purpose**: Guarantee reliability, test coverage, and clear user documentation

- [X] T016 Write comprehensive unit test suite in `tests/unit/tts-api.test.ts` (14 passing tests)
- [X] T017 Verify all 127 tests pass across the entire workspace via `npm run test`
- [X] T018 Verify 0 TypeScript errors via `npx tsc --noEmit`
- [X] T019 Update `README.md` with Docker Compose instructions for ChatTTS
- [X] T020 Complete spec documentation in `specs/003-chattts-service/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/tts.md`)
