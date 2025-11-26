# InsightLoan - Script Reference Guide

This document describes all available scripts in the project and when to use them.

## Startup Scripts

### QUICK_START.bat
**Location:** Project root directory

**Purpose:** Complete automated setup and launch for first-time users or after updates.

**What it does:**
1. Runs configuration verification
2. Checks if frontend dependencies are installed
3. Installs npm packages if node_modules is missing
4. Creates Python virtual environment if needed
5. Checks if backend dependencies are installed
6. Installs Python packages if needed
7. Kills any existing server processes
8. Starts backend server on port 8000
9. Starts frontend server on port 3000
10. Opens browser to http://localhost:3000

**When to use:**
- First time running the project
- After cloning the repository
- After pulling major updates
- When you suspect dependencies are outdated
- If you encounter "module not found" errors

**How to run:**
```cmd
Double-click QUICK_START.bat
```
or
```powershell
.\QUICK_START.bat
```

**Exit codes:**
- 0: Success
- 1: Configuration verification failed

---

### START_SERVERS.bat
**Location:** Project root directory

**Purpose:** Quick server startup for daily development work.

**What it does:**
1. Terminates existing Python and Node.js processes
2. Waits 2 seconds for cleanup
3. Starts backend server with hot reload
4. Waits 3 seconds for backend initialization
5. Starts frontend server with hot reload
6. Waits 8 seconds for frontend startup

**When to use:**
- Daily development work
- Dependencies already installed
- Quick restart after code changes
- Switching between projects

**How to run:**
```cmd
Double-click START_SERVERS.bat
```
or
```powershell
.\START_SERVERS.bat
```

**Note:** Assumes dependencies are already installed. Does not check or install packages.

---

## Verification Scripts

### verify_config.py
**Location:** Project root directory

**Purpose:** Verify all configuration files exist and contain required values.

**What it checks:**
1. Frontend configuration (.env.local):
   - File existence
   - Firebase API key
   - Firebase project ID
   - Firebase app ID
   - API URL setting

2. Backend configuration (backend/.env):
   - File existence
   - Gemini API key
   - SMTP username
   - SMTP password
   - SMTP host

3. Project files:
   - package.json
   - backend/requirements.txt
   - backend/main.py
   - START_SERVERS.bat

**When to use:**
- After initial configuration
- Before first run
- Troubleshooting configuration issues
- After modifying environment files

**How to run:**
```powershell
python verify_config.py
```

**Output:** Displays checklist with status indicators for each item.

---

## Backend Verification Scripts

All backend scripts are located in the `backend/` directory and should be run from there.

### verify_ai.py
**Location:** backend/verify_ai.py

**Purpose:** Test Gemini API connection and response.

**What it does:**
1. Loads GEMINI_API_KEY from environment
2. Initializes Gemini AI client
3. Sends a test prompt
4. Displays API response
5. Confirms AI engine is working

**When to use:**
- After setting up Gemini API key
- When AI analysis is not working
- Testing API quota/limits
- Verifying API key validity

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python verify_ai.py
```

**Expected output:** Response from Gemini API confirming connection works.

---

### check_email_settings.py
**Location:** backend/check_email_settings.py

**Purpose:** Verify email SMTP configuration.

**What it does:**
1. Loads email settings from backend/.env
2. Displays current SMTP configuration
3. Shows which settings are configured
4. Indicates if email service is ready

**When to use:**
- After configuring email settings
- Before attempting to send emails
- Troubleshooting email issues
- Verifying SMTP credentials

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python check_email_settings.py
```

---

### debug_smtp.py
**Location:** backend/debug_smtp.py

**Purpose:** Test SMTP connection and diagnose email issues.

**What it does:**
1. Attempts to connect to SMTP server
2. Tests authentication with credentials
3. Displays detailed connection status
4. Shows specific error messages if connection fails

**When to use:**
- Email sending is failing
- Need to diagnose SMTP issues
- Verify firewall is not blocking SMTP
- Test new SMTP credentials

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python debug_smtp.py
```

**Common errors diagnosed:**
- Authentication failed: Wrong password/username
- Connection timeout: Firewall blocking port 587
- SSL/TLS errors: Certificate issues

---

### test_email.py
**Location:** backend/test_email.py

**Purpose:** Send a test email to verify email service works end-to-end.

**What it does:**
1. Loads email configuration
2. Creates a test email message
3. Sends email via SMTP
4. Reports success or failure

**When to use:**
- After configuring email settings
- Verifying email delivery works
- Testing email format/content
- Confirming recipient can receive emails

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python test_email.py
```

