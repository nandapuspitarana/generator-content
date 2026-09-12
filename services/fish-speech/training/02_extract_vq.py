"""
02_extract_vq.py
----------------
Extracts semantic VQ tokens from audio files using Fish-Speech VQ-GAN / DAC codec.
Outputs a paired .npy token file alongside each .wav and .lab file in the data folder.

Usage:
  python 02_extract_vq.py
  python 02_extract_vq.py --data-dir ../data/Speaker_Indonesia --batch-size 4
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# UTF-8 encoding for Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_vq_extraction(data_dir: Path, batch_size: int = 4, checkpoint_path: str = None):
    root_dir = Path(__file__).resolve().parent.parent
    fish_repo_dir = root_dir / "fish-speech-repo"
    
    print("=" * 65)
    print("  🎧 Fish-Speech VQ Token Extraction")
    print(f"  Target Audio Dir: {data_dir.resolve()}")
    print("=" * 65)

    if not data_dir.exists():
        print(f"❌ Error: Data directory not found at {data_dir.resolve()}")
        print("   Please run 01_download_dataset.py first.")
        sys.exit(1)

    wav_count = len(list(data_dir.glob("*.wav")))
    print(f"✅ Found {wav_count} WAV files to extract tokens from.")

    extract_script = fish_repo_dir / "tools" / "vqgan" / "extract_vq.py"
    if not extract_script.exists():
        print(f"\n⚠️  Fish-Speech repository not yet cloned at {fish_repo_dir.resolve()}.")
        print("   Running setup or fallback mode...")
        print("   To clone Fish-Speech and download codec checkpoint:")
        print("   git clone https://github.com/fishaudio/fish-speech.git services/fish-speech/fish-speech-repo")
        print("   huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini")
        print("\n💡 NOTE: You can also run this step directly in Google Colab (see 04_train_lora_colab.ipynb)!")
        return

    ckpt = checkpoint_path or str(root_dir / "checkpoints" / "fish-speech-1.5" / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth")
    cmd = [
        sys.executable,
        str(extract_script),
        str(data_dir.resolve()),
        "--num-workers", "1",
        "--batch-size", str(batch_size),
        "--config-name", "firefly_gan_vq",
        "--checkpoint-path", ckpt
    ]

    env = os.environ.copy()
    env["PYTHONPATH"] = str(fish_repo_dir.resolve()) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

    print(f"Executing: {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(fish_repo_dir), env=env, check=True)
    print("\n✅ VQ extraction finished successfully! .npy semantic tokens generated.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract VQ tokens from prepared dataset")
    parser.add_argument("--data-dir", type=str, default=str(Path(__file__).resolve().parent.parent / "data" / "Speaker_Indonesia"))
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--checkpoint", type=str, default=None)
    args = parser.parse_args()

    run_vq_extraction(Path(args.data_dir), args.batch_size, args.checkpoint)
