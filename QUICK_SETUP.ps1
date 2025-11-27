<#
.SYNOPSIS
    InsightLoan - Quick Setup Script (PowerShell)

.DESCRIPTION
    This script helps you quickly configure and run the InsightLoan project.

.NOTES
    Author: InsightLoan Team
    Version: 1.0.0
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Colors
$Host.UI.RawUI.WindowTitle = "InsightLoan Quick Setup"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    switch ($Type) {
        "SUCCESS" { Write-Host "[OK] $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
        "HEADER"  { Write-Host $Message -ForegroundColor Magenta }
        default   { Write-Host $Message }
    }
}

function Show-Banner {
    $banner = @"

  ===============================================================================
  |                                                                             |
  |     INSIGHT LOAN - AI Credit Risk Assessment Platform                       |
  |                                                                             |
  |                        Quick Setup Script v1.0                              |
  |                                                                             |
  ===============================================================================

"@
    Write-Host $banner -ForegroundColor Cyan
}

function Test-Prerequisites {
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-ColorOutput " Step 1: Checking Prerequisites" "HEADER"
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
    
    $allGood = $true
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-ColorOutput "Node.js found: $nodeVersion" "SUCCESS"
        } else {
            throw "Not found"
        }
    } catch {
        Write-ColorOutput "Node.js not found! Please install from https://nodejs.org/" "ERROR"
        $allGood = $false
    }
    
    # Check Python
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion) {
            Write-ColorOutput "Python found: $pythonVersion" "SUCCESS"
        } else {
            throw "Not found"
        }
    } catch {
        Write-ColorOutput "Python not found! Please install from https://python.org/" "ERROR"
        $allGood = $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-ColorOutput "npm found: v$npmVersion" "SUCCESS"
        } else {
            throw "Not found"
        }
    } catch {
        Write-ColorOutput "npm not found!" "ERROR"
        $allGood = $false
    }
    
    # Check pip
    try {
        $pipVersion = python -m pip --version 2>$null
        if ($pipVersion) {
            Write-ColorOutput "pip found" "SUCCESS"
        } else {
            throw "Not found"
        }
    } catch {
        Write-ColorOutput "pip not found!" "ERROR"
        $allGood = $false
    }
    
    Write-Host ""
    
    if (-not $allGood) {
        Write-ColorOutput "Please install missing prerequisites and try again." "ERROR"
        exit 1
    }
    
    Write-ColorOutput "All prerequisites met!" "SUCCESS"
    Write-Host ""
}

function Get-Configuration {
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-ColorOutput " Step 2: Configure API Keys" "HEADER"
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
    
    # Check if .env.local exists
    if (Test-Path ".env.local") {
        Write-ColorOutput ".env.local already exists." "INFO"
        $overwrite = Read-Host "Do you want to reconfigure? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            return $false
        }
    }
    
    Write-Host ""
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  FIREBASE CONFIGURATION" -ForegroundColor Yellow
    Write-Host "  Get from: https://console.firebase.google.com/" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $config = @{}
    
    $config.FIREBASE_API_KEY = Read-Host "Firebase API Key"
    $config.FIREBASE_AUTH_DOMAIN = Read-Host "Firebase Auth Domain (e.g., project.firebaseapp.com)"
    $config.FIREBASE_PROJECT_ID = Read-Host "Firebase Project ID"
    $config.FIREBASE_STORAGE_BUCKET = Read-Host "Firebase Storage Bucket (e.g., project.firebasestorage.app)"
    $config.FIREBASE_MESSAGING_SENDER_ID = Read-Host "Firebase Messaging Sender ID"
    $config.FIREBASE_APP_ID = Read-Host "Firebase App ID"
    $config.FIREBASE_MEASUREMENT_ID = Read-Host "Firebase Measurement ID (optional, press Enter to skip)"
    
    Write-Host ""
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  GEMINI AI CONFIGURATION" -ForegroundColor Yellow
    Write-Host "  Get from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $config.GEMINI_API_KEY = Read-Host "Gemini API Key"
    
    Write-Host ""
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  EMAIL CONFIGURATION (Optional)" -ForegroundColor Yellow
    Write-Host "  For Gmail: Enable 2FA and create App Password" -ForegroundColor Yellow
    Write-Host "  https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ""
    
    $smtpHost = Read-Host "SMTP Host (default: smtp.gmail.com)"
    $config.SMTP_HOST = if ($smtpHost) { $smtpHost } else { "smtp.gmail.com" }
    
    $smtpPort = Read-Host "SMTP Port (default: 587)"
    $config.SMTP_PORT = if ($smtpPort) { $smtpPort } else { "587" }
    
    $config.SMTP_USERNAME = Read-Host "SMTP Username (your email)"
    $config.SMTP_PASSWORD = Read-Host "SMTP Password (app password)"
    $config.SMTP_FROM_EMAIL = Read-Host "From Email Address"
    
    $smtpFromName = Read-Host "From Name (default: InsightLoan)"
    $config.SMTP_FROM_NAME = if ($smtpFromName) { $smtpFromName } else { "InsightLoan" }
    
    Write-Host ""
    Write-ColorOutput "Creating configuration files..." "INFO"
    
    # Create .env.local for frontend
    $frontendEnv = @"
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$($config.FIREBASE_API_KEY)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($config.FIREBASE_AUTH_DOMAIN)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($config.FIREBASE_PROJECT_ID)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($config.FIREBASE_STORAGE_BUCKET)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($config.FIREBASE_MESSAGING_SENDER_ID)
NEXT_PUBLIC_FIREBASE_APP_ID=$($config.FIREBASE_APP_ID)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$($config.FIREBASE_MEASUREMENT_ID)
"@
    
    $frontendEnv | Out-File -FilePath ".env.local" -Encoding UTF8
    
    # Create backend/.env
    $backendEnv = @"
