<#
.SYNOPSIS
    InsightLoan - Quick Setup Script (PowerShell)

.DESCRIPTION
    This script configures and sets up the InsightLoan project.
    It checks prerequisites, configures API keys, and installs dependencies.

.NOTES
    Version: 2.0
    Requires: PowerShell 5.1 or higher
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "InsightLoan Quick Setup"

# Change to script directory
Set-Location $PSScriptRoot

function Write-Status {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    switch ($Type) {
        "OK"      { Write-Host "[OK] $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
        default   { Write-Host $Message }
    }
}

function Show-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor White
    Write-Host " $Title" -ForegroundColor White
    Write-Host "============================================================================" -ForegroundColor White
    Write-Host ""
}

# Banner
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                   INSIGHTLOAN - QUICK SETUP" -ForegroundColor Cyan
Write-Host "                   AI Credit Risk Assessment Platform" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Status "Working directory: $PWD" "INFO"
Write-Host ""

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
Show-Header "Step 1: Checking Prerequisites"

$allGood = $true

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Status "Node.js found: $nodeVersion" "OK"
    } else {
        throw "Not found"
    }
} catch {
    Write-Status "Node.js is not installed." "ERROR"
    Write-Host "         Download and install from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "         Recommended version: 18 or higher" -ForegroundColor Yellow
    $allGood = $false
}

# Check Python
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Status "Python found: $pythonVersion" "OK"
    } else {
        throw "Not found"
    }
} catch {
    Write-Status "Python is not installed." "ERROR"
    Write-Host "         Download and install from: https://python.org/" -ForegroundColor Yellow
    Write-Host "         Recommended version: 3.10 or higher" -ForegroundColor Yellow
    $allGood = $false
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Status "npm found: v$npmVersion" "OK"
    } else {
        throw "Not found"
    }
} catch {
    Write-Status "npm is not found. It should be installed with Node.js." "ERROR"
    $allGood = $false
}

# Check pip
try {
    $pipCheck = python -m pip --version 2>$null
    if ($pipCheck) {
        Write-Status "pip found" "OK"
    } else {
        throw "Not found"
    }
} catch {
    Write-Status "pip is not found. It should be installed with Python." "ERROR"
    $allGood = $false
}

