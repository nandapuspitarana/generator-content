"""
setup.py
--------
Setup script for Fish-Speech environment:
1. Checks CUDA capability and GPU status (GTX 1650 / RTX GPUs)
2. Clones Fish-Speech repository if not yet present
3. Downloads the base model fishaudio/fish-speech-1.5 via Hugging Face Hub
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
REPO_DIR = ROOT_DIR / "fish-speech-repo"
CHECKPOINTS_DIR = ROOT_DIR / "checkpoints" / "fish-speech-1.5"
FISH_SPEECH_GIT_URL = "https://github.com/fishaudio/fish-speech.git"


def check_gpu():
    print("\n[1/3] Checking GPU & PyTorch Acceleration...")
    try:
        import torch
        cuda_ok = torch.cuda.is_available()
        print(f"  PyTorch Version: {torch.__version__}")
        print(f"  CUDA Available:  {cuda_ok}")
        if cuda_ok:
            dev_name = torch.cuda.get_device_name(0)
            vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            print(f"  GPU Device:      {dev_name} ({vram_gb:.2f} GB VRAM)")
            print("  Status:          ✅ GPU ready for Fish-Speech FP16 inference!")
        else:
            print("  Status:          ⚠️ Running on CPU mode.")
    except ImportError:
        print("  ❌ PyTorch not installed. Please run: pip install torch torchaudio")


def clone_repo():
    print("\n[2/3] Checking Fish-Speech Repository...")
    if (REPO_DIR / ".git").exists() or (REPO_DIR / "fish_speech").exists():
        print(f"  ✅ Fish-Speech repository already present at: {REPO_DIR.resolve()}")
    else:
        print(f"  Cloning {FISH_SPEECH_GIT_URL} into {REPO_DIR.resolve()}...")
        try:
            subprocess.run(["git", "clone", "--depth", "1", FISH_SPEECH_GIT_URL, str(REPO_DIR.resolve())], check=True)
            print("  ✅ Repository cloned successfully!")
        except Exception as e:
            print(f"  ⚠️ Could not clone automatically: {e}")
            print(f"     Run manually: git clone --depth 1 {FISH_SPEECH_GIT_URL} {REPO_DIR}")


def download_base_model():
    print("\n[3/3] Checking Base Model Checkpoint (fish-speech-1.5)...")
    try:
        from download_model import download_fish_speech_model
        download_fish_speech_model("fishaudio/fish-speech-1.5", CHECKPOINTS_DIR)
    except Exception as e:
        print(f"  ⚠️ Invoking download_model.py fallback: {e}")
        subprocess.run([sys.executable, str(ROOT_DIR / "download_model.py")])


if __name__ == "__main__":
    print("=" * 65)
    print("  🐟 Fish-Speech Setup & Diagnostic Utility")
    print("=" * 65)
    check_gpu()
    clone_repo()
    download_base_model()
    print("\n" + "=" * 65)
    print("  🎉 Setup check complete!")
    print("  To launch the microservice:")
    print("     npm run tts:dev")
    print("  To download model weights directly:")
    print("     npm run tts:download-model")
    print("=" * 65 + "\n")
