@echo off
echo ================================================
echo   Checking if AI is Running
echo ================================================
echo.
echo Looking for backend process...
tasklist /FI "IMAGENAME eq python.exe" /FO TABLE
echo.
echo ================================================
echo Checking API key configuration...
echo ================================================
cd /d "%~dp0backend"
python -c "from dotenv import load_dotenv; import os; load_dotenv(); key = os.getenv('GEMINI_API_KEY'); print('API Key loaded:', 'YES' if key else 'NO'); print('Key starts with:', key[:10] if key else 'N/A'); print('Key length:', len(key) if key else 0)"
echo.
echo ================================================
echo Test AI Engine Import
echo ================================================
python -c "import os; from dotenv import load_dotenv; load_dotenv(); os.environ.setdefault('GEMINI_API_KEY', os.getenv('GEMINI_API_KEY', '')); from ai_engine import AIEngine; from config import AIConfig; key = os.getenv('GEMINI_API_KEY'); print('Initializing AI Engine...'); engine = AIEngine(key) if key else None; print('SUCCESS: AI Engine ready!' if engine else 'FAILED: No API key'); print('Model:', engine.model_name if engine else 'N/A')"
echo.
echo ================================================
echo.
echo If you see "SUCCESS: AI Engine ready!" above,
echo then AI is configured correctly!
echo.
echo Check the "TrustLens Backend" cmd window for:
echo   - Look for a BLACK command prompt window
echo   - Title bar says "TrustLens Backend"
echo   - Should show green checkmark: AI Engine initialized
echo.
pause
