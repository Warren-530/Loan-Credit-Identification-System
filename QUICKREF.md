# Quick Reference - InsightLoan Project

## First Time Setup

```powershell
# Run automated setup
QUICK_START.bat
```

That's it. The script handles everything.

## Daily Usage

```powershell
# Start servers
START_SERVERS.bat
```

Then open http://localhost:3000

## Manual Installation

```powershell
# Install frontend
npm install

# Install backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Verify Setup

```powershell
# Check configuration
python verify_config.py
```

## Common Commands

### Start Backend Only
```powershell
cd backend
venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Start Frontend Only
```powershell
npm run dev
```

### Test AI Connection
```powershell
cd backend
venv\Scripts\activate
python verify_ai.py
```

### Test Email Service
```powershell
cd backend
venv\Scripts\activate
python test_email.py
```

### View Database
```powershell
cd backend
venv\Scripts\activate
python view_db.py
```

## Troubleshooting

### Backend won't start
```powershell
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend won't start
```powershell
npm install
```

### Configuration errors
```powershell
python verify_config.py
```

### Kill stuck processes
```powershell
taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
```

## File Locations

| File | Purpose |
|------|---------|
| `.env.local` | Frontend config (Firebase) |
| `backend/.env` | Backend config (API keys) |
| `requirements.txt` | Python dependencies |
| `package.json` | Node.js dependencies |

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## Important Scripts

| Script | Purpose |
|--------|---------|
| `QUICK_START.bat` | First-time setup and launch |
| `START_SERVERS.bat` | Daily server startup |
| `verify_config.py` | Check configuration |
| `backend/verify_ai.py` | Test AI connection |
| `backend/test_email.py` | Test email sending |

## Getting Help

1. Check [INSTALLATION.md](INSTALLATION.md) for setup issues
2. Check [SCRIPTS.md](SCRIPTS.md) for script details
3. Check [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md) for configuration
4. Read terminal error messages carefully
5. Check browser console (F12) for frontend errors
