"""
01_download_dataset.py
---------------------
Automated pipeline to download and prepare the Indonesian TTS dataset:
Dataset: X-lord/Dataset-Text-To-Speech-Indonesia (HuggingFace)
- 4,531 voice segments, ~16.38 hours of Indonesian dialogue/speech
- Format: WAV (resampled to 24,000 Hz PCM_16 for Fish-Speech codec)
- Transcripts: .lab text files paired with each .wav file

Usage:
  python 01_download_dataset.py --sample 50    # Download & prepare first 50 samples for testing
  python 01_download_dataset.py --all          # Download all 4,531 samples (~16.4 hours)
  python 01_download_dataset.py --help
"""

import os
import sys
import io
import argparse
import json
import logging
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dataset_preparator")

TARGET_SAMPLE_RATE = 24000  # Required by Fish-Speech VQ-GAN / DAC codec
DEFAULT_DATASET_REPO = "agufsamudra/tts-indo"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "Speaker_Indonesia"


def resample_and_normalize_audio(audio_bytes: bytes, target_sr: int = TARGET_SAMPLE_RATE):
    """
    Decodes audio bytes, resamples to target_sr (24kHz), and normalizes peak amplitude.
    Returns (numpy_array, sample_rate, duration_seconds).
    """
    import soundfile as sf
    import numpy as np
    from scipy import signal

    data, orig_sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    if data.ndim > 1:
        # Convert stereo to mono by averaging channels
        data = np.mean(data, axis=1)

    # Resample if sample rate doesn't match target
    if orig_sr != target_sr:
        num_target_samples = int(len(data) * target_sr / orig_sr)
        data = signal.resample(data, num_target_samples)

    # Peak normalization (prevent clipping, normalize to -1 dBFS approx 0.89)
    max_val = np.max(np.abs(data))
    if max_val > 1e-5:
        data = data / max_val * 0.90

    duration = len(data) / target_sr
    return data.astype(np.float32), target_sr, duration


