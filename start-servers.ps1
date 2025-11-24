# TrustLens AI - Startup Script
Write-Host "`n=== TrustLens AI - Starting Servers ===" -ForegroundColor Cyan

# Stop any existing processes
Write-Host "`nStopping existing processes..." -ForegroundColor Yellow
Stop-Process -Name "*python*","*node*" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Green
$backendScript = @"
cd 'D:\CodeFest 2025\trustlens-ai\backend'
.\venv\Scripts\Activate.ps1
Write-Host '=== Backend Server ===' -ForegroundColor Green
Write-Host 'Running on: http://127.0.0.1:8000' -ForegroundColor White
Write-Host ''
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "`nStarting Frontend Server..." -ForegroundColor Cyan
$frontendScript = @"
cd 'D:\CodeFest 2025\trustlens-ai'
Write-Host '=== Frontend Server ===' -ForegroundColor Cyan
Write-Host 'Running on: http://localhost:3000' -ForegroundColor White
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Wait and verify
Write-Host "`nWaiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n=== Checking Server Status ===" -ForegroundColor Cyan

# Check backend
try {
    $backend = Invoke-RestMethod -Uri "http://127.0.0.1:8000" -TimeoutSec 3
    Write-Host "✓ Backend: Running ($($backend.status))" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend: Not responding" -ForegroundColor Red
}

# Check frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Frontend: Running (HTTP $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend: Not responding yet (may still be starting...)" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Open your browser to:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