# Gemini AI Configuration
GEMINI_API_KEY=$($config.GEMINI_API_KEY)

# Email Configuration
SMTP_HOST=$($config.SMTP_HOST)
SMTP_PORT=$($config.SMTP_PORT)
SMTP_USERNAME=$($config.SMTP_USERNAME)
SMTP_PASSWORD=$($config.SMTP_PASSWORD)
SMTP_FROM_EMAIL=$($config.SMTP_FROM_EMAIL)
SMTP_FROM_NAME=$($config.SMTP_FROM_NAME)
"@
    
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    
    Write-ColorOutput "Configuration files created!" "SUCCESS"
    return $true
}

function Install-Dependencies {
    Write-Host ""
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-ColorOutput " Step 3: Installing Dependencies" "HEADER"
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
    
    Write-ColorOutput "Installing frontend dependencies (npm)..." "INFO"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Failed to install npm dependencies!" "ERROR"
        exit 1
    }
    Write-ColorOutput "Frontend dependencies installed!" "SUCCESS"
    
    Write-Host ""
    Write-ColorOutput "Installing backend dependencies (pip)..." "INFO"
    Push-Location backend
    python -m pip install -r requirements.txt --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Failed to install Python dependencies!" "ERROR"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-ColorOutput "Backend dependencies installed!" "SUCCESS"
}

function Build-Frontend {
    Write-Host ""
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-ColorOutput " Step 4: Build Frontend" "HEADER"
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
    
    Write-ColorOutput "Building Next.js application..." "INFO"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Build failed, but you can still run in dev mode" "WARNING"
    } else {
        Write-ColorOutput "Build successful!" "SUCCESS"
    }
}

function Show-Completion {
    Write-Host ""
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-ColorOutput " SETUP COMPLETE!" "HEADER"
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
    Write-Host "  To start the application:" -ForegroundColor White
    Write-Host ""
    Write-Host "    Option 1: Run START_SERVERS.bat (recommended)" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Option 2: Manual start:" -ForegroundColor Yellow
    Write-Host "              Terminal 1: npm run dev" -ForegroundColor Yellow
    Write-Host "              Terminal 2: cd backend && python main.py" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Access the application at:" -ForegroundColor White
    Write-Host "    Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "    Backend:  http://localhost:8000" -ForegroundColor Cyan
    Write-Host ""
    Write-ColorOutput "===============================================================================" "HEADER"
    Write-Host ""
}

function Start-Application {
    $startNow = Read-Host "Start the application now? (Y/n)"
    if ($startNow -ne "n" -and $startNow -ne "N") {
        Write-Host ""
        Write-ColorOutput "Starting servers..." "INFO"
        
        # Start backend in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python main.py"
        Start-Sleep -Seconds 3
        
        # Start frontend in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
        Start-Sleep -Seconds 5
        
        Write-ColorOutput "Servers started! Opening browser..." "SUCCESS"
        Start-Process "http://localhost:3000"
    }
}

# Main execution
Clear-Host
Show-Banner
Test-Prerequisites
Get-Configuration
Install-Dependencies
Build-Frontend
Show-Completion
Start-Application

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
