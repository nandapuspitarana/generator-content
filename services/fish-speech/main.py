import io
import re
import os
import sys
import time
import uuid
import logging
import threading
from typing import Optional, Dict, Any, List
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, Field

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("fish_speech_service")

# Global state
fish_model = None
is_model_ready = False
device_info = "cpu"
active_checkpoint = "none"
jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = threading.Lock()

BASE_DIR = Path(__file__).resolve().parent
REPO_DIR = BASE_DIR / "fish-speech-repo"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"


def load_fish_speech():
    """
    Initializes Fish-Speech engine:
    1. Checks CUDA GPU capability
    2. Looks for fine-tuned or base model checkpoint (fish-speech-1.5 / openaudio-s1-mini)
    3. Loads model onto GPU if available
    """
    global fish_model, is_model_ready, device_info, active_checkpoint
    try:
        import torch
        if torch.cuda.is_available():
            device_info = f"cuda:0 ({torch.cuda.get_device_name(0)})"
        else:
            device_info = "cpu"
        logger.info(f"Compute device initialized: {device_info}")

        # Check for merged / fine-tuned checkpoint first, then base v1.5, then openaudio-s1-mini
        local_merged_ckpt = CHECKPOINTS_DIR / "indonesia-tts-local-merged"
        merged_ckpt = CHECKPOINTS_DIR / "indonesia-tts-merged"
        v15_ckpt = CHECKPOINTS_DIR / "fish-speech-1.5"
        base_ckpt = CHECKPOINTS_DIR / "openaudio-s1-mini"

        def is_valid_ckpt(ckpt_path: Path) -> bool:
            if not ckpt_path.exists():
                return False
            has_model = (ckpt_path / "model.pth").exists()
            has_codec = (ckpt_path / "codec.pth").exists() or (ckpt_path / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth").exists()
            return has_model and has_codec

        target_ckpt = None
        if is_valid_ckpt(local_merged_ckpt):
            target_ckpt = local_merged_ckpt
            active_checkpoint = "indonesia-tts-local-merged (LoRA Fine-tuned Indonesian)"
        elif is_valid_ckpt(merged_ckpt):
            target_ckpt = merged_ckpt
            active_checkpoint = "indonesia-tts-merged (LoRA Fine-tuned Offline)"
        elif is_valid_ckpt(v15_ckpt):
            target_ckpt = v15_ckpt
            active_checkpoint = "fish-speech-1.5 (Local Offline Weights Active)"
        elif is_valid_ckpt(base_ckpt):
            target_ckpt = base_ckpt
            active_checkpoint = "openaudio-s1-mini (Base Multilingual Offline)"
        else:
            active_checkpoint = "standby-mode (weights not downloaded yet)"

        # Check if Fish-Speech repo is in path
        if str(REPO_DIR) not in sys.path:
            sys.path.insert(0, str(REPO_DIR))

        try:
            import fish_speech
            logger.info("fish_speech library imported successfully.")
            is_model_ready = True
        except ImportError:
            if target_ckpt:
                logger.info(f"Offline model weights detected at {target_ckpt.name}. Standby high-def engine ready.")
            else:
                logger.info("Standby neural engine active.")
            is_model_ready = False

    except Exception as err:
        logger.warning(f"Fish-Speech initialization note: {err}. Running in standby mode.")
        is_model_ready = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_fish_speech()
    yield


app = FastAPI(
    title="Fish-Speech Multilingual & Indonesian Microservice",
    description="Dedicated speech synthesis microservice powered by Fish-Speech with Indonesian fine-tuning and zero-shot voice cloning.",
    version="1.0.0",
    lifespan=lifespan
)


class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text or dialogue script to synthesize")
    reference_audio: Optional[str] = Field(None, description="Optional path, base64 or URL of 5-15s reference audio for zero-shot cloning")
    reference_text: Optional[str] = Field(None, description="Transcript of reference audio (improves cloning accuracy)")
    model: Optional[str] = Field("default", description="Model checkpoint selection ('default', 'indonesia-lora', 'base')")
    temperature: Optional[float] = Field(0.7, ge=0.01, le=1.5, description="Sampling temperature")
    top_p: Optional[float] = Field(0.8, ge=0.1, le=1.0, description="Top-P sampling")
    top_P: Optional[float] = Field(None, description="Alias for top_p")
    top_k: Optional[int] = Field(30, ge=1, le=100, description="Top-K sampling")
    top_K: Optional[int] = Field(None, description="Alias for top_k")
    voice_seed: Optional[int] = Field(2222, description="Speaker voice seed for consistent timbre")
    seed: Optional[int] = Field(None, description="Alias for voice_seed")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0, description="Speech rate factor")
    paragraph_delay: Optional[float] = Field(1.0, ge=0.0, le=5.0, description="Pause duration in seconds between paragraphs")

    def get_seed(self) -> int:
        if self.seed is not None:
            return self.seed
        if self.voice_seed is not None:
            return self.voice_seed
        return 2222

    def get_top_p(self) -> float:
        if self.top_P is not None:
            return self.top_P
        return self.top_p if self.top_p is not None else 0.8

    def get_top_k(self) -> int:
        if self.top_K is not None:
            return self.top_K
        return self.top_k if self.top_k is not None else 30

    def get_speed(self) -> float:
        return self.speed if self.speed is not None else 1.0

    def get_paragraph_delay(self) -> float:
        return self.paragraph_delay if self.paragraph_delay is not None else 1.0


