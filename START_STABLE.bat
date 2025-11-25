@echo off
echo ================================================
echo   TrustLens AI - STABLE Server Startup
echo   (No auto-reload - manual restart required)
echo ================================================
echo.

REM Kill any existing processes
echo Stopping existing servers...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 8000) - STABLE MODE
cd /d "%~dp0backend"
start "TrustLens Backend" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server (Port 3000)
cd /d "%~dp0"
start "TrustLens Frontend" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   Servers Started in STABLE MODE!
echo ================================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
echo NOTE: File changes will NOT restart servers
echo       To apply changes, manually restart servers
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Keep the Backend and Frontend windows open!
echo Press any key to exit this launcher...
pause >nul
