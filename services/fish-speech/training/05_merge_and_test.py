"""
05_merge_and_test.py
--------------------
Merges fine-tuned LoRA checkpoint from Google Colab into the base Fish-Speech model,
and performs an end-to-end verification synthesis in Indonesian.

Usage:
  python 05_merge_and_test.py
  python 05_merge_and_test.py --lora-checkpoint checkpoints/indonesia-tts-lora/step_000000200.ckpt
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def merge_and_test(lora_ckpt: Path, output_dir: Path, test_text: str):
    root_dir = Path(__file__).resolve().parent.parent
    fish_repo_dir = root_dir / "fish-speech-repo"
    base_weight = root_dir / "checkpoints" / "openaudio-s1-mini"

    print("=" * 65)
    print("  🐟 Fish-Speech LoRA Merge & Indonesian Verification")
    print(f"  LoRA Checkpoint: {lora_ckpt.resolve()}")
    print(f"  Output Model:    {output_dir.resolve()}")
    print("=" * 65)

    merge_script = fish_repo_dir / "tools" / "llama" / "merge_lora.py"
    if not merge_script.exists():
        print(f"⚠️  Fish-Speech repo not found at {fish_repo_dir.resolve()}.")
        print("   If you trained in Colab, the merged model is already usable or you can use LoRA checkpoint directly.")
        return

    if not lora_ckpt.exists():
        print(f"❌ LoRA checkpoint not found: {lora_ckpt.resolve()}")
        print("   Place your downloaded checkpoint from Colab into checkpoints/ folder.")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    merge_cmd = [
        sys.executable,
        str(merge_script),
        "--lora-config", "r_8_alpha_16",
        "--base-weight", str(base_weight.resolve()),
        "--lora-weight", str(lora_ckpt.resolve()),
        "--output", str(output_dir.resolve())
    ]
    print(f"Executing: {' '.join(merge_cmd)}")
    subprocess.run(merge_cmd, check=True)
    print("✅ Model weights merged successfully!")

    # Test synthesis
    generate_script = fish_repo_dir / "tools" / "llama" / "generate.py"
    if generate_script.exists():
        test_out = root_dir / "test_indonesia_merged.wav"
        gen_cmd = [
            sys.executable,
            str(generate_script),
            "--text", test_text,
            "--checkpoint-path", str(output_dir.resolve()),
            "--output", str(test_out.resolve())
        ]
        print(f"Running test synthesis: {test_text}")
        subprocess.run(gen_cmd, check=True)
        print(f"🎉 Synthesis success! Test audio saved to: {test_out.resolve()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge LoRA and test Fish-Speech")
    parser.add_argument("--lora-checkpoint", type=str, default=str(Path(__file__).resolve().parent.parent / "checkpoints" / "indonesia-lora.ckpt"))
    parser.add_argument("--output", type=str, default=str(Path(__file__).resolve().parent.parent / "checkpoints" / "indonesia-tts-merged"))
    parser.add_argument("--test-text", type=str, default="Halo semua! Ini adalah suara hasil fine-tuning model Fish-Speech Bahasa Indonesia.")
    args = parser.parse_args()

    merge_and_test(Path(args.lora_checkpoint), Path(args.output), args.test_text)