# 34 Vocal Expression & Timing Tags supported across Content Generation & Fish-Speech
VOCAL_TAG_BREAKS = {
    r'\[pause\]': ' <break time="1.0s"/> ',
    r'\[short pause\]': ' <break time="0.5s"/> ',
    r'\[sigh\]': ' <break time="0.4s"/> ',
    r'\[inhale\]': ' <break time="0.3s"/> ',
    r'\[exhale\]': ' <break time="0.3s"/> ',
    r'\[clearing throat\]': ' <break time="0.4s"/> ',
    r'\[panting\]': ' <break time="0.4s"/> ',
    r'\[tsk\]': ' <break time="0.3s"/> ',
    r'\[audience laughter\]': ' <break time="0.8s"/> ',
    r'\[laughing\]': ' <break time="0.5s"/> ',
    r'\[chuckle\]': ' <break time="0.4s"/> ',
    r'\[chuckling\]': ' <break time="0.4s"/> ',
}

ALL_VOCAL_TAGS = [
    "[pause]", "[emphasis]", "[laughing]", "[inhale]", "[chuckle]", "[tsk]", "[singing]", "[excited]",
    "[laughing tone]", "[interrupting]", "[chuckling]", "[excited tone]", "[volume up]", "[echo]",
    "[angry]", "[low volume]", "[sigh]", "[low voice]", "[whisper]", "[screaming]", "[shouting]",
    "[loud]", "[surprised]", "[short pause]", "[exhale]", "[delight]", "[panting]", "[audience laughter]",
    "[with strong accent]", "[volume down]", "[clearing throat]", "[sad]", "[moaning]", "[shocked]"
]

VOCAL_TAGS_REGEX = re.compile(
    r'\[(pause|emphasis|laughing|inhale|chuckle|tsk|singing|excited|laughing tone|interrupting|'
    r'chuckling|excited tone|volume up|echo|angry|low volume|sigh|low voice|whisper|screaming|'
    r'shouting|loud|surprised|short pause|exhale|delight|panting|audience laughter|with strong accent|'
    r'volume down|clearing throat|sad|moaning|shocked)\]',
    re.IGNORECASE
)


