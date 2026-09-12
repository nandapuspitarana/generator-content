#!/usr/bin/env python3
"""
📥 Fish-Speech v1.5 Model & Checkpoints Downloader
Downloads official neural weights from Hugging Face for 100% offline local synthesis.
- Base Model: fishaudio/fish-speech-1.5 (~1.4 GB total)
  * model.pth (~1.2 GB) - Autoregressive Dual-Transformer
  * firefly-gan-vq-fsq-8x1024-21hz-generator.pth (~180 MB) - High-Definition VQ Audio Codec
  * config.json, special_tokens.json, tokenizer.tiktoken
- Official Fish-Speech Source: clones fishaudio/fish-speech into fish-speech-repo/

Usage:
    python download_model.py                   # Download all weights and clone repo
    python download_model.py --verify-only     # Verify downloaded files without downloading
    python download_model.py --no-clone        # Download model weights only
"""

import os
import sys
import shutil
import argparse
import subprocess
from pathlib import Path

# UTF-8 terminal output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
REPO_DIR = BASE_DIR / "fish-speech-repo"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
DEFAULT_MODEL_REPO = "fishaudio/fish-speech-1.5"
FISH_SPEECH_GIT_URL = "https://github.com/fishaudio/fish-speech.git"

REQUIRED_FILES = [
    "model.pth",
    "firefly-gan-vq-fsq-8x1024-21hz-generator.pth",
    "config.json",
    "special_tokens.json",
    "tokenizer.tiktoken",
]


def clone_fish_speech_repo(target_dir: Path):
    """Clones official Fish-Speech repository shallowly if not already present."""
    print("\n" + "=" * 65)
    print("  🐙 [1/2] Memeriksa Repository Fish-Speech (fish-speech-repo)")
    print("=" * 65)

    if (target_dir / ".git").exists() or (target_dir / "fish_speech").exists():
        print(f"  ✅ Repository Fish-Speech sudah tersedia di: {target_dir.resolve()}")
        return True

    print(f"  Mengkloning {FISH_SPEECH_GIT_URL} (shallow clone --depth 1)...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", FISH_SPEECH_GIT_URL, str(target_dir.resolve())],
            check=True
        )
        print(f"  ✅ Berhasil mengkloning repository ke {target_dir.resolve()}!")
        return True
    except Exception as err:
        print(f"  ⚠️ Gagal mengkloning otomatis: {err}")
        print(f"     Anda dapat mengkloning manual: git clone --depth 1 {FISH_SPEECH_GIT_URL} {target_dir}")
        return False


def verify_checkpoint_integrity(target_dir: Path) -> tuple[bool, list[str]]:
    """Verifies that all required model weight files exist and have non-zero size."""
    missing = []
    if not target_dir.exists():
        return False, REQUIRED_FILES

    for fname in REQUIRED_FILES:
        fpath = target_dir / fname
        if not fpath.exists() or fpath.stat().st_size == 0:
            missing.append(fname)

    return len(missing) == 0, missing


def setup_codec_alias(target_dir: Path):
    """Creates a codec.pth alias/symlink pointing to the VQ generator for legacy compatibility."""
    vq_gen = target_dir / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth"
    codec_alias = target_dir / "codec.pth"
    legacy_openaudio_dir = CHECKPOINTS_DIR / "openaudio-s1-mini"

    if vq_gen.exists():
        # Alias in the same folder
        if not codec_alias.exists():
            try:
                # Try symlink or hardlink first, fallback to copy
                try:
                    codec_alias.symlink_to(vq_gen.name)
                    print(f"  🔗 Dibuat symlink codec.pth -> {vq_gen.name}")
                except (OSError, NotImplementedError):
                    shutil.copyfile(vq_gen, codec_alias)
                    print(f"  📋 Dibuat salinan alias codec.pth ({vq_gen.name})")
            except Exception as e:
                print(f"  ⚠️ Catatan alias codec.pth: {e}")

        # Also support legacy openaudio-s1-mini folder reference if needed
        legacy_openaudio_dir.mkdir(parents=True, exist_ok=True)
        legacy_codec = legacy_openaudio_dir / "codec.pth"
        if not legacy_codec.exists():
            try:
                try:
                    legacy_codec.symlink_to(str(vq_gen.resolve()))
                except (OSError, NotImplementedError):
                    shutil.copyfile(vq_gen, legacy_codec)
            except Exception:
                pass


