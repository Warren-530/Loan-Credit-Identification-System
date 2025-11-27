@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ============================================================================
REM InsightLoan - Quick Setup Script for Windows
REM Version: 2.0
REM ============================================================================

title InsightLoan Quick Setup

echo.
echo ============================================================================
echo                    INSIGHTLOAN - QUICK SETUP
echo                    AI Credit Risk Assessment Platform
echo ============================================================================
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

echo [INFO] Working directory: %CD%
echo.

REM ============================================================================
REM Step 1: Check Prerequisites
REM ============================================================================
echo ============================================================================
echo  Step 1: Checking Prerequisites
echo ============================================================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Download and install from: https://nodejs.org/
    echo         Recommended version: 18 or higher
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo [OK] Node.js found: !NODE_VER!
)

REM Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed.
    echo         Download and install from: https://python.org/
    echo         Recommended version: 3.10 or higher
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
    echo [OK] Python found: !PY_VER!
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found. It should be installed with Node.js.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo [OK] npm found: v!NPM_VER!
)

REM Check pip
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pip is not found. It should be installed with Python.
    pause
    exit /b 1
) else (
    echo [OK] pip found
)

echo.
echo [SUCCESS] All prerequisites are installed.
echo.

REM ============================================================================
REM Step 2: Configure API Keys
REM ============================================================================
echo ============================================================================
echo  Step 2: Configure API Keys
echo ============================================================================
echo.

REM Check if configuration already exists
if exist ".env.local" (
    if exist "backend\.env" (
        echo [INFO] Configuration files already exist.
        set /p RECONFIG="Do you want to reconfigure? Enter Y to reconfigure, or press Enter to skip: "
        if /i not "!RECONFIG!"=="y" (
            echo [INFO] Skipping configuration...
            goto :install_deps
        )
    )
)

echo.
echo You need API keys to run this application.
echo If you do not have them yet, you can skip for now and configure later.
echo.
set /p SKIP_CONFIG="Press Enter to configure now, or enter S to skip: "
if /i "!SKIP_CONFIG!"=="s" (
    echo.
    echo [INFO] Skipping configuration.
    echo        You will need to create these files manually before running:
    echo        - .env.local (frontend configuration)
    echo        - backend\.env (backend configuration)
    echo.
    goto :install_deps
)

echo.
echo ----------------------------------------------------------------------------
echo  FIREBASE CONFIGURATION
echo  Go to: https://console.firebase.google.com/
echo  Create a project and get your web app configuration.
echo ----------------------------------------------------------------------------
echo.

set /p FIREBASE_API_KEY="Firebase API Key: "
set /p FIREBASE_AUTH_DOMAIN="Firebase Auth Domain (example: your-project.firebaseapp.com): "
set /p FIREBASE_PROJECT_ID="Firebase Project ID: "
set /p FIREBASE_STORAGE_BUCKET="Firebase Storage Bucket (example: your-project.firebasestorage.app): "
set /p FIREBASE_MESSAGING_SENDER_ID="Firebase Messaging Sender ID: "
set /p FIREBASE_APP_ID="Firebase App ID: "
set /p FIREBASE_MEASUREMENT_ID="Firebase Measurement ID (optional, press Enter to skip): "

echo.
echo ----------------------------------------------------------------------------
echo  GEMINI AI CONFIGURATION
echo  Go to: https://aistudio.google.com/app/apikey
echo  Create an API key for Gemini.
echo ----------------------------------------------------------------------------
echo.

set /p GEMINI_API_KEY="Gemini API Key: "

echo.
echo ----------------------------------------------------------------------------
echo  EMAIL CONFIGURATION (Optional)
echo  For Gmail: Enable 2-Factor Authentication first, then create an App Password
echo  Go to: https://myaccount.google.com/apppasswords
echo  Press Enter to skip any field you do not want to configure.
echo ----------------------------------------------------------------------------
echo.

set /p SMTP_HOST="SMTP Host (press Enter for smtp.gmail.com): "
if "!SMTP_HOST!"=="" set SMTP_HOST=smtp.gmail.com

set /p SMTP_PORT="SMTP Port (press Enter for 587): "
if "!SMTP_PORT!"=="" set SMTP_PORT=587

set /p SMTP_USERNAME="SMTP Username (your email address): "
set /p SMTP_PASSWORD="SMTP Password (Gmail App Password): "
set /p SMTP_FROM_EMAIL="From Email Address: "

set /p SMTP_FROM_NAME="From Name (press Enter for InsightLoan): "
if "!SMTP_FROM_NAME!"=="" set SMTP_FROM_NAME=InsightLoan

