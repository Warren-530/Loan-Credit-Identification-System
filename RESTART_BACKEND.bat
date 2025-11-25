@echo off
echo ================================================
echo   TrustLens AI - Restarting Backend
echo ================================================
echo.

echo Stopping backend server...
taskkill /F /FI "WINDOWTITLE eq TrustLens Backend*" /T >nul 2>&1
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 8000)...
cd /d "%~dp0backend"
start "TrustLens Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Backend server restarted!
echo Check the Backend window for any errors.
echo.
pause