def download_and_process_dataset(
    output_dir: Path,
    limit: int = 50,
    all_records: bool = False,
    dataset_repo: str = DEFAULT_DATASET_REPO,
    speaker_name: str = "Speaker_Indonesia"
):
    """
    Downloads parquet files from HuggingFace, extracts audio and text,
    resamples to 24kHz, and saves paired .wav and .lab files.
    """
    try:
        from huggingface_hub import HfApi, hf_hub_download
        import pyarrow.parquet as pq
        import soundfile as sf
    except ImportError as e:
        logger.error(f"Missing required dependencies: {e}. Run: pip install huggingface_hub pyarrow soundfile scipy")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Target directory: {output_dir.resolve()}")
    logger.info(f"Connecting to HuggingFace repository: {dataset_repo}...")

    api = HfApi()
    try:
        repo_files = api.list_repo_files(dataset_repo, repo_type="dataset")
    except Exception as e:
        logger.error(f"Failed to fetch file list from HuggingFace repository '{dataset_repo}': {e}")
        sys.exit(1)

    # Match train parquet partitions (e.g. data/train-*.parquet or default/*/*.parquet or *.parquet)
    parquet_files = sorted([f for f in repo_files if ("train" in f or "default" in f) and f.endswith(".parquet")])
    if not parquet_files:
        parquet_files = sorted([f for f in repo_files if f.endswith(".parquet")])

    if not parquet_files:
        logger.error(f"No parquet files found in dataset repository '{dataset_repo}'.")
        sys.exit(1)

    logger.info(f"Found {len(parquet_files)} parquet partition files in dataset '{dataset_repo}'.")
    target_count = float("inf") if all_records else limit
    logger.info(f"Target count: {'ALL' if all_records else limit} audio segments.")

    processed_count = 0
    total_duration_sec = 0.0
    manifest_records = []

    for parquet_name in parquet_files:
        if processed_count >= target_count:
            break

        logger.info(f"Downloading partition: {parquet_name}...")
        try:
            local_parquet_path = hf_hub_download(dataset_repo, parquet_name, repo_type="dataset")
        except Exception as err:
            logger.error(f"Error downloading {parquet_name}: {err}")
            continue

        table = pq.read_table(local_parquet_path)
        col_names = table.column_names
        logger.info(f"Partition loaded ({table.num_rows} rows). Columns: {col_names}")

        # Extract rows
        for row_idx in range(table.num_rows):
            if processed_count >= target_count:
                break

            try:
                row = {name: table[name][row_idx].as_py() for name in col_names}
                raw_text = str(row.get("text", "")).strip()
                audio_obj = row.get("audio")

                if not raw_text or not audio_obj:
                    continue

                # Audio can be a dict with 'bytes' or binary data
                if isinstance(audio_obj, dict) and "bytes" in audio_obj:
                    audio_bytes = audio_obj["bytes"]
                elif isinstance(audio_obj, bytes):
                    audio_bytes = audio_obj
                else:
                    logger.warning(f"Row {row_idx}: Unsupported audio format, skipping.")
                    continue

                # Resample and normalize to 24kHz
                processed_audio, sample_rate, duration = resample_and_normalize_audio(audio_bytes, TARGET_SAMPLE_RATE)

                # Skip extremely short clips (< 0.4s) or excessively long clips (> 30s)
                if duration < 0.4 or duration > 30.0:
                    continue

                seg_id = f"segment_{processed_count + 1:05d}"
                wav_filename = f"{seg_id}.wav"
                lab_filename = f"{seg_id}.lab"

                wav_path = output_dir / wav_filename
                lab_path = output_dir / lab_filename

                # Save 24kHz PCM_16 WAV
                sf.write(str(wav_path), processed_audio, samplerate=sample_rate, format="WAV", subtype="PCM_16")

                # Save transcript .lab
                with open(lab_path, "w", encoding="utf-8") as f:
                    f.write(raw_text)

                processed_count += 1
                total_duration_sec += duration

                manifest_records.append({
                    "id": seg_id,
                    "wav": str(wav_filename),
                    "lab": str(lab_filename),
                    "text": raw_text,
                    "duration": round(duration, 2),
                    "sample_rate": sample_rate
                })

                if processed_count % 25 == 0 or processed_count == target_count:
                    logger.info(f"Processed [{processed_count}/{int(target_count) if target_count != float('inf') else '?'}] segments ({total_duration_sec/60:.1f} minutes of audio)")

            except Exception as seg_err:
                logger.warning(f"Error processing row {row_idx}: {seg_err}")
                continue

    # Write summary manifest
    manifest_path = output_dir.parent / "dataset_manifest.json"
    summary = {
        "dataset_name": dataset_repo,
        "language": "id",
        "speaker": speaker_name,
        "sample_rate": TARGET_SAMPLE_RATE,
        "format": "WAV (PCM_16) + .lab",
        "total_segments": processed_count,
        "total_duration_seconds": round(total_duration_sec, 2),
        "total_duration_hours": round(total_duration_sec / 3600, 3),
        "output_directory": str(output_dir.resolve()),
        "segments": manifest_records[:50]  # Store preview of first 50
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print("  🎉 Dataset Preparation Complete!")
    print(f"  Dataset Source:    {dataset_repo}")
    print(f"  Total Segments:    {processed_count}")
    print(f"  Total Duration:    {total_duration_sec/60:.2f} mins ({total_duration_sec/3600:.2f} hours)")
    print(f"  Sample Rate:       {TARGET_SAMPLE_RATE} Hz (Ready for Fish-Speech)")
    print(f"  Output Directory:  {output_dir.resolve()}")
    print(f"  Manifest File:     {manifest_path.resolve()}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download and prepare Indonesian TTS dataset for Fish-Speech")
    parser.add_argument("--repo", type=str, default=DEFAULT_DATASET_REPO, help=f"HuggingFace dataset repository (default: {DEFAULT_DATASET_REPO})")
    parser.add_argument("--sample", type=int, default=50, help="Number of samples to process (default: 50)")
    parser.add_argument("--all", action="store_true", help="Download and process all available dataset segments")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT_DIR), help="Output directory for .wav and .lab files")
    parser.add_argument("--speaker", type=str, default="Speaker_Indonesia", help="Speaker identifier tag")

    args = parser.parse_args()
    download_and_process_dataset(
        output_dir=Path(args.output),
        limit=args.sample,
        all_records=args.all,
        dataset_repo=args.repo,
        speaker_name=args.speaker
    )
