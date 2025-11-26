@echo off
echo ================================================
echo   InsightLoan - 一键启动 Quick Start
echo ================================================
echo.

echo [1/4] 检查配置文件...
python verify_config.py
if %errorlevel% neq 0 (
    echo.
    echo ❌ 配置验证失败！请检查配置文件。
    pause
    exit /b 1
)

echo.
echo [2/4] 检查前端依赖...
if not exist "node_modules\" (
    echo 📦 安装前端依赖 (npm install)...
    call npm install
) else (
    echo ✅ 前端依赖已安装
)

echo.
echo [3/4] 检查后端依赖...
cd backend
if not exist "venv\" (
    echo 📦 创建Python虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate
pip list | findstr "fastapi" >nul
if %errorlevel% neq 0 (
    echo 📦 安装后端依赖 (pip install)...
    pip install -r requirements.txt
) else (
    echo ✅ 后端依赖已安装
)
cd ..

echo.
echo [4/4] 启动服务器...
echo.
echo ================================================
echo   正在启动服务器...
echo ================================================
echo.

REM 停止现有进程
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🚀 启动后端服务器 (Port 8000)...
cd backend
start "InsightLoan Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
cd ..

timeout /t 3 /nobreak >nul

echo 🚀 启动前端服务器 (Port 3000)...
start "InsightLoan Frontend" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo   ✅ 服务器启动成功！
echo ================================================
echo.
echo 🌐 访问应用:
echo    前端: http://localhost:3000
echo    后端API: http://localhost:8000/docs
echo.
echo 📝 按任意键打开浏览器...
pause >nul

start http://localhost:3000

echo.
echo ✨ 完成! 享受使用 InsightLoan
echo.
pause
