# Data Model & Schema Specifications: Fish-Speech Microservice

Dokumentasi model data, skema validasi Zod, Pydantic DTO, dan entitas audio stream untuk microservice **Fish-Speech**.

---

## 1. Skema Validasi Zod (Next.js Gateway)

**File**: `src/lib/validation/schemas.ts`

```typescript
export const TtsSynthesizeSchema = z.object({
  text: z
    .string()
    .min(1, "Teks untuk disintesis wajib diisi")
    .max(10000, "Teks maksimal 10.000 karakter"),
  temperature: z
    .number()
    .min(0.01)
    .max(1.5)
    .optional()
    .default(0.7),
  top_p: z
    .number()
    .min(0.1)
    .max(1.0)
    .optional()
    .default(0.8),
  top_P: z.number().optional(), // alias
  top_k: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(30),
  top_K: z.number().optional(), // alias
  voice_seed: z
    .number()
    .int()
    .optional()
    .default(2222),
  seed: z.number().int().optional(), // alias
  speed: z
    .number()
    .min(0.5)
    .max(2.0)
    .optional()
    .default(1.0),
  paragraph_delay: z
    .number()
    .min(0.0)
    .max(5.0)
    .optional()
    .default(1.0),
  reference_audio: z.string().nullable().optional(),
  reference_text: z.string().nullable().optional(),
  model: z.string().optional().default("default"),
});

export type TtsSynthesizeInput = z.infer<typeof TtsSynthesizeSchema>;
```

---

## 2. Pydantic Model (Python FastAPI)

**File**: `services/fish-speech/main.py`

```python
class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Teks atau naskah dialog")
    reference_audio: Optional[str] = Field(None, description="Path atau Base64 audio referensi zero-shot cloning")
    reference_text: Optional[str] = Field(None, description="Transkrip teks dari audio referensi")
    model: Optional[str] = Field("default", description="Pilihan checkpoint model ('default', 'indonesia-lora', 'base')")
    temperature: Optional[float] = Field(0.7, ge=0.01, le=1.5)
    top_p: Optional[float] = Field(0.8, ge=0.1, le=1.0)
    top_P: Optional[float] = Field(None)
    top_k: Optional[int] = Field(30, ge=1, le=100)
    top_K: Optional[int] = Field(None)
    voice_seed: Optional[int] = Field(2222)
    seed: Optional[int] = Field(None)
    speed: Optional[float] = Field(1.0, ge=0.5, le=2.0)
    paragraph_delay: Optional[float] = Field(1.0, ge=0.0, le=5.0)
```

---

## 3. Background Job Data Models

```python
class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobRecord:
    job_id: str
    status: JobStatus
    created_at: float
    total_segments: int
    completed_segments: int
    audio_bytes: Optional[bytes]
    error_message: Optional[str]
```

---

## 4. Spesifikasi Biner Output Audio

| Properti | Nilai | Keterangan |
|---|---|---|
| **Format Kontainer** | WAV (`audio/wav`) | Standar RIFF Header |
| **Encoding Audio** | PCM 16-bit (`PCM_16`) | Uncompressed, kompatibel dengan seluruh web browser |
| **Sampling Rate** | 24.000 Hz (24kHz) | Kualitas standar studio audio podcast |
| **Channels** | 1 (Mono) | Optimized untuk kejelasan vokal manusia |
| **Stitching Engine** | NumPy concatenation | Penggabungan segmen audio & hening zero-glitch |

---

## 5. Model Data Masa Depan / Roadmap (Pending)

### Multi-Speaker Dialogue Script Schema *(Pending)*
```typescript
interface MultiSpeakerScript {
  segments: {
    speaker: "ardi" | "gadis" | "andrew" | "emma";
    voice_seed: number;
    text: string;
    pause_after: number;
  }[];
}
```
