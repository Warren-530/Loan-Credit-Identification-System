# InsightLoan - Installation and Setup Guide

## System Requirements

- Node.js 18 or higher
- Python 3.10 or higher
- npm (comes with Node.js)
- pip (comes with Python)
- Windows, macOS, or Linux

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the automated setup script that handles dependency installation and server startup:

```cmd
QUICK_START.bat
```

This script will:
1. Verify all configuration files exist
2. Install frontend dependencies automatically
3. Create Python virtual environment
4. Install backend dependencies automatically
5. Start both servers
6. Open the application in your browser

### Option 2: Manual Setup

If you prefer to set up manually or the automated script fails, follow these steps:

#### Step 1: Install Frontend Dependencies

```powershell
npm install
```

This installs all JavaScript packages listed in package.json, including:
- Next.js framework
- React libraries
- UI components (Radix UI)
- Firebase SDK
- Tailwind CSS

#### Step 2: Install Backend Dependencies

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

This installs all Python packages from requirements.txt, including:
- FastAPI web framework
- Uvicorn ASGI server
- Google Gemini AI SDK
- PDF processing libraries
- Database ORM

#### Step 3: Verify Configuration

Run the configuration verification script:

```powershell
python verify_config.py
```

This checks that all required configuration files exist and contain the necessary API keys.

#### Step 4: Start the Application

Use the server startup script:

```cmd
START_SERVERS.bat
```

Or start each server manually in separate terminals:

Terminal 1 (Backend):
```powershell
cd backend
venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (Frontend):
```powershell
npm run dev
```

## Configuration Files

The following environment configuration files must exist:

### Frontend Configuration (.env.local)

Located in project root directory. Contains Firebase credentials and API endpoint.

Required variables:
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

### Backend Configuration (backend/.env)

Located in backend directory. Contains Gemini API key and email credentials.

Required variables:
- GEMINI_API_KEY
- SMTP_HOST
- SMTP_PORT
- SMTP_USERNAME
- SMTP_PASSWORD
- SMTP_FROM_EMAIL
- SMTP_FROM_NAME

## Accessing the Application

Once both servers are running:

- Frontend Application: http://localhost:3000
- Backend API Documentation: http://localhost:8000/docs
- Backend API Base URL: http://localhost:8000

## Helpful Scripts

The project includes several utility scripts to simplify setup and troubleshooting:

### QUICK_START.bat
Complete automated setup and launch script.

What it does:
- Runs verify_config.py to check configuration
- Installs npm dependencies if node_modules folder missing
- Creates Python virtual environment if not exists
- Installs Python dependencies if not already installed
- Starts both frontend and backend servers
- Opens browser to application

When to use:
- First time setup
- After pulling new changes
- When dependencies might be out of date

### START_SERVERS.bat
Fast server startup without dependency checks.

What it does:
- Kills any existing Python and Node processes
- Starts backend server on port 8000
- Starts frontend server on port 3000

When to use:
- Daily development work
- When dependencies are already installed
- Quick restart after code changes

### verify_config.py
Configuration verification script.

What it does:
- Checks .env.local exists and contains Firebase config
- Checks backend/.env exists and contains API keys
- Verifies all required project files are present
- Displays status of each configuration item

When to use:
- After initial configuration
- Troubleshooting configuration issues
- Before running servers for first time

### Backend Scripts (located in backend/ directory)

#### check_all_apps.py
Checks all applications in the database.

#### check_email_settings.py
Verifies email SMTP configuration is working.

#### debug_smtp.py
Tests SMTP connection and email sending.

#### test_email.py
Sends a test email to verify email service.

#### verify_ai.py
Tests Gemini API connection and response.

#### view_db.py
Displays database contents for debugging.

#### migrate_db.py
Runs database migrations and schema updates.

## Troubleshooting

### Common Issues and Solutions

#### Issue: "GEMINI_API_KEY not set"

Solution:
1. Verify backend/.env file exists
2. Check that GEMINI_API_KEY variable is set
3. Run verify_config.py to confirm

#### Issue: "Module not found" errors

Solution:
1. Check if virtual environment is activated
2. Reinstall dependencies:
   ```powershell
   cd backend
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

#### Issue: Frontend cannot connect to backend

Solution:
1. Verify backend is running on http://localhost:8000
2. Check backend terminal for errors
3. Verify .env.local has NEXT_PUBLIC_API_URL=http://localhost:8000

#### Issue: Firebase authentication errors

Solution:
1. Verify .env.local file exists
2. Check all Firebase variables are set correctly
3. Run verify_config.py

#### Issue: Port already in use

Solution:
1. Kill existing processes:
   ```powershell
   taskkill /F /IM python.exe /T
   taskkill /F /IM node.exe /T
   ```
2. Wait a few seconds
3. Restart servers

#### Issue: Email sending fails

Solution:
1. Verify Gmail account has 2-factor authentication enabled
2. Generate an App Password (not your regular Gmail password)
3. Update SMTP_PASSWORD in backend/.env with App Password
4. Test with: `cd backend && python test_email.py`

### Testing Individual Components

Test backend only:
```powershell
cd backend
venv\Scripts\activate
python main.py
```

Test frontend only:
```powershell
npm run dev
```

Test AI connection:
```powershell
cd backend
venv\Scripts\activate
python verify_ai.py
```

Test email service:
```powershell
cd backend
venv\Scripts\activate
python check_email_settings.py
```

## Development Workflow

### Making Changes

Both servers support hot reload:
- Frontend: Changes to .tsx/.ts files reload automatically
- Backend: Changes to .py files reload automatically (with --reload flag)

### Building for Production

Frontend production build:
```powershell
npm run build
npm start
```

Backend production run:
```powershell
cd backend
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
InsightLoan/
├── app/                    # Next.js pages and routes
├── backend/                # FastAPI backend
│   ├── main.py            # API endpoints
│   ├── ai_engine.py       # Gemini AI integration
│   ├── config.py          # Configuration constants
│   ├── models.py          # Database models
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── components/            # React components
├── lib/                   # Utilities and helpers
├── public/               # Static assets
├── .env.local           # Frontend environment variables
├── package.json         # Node.js dependencies
├── requirements.txt     # Python dependencies (root)
└── QUICK_START.bat      # Automated setup script
```

## Security Notes

Important: Never commit sensitive files to version control
- .env.local contains Firebase credentials
- backend/.env contains API keys and passwords
- Both files are in .gitignore
- Use environment variables in production

## Additional Resources

- Check CONFIG_CHECKLIST.md for configuration reference
- See backend/README.md for backend-specific documentation
- Visit http://localhost:8000/docs for API documentation when server is running

## Support

If issues persist after following this guide:
1. Check terminal output for specific error messages
2. Review browser console (F12) for frontend errors
3. Check backend terminal for API errors
4. Verify all dependencies are installed correctly
5. Ensure configuration files match CONFIG_CHECKLIST.md