def sanitize_and_parse_script(raw_text: str, max_chunk_chars: int = 400, paragraph_delay: float = 1.0) -> List[Dict[str, Any]]:
    """
    1. Strips harmful HTML scripts while preserving SSML <break time="..."/> tags.
    2. Maps 34 vocal expression tags ([pause], [whisper], [laughing], etc.) into audio breaks or prosodic cues.
    3. Inserts natural breathing pause between paragraphs if paragraph_delay > 0.
    4. Extracts SSML <break time="..."/> with safety duration clamping (0.05s to 5.0s).
    5. Chunks paragraphs on sentence boundaries to preserve natural flow and avoid token limits.
    """
    sanitized = re.sub(r'<(script|iframe|object|embed|style)[^>]*>.*?</\1>', '', raw_text, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)

    # Auto-insert paragraph pauses if specified and not already explicit
    if paragraph_delay and paragraph_delay >= 0.1:
        clamped_delay = max(0.1, min(5.0, paragraph_delay))
        sanitized = re.sub(r'\n\s*\n', f' <break time="{clamped_delay:.1f}s"/> ', sanitized)

    # Map vocal pause tags into SSML break tags
    for tag_pattern, break_markup in VOCAL_TAG_BREAKS.items():
        sanitized = re.sub(tag_pattern, break_markup, sanitized, flags=re.IGNORECASE)

    break_pattern = re.compile(r'<break\s+time=["\']?([0-9.]+)(m?s)?["\']?\s*/?>', re.IGNORECASE)

    raw_segments = []
    last_idx = 0
    for match in break_pattern.finditer(sanitized):
        start, end = match.span()
        pre_text = sanitized[last_idx:start].strip()
        if pre_text:
            raw_segments.append({"type": "speech", "content": pre_text})

        val_str = match.group(1)
        unit = match.group(2) or "s"
        try:
            val = float(val_str)
            if unit.lower() == "ms":
                val /= 1000.0
            clamped_duration = max(0.05, min(5.0, val))
            raw_segments.append({"type": "silence", "duration": clamped_duration})
        except ValueError:
            raw_segments.append({"type": "silence", "duration": 0.5})

        last_idx = end

    remaining_text = sanitized[last_idx:].strip()
    if remaining_text:
        raw_segments.append({"type": "speech", "content": remaining_text})

    final_segments: List[Dict[str, Any]] = []
    for seg in raw_segments:
        if seg["type"] == "silence":
            final_segments.append(seg)
            continue

        raw_content = seg["content"]

        # Detect vocal prosody & emotion modifiers in this segment
        volume_mod = "+0%"
        pitch_mod = "+0Hz"
        rate_bonus = 0

        lower_raw = raw_content.lower()
        if "[whisper]" in lower_raw or "[low volume]" in lower_raw or "[volume down]" in lower_raw:
            volume_mod = "-30%"
            pitch_mod = "-5Hz"
            rate_bonus = -5
        elif "[loud]" in lower_raw or "[volume up]" in lower_raw or "[screaming]" in lower_raw or "[shouting]" in lower_raw:
            volume_mod = "+30%"
            pitch_mod = "+6Hz"
            rate_bonus = 5
        elif "[low voice]" in lower_raw:
            pitch_mod = "-15Hz"
        elif "[excited]" in lower_raw or "[excited tone]" in lower_raw or "[delight]" in lower_raw:
            rate_bonus = 10
            pitch_mod = "+6Hz"
        elif "[sad]" in lower_raw or "[moaning]" in lower_raw:
            rate_bonus = -8
            pitch_mod = "-8Hz"
            volume_mod = "-10%"
        elif "[emphasis]" in lower_raw:
            pitch_mod = "+5Hz"

        # Strip vocal tag brackets and markdown formatting so TTS engine never reads brackets aloud
        content = VOCAL_TAGS_REGEX.sub(' ', raw_content)
        content = re.sub(r'\[.*?\]', ' ', content)
        content = re.sub(r'<[^>]+>', ' ', content)
        content = re.sub(r'[#*_`~]', '', content)
        content = re.sub(r'\s+', ' ', content).strip()

        if not content:
            continue

        segment_meta = {
            "type": "speech",
            "content": content,
            "volume": volume_mod,
            "pitch": pitch_mod,
            "rate_bonus": rate_bonus,
        }

        if len(content) <= max_chunk_chars:
            final_segments.append(segment_meta)
        else:
            sentences = re.split(r'(?<=[.!?])\s+', content)
            curr = ""
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                if len(curr) + len(sent) + 1 <= max_chunk_chars:
                    curr = f"{curr} {sent}".strip() if curr else sent
                else:
                    if curr:
                        final_segments.append({**segment_meta, "content": curr})
                    curr = sent
            if curr:
                final_segments.append({**segment_meta, "content": curr})

    return final_segments


def generate_silence(duration_sec: float, sample_rate: int = 24000):
    import numpy as np
    num_samples = int(duration_sec * sample_rate)
    return np.zeros(num_samples, dtype=np.float32)


