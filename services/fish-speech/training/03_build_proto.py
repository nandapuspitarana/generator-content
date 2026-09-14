"""
03_build_proto.py
-----------------
Packs the extracted .wav, .lab, and .npy semantic tokens into
Fish-Speech Protobuf dataset format for LLAMA / Dual-AR model training.

Usage:
  python 03_build_proto.py
  python 03_build_proto.py --input ../data/Speaker_Indonesia --output ../data/protos
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def build_protobuf_dataset(input_dir: Path, output_dir: Path, num_workers: int = 2):
    root_dir = Path(__file__).resolve().parent.parent
    fish_repo_dir = root_dir / "fish-speech-repo"

    print("=" * 65)
    print("  📦 Fish-Speech Protobuf Dataset Builder")
    print(f"  Input Directory:  {input_dir.resolve()}")
    print(f"  Output Directory: {output_dir.resolve()}")
    print("=" * 65)

    if not input_dir.exists():
        print(f"❌ Input directory not found: {input_dir.resolve()}")
        sys.exit(1)

    build_script = fish_repo_dir / "tools" / "llama" / "build_dataset.py"
    if not build_script.exists():
        print(f"\n⚠️  Fish-Speech repository not found at {fish_repo_dir.resolve()}.")
        print("   To build protobufs locally, Fish-Speech repo must be present.")
        print("   Alternatively, run this step in Google Colab (04_train_lora_colab.ipynb)!")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(build_script),
        "--input", str(input_dir.resolve()),
        "--output", str(output_dir.resolve()),
        "--text-extension", ".lab",
        "--num-workers", str(num_workers)
    ]

    env = os.environ.copy()
    env["PYTHONPATH"] = str(fish_repo_dir.resolve()) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

    print(f"Executing: {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(fish_repo_dir), env=env, check=True)
    print("\n✅ Protobuf dataset built successfully! Ready for LoRA fine-tuning.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pack dataset into Protobuf format")
    parser.add_argument("--input", type=str, default=str(Path(__file__).resolve().parent.parent / "data"))
    parser.add_argument("--output", type=str, default=str(Path(__file__).resolve().parent.parent / "data" / "protos"))
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()

    build_protobuf_dataset(Path(args.input), Path(args.output), args.workers)
