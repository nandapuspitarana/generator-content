"""
04_train_lora_local.py
-----------------------
Runs Dual-AR LoRA fine-tuning for Indonesian TTS directly on the local
NVIDIA RTX 5060 Ti GPU with full hardware bfloat16 acceleration.

Usage:
  python 04_train_lora_local.py
  python 04_train_lora_local.py --max-steps 100 --val-interval 25
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


def run_local_lora_training(max_steps: int = 100, val_interval: int = 25, project_name: str = "indonesia-tts-local"):
    root_dir = Path(__file__).resolve().parent.parent
    fish_repo_dir = root_dir / "fish-speech-repo"
    base_ckpt = root_dir / "checkpoints" / "fish-speech-1.5"
    protos_dir = root_dir / "data" / "protos"

    print("=" * 70)
    print("  🚀 Fish-Speech Dual-AR LoRA Training (Local RTX 5060 Ti GPU)")
    print(f"  Project Name:       {project_name}")
    print(f"  Base Pretrained:    {base_ckpt.resolve()}")
    print(f"  Protobuf Dataset:   {protos_dir.resolve()}")
    print(f"  Max Steps:          {max_steps}")
    print(f"  Validation Check:   every {val_interval} steps")
    print("=" * 70)

    if not base_ckpt.exists():
        print(f"❌ Error: Pretrained base model not found at {base_ckpt.resolve()}")
        sys.exit(1)

    if not protos_dir.exists() or len(list(protos_dir.glob("*.protos"))) == 0:
        print(f"❌ Error: Protobuf files not found in {protos_dir.resolve()}")
        print("   Please run 03_build_proto.py first.")
        sys.exit(1)

    train_script = fish_repo_dir / "fish_speech" / "train.py"
    if not train_script.exists():
        print(f"❌ Error: Train script not found at {train_script.resolve()}")
        sys.exit(1)

    # Use relative paths from fish-speech-repo
    cmd = [
        sys.executable,
        str(train_script),
        "--config-name", "text2semantic_finetune",
        f"project={project_name}",
        f"pretrained_ckpt_path={str(base_ckpt.resolve()).replace(chr(92), '/')}",
        f"train_dataset.proto_files=[{str(protos_dir.resolve()).replace(chr(92), '/')}]",
        f"val_dataset.proto_files=[{str(protos_dir.resolve()).replace(chr(92), '/')}]",
        "+lora@model.model.lora_config=r_8_alpha_16",
        f"trainer.max_steps={max_steps}",
        f"trainer.val_check_interval={val_interval}",
        "trainer.strategy=auto",
        "data.num_workers=2"
    ]

    env = os.environ.copy()
    env["PYTHONPATH"] = str(fish_repo_dir.resolve()) + (os.pathsep + env["PYTHONPATH"] if "PYTHONPATH" in env else "")

    print(f"Executing: {' '.join(cmd)}\n")
    subprocess.run(cmd, cwd=str(fish_repo_dir), env=env, check=True)
    print("\n" + "=" * 70)
    print("  🎉 Local LoRA Training Finished Successfully!")
    print(f"  Checkpoints saved in: {(fish_repo_dir / 'results' / project_name / 'checkpoints').resolve()}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Fish-Speech LoRA on Local GPU")
    parser.add_argument("--max-steps", type=int, default=100, help="Maximum training steps (default: 100)")
    parser.add_argument("--val-interval", type=int, default=25, help="Validation & checkpoint saving interval (default: 25)")
    parser.add_argument("--project", type=str, default="indonesia-tts-local", help="Project output name")
    args = parser.parse_args()

    run_local_lora_training(args.max_steps, args.val_interval, args.project)
