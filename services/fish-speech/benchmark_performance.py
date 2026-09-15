#!/usr/bin/env python3
"""
⚡ Fish-Speech 1.5 & Neural Engine Performance Benchmark Script
Measures latency, memory usage (RAM/VRAM), Real-Time Factor (RTF), and throughput.
Generates performance metrics and minimal hardware specification recommendations.

Usage:
    python benchmark_performance.py
    python benchmark_performance.py --output benchmark_results.json
"""

import os
import sys
import time
import json
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

import argparse
from pathlib import Path

# UTF-8 encoding support on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Import synthesis logic from main.py
try:
    from main import sanitize_and_parse_script, synthesize_segments_to_wav, TtsRequest, load_fish_speech
    import main
except ImportError as e:
    print(f"❌ Failed to import main.py: {e}")
    sys.exit(1)

TEST_SCRIPTS = {
    "short": {
        "title": "Kalimat Singkat (Short)",
        "text": "Selamat datang di generator konten otomatis Bahasa Indonesia."
    },
    "medium": {
        "title": "Paragraf Narasi (Medium)",
        "text": "Dalam dunia investasi modern, Benjamin Graham mengajarkan pentingnya margin of safety. Konsep ini menjadi fondasi utama bagi investor bernilai yang ingin melindungi modal dari risiko kerugian pasar saham yang tidak terduga."
    },
    "long": {
        "title": "Naskah Podcast / Audiobook (Long)",
        "text": "[excited] Halo pembaca dan pendengar setia! [pause] Hari ini kita akan membahas prinsip utama dari buku Thinking, Fast and Slow karya Daniel Kahneman. System satu bekerja secara cepat, intuitif, dan otomatis. Sementara System dua memerlukan perhatian penuh, logika mendalam, dan konsentrasi tinggi. [short pause] Mari kita bedah bagaimana kedua sistem ini mempengaruhi pengambilan keputusan finansial Anda sehari-hari."
    }
}


def get_system_specs():
    """Gathers system information: CPU, RAM, GPU, OS."""
    specs = {
        "platform": sys.platform,
        "python_version": sys.version.split()[0],
        "cpu_count_logical": psutil.cpu_count(logical=True) if HAS_PSUTIL else (os.cpu_count() or 1),
        "cpu_count_physical": psutil.cpu_count(logical=False) if HAS_PSUTIL else (os.cpu_count() or 1),
        "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2) if HAS_PSUTIL else "N/A",
        "gpu_available": False,
        "gpu_name": "N/A",
        "vram_total_mb": 0
    }

    try:
        import torch
        if torch.cuda.is_available():
            specs["gpu_available"] = True
            specs["gpu_name"] = torch.cuda.get_device_name(0)
            specs["vram_total_mb"] = round(torch.cuda.get_device_properties(0).total_memory / (1024**2), 1)
    except Exception:
        pass

    return specs


def measure_memory():
    """Measures current RAM and VRAM usage."""
    ram_mb = 0.0
    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        ram_mb = round(process.memory_info().rss / (1024**2), 2)
    vram_mb = 0.0

    try:
        import torch
        if torch.cuda.is_available():
            vram_mb = round(torch.cuda.memory_allocated(0) / (1024**2), 2)
    except Exception:
        pass

    return ram_mb, vram_mb


