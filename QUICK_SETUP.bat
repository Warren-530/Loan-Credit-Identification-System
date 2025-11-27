@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM ╔══════════════════════════════════════════════════════════════════════════════╗
REM ║                    InsightLoan - Quick Setup Script                           ║
REM ║                         One-Click Setup                                       ║
REM ╚══════════════════════════════════════════════════════════════════════════════╝

title InsightLoan Quick Setup

echo.
echo  ╔══════════════════════════════════════════════════════════════════════════╗
echo  ║                                                                          ║
echo  ║     ██╗███╗   ██╗███████╗██╗ ██████╗ ██╗  ██╗████████╗                   ║
echo  ║     ██║████╗  ██║██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝                   ║
echo  ║     ██║██╔██╗ ██║███████╗██║██║  ███╗███████║   ██║                      ║
echo  ║     ██║██║╚██╗██║╚════██║██║██║   ██║██╔══██║   ██║                      ║
echo  ║     ██║██║ ╚████║███████║██║╚██████╔╝██║  ██║   ██║                      ║
echo  ║     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝                      ║
echo  ║                         LOAN SYSTEM                                      ║
echo  ║                                                                          ║
echo  ║                        Quick Setup v1.0                                  ║
echo  ╚══════════════════════════════════════════════════════════════════════════╝
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Running without admin privileges - some features may be limited
)

echo ══════════════════════════════════════════════════════════════════════════════
echo  Step 1: Checking Prerequisites
echo ══════════════════════════════════════════════════════════════════════════════
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo         Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo [OK] Node.js found: !NODE_VER!
)

REM Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo         Please install Python 3.10+ from: https://python.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
    echo [OK] Python found: !PY_VER!
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
) else (
    echo [OK] npm found
)

REM Check pip
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pip not found!
    pause
    exit /b 1
) else (
    echo [OK] pip found
)

echo.
echo [SUCCESS] All prerequisites met!
echo.

echo ══════════════════════════════════════════════════════════════════════════════
echo  Step 2: Configure API Keys
echo ══════════════════════════════════════════════════════════════════════════════
echo.

REM Check if .env.local exists
if exist ".env.local" (
    echo [INFO] .env.local already exists.
    set /p OVERWRITE="Do you want to reconfigure? (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        goto :skip_config
    )
)

echo.
echo ┌──────────────────────────────────────────────────────────────────────────┐
echo │  FIREBASE CONFIGURATION                                                  │
echo │  Get from: https://console.firebase.google.com/                          │
echo └──────────────────────────────────────────────────────────────────────────┘
echo.

set /p FIREBASE_API_KEY="Firebase API Key: "
set /p FIREBASE_AUTH_DOMAIN="Firebase Auth Domain (e.g., project.firebaseapp.com): "
set /p FIREBASE_PROJECT_ID="Firebase Project ID: "
set /p FIREBASE_STORAGE_BUCKET="Firebase Storage Bucket (e.g., project.firebasestorage.app): "
set /p FIREBASE_MESSAGING_SENDER_ID="Firebase Messaging Sender ID: "
set /p FIREBASE_APP_ID="Firebase App ID: "
set /p FIREBASE_MEASUREMENT_ID="Firebase Measurement ID (optional, press Enter to skip): "

echo.
echo ┌──────────────────────────────────────────────────────────────────────────┐
echo │  GEMINI AI CONFIGURATION                                                 │
echo │  Get from: https://aistudio.google.com/app/apikey                        │
echo └──────────────────────────────────────────────────────────────────────────┘
echo.

set /p GEMINI_API_KEY="Gemini API Key: "

echo.
echo ┌──────────────────────────────────────────────────────────────────────────┐
echo │  EMAIL CONFIGURATION (Optional)                                          │
echo │  For Gmail: Enable 2FA and create App Password                           │
echo │  https://myaccount.google.com/apppasswords                               │
echo └──────────────────────────────────────────────────────────────────────────┘
echo.

