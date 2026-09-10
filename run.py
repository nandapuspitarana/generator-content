#!/usr/bin/env python3
"""
🚀 Generator-Content All-in-One Service Manager
- Auto-run: Starts Fish-Speech TTS backend (8765) + Next.js web app (3300)
- Auto-stop: Gracefully terminates all services & releases ports on Ctrl+C or 'stop'
- Usage:
    python run.py           # Auto-run both services (auto-stop on Ctrl+C)
    python run.py stop      # Force stop all running services & free ports
    python run.py status    # Check health and status of both services
    python run.py restart   # Clean restart both services
    python run.py tts       # Auto-run only the Fish-Speech TTS service
"""

import os
import sys
import time
import signal
import atexit
import shutil
import json
import threading
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

# UTF-8 encoding support on Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Service Ports & URLs
PORT_TTS = 8765
PORT_WEB = 3300
URL_TTS_HEALTH = f"http://localhost:{PORT_TTS}/v1/health"
URL_WEB = f"http://localhost:{PORT_WEB}"

BASE_DIR = Path(__file__).resolve().parent
TTS_ENTRY = BASE_DIR / "services" / "fish-speech" / "main.py"

active_processes: list[subprocess.Popen] = []
is_shutting_down = False
shutdown_lock = threading.Lock()


# ============================================================================
# Port & Process Management
# ============================================================================

def get_pids_on_port(port: int) -> list[int]:
    """Finds PIDs listening on the specified port."""
    pids = set()
    if sys.platform == "win32":
        try:
            cmd = f'netstat -ano -p tcp'
            out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and parts[0].upper() == "TCP":
                    local_addr = parts[1]
                    state = parts[3].upper() if len(parts) >= 4 else ""
                    pid_str = parts[-1]
                    if f":{port}" in local_addr and ("LISTEN" in state or "ESTABLISHED" in state):
                        try:
                            pid = int(pid_str)
                            if pid > 4:  # Avoid system / idle PID
                                pids.add(pid)
                        except ValueError:
                            pass
        except Exception:
            pass
    else:
        try:
            out = subprocess.check_output(["lsof", "-t", f"-i:{port}"], text=True, stderr=subprocess.DEVNULL)
            for line in out.strip().splitlines():
                try:
                    pids.add(int(line.strip()))
                except ValueError:
                    pass
        except Exception:
            pass
    return sorted(list(pids))