def run_benchmark():
    print("=" * 70)
    print("⚡ FISH-SPEECH 1.5 & NEURAL ENGINE PERFORMANCE BENCHMARK")
    print("=" * 70)

    specs = get_system_specs()
    print("\n🖥️  SPESIFIKASI SISTEM SAAT INI:")
    print(f"   • Sistem Operasi    : {specs['platform'].upper()}")
    print(f"   • CPU Cores         : {specs['cpu_count_physical']} Physical / {specs['cpu_count_logical']} Logical")
    print(f"   • System RAM        : {specs['ram_total_gb']} GB")
    print(f"   • GPU Acceleration  : {'🟢 ' + specs['gpu_name'] if specs['gpu_available'] else '🔴 Tidak Aktif (CPU Only)'}")
    if specs['gpu_available']:
        print(f"   • Total VRAM GPU    : {specs['vram_total_mb']} MB")

    print("\n⚙️  Inisialisasi Model Engine...")
    ram_init, vram_init = measure_memory()
    t_init_start = time.time()
    load_fish_speech()
    t_init_end = time.time()
    ram_loaded, vram_loaded = measure_memory()

    init_duration = round(t_init_end - t_init_start, 3)
    print(f"   • Waktu Load Model  : {init_duration} detik")
    print(f"   • RAM Memory Base   : {ram_loaded} MB (selisih +{round(ram_loaded - ram_init, 2)} MB)")
    if specs['gpu_available']:
        print(f"   • VRAM Allocated    : {vram_loaded} MB")

    print("\n" + "-" * 70)
    print("🧪 MEMULAI PENGUJIAN SINTESIS SUARA (BENCHMARK RUNS)")
    print("-" * 70)

    benchmark_results = {
        "system_info": specs,
        "model_loaded": main.is_model_ready,
        "active_checkpoint": main.active_checkpoint,
        "init_time_sec": init_duration,
        "runs": []
    }

    for key, item in TEST_SCRIPTS.items():
        title = item["title"]
        raw_text = item["text"]
        char_count = len(raw_text)

        print(f"\n▶️  Pengujian [{title}] - ({char_count} karakter)")

        req = TtsRequest(text=raw_text, speed=1.0)
        segments = sanitize_and_parse_script(raw_text, paragraph_delay=req.get_paragraph_delay())
        speech_segments = [s for s in segments if s["type"] == "speech"]

        # Warmup run
        ram_before, vram_before = measure_memory()
        t_start = time.time()
        wav_bytes = synthesize_segments_to_wav(segments, req)
        t_end = time.time()
        ram_after, vram_after = measure_memory()

        gen_time = round(t_end - t_start, 3)
        wav_size_kb = round(len(wav_bytes) / 1024, 2)

        # WAV 24kHz 16-bit mono = 48,000 bytes per second
        # Exclude WAV header (44 bytes)
        audio_dur_sec = round(max(0.0, len(wav_bytes) - 44) / 48000.0, 2)
        rtf = round(gen_time / max(0.01, audio_dur_sec), 3)
        chars_per_sec = round(char_count / max(0.01, gen_time), 2)
        audio_sec_per_gen_sec = round(audio_dur_sec / max(0.01, gen_time), 2)

        print(f"   ✅ Selesai dalam     : {gen_time} detik")
        print(f"   🔊 Durasi Audio WAV : {audio_dur_sec} detik ({wav_size_kb} KB)")
        print(f"   ⚡ Real-Time Factor  : {rtf}x {'(🚀 Lebih Cepat Dari Realtime)' if rtf < 1.0 else '(🐢 Lebih Lambat Dari Realtime)'}")
        print(f"   🚀 Kecepatan Karakter: {chars_per_sec} char/sec")
        print(f"   💾 RAM Digunakan     : {ram_after} MB (puncak: {round(ram_after - ram_before, 2)} MB)")
        if specs['gpu_available']:
            print(f"   📟 VRAM GPU          : {vram_after} MB")

        benchmark_results["runs"].append({
            "test_id": key,
            "title": title,
            "char_count": char_count,
            "speech_segments": len(speech_segments),
            "generation_time_sec": gen_time,
            "audio_duration_sec": audio_dur_sec,
            "real_time_factor": rtf,
            "throughput_char_per_sec": chars_per_sec,
            "throughput_audio_speedup": audio_sec_per_gen_sec,
            "ram_mb": ram_after,
            "vram_mb": vram_after
        })

    print("\n" + "=" * 70)
    print("📊 REKAPITULASI HASIL & SPESIFIKASI MINIMAL HARDWARE")
    print("=" * 70)

    print("\n1. Metrik Kinerja Sintesis Suara:")
    print(f"   • Average RTF (Real-Time Factor) : {round(sum(r['real_time_factor'] for r in benchmark_results['runs']) / len(benchmark_results['runs']), 3)}x")
    print(f"   • Status Model Active            : {main.active_checkpoint}")

    print("\n2. Spesifikasi Minimum Hardware (Minimum Hardware Requirements):")
    print("   ┌────────────────────┬─────────────────────────────┬─────────────────────────────┐")
    print("   │ Komponen Hardware  │ Standby / Neural CPU Mode   │ Local PyTorch GPU Inference │")
    print("   ├────────────────────┼─────────────────────────────┼─────────────────────────────┤")
    print("   │ CPU                │ Dual-Core x86_64 / ARM64    │ Quad-Core x86_64 (AVX2)     │")
    print("   │ System RAM         │ 4 GB RAM                    │ 8 GB RAM                    │")
    print("   │ GPU Acceleration   │ Tidak Diperlukan (0 MB VRAM)│ NVIDIA GPU (Min. 4 GB VRAM) │")
    print("   │ Disk Space         │ 500 MB                      │ 3.0 GB (Bobot Model 1.4 GB) │")
    print("   │ Target RTF         │ < 0.15x (Sangat Cepat)      │ < 0.35x (Sangat Cepat)      │")
    print("   └────────────────────┴─────────────────────────────┴─────────────────────────────┘")

    print("\n3. Rekomendasi Spesifikasi Server / Production:")
    print("   • CPU           : 8 Cores (AMD Ryzen 7 / Intel Core i7 / Xeon)")
    print("   • System RAM    : 16 GB DDR4/DDR5")
    print("   • GPU           : NVIDIA RTX 3060 / 4060 / 5060 Ti (8GB+ VRAM)")
    print("   • Storage       : NVMe SSD")

    print("\n✨ Benchmark selesai dengan sukses!\n")
    return benchmark_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fish-Speech & Neural Engine Performance Benchmark")
    parser.add_argument("--output", type=str, default=None, help="Save JSON benchmark report to file")
    args = parser.parse_args()

    results = run_benchmark()

    if args.output:
        out_path = Path(args.output)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"💾 Laporan benchmark disimpan ke: {out_path.resolve()}")
