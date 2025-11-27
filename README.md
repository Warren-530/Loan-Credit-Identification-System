# InsightLoan

InsightLoan is a credit risk assessment platform built for Malaysian banks. It uses Google Gemini AI to analyze loan applications, extract information from documents, and provide risk assessments with explanations.

The system processes PDF documents including application forms, bank statements, payslips, and supporting documents. It generates risk scores, identifies potential concerns, and provides recommendations for loan officers.

---

## Table of Contents

1. [Features](#features)
2. [System Requirements](#system-requirements)
3. [Quick Setup (Recommended)](#quick-setup-recommended)
4. [Manual Setup](#manual-setup)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Usage Guide](#usage-guide)
8. [Project Structure](#project-structure)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

## Features

**Document Processing**
- PDF text extraction and OCR for scanned documents
- Supports application forms, bank statements, payslips, and supporting documents
- Batch upload for processing multiple applications at once

**AI Analysis**
- Risk scoring from 0-100 with category breakdown
- Income verification and expense analysis
- Fraud detection and red flag identification
- Explainable AI with evidence citations

**Loan Types Supported**
- Micro-Business Loans
- Personal Loans
- Housing Loans
- Car Loans

**Malaysian Context**
- Understands local financial terms and institutions
- Recognizes Malaysian IC numbers and addresses
- Handles Manglish and Bahasa Melayu in documents

**User Interface**
- Dashboard with application overview and statistics
- Detailed risk console for each application
- AI Copilot for interactive questions about applications
- PDF report generation

**Notifications**
- Email notifications for application status updates
- Configurable SMTP settings

---

## System Requirements

Before setting up the project, ensure you have the following installed:

| Requirement | Minimum Version | Download Link |
|-------------|-----------------|---------------|
| Node.js | 18.0 or higher | https://nodejs.org/ |
| Python | 3.10 or higher | https://python.org/ |
| npm | 9.0 or higher | Included with Node.js |
| pip | 21.0 or higher | Included with Python |

**Operating System**: Windows 10/11, macOS, or Linux

**Browser**: Chrome, Firefox, Edge, or Safari (latest versions)

---

## Quick Setup (Recommended)

The quick setup script automates the entire installation process. It checks prerequisites, configures API keys, and installs all dependencies.

### For Windows Users (Command Prompt)

1. Open the project folder in File Explorer
2. Double-click `QUICK_SETUP.bat`
3. Follow the prompts to enter your API keys
4. Wait for dependencies to install
5. Choose whether to start the application

Alternatively, open Command Prompt and run:
```cmd
QUICK_SETUP.bat
```

### For Windows Users (PowerShell)

1. Open PowerShell
2. Navigate to the project folder
3. Run the setup script:
```powershell
.\QUICK_SETUP.ps1
```

If you get an execution policy error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### What the Quick Setup Does

1. Checks that Node.js, Python, npm, and pip are installed
2. Prompts for Firebase, Gemini AI, and SMTP configuration
3. Creates `.env.local` for the frontend
4. Creates `backend/.env` for the backend
5. Runs `npm install` to install frontend dependencies
6. Runs `pip install -r requirements.txt` to install backend dependencies
7. Optionally starts both servers and opens the browser

---

## Manual Setup

If you prefer to set up the project manually, follow these steps.

### Step 1: Clone or Download the Repository

```bash
git clone https://github.com/Warren-530/Loan-Credit-Identification-System.git
cd Loan-Credit-Identification-System
```

Or download and extract the ZIP file from GitHub.

### Step 2: Install Frontend Dependencies

Open a terminal in the project root directory and run:

```bash
npm install
```

This installs Next.js, React, and all frontend packages defined in `package.json`.

### Step 3: Install Backend Dependencies

Navigate to the backend folder and install Python packages:

```bash
cd backend
pip install -r requirements.txt
```

Or from the project root:

```bash
pip install -r backend/requirements.txt
```

### Step 4: Create Configuration Files

You need to create two configuration files before running the application.

#### Frontend Configuration (.env.local)

Create a file named `.env.local` in the project root directory with the following content:

```env
# API URL - points to the backend server
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### Backend Configuration (backend/.env)

Create a file named `.env` in the `backend` folder with the following content:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=InsightLoan
```

---

## Configuration

### Getting Firebase Credentials

1. Go to https://console.firebase.google.com/
2. Create a new project or select an existing one
3. Click the gear icon and select "Project settings"
4. Scroll down to "Your apps" and click "Add app"
5. Select the web platform (</> icon)
6. Register your app with a nickname
7. Copy the configuration values from the `firebaseConfig` object

### Getting Gemini AI API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the generated API key

The free tier of Gemini AI provides sufficient quota for testing and moderate usage.

### Setting Up Gmail SMTP (Optional)

Email notifications require a Gmail account with an App Password.

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Windows Computer"
5. Click "Generate"
6. Copy the 16-character password (without spaces)
7. Use this as your `SMTP_PASSWORD`

---

## Running the Application

### Option 1: Using START_SERVERS.bat (Windows)

Double-click `START_SERVERS.bat` or run it from the command line:

```cmd
START_SERVERS.bat
```

This script:
- Stops any existing Python and Node processes
- Starts the backend server on port 8000
- Starts the frontend server on port 3000
- Opens your browser to http://localhost:3000

### Option 2: Manual Start

You need two terminal windows.

**Terminal 1 - Backend Server:**

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 - Frontend Server:**

```bash
npm run dev
```

### Accessing the Application

Once both servers are running:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## Usage Guide

### Creating a New Application

1. Open http://localhost:3000 in your browser
2. Click the "+ New Application" button in the sidebar
3. Fill in the applicant details:
   - Select the loan type
   - Enter the applicant's name
   - Enter the IC number
   - Enter the requested loan amount
   - Enter the applicant's email (for notifications)
4. Upload the required documents:
   - Application Form (PDF) - Required
   - Bank Statement (PDF) - Required
   - Loan Essay (PDF) - Optional
   - Payslip (PDF) - Optional
   - Supporting Documents (PDF) - Optional
5. Click "Submit Application"

### Batch Upload

1. Click the "+ New Application" button
2. Select "Batch Upload" tab
3. Prepare a folder structure with subfolders for each applicant
4. Each subfolder should contain the applicant's documents
5. Upload the folder or select multiple files
6. The system will process all applications in parallel

### Viewing Application Details

1. Click on any application in the dashboard list
2. The risk console shows:
   - Overall risk score and category scores
   - Applicant information extracted from documents
   - AI analysis with key points
   - Red flags and concerns
   - Supporting evidence with page references
3. Click on evidence items to view the source document

### Using the AI Copilot

1. Open any application's detail page
2. Look for the "AI Copilot" panel
3. Type questions about the application
4. The AI will answer based on the analyzed documents

Examples:
- "What is the applicant's monthly income?"
- "Are there any suspicious transactions?"
- "What are the main risks with this application?"

### Generating Reports

1. Open an application's detail page
2. Click the "Generate Report" button
3. A PDF report will be downloaded with:
   - Application summary
   - Risk assessment details
   - Key findings
   - Recommendations

### Approving or Rejecting Applications

1. Open an application's detail page
2. Review the AI analysis and documents
3. Click "Approve" or "Reject"
4. Add any notes for the decision
5. If email is configured, the applicant will receive a notification

---

## Project Structure

```
Loan-Credit-Identification-System/
|
|-- app/                      # Next.js frontend pages
|   |-- page.tsx              # Dashboard (main page)
|   |-- layout.tsx            # Root layout
|   |-- application/          # Application detail pages
|   |-- analytics/            # Analytics pages
|   |-- settings/             # Settings pages
|   |-- auth/                 # Authentication pages
|
|-- backend/                  # Python FastAPI backend
|   |-- main.py               # API server and routes
|   |-- models.py             # Database models
|   |-- database.py           # Database connection
|   |-- ai_engine.py          # Gemini AI integration
|   |-- pdf_processor.py      # PDF text extraction
|   |-- email_service.py      # Email notifications
|   |-- report_generator.py   # PDF report generation
|   |-- prompts.py            # AI system prompts
|   |-- requirements.txt      # Python dependencies
|   |-- uploads/              # Uploaded documents storage
|
|-- components/               # React components
|   |-- ui/                   # Shadcn UI components
|   |-- sidebar.tsx           # Navigation sidebar
|   |-- header.tsx            # Page header
|   |-- ai-copilot.tsx        # AI chat interface
|   |-- new-application-modal.tsx  # Application form
|
|-- lib/                      # Utility libraries
|   |-- api.ts                # API client functions
|   |-- auth-context.tsx      # Authentication context
|   |-- config.ts             # Frontend configuration
|
|-- public/                   # Static assets
|
|-- .env.local                # Frontend environment variables
|-- package.json              # Node.js dependencies
|-- QUICK_SETUP.bat           # Windows setup script
|-- QUICK_SETUP.ps1           # PowerShell setup script
|-- START_SERVERS.bat         # Server startup script
```

---

## API Reference

The backend provides a REST API. Full documentation is available at http://localhost:8000/docs when the server is running.

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/applications | List all applications |
| GET | /api/application/{id} | Get application details |
| POST | /api/upload | Upload single application |
| POST | /api/upload/batch | Upload multiple applications |
| POST | /api/application/{id}/retry | Retry failed analysis |
| PUT | /api/application/{id}/status | Update application status |
| DELETE | /api/application/{id} | Delete application |
| GET | /api/applications/stats | Get statistics |
| GET | /api/settings | Get system settings |
| PUT | /api/settings | Update system settings |

---

## Troubleshooting

### "npm install" fails with permission errors

On Windows, try running Command Prompt as Administrator.

On macOS/Linux, do not use sudo. Instead, fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### "pip install" fails with permission errors

Use the --user flag:
```bash
pip install -r requirements.txt --user
```

Or create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Backend server fails to start

Check that port 8000 is not in use:
```bash
netstat -ano | findstr :8000
```

Kill the process using that port or use a different port:
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### Frontend shows "Failed to fetch" errors

This means the frontend cannot connect to the backend.

1. Check that the backend server is running
2. Check that the backend is on port 8000
3. Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
4. Restart the frontend server after changing `.env.local`

### AI analysis fails with "API_KEY_INVALID"

1. Check that your Gemini API key is correct
2. Verify the key in `backend/.env` starts with "AIzaSy"
3. Restart the backend server after changing the key
4. Check your API quota at https://aistudio.google.com/

### OCR not working for scanned documents

The system uses Tesseract OCR for scanned images.

On Windows, install Tesseract:
1. Download from https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer
3. Add Tesseract to your PATH environment variable

On macOS:
```bash
brew install tesseract
```

On Ubuntu/Debian:
```bash
sudo apt-get install tesseract-ocr
```

### Firebase authentication not working

1. Verify all Firebase configuration values in `.env.local`
2. Enable Email/Password authentication in Firebase Console
3. Add your domain (localhost:3000) to authorized domains in Firebase

### Email notifications not sending

1. Check SMTP settings in `backend/.env`
2. For Gmail, ensure you are using an App Password, not your regular password
3. Check that 2-Step Verification is enabled on your Google account
4. Try the test email endpoint: POST /api/test-email

---

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Built for CodeFest 2025