def kill_pids(pids: list[int], desc: str = ""):
    """Forcefully kills processes by PID."""
    for pid in pids:
        try:
            if sys.platform == "win32":
                subprocess.run(
                    f"taskkill /F /T /PID {pid}",
                    shell=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            else:
                os.kill(pid, signal.SIGKILL)
            print(f"   🛑 Stopped {desc} (PID {pid})")
        except Exception:
            pass


def free_ports(ports: list[int]):
    """Checks and frees specified ports immediately."""
    for port in ports:
        pids = get_pids_on_port(port)
        if pids:
            print(f"🧹 Membersihkan port {port} (terdeteksi proses aktif: {pids})...")
            kill_pids(pids, f"port {port}")
            time.sleep(0.5)


def check_http(url: str, timeout: float = 2.0) -> tuple[bool, str]:
    """Tests HTTP response from an endpoint."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GeneratorContent-Manager/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read(512).decode("utf-8", errors="ignore")
            return (resp.status in (200, 301, 302, 304, 307, 308), data)
    except urllib.error.HTTPError as e:
        return (True, f"HTTP {e.code}")
    except Exception as e:
        return (False, str(e))


should_auto_stop = False

def auto_stop():
    """Gracefully stops all managed child processes and cleans ports."""
    global is_shutting_down
    if not should_auto_stop and not active_processes:
        return

    with shutdown_lock:
        if is_shutting_down:
            return
        is_shutting_down = True

    print("\n" + "=" * 60)
    print("🛑 AUTO-STOP: Menghentikan semua layanan secara otomatis...")
    print("=" * 60)

    # 1. Terminate tracked child processes
    for proc in active_processes:
        if proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass

    time.sleep(1.0)

    # 2. Force kill if still running
    for proc in active_processes:
        if proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass

    active_processes.clear()

    # 3. Clean up any remaining processes holding our ports
    free_ports([PORT_TTS, PORT_WEB])

    print("✨ Semua layanan berhasil dihentikan. Port 8765 dan 3300 telah bersih.\n")


# Register cleanup hooks
atexit.register(auto_stop)

def signal_handler(sig, frame):
    auto_stop()
    sys.exit(0)

try:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except Exception:
    pass


# ============================================================================
# Service Starters
# ============================================================================

def stream_output(process: subprocess.Popen, prefix: str):
    """Streams child process stdout/stderr safely in binary mode to avoid Windows encoding crashes."""
    try:
        while True:
            raw_line = process.stdout.readline()
            if not raw_line:
                if process.poll() is not None:
                    break
                time.sleep(0.01)
                continue
            text = raw_line.decode("utf-8", errors="replace").rstrip()
            if text:
                try:
                    sys.stdout.write(f"{prefix} {text}\n")
                    sys.stdout.flush()
                except Exception:
                    pass
    except Exception:
        pass


def start_tts_service() -> subprocess.Popen:
    """Launches the Fish-Speech TTS microservice (port 8765)."""
    print(f"🎙️  Menjalankan Fish-Speech TTS Backend di port {PORT_TTS}...")
    if not TTS_ENTRY.exists():
        print(f"❌ File {TTS_ENTRY} tidak ditemukan!")
        sys.exit(1)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    env["PORT"] = str(PORT_TTS)

    proc = subprocess.Popen(
        [sys.executable, str(TTS_ENTRY)],
        cwd=str(BASE_DIR),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    active_processes.append(proc)

    # Background reader thread
    t = threading.Thread(target=stream_output, args=(proc, "[TTS 8765]"), daemon=True)
    t.start()

    # Health check wait loop
    print("⏳ Menunggu Fish-Speech service siap...")
    ready = False
    for attempt in range(1, 30):
        if proc.poll() is not None:
            print(f"❌ Fish-Speech service berhenti sebelum siap! (exit code: {proc.returncode})")
            sys.exit(1)
        ok, data = check_http(URL_TTS_HEALTH, timeout=1.5)
        if ok:
            ready = True
            break
        time.sleep(0.5)

    if ready:
        print(f"✅ Fish-Speech service aktif di http://localhost:{PORT_TTS}")
    else:
        print(f"⚠️  Peringatan: Fish-Speech belum merespons dalam 15 detik, tetap melanjutkan...")

    return proc


def start_web_service() -> subprocess.Popen:
    """Launches the Next.js frontend (port 3300)."""
    print(f"🌐 Menjalankan Next.js Web App di port {PORT_WEB}...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

    proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(BASE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=(sys.platform == "win32"),
    )
    active_processes.append(proc)

    # Background reader thread
    t = threading.Thread(target=stream_output, args=(proc, "[WEB 3300]"), daemon=True)
    t.start()

    print(f"🚀 Next.js sedang booting di http://localhost:{PORT_WEB}")
    return proc


# ============================================================================
# Command Actions
# ============================================================================

def action_status():
    """Displays current status of both services."""
    print("\n" + "=" * 60)
    print("📊 STATUS LAYANAN GENERATOR-CONTENT")
    print("=" * 60)

    # TTS Service
    tts_pids = get_pids_on_port(PORT_TTS)
    tts_ok, tts_info = check_http(URL_TTS_HEALTH, timeout=1.5)
    tts_status = "🟢 ONLINE" if tts_ok else ("🟡 PORT TERPAKAI" if tts_pids else "🔴 OFFLINE")
    print(f"1. Fish-Speech TTS  : {tts_status}")
    print(f"   - Port           : {PORT_TTS}")
    print(f"   - PIDs           : {tts_pids if tts_pids else 'Tidak ada'}")
    print(f"   - Health URL     : {URL_TTS_HEALTH}")
    if tts_ok:
        try:
            info_json = json.loads(tts_info)
            print(f"   - Checkpoint     : {info_json.get('checkpoint')}")
            print(f"   - Perangkat      : {info_json.get('device')}")
        except Exception:
            pass

    print()

    # Next.js Web App
    web_pids = get_pids_on_port(PORT_WEB)
    web_ok, _ = check_http(URL_WEB, timeout=1.5)
    web_status = "🟢 ONLINE" if web_ok else ("🟡 PORT TERPAKAI" if web_pids else "🔴 OFFLINE")
    print(f"2. Next.js Web App  : {web_status}")
    print(f"   - Port           : {PORT_WEB}")
    print(f"   - PIDs           : {web_pids if web_pids else 'Tidak ada'}")
    print(f"   - URL            : {URL_WEB}")

    print("=" * 60 + "\n")


def action_stop():
    """Manual stop command: frees all ports and kills orphaned processes."""
    print("\n" + "=" * 60)
    print("🧹 MENGHENTIKAN SEMUA LAYANAN")
    print("=" * 60)
    free_ports([PORT_TTS, PORT_WEB])
    print("✨ Selesai. Semua proses dan port berhasil dibersihkan.\n")


def action_run(tts_only: bool = False):
    """Auto-run mode: starts services and waits for Ctrl+C to auto-stop."""
    global should_auto_stop
    should_auto_stop = True

    print("\n" + "=" * 60)
    print("🚀 MEMULAI LAYANAN DENGAN AUTO-RUN & AUTO-STOP")
    print("=" * 60)
    print("Tekan [Ctrl + C] kapan saja untuk menghentikan SEMUA layanan secara otomatis.\n")

    # Clean existing lingering processes first
    free_ports([PORT_TTS, PORT_WEB] if not tts_only else [PORT_TTS])

    # 1. Start TTS
    tts_proc = start_tts_service()

    # 2. Start Web (if not tts_only)
    web_proc = None
    if not tts_only:
        web_proc = start_web_service()

    print("\n" + "-" * 60)
    print("🎉 SEMUA LAYANAN AKTIF!")
    if not tts_only:
        print(f"   🌐 Web Studio:    http://localhost:{PORT_WEB}")
    print(f"   🎙️  TTS Service:   http://localhost:{PORT_TTS}")
    print(f"   🩺 Health API:    http://localhost:{PORT_TTS}/v1/health")
    print("   ⌨️  Auto-Stop:     Tekan [Ctrl + C] untuk berhenti bersih")
    print("-" * 60 + "\n")

    # Keep alive loop until user interrupts or child process crashes
    try:
        while True:
            time.sleep(1.0)
            if tts_proc.poll() is not None:
                print(f"\n⚠️  TTS Service berhenti (code {tts_proc.returncode}). Mematikan service lainnya...")
                break
            if web_proc and web_proc.poll() is not None:
                print(f"\n⚠️  Web App berhenti (code {web_proc.returncode}). Mematikan service lainnya...")
                break
    except KeyboardInterrupt:
        print("\n\n👋 Menerima sinyal keyboard (Ctrl+C)...")
    finally:
        auto_stop()


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    args = sys.argv[1:]
    command = args[0].lower() if args else "run"

    if command in ("stop", "kill", "down"):
        action_stop()
    elif command in ("status", "ps", "info"):
        action_status()
    elif command in ("restart", "reload"):
        action_stop()
        time.sleep(1.0)
        action_run(tts_only=("--tts-only" in args))
    elif command in ("tts", "--tts-only"):
        action_run(tts_only=True)
    elif command in ("run", "start", "up"):
        action_run(tts_only=("--tts-only" in args))
    elif command in ("help", "-h", "--help"):
        print(__doc__)
    else:
        print(f"Perintah tidak dikenal: '{command}'")
        print("Gunakan: run.py [run | stop | status | restart | tts | help]")
        sys.exit(1)


if __name__ == "__main__":
    main()
