@echo off
setlocal

REM Start the local verification API first. The Flutter desktop app calls it at
REM http://127.0.0.1:8000 for face and Aadhaar verification.
set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
  echo The project Python environment is not ready.
  echo Run these commands once from C:\digital-kaam:
  echo py -3.11 -m venv .venv
  echo .venv\Scripts\python.exe -m pip install -r backend\requirements.txt
) else (
  start "Digital Kaam Verification API" /min "%PYTHON_EXE%" -m uvicorn smart_brain_service:app --app-dir "%~dp0backend" --host 127.0.0.1 --port 8000
  echo Starting verification backend...
  for /L %%i in (1,1,20) do (
    "%PYTHON_EXE%" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=1)" >nul 2>nul && goto backend_ready
    timeout /t 1 /nobreak >nul
  )
  echo Warning: backend did not become ready in 20 seconds. Check the backend window for details.
)

:backend_ready
cd /d "%~dp0flutter_client\build\windows\x64\runner\Release"
start "" "digital_kaam_flutter.exe"
