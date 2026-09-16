"""
Dataset Tools for Speech AI, TTS & ASR Labeling
------------------------------------------------
Provides tools to validate, normalize, and synchronize custom audio-to-text datasets.

Usage:
  python scripts/dataset_tools.py validate                     # Validate default dataset/ directory
  python scripts/dataset_tools.py validate --dir path/to/data  # Validate specific directory
  python scripts/dataset_tools.py sync                         # Sync .lab files to metadata.csv & metadata.jsonl
  python scripts/dataset_tools.py normalize --input raw/ --output wavs/ # Resample to 24kHz Mono PCM_16
"""

import os
import sys
import re
import json
import wave
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 34 Standard Vocal Expression Tags recognized by the Studio
VOCAL_TAGS = [
    "[pause]", "[short pause]", "[inhale]", "[exhale]", "[sigh]",
    "[clearing throat]", "[panting]", "[tsk]",
    "[laughing]", "[chuckle]", "[chuckling]", "[laughing tone]",
    "[delight]", "[audience laughter]",
    "[emphasis]", "[whisper]", "[low voice]", "[low volume]",
    "[volume down]", "[loud]", "[volume up]", "[screaming]", "[shouting]",
    "[excited]", "[excited tone]", "[surprised]", "[shocked]",
    "[angry]", "[sad]", "[singing]", "[echo]", "[interrupting]",
    "[moaning]", "[with strong accent]"
]

def inspect_wav(file_path: Path) -> Dict[str, Any]:
    """Inspects a WAV file for sample rate, channels, bit depth, and duration."""
    try:
        with wave.open(str(file_path), "rb") as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            frame_rate = wf.getframerate()
            n_frames = wf.getnframes()
            duration = n_frames / float(frame_rate)
            bit_depth = sample_width * 8

            return {
                "valid": True,
                "channels": channels,
                "sample_rate": frame_rate,
                "bit_depth": bit_depth,
                "duration": duration,
                "frames": n_frames
            }
    except Exception as e:
        return {"valid": False, "error": str(e)}

