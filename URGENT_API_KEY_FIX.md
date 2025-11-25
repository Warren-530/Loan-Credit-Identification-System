# 🚨 URGENT: API Key Leaked - Fix Required

## Problem
Your Gemini API key was exposed on GitHub and has been disabled by Google for security.

## Immediate Steps

### 1. Get a New API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the new key (starts with `AIza...`)

### 2. Update Backend .env File
Open `backend\.env` and replace the old key:

```env
# TrustLens AI Backend Configuration
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
DATABASE_URL=sqlite:///./trustlens.db
UPLOAD_DIR=./uploads
```

**IMPORTANT:** Replace `YOUR_NEW_KEY_HERE` with your actual new API key!

### 3. Restart Backend Server
Stop the backend PowerShell window and restart it with:
```cmd
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 4. Verify It Works
Upload a new application - AI analysis should now work!

## Security Best Practices

### ✅ DO:
- Keep API keys in `.env` files (already gitignored)
- Use environment variables
- Rotate keys regularly
- Restrict API key permissions in Google Cloud Console

### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys in code
- Hardcode keys in source files
- Push keys to GitHub

## Why This Happened
The API key was visible in your GitHub repository (in comments or committed files). GitHub scans for exposed keys and reports them to providers. Google disabled the key to protect you.

## Current Status
- ❌ Old key: `AIzaSyBlaCbeTEyjptrl_YMJircDlOzLGg_D-mk` (DISABLED)
- ⏸️ Waiting for new key
- ✅ `.env` is properly gitignored
- ✅ System ready once new key is added

## After Getting New Key
The system will work perfectly - everything else is configured correctly!
