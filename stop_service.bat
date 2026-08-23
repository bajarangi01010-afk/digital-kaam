@echo off
echo ===================================================
echo   🛑 STOPPING DIGITAL KAAM 2.0 BACKGROUND SERVICES
echo ===================================================
taskkill /F /IM cloudflared.exe 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *server.py*" 2>nul
echo [OK] Digital Kaam services stopped successfully!
pause