def download_fish_speech_model(repo_id: str, target_dir: Path) -> bool:
    """Downloads model checkpoint snapshot from Hugging Face Hub."""
    print("\n" + "=" * 65)
    print(f"  🐟 [2/2] Mengunduh Bobot Model Fish-Speech v1.5 ({repo_id})")
    print("=" * 65)

    target_dir.mkdir(parents=True, exist_ok=True)

    # Check if already fully downloaded
    is_valid, missing = verify_checkpoint_integrity(target_dir)
    if is_valid:
        print(f"  ✅ Semua file checkpoint sudah lengkap di: {target_dir.resolve()}")
        setup_codec_alias(target_dir)
        return True

    print(f"  Target direktori: {target_dir.resolve()}")
    print("  File yang akan diunduh (~1.4 GB):")
    for f in REQUIRED_FILES:
        print(f"    - {f}")
    print()

    try:
        from huggingface_hub import snapshot_download
        print(f"  🚀 Memulai unduhan dari Hugging Face Hub ({repo_id})...")
        snapshot_download(
            repo_id=repo_id,
            local_dir=str(target_dir.resolve()),
            allow_patterns=REQUIRED_FILES + ["*.json", "*.tiktoken", "*.pth"],
            ignore_patterns=["*.bin", "*.msgpack", "*.safetensors.index.json"],
            resume_download=True,
        )
        print("  ✅ Unduhan snapshot model selesai!")

        setup_codec_alias(target_dir)

        is_valid_after, missing_after = verify_checkpoint_integrity(target_dir)
        if is_valid_after:
            print("\n  🎉 Verifikasi Berhasil: Seluruh file bobot model siap digunakan secara offline!")
            return True
        else:
            print(f"\n  ⚠️ Beberapa file belum terunduh sempurna: {missing_after}")
            return False

    except ImportError:
        print("  ❌ Modul huggingface_hub belum terpasang.")
        print("     Jalankan: pip install huggingface_hub")
        return False
    except Exception as err:
        print(f"  ❌ Terjadi kesalahan saat mengunduh: {err}")
        print("     Anda dapat mengunduh manual dengan perintah:")
        print(f"     huggingface-cli download {repo_id} --local-dir {target_dir.resolve()}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download & cache Fish-Speech neural model checkpoints")
    parser.add_argument("--repo-id", type=str, default=DEFAULT_MODEL_REPO, help="Hugging Face repository ID")
    parser.add_argument("--dir-name", type=str, default="fish-speech-1.5", help="Subdirectory name in checkpoints/")
    parser.add_argument("--no-clone", action="store_true", help="Skip cloning the Fish-Speech repo")
    parser.add_argument("--verify-only", action="store_true", help="Only verify integrity of existing files")
    args = parser.parse_args()

    model_target_dir = CHECKPOINTS_DIR / args.dir_name

    print("\n" + "#" * 65)
    print("  🐟 Fish-Speech Local Model Checkpoint Manager")
    print("#" * 65)

    if args.verify_only:
        is_ok, missing = verify_checkpoint_integrity(model_target_dir)
        if is_ok:
            print(f"✅ Checkpoint {args.repo_id} VALID dan LENGKAP di {model_target_dir.resolve()}")
            setup_codec_alias(model_target_dir)
            sys.exit(0)
        else:
            print(f"❌ Checkpoint TIDAK LENGKAP. File hilang: {missing}")
            sys.exit(1)

    # 1. Clone repository
    if not args.no_clone:
        clone_fish_speech_repo(REPO_DIR)

    # 2. Download model snapshot
    success = download_fish_speech_model(args.repo_id, model_target_dir)

    print("\n" + "=" * 65)
    if success:
        print("  ✨ STATUS: SEMUA BOBOT MODEL OFFLINE TELAH SIAP (100% OK)!")
        print(f"  Lokasi Model: {model_target_dir.resolve()}")
        print("  Jalankan server dengan: python run.py")
    else:
        print("  ⚠️ STATUS: Pengunduhan belum selesai atau perlu diulang.")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