if (-not $allGood) {
    Write-Host ""
    Write-Status "Please install the missing prerequisites and run this script again." "ERROR"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Status "All prerequisites are installed." "SUCCESS"

# ============================================================================
# Step 2: Configure API Keys
# ============================================================================
Show-Header "Step 2: Configure API Keys"

$skipConfig = $false

# Check if configuration already exists
if ((Test-Path ".env.local") -and (Test-Path "backend\.env")) {
    Write-Status "Configuration files already exist." "INFO"
    $reconfig = Read-Host "Do you want to reconfigure? Enter Y to reconfigure, or press Enter to skip"
    if ($reconfig -ne "y" -and $reconfig -ne "Y") {
        Write-Status "Skipping configuration..." "INFO"
        $skipConfig = $true
    }
}

if (-not $skipConfig) {
    Write-Host ""
    Write-Host "You need API keys to run this application."
    Write-Host "If you do not have them yet, you can skip for now and configure later."
    Write-Host ""
    $skipChoice = Read-Host "Press Enter to configure now, or enter S to skip"
    
    if ($skipChoice -eq "s" -or $skipChoice -eq "S") {
        Write-Host ""
        Write-Status "Skipping configuration." "INFO"
        Write-Host "       You will need to create these files manually before running:" -ForegroundColor Yellow
        Write-Host "       - .env.local (frontend configuration)" -ForegroundColor Yellow
        Write-Host "       - backend\.env (backend configuration)" -ForegroundColor Yellow
        $skipConfig = $true
    }
}

if (-not $skipConfig) {
    Write-Host ""
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host " FIREBASE CONFIGURATION" -ForegroundColor Yellow
    Write-Host " Go to: https://console.firebase.google.com/" -ForegroundColor Yellow
    Write-Host " Create a project and get your web app configuration." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $firebaseApiKey = Read-Host "Firebase API Key"
    $firebaseAuthDomain = Read-Host "Firebase Auth Domain (example: your-project.firebaseapp.com)"
    $firebaseProjectId = Read-Host "Firebase Project ID"
    $firebaseStorageBucket = Read-Host "Firebase Storage Bucket (example: your-project.firebasestorage.app)"
    $firebaseMessagingSenderId = Read-Host "Firebase Messaging Sender ID"
    $firebaseAppId = Read-Host "Firebase App ID"
    $firebaseMeasurementId = Read-Host "Firebase Measurement ID (optional, press Enter to skip)"
    
    Write-Host ""
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host " GEMINI AI CONFIGURATION" -ForegroundColor Yellow
    Write-Host " Go to: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host " Create an API key for Gemini." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $geminiApiKey = Read-Host "Gemini API Key"
    
    Write-Host ""
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host " EMAIL CONFIGURATION (Optional)" -ForegroundColor Yellow
    Write-Host " For Gmail: Enable 2-Factor Authentication first, then create an App Password" -ForegroundColor Yellow
    Write-Host " Go to: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
    Write-Host " Press Enter to skip any field you do not want to configure." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $smtpHost = Read-Host "SMTP Host (press Enter for smtp.gmail.com)"
    if ([string]::IsNullOrEmpty($smtpHost)) { $smtpHost = "smtp.gmail.com" }
    
    $smtpPort = Read-Host "SMTP Port (press Enter for 587)"
    if ([string]::IsNullOrEmpty($smtpPort)) { $smtpPort = "587" }
    
    $smtpUsername = Read-Host "SMTP Username (your email address)"
    $smtpPassword = Read-Host "SMTP Password (Gmail App Password)"
    $smtpFromEmail = Read-Host "From Email Address"
    
    $smtpFromName = Read-Host "From Name (press Enter for InsightLoan)"
    if ([string]::IsNullOrEmpty($smtpFromName)) { $smtpFromName = "InsightLoan" }
    
    Write-Host ""
    Write-Status "Creating configuration files..." "INFO"
    
    # Create .env.local for frontend
    $frontendEnv = @"
# InsightLoan Frontend Configuration
# Generated by QUICK_SETUP.ps1

# API URL - points to the backend server
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$firebaseApiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$firebaseAuthDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$firebaseProjectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$firebaseStorageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$firebaseMessagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=$firebaseAppId
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$firebaseMeasurementId
"@
    $frontendEnv | Out-File -FilePath ".env.local" -Encoding UTF8
    
    # Create backend/.env
    $backendEnv = @"
# InsightLoan Backend Configuration
# Generated by QUICK_SETUP.ps1

# Gemini AI Configuration
GEMINI_API_KEY=$geminiApiKey

# Email Configuration (SMTP)
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_USERNAME=$smtpUsername
SMTP_PASSWORD=$smtpPassword
SMTP_FROM_EMAIL=$smtpFromEmail
SMTP_FROM_NAME=$smtpFromName
"@
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    
    Write-Status "Configuration files created." "SUCCESS"
}

# ============================================================================
# Step 3: Install Dependencies
# ============================================================================
Show-Header "Step 3: Installing Dependencies"

Write-Status "Installing frontend dependencies with npm..." "INFO"
Write-Host "       This may take a few minutes." -ForegroundColor Gray
Write-Host ""

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Status "npm install failed." "ERROR"
    Write-Host "       Check your internet connection and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Status "Frontend dependencies installed." "SUCCESS"
Write-Host ""

Write-Status "Installing backend dependencies with pip..." "INFO"
Write-Host "       This may take a few minutes." -ForegroundColor Gray
Write-Host ""

Push-Location backend
python -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Status "pip install failed." "ERROR"
    Write-Host "       Check your internet connection and try again." -ForegroundColor Yellow
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Pop-Location

Write-Host ""
Write-Status "Backend dependencies installed." "SUCCESS"

# ============================================================================
# Step 4: Verify Setup
# ============================================================================
Show-Header "Step 4: Verifying Setup"

if (Test-Path ".env.local") {
    Write-Status "Frontend configuration file exists: .env.local" "OK"
} else {
    Write-Status "Frontend configuration file missing: .env.local" "WARNING"
    Write-Host "          You need to create this file before running the application." -ForegroundColor Yellow
}

if (Test-Path "backend\.env") {
    Write-Status "Backend configuration file exists: backend\.env" "OK"
} else {
    Write-Status "Backend configuration file missing: backend\.env" "WARNING"
    Write-Host "          You need to create this file before running the application." -ForegroundColor Yellow
}

if (Test-Path "node_modules") {
    Write-Status "Frontend dependencies installed: node_modules" "OK"
} else {
    Write-Status "Frontend dependencies not installed." "ERROR"
}

# ============================================================================
# Setup Complete
# ============================================================================
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host " SETUP COMPLETE" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " To start the application, you have two options:" -ForegroundColor White
Write-Host ""
Write-Host " Option 1: Run START_SERVERS.bat (recommended)" -ForegroundColor Cyan
Write-Host "           This will start both servers and open your browser." -ForegroundColor Gray
Write-Host ""
Write-Host " Option 2: Start manually in two terminal windows:" -ForegroundColor Yellow
Write-Host "           Terminal 1: npm run dev" -ForegroundColor Gray
Write-Host "           Terminal 2: cd backend; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""
Write-Host " Application URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""

$startNow = Read-Host "Start the application now? Enter Y to start, or press Enter to exit"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Status "Starting servers..." "INFO"
    Write-Host ""
    
    # Start backend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\backend'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
    
    Write-Status "Waiting for backend to start..." "INFO"
    Start-Sleep -Seconds 5
    
    # Start frontend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD'; npm run dev"
    
    Write-Status "Waiting for frontend to start..." "INFO"
    Start-Sleep -Seconds 8
    
    # Open browser
    Write-Status "Opening browser..." "INFO"
    Start-Process "http://localhost:3000"
    
    Write-Host ""
    Write-Status "Servers started." "SUCCESS"
    Write-Host "          Keep the terminal windows open while using the application." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
