@echo off
title ChatTTS Local Microservice (Dev Mode)
echo ===================================================
echo   Starting ChatTTS Service via Python Direct
echo ===================================================

cd /d "%~dp0"

if not exist venv (
    echo [Info] Membuat virtual environment venv...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [Info] Menginstal dependencies...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

set PORT=8765
set RELOAD=true
python main.py
pause
