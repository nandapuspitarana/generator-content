#!/usr/bin/env python3
"""
pipeline.py
-----------
Master CLI and Automation Runner for Fish-Speech Indonesian TTS.
Coordinates dataset preparation, semantic extraction, protobuf building,
local GPU fine-tuning, LoRA merging, Hugging Face publishing, and API serving.

Usage:
  python pipeline.py                 # Interactive menu
  python pipeline.py --stage train   # Run specific stage
  python pipeline.py --stage all     # Run end-to-end pipeline
"""

import os
import sys
import shutil
import argparse
import subprocess
from pathlib import Path

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
TRAINING_DIR = BASE_DIR / "training"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
HF_REPO_ID = "nandapuspitarana/fish-speech-1.5-indonesian"


def print_banner():
    print("=" * 70)
    print("  🐟 FISH-SPEECH INDONESIAN TTS — MASTER PIPELINE RUNNER")
    print("  Repository: nandapuspitarana/fish-speech-1.5-indonesian")
    print("=" * 70)


def run_command(cmd: list[str], cwd: Path = BASE_DIR, env_extra: dict = None):
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    print(f"\n[RUN] {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(cwd), env=env)
    if result.returncode != 0:
        print(f"\n❌ Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    return result


def check_gpu():
    print("\n🔍 Checking Hardware & Environment...")
    try:
        import torch
        cuda_avail = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if cuda_avail else "None"
        bf16_ok = torch.cuda.is_bf16_supported() if cuda_avail else False
        print(f"   • PyTorch:        {torch.__version__}")
        print(f"   • CUDA Tersedia:  {cuda_avail}")
        print(f"   • GPU Perangkat:  {gpu_name}")
        print(f"   • Native bfloat16:{bf16_ok}")
    except ImportError:
        print("   ⚠️ PyTorch belum terpasang.")


def stage_download_base():
    """Download base model fishaudio/fish-speech-1.5."""
    print("\n▶ [Stage 0] Download Official Base Model (fish-speech-1.5)...")
    script = BASE_DIR / "download_model.py"
    run_command([sys.executable, str(script)])


def stage_download_dataset():
    """Download and segment Indonesian speech dataset."""
    print("\n▶ [Stage 1] Menyiapkan Dataset Audio Suara Bahasa Indonesia...")
    script = TRAINING_DIR / "01_download_dataset.py"
    run_command([sys.executable, str(script)], cwd=TRAINING_DIR)


def stage_extract_vq():
    """Extract Firefly-GAN VQ semantic tokens."""
    print("\n▶ [Stage 2] Ekstraksi Token Semantik Audio (Firefly VQGAN)...")
    script = TRAINING_DIR / "02_extract_vq.py"
    run_command([sys.executable, str(script)], cwd=TRAINING_DIR)


def stage_build_proto():
    """Pack semantic tokens and text labels into protobuf shards."""
    print("\n▶ [Stage 3] Membangun Protobuf Dataset Shards...")
    script = TRAINING_DIR / "03_build_proto.py"
    run_command([sys.executable, str(script)], cwd=TRAINING_DIR)


def stage_train_lora(max_steps: int = 100, val_interval: int = 25):
    """Fine-tune Dual-AR model with LoRA on local GPU."""
    print(f"\n▶ [Stage 4] Melatih Dual-AR LoRA Lokal ({max_steps} steps, validasi tiap {val_interval})...")
    script = TRAINING_DIR / "04_train_lora_local.py"
    run_command([
        sys.executable, str(script),
        "--max-steps", str(max_steps),
        "--val-interval", str(val_interval),
    ], cwd=TRAINING_DIR)


def stage_merge_and_test(test_text: str = None):
    """Merge LoRA weights into base model and synthesize test audio."""
    print("\n▶ [Stage 5] Penggabungan Bobot LoRA & Uji Coba Sintesis Audio...")
    ckpt_dir = BASE_DIR / "fish-speech-repo" / "results" / "indonesia-tts-local" / "checkpoints"
    ckpts = sorted(list(ckpt_dir.glob("*.ckpt")), reverse=True) if ckpt_dir.exists() else []

    if not ckpts:
        print("❌ Error: Checkpoint LoRA tidak ditemukan di results/indonesia-tts-local/checkpoints/")
        sys.exit(1)

    latest_ckpt = ckpts[0]
    out_dir = CHECKPOINTS_DIR / "indonesia-tts-local-merged"
    script = TRAINING_DIR / "05_merge_and_test.py"
    cmd = [
        sys.executable, str(script),
        "--lora-checkpoint", str(latest_ckpt),
        "--output", str(out_dir),
    ]
    if test_text:
        cmd.extend(["--test-text", test_text])

    run_command(cmd, cwd=TRAINING_DIR)


def stage_push_hf(repo_id: str = HF_REPO_ID, token: str = None, private: bool = False):
    """Publish merged model to Hugging Face Hub."""
    print(f"\n▶ [Stage 6] Mengunggah Model ke Hugging Face Hub ({repo_id})...")
    script = TRAINING_DIR / "06_push_to_hf.py"
    cmd = [
        sys.executable, str(script),
        "--repo-id", repo_id,
    ]
    if token:
        cmd.extend(["--token", token])
    if private:
        cmd.append("--private")

    run_command(cmd, cwd=TRAINING_DIR)


def stage_pull_hf(repo_id: str = HF_REPO_ID):
    """Pull fine-tuned Indonesian model from Hugging Face Hub."""
    print(f"\n▶ [Stage 7] Mengunduh Model Bahasa Indonesia dari Hugging Face ({repo_id})...")
    try:
        from huggingface_hub import snapshot_download
        out_dir = CHECKPOINTS_DIR / "indonesia-tts-local-merged"
        out_dir.mkdir(parents=True, exist_ok=True)
        snapshot_download(repo_id=repo_id, local_dir=str(out_dir))
        print(f"✅ Model berhasil diunduh dan tersimpan di: {out_dir}")
    except ImportError:
        print("❌ Error: Pasang huggingface_hub terlebih dahulu: pip install huggingface_hub")


def stage_serve(port: int = 8765):
    """Start the FastAPI TTS server."""
    print(f"\n▶ [Stage 8] Menjalankan Server Fish-Speech TTS di Port {port}...")
    run_command([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", str(port)])


def run_interactive_menu():
    print_banner()
    check_gpu()

    menu = """
Silakan pilih tahapan yang ingin dijalankan:
  [1] 📥 Download Pretrained Base Model (fish-speech-1.5)
  [2] 🎙️ Siapkan Dataset Suara Bahasa Indonesia (01_download_dataset)
  [3] ⚡ Ekstraksi Token Semantik Audio (02_extract_vq)
  [4] 📦 Bangun Protobuf Dataset Shards (03_build_proto)
  [5] 🚀 Latih Dual-AR LoRA di GPU Lokal (04_train_lora_local)
  [6] 🐟 Gabungkan Bobot LoRA & Uji Sintesis Audio (05_merge_and_test)
  [7] 🤗 Upload Model ke Hugging Face Hub (06_push_to_hf)
  [8] 📥 Tarik Model Bahasa Indonesia dari Hugging Face Hub
  [9] 🌐 Jalankan Server API FastAPI (main.py)
  [10]🎯 Jalankan Pipeline Penuh End-to-End (1 sampai 6)
  [0] Keluar
"""
    print(menu)
    try:
        choice = input("Masukkan nomor pilihan [0-10]: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nSelesai.")
        return

    if choice == "1":
        stage_download_base()
    elif choice == "2":
        stage_download_dataset()
    elif choice == "3":
        stage_extract_vq()
    elif choice == "4":
        stage_build_proto()
    elif choice == "5":
        steps = input("Jumlah langkah pelatihan (default: 100): ").strip()
        steps = int(steps) if steps.isdigit() else 100
        stage_train_lora(max_steps=steps)
    elif choice == "6":
        text = input("Teks uji coba (tekan enter untuk default): ").strip()
        stage_merge_and_test(text if text else None)
    elif choice == "7":
        token = os.environ.get("huggingface_token") or os.environ.get("HF_TOKEN")
        stage_push_hf(token=token)
    elif choice == "8":
        stage_pull_hf()
    elif choice == "9":
        stage_serve()
    elif choice == "10":
        stage_download_base()
        stage_download_dataset()
        stage_extract_vq()
        stage_build_proto()
        stage_train_lora()
        stage_merge_and_test()
        print("\n🎉 SELURUH PIPELINE TRAINING SELESAI DENGAN SUKSES!")
    elif choice == "0":
        print("Sampai jumpa!")
    else:
        print("Pilihan tidak valid.")


def main():
    parser = argparse.ArgumentParser(description="Fish-Speech Indonesian TTS Pipeline Master")
    parser.add_argument("--stage", type=str, choices=[
        "base", "dataset", "vq", "proto", "train", "merge", "push", "pull", "serve", "all"
    ], help="Stage name to execute non-interactively")
    parser.add_argument("--max-steps", type=int, default=100, help="Max steps for training")
    parser.add_argument("--val-interval", type=int, default=25, help="Validation interval")
    parser.add_argument("--repo-id", type=str, default=HF_REPO_ID, help="Hugging Face repo ID")
    parser.add_argument("--token", type=str, default=None, help="Hugging Face token")
    parser.add_argument("--private", action="store_true", help="Set HF repo to private")
    parser.add_argument("--port", type=int, default=8765, help="Port for FastAPI server")
    args = parser.parse_args()

    if args.stage is None:
        run_interactive_menu()
    else:
        print_banner()
        if args.stage == "base":
            stage_download_base()
        elif args.stage == "dataset":
            stage_download_dataset()
        elif args.stage == "vq":
            stage_extract_vq()
        elif args.stage == "proto":
            stage_build_proto()
        elif args.stage == "train":
            stage_train_lora(args.max_steps, args.val_interval)
        elif args.stage == "merge":
            stage_merge_and_test()
        elif args.stage == "push":
            token = args.token or os.environ.get("huggingface_token") or os.environ.get("HF_TOKEN")
            stage_push_hf(repo_id=args.repo_id, token=token, private=args.private)
        elif args.stage == "pull":
            stage_pull_hf(repo_id=args.repo_id)
        elif args.stage == "serve":
            stage_serve(port=args.port)
        elif args.stage == "all":
            stage_download_base()
            stage_download_dataset()
            stage_extract_vq()
            stage_build_proto()
            stage_train_lora(args.max_steps, args.val_interval)
            stage_merge_and_test()


if __name__ == "__main__":
    main()
