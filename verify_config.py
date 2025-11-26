"""
配置验证脚本 - 检查所有必需的配置是否正确设置
Configuration Verification - Check if all required configurations are set
"""
import os
from pathlib import Path

def check_mark(condition):
    return "✅" if condition else "❌"

def main():
    print("=" * 60)
    print("InsightLoan 配置验证 / Configuration Verification")
    print("=" * 60)
    print()
    
    # 检查前端配置
    print("📱 前端配置 / Frontend Configuration")
    print("-" * 60)
    
    env_local = Path(".env.local")
    if env_local.exists():
        print(f"{check_mark(True)} .env.local 文件存在")
        
        with open(env_local, 'r', encoding='utf-8') as f:
            content = f.read()
            
        checks = {
            "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyAqV2MqEoeaLJMI40Ud-wSA7VXo39RqBbA" in content,
            "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "codefest2025---insightloan" in content,
            "NEXT_PUBLIC_FIREBASE_APP_ID": "1:461130606784:web:e74a290ae8c0f8456c6525" in content,
            "NEXT_PUBLIC_API_URL": "http://localhost:8000" in content,
        }
        
        for key, exists in checks.items():
            print(f"  {check_mark(exists)} {key}")
    else:
        print(f"{check_mark(False)} .env.local 文件不存在")
    
    print()
    
    # 检查后端配置
    print("⚙️  后端配置 / Backend Configuration")
    print("-" * 60)
    
    backend_env = Path("backend/.env")
    if backend_env.exists():
        print(f"{check_mark(True)} backend/.env 文件存在")
        
        with open(backend_env, 'r', encoding='utf-8') as f:
            content = f.read()
            
        checks = {
            "GEMINI_API_KEY": "gen-lang-client-0151514222" in content,
            "SMTP_USERNAME": "insightloan.official@gmail.com" in content,
            "SMTP_PASSWORD": "whgznbsuhtgniccb" in content,
            "SMTP_HOST": "smtp.gmail.com" in content,
        }
        
        for key, exists in checks.items():
            print(f"  {check_mark(exists)} {key}")
    else:
        print(f"{check_mark(False)} backend/.env 文件不存在")
    
    print()
    
    # 检查依赖文件
    print("📦 项目文件 / Project Files")
    print("-" * 60)
    
    files = {
        "package.json": Path("package.json"),
        "backend/requirements.txt": Path("backend/requirements.txt"),
        "backend/main.py": Path("backend/main.py"),
        "START_SERVERS.bat": Path("START_SERVERS.bat"),
    }
    
    for name, path in files.items():
        print(f"{check_mark(path.exists())} {name}")
    
    print()
    
    # 总结
    print("=" * 60)
    all_configured = (
        env_local.exists() and 
        backend_env.exists() and
        all(p.exists() for p in files.values())
    )
    
    if all_configured:
        print("✅ 配置完成！可以运行项目了。")
        print("✅ Configuration complete! Ready to run.")
        print()
        print("运行项目 / Run Project:")
        print("  方法1: 双击 START_SERVERS.bat")
        print("  Method 1: Double-click START_SERVERS.bat")
        print()
        print("  方法2: 手动启动 / Method 2: Manual start")
        print("    终端1 / Terminal 1: cd backend && python -m uvicorn main:app --reload")
        print("    终端2 / Terminal 2: npm run dev")
    else:
        print("❌ 配置不完整，请检查上述缺失项")
        print("❌ Configuration incomplete, please check missing items above")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
