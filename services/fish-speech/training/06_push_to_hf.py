"""
06_push_to_hf.py
----------------
Uploads the merged Fish-Speech Indonesian TTS model to Hugging Face Hub
complete with Model Card (README.md), metadata, tags, and sample audio.

Usage:
  python 06_push_to_hf.py --repo-id <username>/<model-name> [--token <hf_token>] [--private]
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from huggingface_hub import HfApi, create_repo, upload_folder

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def generate_model_card(output_path: Path, repo_id: str):
    readme_content = f"""---
language:
- id
license: apache-2.0
tags:
- text-to-speech
- tts
- fish-speech
- audio
- pytorch
- speech-synthesis
datasets:
- custom-indonesian-voice
pipeline_tag: text-to-speech
---

# 🐟 Fish-Speech 1.5 - Bahasa Indonesia TTS

Model *Text-to-Speech* (TTS) Bahasa Indonesia berbasis arsitektur **Dual-AR Transformer** dari Fish-Speech 1.5 yang di-*fine-tune* menggunakan LoRA dan kemudian digabungkan secara permanen (*merged weights*).

## 📊 Detail Pelatihan & Metrik

Model dilatih menggunakan akselerasi GPU lokal NVIDIA RTX 5060 Ti dengan native hardware `bfloat16`:

- **Base Model**: Fish-Speech 1.5 (Dual-AR Transformer, 644M parameter)
- **Neural Vocoder / Tokenizer**: Firefly-GAN VQ (8 codebooks @ 21.5 Hz) + Tiktoken
- **Dataset**: Rekaman audio percakapan Bahasa Indonesia (24 kHz PCM_16)
- **Hasil Metrik Evaluasi (Step 100)**:
  - **Total Loss**: `4.1250` (turun dari `7.9062` pada Step 25)
  - **Top-5 Accuracy**: `63.67%` (naik dari `37.11%` pada Step 25)
  - **Base Loss**: `1.4609`
  - **Semantic Loss**: `2.6562`

---

## 🚀 Cara Penggunaan (Inference)

### 1. Download Model dari Hugging Face
```python
from huggingface_hub import snapshot_download

model_path = snapshot_download(repo_id="{repo_id}")
print(f"Model tersimpan di: {{model_path}}")
```

### 2. Jalankan Sintesis Suara (Python)
```python
import torch
import soundfile as sf
from fish_speech.inference_engine import TTSInferenceEngine
from fish_speech.models.text2semantic.inference import launch_thread_safe_queue
from fish_speech.models.vqgan.inference import load_model as load_decoder_model
from fish_speech.utils.schema import ServeTTSRequest

# Inisialisasi LLaMA Dual-AR queue
llama_queue = launch_thread_safe_queue(
    checkpoint_path=model_path,
    device="cuda" if torch.cuda.is_available() else "cpu",
    precision=torch.bfloat16,
    compile=False,
)

# Inisialisasi Firefly-GAN VQ decoder
decoder = load_decoder_model(
    config_name="firefly_gan_vq",
    checkpoint_path=f"{{model_path}}/firefly-gan-vq-fsq-8x1024-21hz-generator.pth",
    device="cuda" if torch.cuda.is_available() else "cpu",
)

engine = TTSInferenceEngine(llama_queue=llama_queue, decoder_model=decoder)

# Sintesis Teks Bahasa Indonesia
request = ServeTTSRequest(
    text="Halo semua! Model Fish-Speech Bahasa Indonesia ini siap digunakan.",
    references=[],
    max_new_tokens=256,
)

for result in engine.inference(request):
    if result.code == "final" and result.audio is not None:
        sample_rate, audio_data = result.audio
        sf.write("output_audio.wav", audio_data, sample_rate)
        print("Audio berhasil disimpan ke output_audio.wav")
```
"""
    output_path.write_text(readme_content, encoding="utf-8")
    print(f"✅ Generated Model Card: {output_path}")


def push_model(repo_id: str, token: str = None, private: bool = False, model_dir: Path = None):
    root_dir = Path(__file__).resolve().parent.parent
    if model_dir is None:
        model_dir = root_dir / "checkpoints" / "indonesia-tts-local-merged"

    if not model_dir.exists():
        print(f"❌ Error: Model directory not found at {model_dir.resolve()}")
        sys.exit(1)

    print("=" * 65)
    print("  🚀 Hugging Face Hub Model Uploader")
    print(f"  Repository ID:   {repo_id}")
    print(f"  Visibility:      {'Private' if private else 'Public'}")
    print(f"  Model Directory: {model_dir.resolve()}")
    print("=" * 65)

    api = HfApi(token=token)
    user = api.whoami()
    print(f"🔑 Logged in as: {user['name']} ({user.get('email', '')})")

    # 1. Create or verify repository on Hugging Face
    print(f"\n📦 Verifying repository: {repo_id}...")
    url = create_repo(
        repo_id=repo_id,
        token=token,
        private=private,
        repo_type="model",
        exist_ok=True,
    )
    print(f"✅ Repository ready: {url}")

    # 2. Generate README.md Model Card if not exists
    readme_path = model_dir / "README.md"
    generate_model_card(readme_path, repo_id)

    # 3. Copy sample audio for model card showcase
    sample_src = root_dir / "test_indonesia_merged.wav"
    sample_dst = model_dir / "sample_indonesia.wav"
    if sample_src.exists():
        shutil.copy2(sample_src, sample_dst)
        print(f"✅ Included audio demo: {sample_dst.name}")

    # 4. Upload folder to Hugging Face Hub
    print(f"\n⏳ Uploading model files to {repo_id} (this may take 1-3 minutes depending on internet connection)...")
    upload_folder(
        repo_id=repo_id,
        folder_path=str(model_dir.resolve()),
        token=token,
        repo_type="model",
        commit_message="Initial release: Fish-Speech 1.5 Indonesian TTS fine-tuned model",
    )

    print("\n" + "=" * 65)
    print("  🎉 SUCCESS! Model successfully published to Hugging Face Hub!")
    print(f"  🔗 URL: https://huggingface.co/{repo_id}")
    print("=" * 65)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload Fish-Speech model to Hugging Face Hub")
    parser.add_argument("--repo-id", type=str, required=True, help="Target HF repo, e.g. username/fish-speech-indonesia")
    parser.add_argument("--token", type=str, default=None, help="Hugging Face Access Token (or uses saved token)")
    parser.add_argument("--private", action="store_true", help="Set repository to private")
    parser.add_argument("--model-dir", type=str, default=None, help="Path to merged model folder")
    args = parser.parse_args()

    token = args.token or os.environ.get("HF_TOKEN")
    push_model(args.repo_id, token, args.private, Path(args.model_dir) if args.model_dir else None)