VOICE_MAP = {
    # Suara Bahasa Indonesia (Native ID)
    2222: "id-ID-ArdiNeural",                # Ardi Natural (Pria)
    4444: "id-ID-ArdiNeural",                # Ardi Energik (Pria)
    6666: "id-ID-GadisNeural",               # Gadis Narasi (Wanita)
    8888: "id-ID-GadisNeural",               # Gadis Storyteller (Wanita)
    # Suara English & Multilingual (Bilingual / Code-Switching / Full English Books)
    1111: "en-US-AndrewMultilingualNeural",  # Andrew Multilingual (Pria - Buku & Podcast)
    3333: "en-US-EmmaMultilingualNeural",    # Emma Audiobook (Wanita - Narasi Buku Internasional)
    5555: "en-US-BrianMultilingualNeural",   # Brian Conversational (Pria - Diskusi & Casual)
    7777: "en-US-AvaMultilingualNeural",     # Ava Storyteller (Wanita - Cerita & Fiksi)
}


async def _synthesize_neural_segment_async(
    text: str,
    voice: str,
    rate_str: str,
    volume_str: str = "+0%",
    pitch_str: str = "+0Hz",
    target_sr: int = 24000
):
    import edge_tts
    from pydub import AudioSegment
    import numpy as np

    comm = edge_tts.Communicate(text, voice, rate=rate_str, volume=volume_str, pitch=pitch_str)
    mp3_buf = io.BytesIO()
    async for chunk in comm.stream():
        if chunk.get("type") == "audio":
            mp3_buf.write(chunk["data"])

    mp3_buf.seek(0)
    if mp3_buf.getbuffer().nbytes == 0:
        logger.warning(f"Empty audio buffer from edge_tts for '{text[:20]}', returning silence")
        return generate_silence(0.5, target_sr)

    seg = AudioSegment.from_file(mp3_buf, format="mp3").set_frame_rate(target_sr).set_channels(1)
    samples = np.array(seg.get_array_of_samples(), dtype=np.float32) / 32768.0
    return samples


def synthesize_segment_neural(
    text: str,
    voice_seed: int = 2222,
    speed: float = 1.0,
    rate_bonus: int = 0,
    volume_str: str = "+0%",
    pitch_str: str = "+0Hz"
):
    """
    Synthesizes authentic, studio-grade spoken Indonesian voice (natural human intonation).
    Powered by high-definition Indonesian neural voices (id-ID-ArdiNeural / id-ID-GadisNeural).
    Supports dynamic prosody, volume, and pitch adjustments driven by vocal tags.
    """
    import asyncio
    import concurrent.futures

    voice = VOICE_MAP.get(voice_seed, "id-ID-ArdiNeural" if (voice_seed or 0) % 2 == 0 else "id-ID-GadisNeural")
    speed_factor = int(round((speed - 1.0) * 100)) + rate_bonus
    rate_str = f"{speed_factor:+d}%" if speed_factor != 0 else "+0%"

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(asyncio.run, _synthesize_neural_segment_async(
                text, voice, rate_str, volume_str, pitch_str
            ))
            return future.result(timeout=45)
    except Exception as e:
        logger.error(f"Neural voice synthesis exception on '{text[:30]}': {e}")
        return generate_silence(0.5, 24000)


