# 🚀 InsightLoan 项目配置与运行指南

## 📋 配置已完成

我已经为您配置好了以下内容：

### ✅ 已配置的服务

1. **Gemini API** - AI分析引擎
2. **Firebase** - 身份验证和分析
3. **Email服务** - Gmail SMTP邮件发送

配置文件位置：
- Frontend: `.env.local` (根目录)
- Backend: `backend/.env`

## 🛠️ 第一次运行 - 安装依赖

### 1️⃣ 安装前端依赖 (Next.js)

在项目根目录运行：
```powershell
npm install
```

### 2️⃣ 安装后端依赖 (Python FastAPI)

**选项A: 使用虚拟环境 (推荐)**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**选项B: 全局安装**
```powershell
cd backend
pip install -r requirements.txt
cd ..
```

## 🚀 运行项目

### 方法1: 使用批处理脚本 (最简单)

直接双击运行：
```
START_SERVERS.bat
```

这会同时启动前端和后端服务器。

### 方法2: 手动启动 (推荐用于开发)

**终端1 - 启动后端服务器:**
```powershell
cd backend
# 如果使用虚拟环境，先激活
venv\Scripts\activate
# 启动后端
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**终端2 - 启动前端服务器:**
```powershell
# 在项目根目录
npm run dev
```

## 🌐 访问应用

启动成功后，在浏览器访问：

- **前端界面**: http://localhost:3000
- **后端API文档**: http://localhost:8000/docs
- **后端API**: http://localhost:8000

## 🔧 配置详情

### Gemini API 配置
```
API Key: gen-lang-client-0151514222
Model: gemini-2.0-flash
```

### Firebase 配置
```
Project: codefest2025---insightloan
Auth Domain: codefest2025---insightloan.firebaseapp.com
```

### Email 配置
```
SMTP: Gmail (smtp.gmail.com:587)
发件地址: insightloan.official@gmail.com
```

## 📝 使用说明

1. 打开 http://localhost:3000
2. 点击 `+ New Application` 创建新申请
3. 填写申请人信息：
   - 贷款类型 (Micro-Business, Personal, Housing, Car)
   - 身份证号码
   - 申请人姓名
   - 申请金额
4. 上传文档：
   - 银行对账单 (PDF) - 必需
   - 贷款申请书 (PDF/TXT) - 可选
5. 提交并查看AI实时分析结果

## 🐛 故障排查

### 问题1: 后端无法启动
**错误**: `GEMINI_API_KEY not set`
**解决**: 确认 `backend/.env` 文件存在且包含 API key

### 问题2: 前端无法连接后端
**错误**: `Failed to fetch`
**解决**: 确认后端已启动在 http://localhost:8000

### 问题3: Firebase 错误
**错误**: `Firebase: Error (auth/...)`
**解决**: 确认 `.env.local` 文件存在且包含所有 Firebase 配置

### 问题4: Python 模块未找到
**错误**: `ModuleNotFoundError`
**解决**: 
```powershell
cd backend
pip install -r requirements.txt
```

## 📦 后续开发

### 启动开发服务器
```powershell
# 前端 (支持热重载)
npm run dev

# 后端 (支持热重载)
cd backend
python -m uvicorn main:app --reload
```

### 构建生产版本
```powershell
# 前端
npm run build
npm start

# 后端
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🔐 安全注意事项

⚠️ **重要**: 
- `.env.local` 和 `backend/.env` 包含敏感信息
- 这些文件已自动加入 `.gitignore`
- **不要将这些文件提交到 Git**
- 部署时使用环境变量替代文件配置

## 📞 支持

如遇问题，检查：
1. 终端输出的错误信息
2. 浏览器控制台 (F12)
3. 后端日志 (运行后端的终端)

---

✨ 配置完成！现在可以运行项目了。