def validate_dataset(dataset_dir: Path) -> bool:
    """Validates audio files and transcript labels in the dataset directory."""
    print("=" * 65)
    print(f"  Memeriksa Dataset di: {dataset_dir.resolve()}")
    print("=" * 65)

    wavs_dir = dataset_dir / "wavs" if (dataset_dir / "wavs").is_dir() else dataset_dir
    csv_file = dataset_dir / "metadata.csv"
    jsonl_file = dataset_dir / "metadata.jsonl"

    wav_files = sorted(list(wavs_dir.glob("*.wav")))
    if not wav_files:
        print(f"[ERROR] Tidak ada file .wav ditemukan di: {wavs_dir}")
        return False

    print(f"Ditemukan {len(wav_files)} file .wav.")

    total_duration = 0.0
    total_words = 0
    tag_counts: Dict[str, int] = {}
    issues: List[str] = []
    valid_count = 0

    for wav_path in wav_files:
        stem = wav_path.stem
        lab_path = wav_path.parent / f"{stem}.lab"

        # 1. Check Audio
        info = inspect_wav(wav_path)
        if not info["valid"]:
            issues.append(f"[Audio Rusak] {wav_path.name}: {info.get('error')}")
            continue

        dur = info["duration"]
        total_duration += dur

        if info["channels"] != 1:
            issues.append(f"[Format Warning] {wav_path.name}: Audio stereo ({info['channels']} channel). Direkomendasikan Mono 1 channel.")
        if info["sample_rate"] != 24000:
            issues.append(f"[Sample Rate Warning] {wav_path.name}: {info['sample_rate']} Hz. Standar model TTS vokal adalah 24,000 Hz.")
        if dur < 1.0:
            issues.append(f"[Durasi Pendek] {wav_path.name}: {dur:.2f}s (< 1 detik). Terlalu pendek untuk ekspresi emosi.")
        elif dur > 18.0:
            issues.append(f"[Durasi Panjang] {wav_path.name}: {dur:.2f}s (> 18 detik). Disarankan dipotong per kalimat/klausa.")

        # 2. Check Transcript (.lab or metadata)
        transcript = ""
        if lab_path.exists():
            try:
                with open(lab_path, "r", encoding="utf-8") as f:
                    transcript = f.read().strip()
            except Exception as e:
                issues.append(f"[Read Error] {lab_path.name}: {e}")
        else:
            issues.append(f"[Missing Label] Tidak ditemukan {lab_path.name} untuk {wav_path.name}")

        if transcript:
            words = transcript.split()
            total_words += len(words)

            # Count vocal tags
            for tag in VOCAL_TAGS:
                count = transcript.count(tag)
                if count > 0:
                    tag_counts[tag] = tag_counts.get(tag, 0) + count

            # Check for unclosed brackets
            if transcript.count("[") != transcript.count("]"):
                issues.append(f"[Tag Syntax Warning] {lab_path.name}: Terdapat kurung siku '[' dan ']' yang tidak seimbang.")

        valid_count += 1

    # Print Summary Statistics
    minutes = total_duration / 60.0
    print("\n--- Ringkasan Dataset ---")
    print(f"Total File Audio Valid : {valid_count} / {len(wav_files)}")
    print(f"Total Durasi Audio     : {total_duration:.2f} detik (~{minutes:.2f} menit)")
    print(f"Rata-rata Durasi / File: {(total_duration / max(1, valid_count)):.2f} detik")
    print(f"Total Kata Transkrip   : {total_words} kata")

    if tag_counts:
        print("\n--- Tag Ekspresi Vokal Terdeteksi ---")
        for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {tag:<22} : {count}x")
    else:
        print("\n[INFO] Belum ada tag ekspresi vokal ([laughing], [whisper], dll) dalam transkrip.")

    # Check Manifest Files
    print("\n--- File Manifest ---")
    print(f"metadata.csv   : {'[ADA] ' + str(csv_file) if csv_file.exists() else '[BELUM ADA] (Jalankan: python scripts/dataset_tools.py sync)'}")
    print(f"metadata.jsonl : {'[ADA] ' + str(jsonl_file) if jsonl_file.exists() else '[BELUM ADA] (Jalankan: python scripts/dataset_tools.py sync)'}")

    if issues:
        print(f"\n--- Peringatan & Catatan ({len(issues)}) ---")
        for issue in issues[:15]:
            print(f"  {issue}")
        if len(issues) > 15:
            print(f"  ... dan {len(issues) - 15} catatan lainnya.")
    else:
        print("\n[SUKSES] Semua file audio dan transkrip label memenuhi standar format 100%!")

    return len(issues) == 0

def sync_manifests(dataset_dir: Path):
    """Synchronizes .wav + .lab files into metadata.csv and metadata.jsonl."""
    print("=" * 65)
    print(f"  Menyinkronkan Manifest di: {dataset_dir.resolve()}")
    print("=" * 65)

    wavs_dir = dataset_dir / "wavs" if (dataset_dir / "wavs").is_dir() else dataset_dir
    wav_files = sorted(list(wavs_dir.glob("*.wav")))

    if not wav_files:
        print(f"[ERROR] Tidak ada file .wav ditemukan di: {wavs_dir}")
        return

    csv_rows = []
    jsonl_records = []

    for wav_path in wav_files:
        stem = wav_path.stem
        lab_path = wav_path.parent / f"{stem}.lab"
        text = ""

        if lab_path.exists():
            with open(lab_path, "r", encoding="utf-8") as f:
                text = f.read().strip()

        info = inspect_wav(wav_path)
        duration = round(info.get("duration", 0.0), 2)

        # Detect vocal tags in text
        detected_tags = [t for t in VOCAL_TAGS if t in text]

        # Determine relative audio path
        rel_audio = f"wavs/{wav_path.name}" if (dataset_dir / "wavs").is_dir() else wav_path.name

        # CSV row (LJSpeech style: id|raw_text|normalized_text)
        csv_rows.append(f"{stem}|{text}|{text}")

        # JSONL record
        jsonl_records.append({
            "audio_filepath": rel_audio,
            "text": text,
            "normalized_text": text,
            "duration": duration,
            "speaker": "speaker_01",
            "vocal_tags": detected_tags,
            "language": "id"
        })

    # Write metadata.csv
    csv_file = dataset_dir / "metadata.csv"
    with open(csv_file, "w", encoding="utf-8") as f:
        f.write("\n".join(csv_rows) + "\n")
    print(f"[OK] Disimpan: {csv_file} ({len(csv_rows)} baris)")

    # Write metadata.jsonl
    jsonl_file = dataset_dir / "metadata.jsonl"
    with open(jsonl_file, "w", encoding="utf-8") as f:
        for rec in jsonl_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"[OK] Disimpan: {jsonl_file} ({len(jsonl_records)} entri)")

