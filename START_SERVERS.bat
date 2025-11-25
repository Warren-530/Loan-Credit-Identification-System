@echo off
echo ================================================
echo   TrustLens AI - Starting Servers
echo ================================================
echo.

REM Kill any existing processes
echo Stopping existing servers...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 8000)...
cd /d "%~dp0backend"
start "TrustLens Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server (Port 3000)...
cd /d "%~dp0"
start "TrustLens Frontend" cmd /k "npm start"

timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   Servers Started!
echo ================================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo NOTE: Keep the Backend and Frontend terminal windows open!
echo Press any key to exit this launcher...
pause >nul
