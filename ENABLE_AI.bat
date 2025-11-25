@echo off
echo ================================================
echo   Restarting TrustLens Backend with AI
echo ================================================
echo.
echo Step 1: Update backend/.env file with your Gemini API key
echo Visit: https://aistudio.google.com/app/apikey
echo.
echo Step 2: Replace placeholder in backend/.env:
echo   GEMINI_API_KEY=your_actual_key_here
echo.
echo Step 3: Press any key to restart backend...
pause

echo.
echo Stopping backend...
taskkill /F /FI "WINDOWTITLE eq TrustLens Backend*" >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting backend with AI engine...
cd /d "%~dp0backend"
start "TrustLens Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo Done! Check the backend window - it should say "AI Engine initialized"
echo If it still says "WARNING: GEMINI_API_KEY not set", update the .env file!
echo.
pause