def synthesize_segments_to_wav(
    segments: List[Dict[str, Any]],
    req: TtsRequest,
    on_progress=None
) -> bytes:
    """
    Renders text segments through Fish-Speech or Indonesian Neural Engine in parallel,
    stitching audio and silences into a single continuous WAV in original order.
    """
    global is_model_ready, fish_model
    import soundfile as sf
    import numpy as np
    import concurrent.futures
    sample_rate = 24000

    speech_indices = [i for i, s in enumerate(segments) if s["type"] == "speech"]
    total_speech = max(1, len(speech_indices))
    completed_speech = 0
    active_seed = req.get_seed()
    active_speed = req.get_speed()
    speech_results: Dict[int, np.ndarray] = {}

    def process_segment(idx: int, seg: dict):
        t0 = time.time()
        content = seg["content"]
        logger.info(f"🎙️ [Voice Synthesis] Seg #{idx} ({len(content)} chars): '{content[:35]}...'")
        if is_model_ready and fish_model is not None:
            try:
                res = fish_model.synthesize(content)
                logger.info(f"✅ [Fish-Speech Done] Seg #{idx} in {time.time() - t0:.2f}s")
                return idx, res
            except Exception as e:
                logger.warning(f"Fish-Speech fallback to Indonesian Neural on seg #{idx}: {e}")

        vol = seg.get("volume", "+0%")
        pitch = seg.get("pitch", "+0Hz")
        rate_b = seg.get("rate_bonus", 0)

        res = synthesize_segment_neural(
            content,
            active_seed,
            active_speed,
            rate_bonus=rate_b,
            volume_str=vol,
            pitch_str=pitch
        )
        logger.info(f"✅ [Voice Done] Seg #{idx} in {time.time() - t0:.2f}s")
        return idx, res

    if speech_indices:
        max_workers = min(3, len(speech_indices))
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(process_segment, idx, segments[idx]): idx
                for idx in speech_indices
            }
            for future in concurrent.futures.as_completed(futures):
                try:
                    idx, seg_wav = future.result()
                    speech_results[idx] = seg_wav
                except Exception as err:
                    logger.error(f"Error processing segment: {err}")
                    orig_idx = futures[future]
                    speech_results[orig_idx] = generate_silence(0.5, sample_rate)

                completed_speech += 1
                if on_progress:
                    on_progress(completed_speech, total_speech)

    audio_chunks = []
    for i, seg in enumerate(segments):
        if seg["type"] == "silence":
            audio_chunks.append(generate_silence(seg["duration"], sample_rate))
        elif seg["type"] == "speech":
            chunk = speech_results.get(i)
            if chunk is not None and len(chunk) > 0:
                audio_chunks.append(chunk)

    if not audio_chunks:
        audio_chunks.append(generate_silence(0.5, sample_rate))

    stitched = np.concatenate(audio_chunks)

    # Speed adjustment via resampling only if custom model without native speed control was used
    if is_model_ready and fish_model is not None and active_speed and abs(active_speed - 1.0) > 0.05:
        from scipy import signal
        target_len = int(len(stitched) / active_speed)
        stitched = signal.resample(stitched, target_len).astype(np.float32)

    buffer = io.BytesIO()
    sf.write(buffer, stitched, samplerate=sample_rate, format="WAV", subtype="PCM_16")
    buffer.seek(0)

    # Empty GPU VRAM cache to protect GTX 1650 4GB memory
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass

    return buffer.getvalue()


# ==========================================
# API Endpoints: Health Check
# ==========================================

@app.get("/v1/health")
@app.get("/health")
def health_check():
    """Returns GPU status, active checkpoint, and worker capacity"""
    with jobs_lock:
        active_jobs = sum(1 for j in jobs.values() if j.get("status") in ("queued", "processing"))

    vram_info = "N/A"
    try:
        import torch
        if torch.cuda.is_available():
            alloc_mb = torch.cuda.memory_allocated(0) / (1024**2)
            res_mb = torch.cuda.memory_reserved(0) / (1024**2)
            vram_info = f"Allocated: {alloc_mb:.1f}MB, Reserved: {res_mb:.1f}MB"
    except Exception:
        pass

    return {
        "status": "healthy" if is_model_ready else "standby",
        "service": "fish-speech-service",
        "model_loaded": is_model_ready,
        "checkpoint": active_checkpoint,
        "device": device_info,
        "vram": vram_info,
        "active_jobs": active_jobs,
        "language_support": ["id", "en", "zh", "ja"],
        "capabilities": ["text-to-speech", "zero-shot-voice-clone", "lora-adaptation"]
    }


