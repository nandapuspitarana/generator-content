import io
import re
import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("chattts_service")

app = FastAPI(
    title="ChatTTS Microservice",
    description="Dedicated speech synthesis microservice powered by 2noise/ChatTTS",
    version="1.0.0"
)

# Global model state
chat_model = None
is_model_ready = False

class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Input text to synthesize")
    temperature: Optional[float] = Field(0.3, ge=0.01, le=1.0, description="Sampling temperature")
    top_P: Optional[float] = Field(0.7, ge=0.1, le=1.0, description="Top-P sampling")
    top_K: Optional[int] = Field(20, ge=1, le=100, description="Top-K sampling")
    voice_seed: Optional[int] = Field(2222, description="Random seed for consistent speaker voice")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0, description="Playback speed factor")

def preprocess_text_for_chattts(raw_text: str) -> str:
    """
    Clean and adapt text for ChatTTS:
    - Converts SSML <break time="..."/> tags to ChatTTS pause tokens [break_4]
    - Cleans excessive markdown syntax
    - Normalizes punctuation
    """
    cleaned = re.sub(r'<break\s+time=["\']?([0-9.]+s?)["\']?\s*/?>', r' [break_4] ', raw_text, flags=re.IGNORECASE)
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned) # Remove remaining HTML/XML tags
    cleaned = re.sub(r'[#*_`~]', '', cleaned)  # Strip markdown formatting
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

@app.on_event("startup")
def load_chattts_model():
    global chat_model, is_model_ready
    try:
        logger.info("Initializing ChatTTS model...")
        import ChatTTS
        import torch

        chat = ChatTTS.Chat()
        # Compile=False is safer across standard CPU/CUDA environments
        compile_flag = os.getenv("CHATTTS_COMPILE", "false").lower() == "true"
        chat.load(compile=compile_flag)
        chat_model = chat
        is_model_ready = True
        logger.info("ChatTTS model loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load ChatTTS model at startup: {e}. Running in standby or mock mode.")
        is_model_ready = False

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if is_model_ready else "initializing_or_mock",
        "service": "chattts-microservice",
        "model_loaded": is_model_ready
    }

@app.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    global chat_model, is_model_ready

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    clean_text = preprocess_text_for_chattts(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text contains no readable speech content")

    logger.info(f"Synthesizing text of length {len(clean_text)} characters (seed={req.voice_seed})")

    # If ChatTTS is installed and initialized
    if is_model_ready and chat_model is not None:
        try:
            import torch
            import numpy as np
            import soundfile as sf

            if req.voice_seed is not None:
                torch.manual_seed(req.voice_seed)
                rand_spk = chat_model.sample_random_speaker()
            else:
                rand_spk = None

            params_infer_code = {
                'spk_emb': rand_spk,
                'temperature': req.temperature,
                'top_P': req.top_P,
                'top_K': req.top_K,
            }

            wavs = chat_model.infer([clean_text], params_infer_code=params_infer_code, use_decoder=True)

            if not wavs or len(wavs) == 0:
                raise HTTPException(status_code=500, detail="ChatTTS failed to generate audio samples")

            audio_data = wavs[0]
            # Convert 2D tensor/array to 1D if necessary
            if hasattr(audio_data, 'cpu'):
                audio_data = audio_data.cpu().numpy()
            if isinstance(audio_data, np.ndarray) and audio_data.ndim > 1:
                audio_data = audio_data.squeeze()

            # ChatTTS standard output sample rate is 24000 Hz
            sample_rate = 24000

            buffer = io.BytesIO()
            sf.write(buffer, audio_data, samplerate=sample_rate, format='WAV', subtype='PCM_16')
            buffer.seek(0)

            return Response(
                content=buffer.getvalue(),
                media_type="audio/wav",
                headers={
                    "Content-Disposition": "inline; filename=\"speech.wav\"",
                    "X-Audio-Sample-Rate": str(sample_rate)
                }
            )
        except Exception as err:
            logger.error(f"Inference error: {err}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Inference error: {str(err)}")

    # Standby fallback: generate an empty/minimal valid WAV header so clients do not crash during dev/test
    logger.warning("ChatTTS model is not loaded; returning diagnostic placeholder WAV.")
    try:
        import soundfile as sf
        import numpy as np

        sample_rate = 24000
        # Generate 0.5s silent/gentle tone placeholder for tests when weights are absent
        t = np.linspace(0, 0.5, int(sample_rate * 0.5), False)
        # 440 Hz gentle sine wave
        audio_placeholder = (np.sin(2 * np.pi * 440 * t) * 0.1).astype(np.float32)

        buffer = io.BytesIO()
        sf.write(buffer, audio_placeholder, samplerate=sample_rate, format='WAV', subtype='PCM_16')
        buffer.seek(0)

        return Response(
            content=buffer.getvalue(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=\"placeholder.wav\"",
                "X-ChatTTS-Mode": "fallback-test"
            }
        )
    except Exception as fallback_err:
        raise HTTPException(
            status_code=503,
            detail=f"ChatTTS model not ready and fallback audio generator failed: {fallback_err}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8765"))
    reload_flag = os.getenv("RELOAD", "false").lower() == "true"
    print(f"\n========================================================")
    print(f"  🎙️ ChatTTS Microservice Starting")
    print(f"  Local API: http://localhost:{port}")
    print(f"  Health Check: http://localhost:{port}/health")
    print(f"  Synthesize:   POST http://localhost:{port}/synthesize")
    print(f"========================================================\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload_flag)

