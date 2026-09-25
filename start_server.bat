@echo off
title Digital Kaam Smart Brain Server
cd /d "%~dp0"

echo ====================================================================
echo             DIGITAL KAAM - SMART BRAIN SERVER (PORT 8000)
echo ====================================================================
echo.
echo Checking Python Virtual Environment (.venv)...

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Creating one...
    py -3.11 -m venv .venv
    echo Installing required packages...
    .venv\Scripts\python.exe -m pip install -r backend\requirements.txt
)

echo.
echo [OK] Python Environment Ready!
echo.
echo --------------------------------------------------------------------
echo   Access URLs:
echo   - Local Dashboard:     http://127.0.0.1:8000
echo   - API Interactive Docs: http://127.0.0.1:8000/docs
echo   - Health Check:        http://127.0.0.1:8000/health
echo   - Android Emulator:    http://10.0.2.2:8000
echo --------------------------------------------------------------------
echo.
echo Starting Uvicorn Server on 0.0.0.0:8000 (accessible across Wi-Fi)...
echo Press Ctrl + C to stop the server anytime.
echo ====================================================================
echo.

start "" "http://127.0.0.1:8000/admin"
.venv\Scripts\python.exe -m uvicorn smart_brain_service:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
pause
