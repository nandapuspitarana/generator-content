Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting ChatTTS Service via Python Direct" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "venv")) {
    Write-Host "[Info] Creating Python virtual environment (venv)..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    Write-Host "[Info] Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
} else {
    .\venv\Scripts\Activate.ps1
}

$env:PORT = "8765"
$env:RELOAD = "true"
python main.py