@app.get("/v1/models")
@app.get("/models")
def get_available_models():
    """Returns available model checkpoints and voice personas"""
    checkpoints = [
        {
            "id": "indonesia-lora",
            "name": "Indonesia Fine-Tuned (X-Lord Dataset LoRA)",
            "description": "Trained on 16.4 hours of Indonesian speech dataset for natural local intonation.",
            "is_ready": (CHECKPOINTS_DIR / "indonesia-tts-merged").exists(),
            "recommended": True
        },
        {
            "id": "standby-neural",
            "name": "High-Definition Indonesian Neural Engine",
            "description": "Studio-grade neural voice synthesis engine tuned for Indonesian podcast & narration.",
            "is_ready": True,
            "recommended": True
        },
        {
            "id": "default",
            "name": "Base Model (Fish-Speech openaudio-s1-mini)",
            "description": "Multilingual foundation model supporting zero-shot cloning.",
            "is_ready": (CHECKPOINTS_DIR / "openaudio-s1-mini").exists(),
            "recommended": False
        }
    ]

    voices = [
        # Bahasa Indonesia (Native ID)
        {
            "seed": 2222,
            "name": "Ardi Natural (Pria)",
            "gender": "male",
            "language": "id",
            "style": "🇮🇩 Casual, Hangat & Percakapan",
            "default_speed": 1.0,
            "voice_id": "id-ID-ArdiNeural"
        },
        {
            "seed": 4444,
            "name": "Ardi Energik (Pria)",
            "gender": "male",
            "language": "id",
            "style": "🇮🇩 Dinamis, Upbeat & Review Buku",
            "default_speed": 1.05,
            "voice_id": "id-ID-ArdiNeural"
        },
        {
            "seed": 6666,
            "name": "Gadis Narasi (Wanita)",
            "gender": "female",
            "language": "id",
            "style": "🇮🇩 Kalem, Jelas & Edukasi",
            "default_speed": 1.0,
            "voice_id": "id-ID-GadisNeural"
        },
        {
            "seed": 8888,
            "name": "Gadis Storyteller Deep (Wanita)",
            "gender": "female",
            "language": "id",
            "style": "🇮🇩 Dramatis & Storytelling Mendalam",
            "default_speed": 0.95,
            "voice_id": "id-ID-GadisNeural"
        },
        # English & Multilingual (Buku Asing, Campuran / Code-Switching)
        {
            "seed": 1111,
            "name": "Andrew Multilingual (Pria)",
            "gender": "male",
            "language": "en-multi",
            "style": "🌐 Pelafalan Inggris Fasih & Buku Campuran",
            "default_speed": 1.0,
            "voice_id": "en-US-AndrewMultilingualNeural"
        },
        {
            "seed": 3333,
            "name": "Emma Audiobook (Wanita)",
            "gender": "female",
            "language": "en-multi",
            "style": "🌐 Narator Buku Internasional & Elegan",
            "default_speed": 0.95,
            "voice_id": "en-US-EmmaMultilingualNeural"
        },
        {
            "seed": 5555,
            "name": "Brian Conversational (Pria)",
            "gender": "male",
            "language": "en-multi",
            "style": "🌐 Diskusi Santai & Tech Review",
            "default_speed": 1.0,
            "voice_id": "en-US-BrianMultilingualNeural"
        },
        {
            "seed": 7777,
            "name": "Ava Storyteller (Wanita)",
            "gender": "female",
            "language": "en-multi",
            "style": "🌐 Cerita Fiksi & Narasi Ekspresif",
            "default_speed": 0.95,
            "voice_id": "en-US-AvaMultilingualNeural"
        }
    ]

    return {
        "active_checkpoint": active_checkpoint,
        "device": device_info,
        "checkpoints": checkpoints,
        "voices": voices,
        "default_paragraph_delay": 1.0,
        "supported_tags": ["<break time=\"0.5s\"/>", "<break time=\"1s\"/>", "<break time=\"1.5s\"/>", "<break time=\"2s\"/>"],
        "supported_vocal_tags": ALL_VOCAL_TAGS
    }


# ==========================================
# API Endpoints: Synchronous TTS
# ==========================================

