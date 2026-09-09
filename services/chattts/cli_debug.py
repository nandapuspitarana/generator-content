"""
ChatTTS CLI Debugger
Gunakan script ini untuk debugging model ChatTTS langsung via terminal tanpa perlu server HTTP:
Contoh:
    python cli_debug.py "Halo, ini pengujian suara ChatTTS langsung dari script Python."
    python cli_debug.py "Halo kawan [break_4] selamat datang kembali!" --seed 8888 --out my_audio.wav
"""

import sys
import os
import argparse
import time

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import preprocess_text_for_chattts

def main():
    parser = argparse.ArgumentParser(description="Debug ChatTTS inference directly via Python CLI")
    parser.add_argument("text", nargs="?", default="Halo kawan! Selamat datang di podcast AsikReview.", help="Text to synthesize")
    parser.add_argument("--seed", type=int, default=2222, help="Speaker voice seed (default: 2222)")
    parser.add_argument("--out", type=str, default="debug_speech.wav", help="Output WAV file name (default: debug_speech.wav)")
    parser.add_argument("--temp", type=float, default=0.3, help="Sampling temperature (default: 0.3)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech speed factor (default: 1.0)")
    args = parser.parse_args()

    print("=" * 60)
    print("  🎙️  ChatTTS Direct Script Debugger")
    print("=" * 60)

    # 1. Text preprocessing
    print(f"\n[1/4] Preprocessing Text...")
    cleaned = preprocess_text_for_chattts(args.text)
    print(f"      Original: {args.text}")
    print(f"      Cleaned:  {cleaned} (Length: {len(cleaned)} chars)")

    # 2. Loading ChatTTS
    print(f"\n[2/4] Loading ChatTTS Engine...")
    try:
        import torch
        import ChatTTS
        import soundfile as sf
        import numpy as np

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"      PyTorch Device: {device.upper()}")
        if device == "cuda":
            print(f"      GPU: {torch.cuda.get_device_name(0)}")

        start_load = time.time()
        chat = ChatTTS.Chat()
        print("      Loading model weights (from HuggingFace cache)...")
        chat.load(compile=False)
        print(f"      Model loaded in {time.time() - start_load:.2f}s")
    except ImportError as ie:
        print(f"❌ Module missing: {ie}")
        print("   Silakan jalankan: pip install -r requirements.txt")
        return
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return

    # 3. Speaker Sampling & Inference
    print(f"\n[3/4] Running Inference (Seed: {args.seed})...")
    try:
        torch.manual_seed(args.seed)
        rand_spk = chat.sample_random_speaker()

        params_infer_code = {
            'spk_emb': rand_spk,
            'temperature': args.temp,
            'top_P': 0.7,
            'top_K': 20,
        }

        start_infer = time.time()
        wavs = chat.infer([cleaned], params_infer_code=params_infer_code, use_decoder=True)
        infer_duration = time.time() - start_infer
        print(f"      Inference completed in {infer_duration:.2f}s")

        if not wavs or len(wavs) == 0:
            print("❌ No audio generated.")
            return

        audio_data = wavs[0]
        if hasattr(audio_data, 'cpu'):
            audio_data = audio_data.cpu().numpy()
        if isinstance(audio_data, np.ndarray) and audio_data.ndim > 1:
            audio_data = audio_data.squeeze()

    except Exception as infer_err:
        print(f"❌ Inference error: {infer_err}")
        return

    # 4. Saving Output
    print(f"\n[4/4] Saving Output Audio...")
    out_path = os.path.abspath(args.out)
    sample_rate = 24000
    sf.write(out_path, audio_data, samplerate=sample_rate, format='WAV', subtype='PCM_16')

    audio_len_sec = len(audio_data) / sample_rate
    file_size_kb = os.path.getsize(out_path) / 1024
    print(f"      Saved to: {out_path}")
    print(f"      Duration: {audio_len_sec:.2f} seconds")
    print(f"      File Size: {file_size_kb:.1f} KB")
    print("\n✅ Debugging Selesai! Putar file dengan media player favorit Anda.")

if __name__ == "__main__":
    main()