echo.
echo [INFO] Creating configuration files...

REM Create .env.local for frontend
(
echo # InsightLoan Frontend Configuration
echo # Generated by QUICK_SETUP.bat
echo.
echo # API URL - points to the backend server
echo NEXT_PUBLIC_API_URL=http://localhost:8000
echo.
echo # Firebase Configuration
echo NEXT_PUBLIC_FIREBASE_API_KEY=!FIREBASE_API_KEY!
echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=!FIREBASE_AUTH_DOMAIN!
echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=!FIREBASE_PROJECT_ID!
echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=!FIREBASE_STORAGE_BUCKET!
echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=!FIREBASE_MESSAGING_SENDER_ID!
echo NEXT_PUBLIC_FIREBASE_APP_ID=!FIREBASE_APP_ID!
echo NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=!FIREBASE_MEASUREMENT_ID!
) > .env.local

REM Create backend/.env
(
echo # InsightLoan Backend Configuration
echo # Generated by QUICK_SETUP.bat
echo.
echo # Gemini AI Configuration
echo GEMINI_API_KEY=!GEMINI_API_KEY!
echo.
echo # Email Configuration (SMTP)
echo SMTP_HOST=!SMTP_HOST!
echo SMTP_PORT=!SMTP_PORT!
echo SMTP_USERNAME=!SMTP_USERNAME!
echo SMTP_PASSWORD=!SMTP_PASSWORD!
echo SMTP_FROM_EMAIL=!SMTP_FROM_EMAIL!
echo SMTP_FROM_NAME=!SMTP_FROM_NAME!
) > backend\.env

echo [SUCCESS] Configuration files created.
echo.

:install_deps
REM ============================================================================
REM Step 3: Install Dependencies
REM ============================================================================
echo ============================================================================
echo  Step 3: Installing Dependencies
echo ============================================================================
echo.

echo [INFO] Installing frontend dependencies with npm...
echo        This may take a few minutes.
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed.
    echo         Check your internet connection and try again.
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Frontend dependencies installed.
echo.

echo [INFO] Installing backend dependencies with pip...
echo        This may take a few minutes.
echo.
cd backend
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] pip install failed.
    echo         Check your internet connection and try again.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.
echo [SUCCESS] Backend dependencies installed.
echo.

REM ============================================================================
REM Step 4: Verify Setup
REM ============================================================================
echo ============================================================================
echo  Step 4: Verifying Setup
echo ============================================================================
echo.

REM Check if configuration files exist
if exist ".env.local" (
    echo [OK] Frontend configuration file exists: .env.local
) else (
    echo [WARNING] Frontend configuration file missing: .env.local
    echo           You need to create this file before running the application.
)

if exist "backend\.env" (
    echo [OK] Backend configuration file exists: backend\.env
) else (
    echo [WARNING] Backend configuration file missing: backend\.env
    echo           You need to create this file before running the application.
)

REM Check if node_modules exists
if exist "node_modules" (
    echo [OK] Frontend dependencies installed: node_modules
) else (
    echo [ERROR] Frontend dependencies not installed.
)

echo.

REM ============================================================================
REM Setup Complete
REM ============================================================================
echo ============================================================================
echo  SETUP COMPLETE
echo ============================================================================
echo.
echo  To start the application, you have two options:
echo.
echo  Option 1: Run START_SERVERS.bat (recommended)
echo            This will start both servers and open your browser.
echo.
echo  Option 2: Start manually in two terminal windows:
echo            Terminal 1: npm run dev
echo            Terminal 2: cd backend ^&^& python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
echo.
echo  Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo.
echo ============================================================================
echo.

set /p START_NOW="Start the application now? Enter Y to start, or press Enter to exit: "
if /i "!START_NOW!"=="y" (
    echo.
    echo [INFO] Starting servers...
    echo.
    
    REM Start backend server
    start "InsightLoan Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
    
    REM Wait for backend to initialize
    echo [INFO] Waiting for backend to start...
    timeout /t 5 /nobreak >nul
    
    REM Start frontend server
    start "InsightLoan Frontend" cmd /k "cd /d "%~dp0" && npm run dev"
    
    REM Wait for frontend to initialize
    echo [INFO] Waiting for frontend to start...
    timeout /t 8 /nobreak >nul
    
    REM Open browser
    echo [INFO] Opening browser...
    start http://localhost:3000
    
    echo.
    echo [SUCCESS] Servers started.
    echo           Keep the terminal windows open while using the application.
    echo.
)

echo Press any key to exit...
pause >nul
