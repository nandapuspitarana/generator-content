# Data Model & Schema Specifications: ChatTTS Microservice

## 1. Zod Validation Schema (Next.js Gateway)

**File**: `src/lib/validation/schemas.ts`

```typescript
export const TtsSynthesizeSchema = z.object({
  text: z
    .string()
    .min(1, "Teks untuk disintesis wajib diisi")
    .max(5000, "Teks maksimal 5000 karakter"),
  temperature: z
    .number()
    .min(0.01)
    .max(1.0)
    .optional()
    .default(0.3),
  top_P: z
    .number()
    .min(0.1)
    .max(1.0)
    .optional()
    .default(0.7),
  top_K: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  voice_seed: z
    .number()
    .int()
    .optional()
    .default(2222),
  speed: z
    .number()
    .min(0.5)
    .max(2.0)
    .optional()
    .default(1.0),
});

export type TtsSynthesizeInput = z.infer<typeof TtsSynthesizeSchema>;
```

---

## 2. Pydantic Request Model (Python FastAPI)

**File**: `services/chattts/main.py`

```python
class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Input text to synthesize")
    temperature: Optional[float] = Field(0.3, ge=0.01, le=1.0, description="Sampling temperature")
    top_P: Optional[float] = Field(0.7, ge=0.1, le=1.0, description="Top-P sampling")
    top_K: Optional[int] = Field(20, ge=1, le=100, description="Top-K sampling")
    voice_seed: Optional[int] = Field(2222, description="Random seed for consistent speaker voice")
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0, description="Playback speed factor")
```

---

## 3. Audio Output Specification

| Property | Value | Description |
|---|---|---|
| **Container Format** | WAV (`audio/wav`) | Standard RIFF header |
| **Audio Encoding** | PCM 16-bit (`PCM_16`) | Uncompressed, wide browser support |
| **Sampling Rate** | 24,000 Hz (24kHz) | ChatTTS native audio sample rate |
| **Channels** | 1 (Mono) / 2 (Stereo) | 1D squeezed waveform |
| **Streaming** | Binary buffer | Direct response body streaming |

---

## 4. Health Check Response Model

```json
{
  "status": "healthy",
  "service": "chattts-microservice",
  "model_loaded": true
}
```

---

## 5. Error Responses & Status Codes

| HTTP Status | Trigger Scenario | Response Format |
|---|---|---|
| **400 Bad Request** | Teks kosong, panjang > 5000, JSON rusak | `{"error": "Validasi gagal", "details": {...}}` |
| **429 Too Many Requests** | Request melebihi 20 req/menit | `{"error": "Rate limit exceeded..."}` |
| **503 Service Unavailable** | Microservice down / `CHATTTS_ENABLED=false` | `{"error": "ChatTTS microservice tidak dapat dihubungi..."}` |
| **504 Gateway Timeout** | Inferensi memakan waktu > 90s | `{"error": "Sintesis suara ChatTTS melebihi batas waktu (timeout)."}` |