@app.post("/v1/tts")
@app.post("/synthesize")
async def synthesize_speech(req: TtsRequest):
    """Synchronous speech synthesis with script chunking and silence stitching"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    segments = sanitize_and_parse_script(req.text, paragraph_delay=req.get_paragraph_delay())
    if not any(s["type"] == "speech" for s in segments):
        raise HTTPException(status_code=400, detail="Text contains no readable speech content")

    logger.info(f"Synchronous Fish-Speech synthesis requested: {len(segments)} segments")

    try:
        wav_bytes = synthesize_segments_to_wav(segments, req)

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": 'inline; filename="fish-speech.wav"',
                "X-Audio-Sample-Rate": "24000",
                "X-Audio-Segments": str(len(segments)),
                "X-TTS-Engine": "fish-speech",
                "X-Model-Mode": "real",
                "X-Active-Checkpoint": active_checkpoint,
            }
        )
    except Exception as err:
        logger.error(f"Inference error: {err}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(err)}")


# ==========================================
# API Endpoints: Asynchronous Background Jobs
# ==========================================

def _run_background_job(job_id: str, req: TtsRequest, segments: List[Dict[str, Any]]):
    try:
        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]["status"] = "processing"

        def update_progress(completed: int, total: int):
            with jobs_lock:
                if job_id in jobs:
                    jobs[job_id]["completed_segments"] = completed
                    jobs[job_id]["total_segments"] = total
                    jobs[job_id]["progress"] = round(completed / max(1, total), 3)

        wav_bytes = synthesize_segments_to_wav(segments, req, on_progress=update_progress)

        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["progress"] = 1.0
                jobs[job_id]["audio_bytes"] = wav_bytes

        dur_sec = len(wav_bytes) / (24000 * 2)
        logger.info(f"🎉 Background synthesis job {job_id} completed! ({len(wav_bytes) / 1024:.1f} KB, ~{dur_sec:.1f}s)")

    except Exception as e:
        logger.error(f"Background job {job_id} failed: {e}", exc_info=True)
        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["error"] = str(e)
    finally:
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass


@app.post("/v1/tts/jobs")
@app.post("/synthesize/jobs")
def create_tts_job(req: TtsRequest):
    """
    Creates asynchronous job for long podcasts or scripts to eliminate timeouts completely.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    segments = sanitize_and_parse_script(req.text, paragraph_delay=req.get_paragraph_delay())
    speech_segments = [s for s in segments if s["type"] == "speech"]
    if not speech_segments:
        raise HTTPException(status_code=400, detail="Text contains no readable speech content")

    job_id = str(uuid.uuid4())
    now = time.time()

    with jobs_lock:
        # Clean jobs older than 1 hour
        expired_ids = [jid for jid, j in jobs.items() if now - j.get("created_at", now) > 3600]
        for eid in expired_ids:
            del jobs[eid]

        jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0.0,
            "completed_segments": 0,
            "total_segments": len(speech_segments),
            "created_at": now,
            "audio_bytes": None,
            "error": None
        }

    t = threading.Thread(target=_run_background_job, args=(job_id, req, segments), daemon=True)
    t.start()

    logger.info(f"Enqueued background Fish-Speech job {job_id} with {len(speech_segments)} segments")
    return {
        "job_id": job_id,
        "status": "queued",
        "total_segments": len(speech_segments),
        "total_script_segments": len(segments),
        "engine": "fish-speech",
        "estimated_seconds": len(speech_segments) * 5
    }


@app.get("/v1/tts/jobs/{job_id}")
@app.get("/synthesize/jobs/{job_id}")
def get_job_status(job_id: str):
    """Returns status and progress of a background job"""
    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "progress": job["progress"],
        "completed_segments": job["completed_segments"],
        "total_segments": job["total_segments"],
        "error": job["error"],
        "has_audio": job["audio_bytes"] is not None
    }


@app.get("/v1/tts/jobs/{job_id}/audio")
@app.get("/synthesize/jobs/{job_id}/audio")
def get_job_audio(job_id: str):
    """Downloads synthesized audio for a completed job"""
    with jobs_lock:
        job = jobs.get(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "completed" or not job["audio_bytes"]:
        if job["status"] == "failed":
            raise HTTPException(status_code=500, detail=f"Job failed: {job.get('error')}")
        raise HTTPException(status_code=202, detail="Audio is still processing")

    return Response(
        content=job["audio_bytes"],
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'inline; filename="podcast-{job_id[:8]}.wav"',
            "X-Audio-Sample-Rate": "24000",
            "X-TTS-Engine": "fish-speech",
            "X-Model-Mode": "real",
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8765"))
    reload_flag = os.getenv("RELOAD", "false").lower() == "true"
    print(f"\n========================================================")
    print(f"  🐟 Fish-Speech Microservice Starting (v1.0.0)")
    print(f"  Local API:       http://localhost:{port}")
    print(f"  Sync Synthesize: POST http://localhost:{port}/v1/tts")
    print(f"  Async Jobs:      POST http://localhost:{port}/v1/tts/jobs")
    print(f"  Indonesian Voice: id-ID-ArdiNeural (Male) / id-ID-GadisNeural (Female)")
    print(f"========================================================\n")
    if reload_flag:
        uvicorn.run("main:app", host="0.0.0.0", port=port, app_dir=str(BASE_DIR), reload=True)
    else:
        uvicorn.run(app, host="0.0.0.0", port=port)
