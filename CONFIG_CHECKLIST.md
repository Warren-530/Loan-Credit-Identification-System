# ✅ InsightLoan 配置清单

## 已完成的配置

### 1. ✅ Gemini API 配置
- **API Key**: `gen-lang-client-0151514222`
- **位置**: `backend/.env`
- **变量名**: `GEMINI_API_KEY`

### 2. ✅ Firebase 配置
- **项目**: codefest2025---insightloan
- **位置**: `.env.local`
- **配置项**:
  - API Key: AIzaSyAqV2MqEoeaLJMI40Ud-wSA7VXo39RqBbA
  - Auth Domain: codefest2025---insightloan.firebaseapp.com
  - Project ID: codefest2025---insightloan
  - Storage Bucket: codefest2025---insightloan.firebasestorage.app
  - Messaging Sender ID: 461130606784
  - App ID: 1:461130606784:web:e74a290ae8c0f8456c6525
  - Measurement ID: G-XF476EL15K

### 3. ✅ Email (Gmail SMTP) 配置
- **发件邮箱**: insightloan.official@gmail.com
- **App密码**: whgznbsuhtgniccb
- **SMTP服务器**: smtp.gmail.com:587
- **位置**: `backend/.env`

## 下一步操作

### 首次运行前需要安装依赖:

#### 选项A: 使用一键启动脚本 (自动安装)
```cmd
双击运行: QUICK_START.bat
```
这个脚本会：
1. 验证配置
2. 自动安装前端依赖 (npm install)
3. 自动安装后端依赖 (pip install)
4. 启动服务器
5. 自动打开浏览器

#### 选项B: 手动安装依赖
```powershell
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. 运行项目
# 方式1: 使用批处理脚本
START_SERVERS.bat

# 方式2: 手动启动两个终端
# 终端1 - 后端
cd backend
venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# 终端2 - 前端
npm run dev
```

## 验证配置

运行验证脚本检查配置是否正确:
```powershell
python verify_config.py
```

应该看到所有项目都显示 ✅

## 访问应用

启动成功后访问:
- **前端**: http://localhost:3000
- **后端API文档**: http://localhost:8000/docs

## 文件说明

| 文件 | 说明 |
|------|------|
| `.env.local` | 前端环境变量 (Firebase配置) |
| `backend/.env` | 后端环境变量 (Gemini API, Email配置) |
| `QUICK_START.bat` | 一键启动脚本 (自动安装+启动) |
| `START_SERVERS.bat` | 快速启动脚本 (仅启动服务器) |
| `verify_config.py` | 配置验证脚本 |
| `SETUP_GUIDE_CN.md` | 详细配置指南 (中文) |

## 🔐 安全提醒

⚠️ **重要**:
- `.env.local` 和 `backend/.env` 包含敏感信息
- 这些文件**不应该**提交到 Git
- 已自动添加到 `.gitignore`
- 生产环境使用环境变量而不是文件

## 常见问题

### Q1: 后端启动失败，提示 "GEMINI_API_KEY not set"
**A**: 确认 `backend/.env` 文件存在且包含 `GEMINI_API_KEY=gen-lang-client-0151514222`

### Q2: 前端无法连接后端
**A**: 确认后端已经启动在 http://localhost:8000，检查终端输出

### Q3: Firebase 认证错误
**A**: 确认 `.env.local` 文件存在且包含所有 Firebase 配置项

### Q4: Email 发送失败
**A**: 
1. 确认 Gmail App密码正确
2. 确认 Gmail 账户已启用"两步验证"
3. 确认已生成"应用专用密码"

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **后端**: FastAPI, Python 3.10+, SQLModel
- **AI**: Google Gemini 2.0 Flash
- **认证**: Firebase Auth
- **数据库**: SQLite
- **Email**: Gmail SMTP

---

✨ **配置完成！现在可以运行项目了。**

推荐使用 `QUICK_START.bat` 进行首次启动，它会自动处理所有设置。