set /p SMTP_HOST="SMTP Host (default: smtp.gmail.com): "
if "!SMTP_HOST!"=="" set SMTP_HOST=smtp.gmail.com

set /p SMTP_PORT="SMTP Port (default: 587): "
if "!SMTP_PORT!"=="" set SMTP_PORT=587

set /p SMTP_USERNAME="SMTP Username (your email): "
set /p SMTP_PASSWORD="SMTP Password (app password): "
set /p SMTP_FROM_EMAIL="From Email Address: "
set /p SMTP_FROM_NAME="From Name (default: InsightLoan): "
if "!SMTP_FROM_NAME!"=="" set SMTP_FROM_NAME=InsightLoan

echo.
echo [INFO] Creating configuration files...

REM Create .env.local for frontend
(
echo # Frontend Configuration
echo NEXT_PUBLIC_API_URL=http://localhost:8000
echo.
echo # Firebase Configuration
echo NEXT_PUBLIC_FIREBASE_API_KEY=%FIREBASE_API_KEY%
echo NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=%FIREBASE_AUTH_DOMAIN%
echo NEXT_PUBLIC_FIREBASE_PROJECT_ID=%FIREBASE_PROJECT_ID%
echo NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=%FIREBASE_STORAGE_BUCKET%
echo NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=%FIREBASE_MESSAGING_SENDER_ID%
echo NEXT_PUBLIC_FIREBASE_APP_ID=%FIREBASE_APP_ID%
echo NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=%FIREBASE_MEASUREMENT_ID%
) > .env.local

REM Create backend/.env
(
echo # Gemini AI Configuration
echo GEMINI_API_KEY=%GEMINI_API_KEY%
echo.
echo # Email Configuration
echo SMTP_HOST=%SMTP_HOST%
echo SMTP_PORT=%SMTP_PORT%
echo SMTP_USERNAME=%SMTP_USERNAME%
echo SMTP_PASSWORD=%SMTP_PASSWORD%
echo SMTP_FROM_EMAIL=%SMTP_FROM_EMAIL%
echo SMTP_FROM_NAME=%SMTP_FROM_NAME%
) > backend\.env

echo [SUCCESS] Configuration files created!

:skip_config
echo.

echo ══════════════════════════════════════════════════════════════════════════════
echo  Step 3: Installing Dependencies
echo ══════════════════════════════════════════════════════════════════════════════
echo.

echo [INFO] Installing frontend dependencies (npm)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies!
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies installed!

echo.
echo [INFO] Installing backend dependencies (pip)...
cd backend
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Backend dependencies installed!

echo.

echo ══════════════════════════════════════════════════════════════════════════════
echo  Step 4: Build Frontend
echo ══════════════════════════════════════════════════════════════════════════════
echo.

echo [INFO] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Build failed, but you can still run in dev mode
)

echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo  SETUP COMPLETE!
echo ══════════════════════════════════════════════════════════════════════════════
echo.
echo  To start the application:
echo.
echo    Option 1: Run START_SERVERS.bat (recommended)
echo.
echo    Option 2: Manual start:
echo              Terminal 1: npm run dev
echo              Terminal 2: cd backend ^&^& python main.py
echo.
echo  Access the application at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo.
echo ══════════════════════════════════════════════════════════════════════════════
echo.

set /p START_NOW="Start the application now? (Y/n): "
if /i not "!START_NOW!"=="n" (
    echo.
    echo [INFO] Starting servers...
    start "InsightLoan Backend" cmd /k "cd backend && python main.py"
    timeout /t 3 /nobreak >nul
    start "InsightLoan Frontend" cmd /k "npm run dev"
    timeout /t 5 /nobreak >nul
    echo.
    echo [SUCCESS] Servers started! Opening browser...
    start http://localhost:3000
)

echo.
echo Press any key to exit...
pause >nul