def normalize_audio_files(input_dir: Path, output_dir: Path, target_sr: int = 24000):
    """Normalizes audio files to target_sr mono 16-bit PCM WAV."""
    try:
        import soundfile as sf
        import numpy as np
        from scipy import signal
    except ImportError:
        print("[ERROR] Dibutuhkan soundfile dan scipy. Jalankan: pip install soundfile scipy")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    audio_extensions = [".wav", ".mp3", ".m4a", ".flac", ".ogg"]
    files = [f for f in input_dir.iterdir() if f.suffix.lower() in audio_extensions]

    if not files:
        print(f"Tidak ada file audio ditemukan di: {input_dir}")
        return

    print(f"Memproses {len(files)} file audio ke format {target_sr} Hz Mono PCM 16-bit...")

    count = 0
    for file in files:
        try:
            data, orig_sr = sf.read(str(file), dtype="float32")
            if data.ndim > 1:
                data = np.mean(data, axis=1)  # Convert stereo to mono

            if orig_sr != target_sr:
                num_target = int(len(data) * target_sr / orig_sr)
                data = signal.resample(data, num_target)

            # Peak amplitude normalize to -1 dBFS (0.90)
            max_val = np.max(np.abs(data))
            if max_val > 1e-5:
                data = data / max_val * 0.90

            out_wav = output_dir / f"{file.stem}.wav"
            sf.write(str(out_wav), data.astype(np.float32), samplerate=target_sr, format="WAV", subtype="PCM_16")
            count += 1
            print(f"  ✓ {file.name} -> {out_wav.name}")
        except Exception as e:
            print(f"  ✗ Gagal memproses {file.name}: {e}")

    print(f"\n[SUKSES] {count} file berhasil dinormalisasi ke: {output_dir.resolve()}")

def main():
    parser = argparse.ArgumentParser(description="Dataset Labeling & Speech AI Tools")
    subparsers = parser.add_subparsers(dest="command", help="Perintah yang tersedia")

    # Command: validate
    val_p = subparsers.add_parser("validate", help="Validasi integritas audio dan teks label")
    val_p.add_argument("--dir", default="dataset", help="Direktori dataset (default: dataset/)")

    # Command: sync
    sync_p = subparsers.add_parser("sync", help="Sinkronkan file .lab ke metadata.csv dan metadata.jsonl")
    sync_p.add_argument("--dir", default="dataset", help="Direktori dataset (default: dataset/)")

    # Command: normalize
    norm_p = subparsers.add_parser("normalize", help="Konversi audio ke standar 24kHz Mono 16-bit PCM")
    norm_p.add_argument("--input", default="dataset/raw_recordings", help="Direktori sumber audio mentah")
    norm_p.add_argument("--output", default="dataset/wavs", help="Direktori tujuan audio terstandar")
    norm_p.add_argument("--sr", type=int, default=24000, help="Target sample rate (default: 24000)")

    args = parser.parse_args()

    if args.command == "validate" or args.command is None:
        target_dir = Path(getattr(args, "dir", "dataset"))
        validate_dataset(target_dir)
    elif args.command == "sync":
        target_dir = Path(args.dir)
        sync_manifests(target_dir)
    elif args.command == "normalize":
        in_dir = Path(args.input)
        out_dir = Path(args.output)
        normalize_audio_files(in_dir, out_dir, target_sr=args.sr)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
