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
    base_weight = root_dir / "checkpoints" / "fish-speech-1.5"

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

    env = os.environ.copy()
    env["PYTHONPATH"] = str(fish_repo_dir.resolve()) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

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
    subprocess.run(merge_cmd, env=env, cwd=str(fish_repo_dir), check=True)
    print("✅ Model weights merged successfully!")

    # Copy firefly decoder generator to output dir for fully self-contained deployment
    decoder_src = root_dir / "checkpoints" / "fish-speech-1.5" / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth"
    decoder_dst = output_dir / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth"
    if decoder_src.exists() and not decoder_dst.exists():
        import shutil
        shutil.copy2(decoder_src, decoder_dst)
        print(f"✅ Copied VQGAN decoder generator to {decoder_dst.resolve()}")

    # Test synthesis using TTSInferenceEngine
    decoder_ckpt = root_dir / "checkpoints" / "fish-speech-1.5" / "firefly-gan-vq-fsq-8x1024-21hz-generator.pth"
    if decoder_ckpt.exists():
        print(f"Running test synthesis: {test_text}")
        test_out = root_dir / "test_indonesia_merged.wav"
        env = os.environ.copy()
        env["PYTHONPATH"] = str(fish_repo_dir.resolve()) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")
        test_script = f"""
import soundfile as sf
import torch
from pathlib import Path
from fish_speech.inference_engine import TTSInferenceEngine
from fish_speech.models.text2semantic.inference import launch_thread_safe_queue
from fish_speech.models.vqgan.inference import load_model as load_decoder_model
from fish_speech.utils.schema import ServeTTSRequest

llama_queue = launch_thread_safe_queue(
    checkpoint_path=r'{output_dir.resolve()}',
    device='cuda' if torch.cuda.is_available() else 'cpu',
    precision=torch.bfloat16,
    compile=False,
)
decoder_model = load_decoder_model(
    config_name='firefly_gan_vq',
    checkpoint_path=r'{decoder_ckpt.resolve()}',
    device='cuda' if torch.cuda.is_available() else 'cpu',
)
engine = TTSInferenceEngine(
    llama_queue=llama_queue,
    decoder_model=decoder_model,
    precision=torch.bfloat16,
    compile=False,
)
req = ServeTTSRequest(
    text='{test_text}',
    references=[],
    max_new_tokens=256,
    chunk_length=150,
    top_p=0.7,
    repetition_penalty=1.2,
    temperature=0.7,
    format='wav',
)
results = list(engine.inference(req))
for r in results:
    if r.code == 'final' and r.audio is not None:
        sr, audio_arr = r.audio
        sf.write(r'{test_out.resolve()}', audio_arr, sr)
        print('Audio successfully written to file.')
"""
        subprocess.run([sys.executable, "-c", test_script], env=env, cwd=str(fish_repo_dir), check=True)
        print(f"🎉 Synthesis success! Test audio saved to: {test_out.resolve()}")
    else:
        print(f"Decoder checkpoint not found at {decoder_ckpt.resolve()}, skipping synthesis test.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge LoRA and test Fish-Speech")
    parser.add_argument("--lora-checkpoint", type=str, default=str(Path(__file__).resolve().parent.parent / "checkpoints" / "indonesia-lora.ckpt"))
    parser.add_argument("--output", type=str, default=str(Path(__file__).resolve().parent.parent / "checkpoints" / "indonesia-tts-merged"))
    parser.add_argument("--test-text", type=str, default="Halo semua! Ini adalah suara hasil fine-tuning model Fish-Speech Bahasa Indonesia.")
    args = parser.parse_args()

    merge_and_test(Path(args.lora_checkpoint), Path(args.output), args.test_text)
