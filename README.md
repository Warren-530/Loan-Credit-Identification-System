# TrustLens AI - Credit Risk Assessment Platform

An enterprise-grade AI-powered credit risk assessment platform for Malaysian banks, featuring advanced document analysis, behavioral scoring, and explainable AI.

## 🚀 Features

- **Smart Triage Dashboard**: AI-prioritized loan applications with real-time status tracking
- **360° Risk Console**: Split-screen interface merging AI insights with document evidence
- **Multi-Loan Support**: Micro-Business, Personal, Housing, and Car loans
- **Hyper-Localization**: Understands Manglish, Bahasa Melayu, and Malaysian financial context
- **Click-to-Verify Evidence**: Explainable AI with source attribution
- **AI Copilot**: Interactive Q&A powered by RAG (Retrieval Augmented Generation)

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Google Gemini API Key** (free tier available)

## Quick Start

### Automated Setup (Recommended)

Run the automated setup script:

```cmd
QUICK_START.bat
```

This will automatically install all dependencies and start both servers.

### Manual Setup

See [INSTALLATION.md](INSTALLATION.md) for detailed installation instructions.

## Configuration

Configuration files are required before running the application:

- `.env.local` - Frontend configuration (Firebase, API endpoint)
- `backend/.env` - Backend configuration (Gemini API, Email SMTP)

Run the verification script to check your configuration:

```powershell
python verify_config.py
```

For detailed configuration steps, see [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md).

## Running the Application

### Option 1: Quick Start Script
```cmd
START_SERVERS.bat
```

### Option 2: Manual Start

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

Access the application at **http://localhost:3000**

## 📖 Usage

1. **Open** http://localhost:3000 in your browser
2. **Click** the `+ New Application` button
3. **Fill in** applicant details:
   - Loan Type (Micro-Business, Personal, Housing, or Car)
   - IC Number
   - Applicant Name
   - Requested Amount
4. **Upload** documents:
   - Bank Statement (PDF) - required
   - Loan Essay (PDF/TXT) - optional
5. **Submit** and watch AI analysis in real-time
6. **View** detailed risk assessment with explainable insights

## 🎯 Demo Data

For testing without a Gemini API key, the system will use mock data. For full AI functionality, configure your API key.

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router
- **UI**: Shadcn/UI + Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend (FastAPI)
- **API Framework**: FastAPI with async support
- **Database**: SQLite (SQLModel ORM)
- **PDF Processing**: PyMuPDF (fitz)
- **AI Engine**: Google Gemini 1.5 Flash

## 📁 Project Structure

```
trustlens-ai/
├── app/                    # Next.js pages
│   ├── page.tsx           # Dashboard
│   ├── application/[id]/  # Risk console
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn components
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── ai-copilot.tsx
├── backend/              # Python FastAPI backend
│   ├── main.py          # API server
│   ├── models.py        # Database models
│   ├── ai_engine.py     # Gemini integration
│   ├── prompts.py       # System prompts
│   └── pdf_processor.py # Document processing
└── lib/                 # Utilities
    └── api.ts           # API client
```

## 🧪 API Endpoints

- `GET /api/applications` - List all applications
- `GET /api/application/{id}` - Get specific application
- `POST /api/upload` - Submit new application
- `GET /api/status/{id}` - Check processing status

## 📝 System Prompts

The AI is configured with Malaysian-specific financial context:
- Recognizes local terms (Gaji, DuitNow, Shopee, etc.)
- Understands Manglish and Bahasa Melayu
- Applies cultural context (e.g., filial transfers)
- Detects Malaysian-specific risks (kutu, ah long, etc.)

## 🎨 Design Philosophy

**Bloomberg meets Stripe** - Professional, data-dense, high-contrast interface optimized for:
- Bank credit officers
- Desktop monitors
- Enterprise SaaS aesthetics

## Documentation

- [INSTALLATION.md](INSTALLATION.md) - Complete installation guide with troubleshooting
- [SCRIPTS.md](SCRIPTS.md) - Reference for all available scripts and their usage
- [CONFIG_CHECKLIST.md](CONFIG_CHECKLIST.md) - Configuration verification checklist

## Troubleshooting

See [INSTALLATION.md](INSTALLATION.md#troubleshooting) for common issues and solutions.

For script-specific help, see [SCRIPTS.md](SCRIPTS.md#script-troubleshooting).

---

Built for CodeFest 2025