**Note:** Check your inbox (and spam folder) for test email.

---

### check_all_apps.py
**Location:** backend/check_all_apps.py

**Purpose:** Display all loan applications in the database.

**What it does:**
1. Connects to database
2. Retrieves all applications
3. Displays application details
4. Shows status and metadata

**When to use:**
- Viewing all applications
- Debugging database content
- Checking application processing status
- Database inspection

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python check_all_apps.py
```

---

### view_db.py
**Location:** backend/view_db.py

**Purpose:** Display complete database contents for debugging.

**What it does:**
1. Shows all database tables
2. Displays row counts
3. Lists all records
4. Shows relationships between tables

**When to use:**
- Database debugging
- Understanding data structure
- Checking data integrity
- Development and testing

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python view_db.py
```

---

### migrate_db.py
**Location:** backend/migrate_db.py

**Purpose:** Run database migrations and schema updates.

**What it does:**
1. Creates backup of existing database
2. Applies schema changes
3. Migrates existing data
4. Updates table structures

**When to use:**
- After updating database models
- Upgrading to new version
- Adding new database fields
- Schema modifications needed

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python migrate_db.py
```

**Warning:** Creates database backup before migration. Keep backups safe.

---

## Testing Scripts

### test_upload_application.py
**Location:** backend/test_upload_application.py

**Purpose:** Test application upload functionality.

**What it does:**
1. Creates test application data
2. Uploads test documents
3. Triggers AI analysis
4. Verifies processing pipeline

**When to use:**
- Testing upload feature
- Verifying AI integration
- End-to-end testing
- Development testing

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python test_upload_application.py
```

---

### test_analytics.py
**Location:** backend/test_analytics.py

**Purpose:** Test analytics and reporting features.

**When to use:**
- Verifying analytics calculations
- Testing dashboard data
- Development of analytics features

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python test_analytics.py
```

---

## Database Management Scripts

### clear_db.py
**Location:** backend/clear_db.py

**Purpose:** Clear all data from database.

**What it does:**
1. Deletes all applications
2. Removes uploaded files
3. Resets database to clean state
4. Preserves schema

**When to use:**
- Testing with clean slate
- Removing test data
- Development reset

**Warning:** This permanently deletes all data. Use with caution.

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python clear_db.py
```

---

## Utility Scripts

### check_schema.py
**Location:** backend/check_schema.py

**Purpose:** Display current database schema.

**What it does:**
1. Shows all tables
2. Lists all columns and types
3. Displays relationships
4. Shows constraints

**When to use:**
- Understanding database structure
- Planning schema changes
- Documentation
- Debugging model issues

**How to run:**
```powershell
cd backend
venv\Scripts\activate
python check_schema.py
```

---

## Script Troubleshooting

### If a script fails to run:

1. **Check Python environment is activated:**
   ```powershell
   cd backend
   venv\Scripts\activate
   ```

2. **Verify dependencies are installed:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Check configuration files exist:**
   ```powershell
   python verify_config.py
   ```

4. **Ensure you are in correct directory:**
   - Root scripts run from project root
   - Backend scripts run from backend/ directory

5. **Check for Python errors:**
   - Read error message carefully
   - Check if module is missing
   - Verify Python version is 3.10+

### Common Error Solutions:

**"python is not recognized"**
- Install Python 3.10 or higher
- Add Python to system PATH

**"No module named 'fastapi'"**
- Install backend dependencies: `pip install -r requirements.txt`

**"Permission denied"**
- Run PowerShell as Administrator
- Check file permissions

**"Port already in use"**
- Kill existing processes: `taskkill /F /IM python.exe /T`
- Wait a few seconds and retry

## Script Execution Order

For first-time setup, run in this order:

1. verify_config.py - Confirm configuration
2. QUICK_START.bat - Install and start everything

For daily development:

1. START_SERVERS.bat - Start servers
2. Use other scripts as needed for testing/debugging

For troubleshooting:

1. verify_config.py - Check configuration
2. verify_ai.py - Test AI connection
3. check_email_settings.py - Check email config
4. debug_smtp.py - Diagnose email issues
5. view_db.py - Check database state
