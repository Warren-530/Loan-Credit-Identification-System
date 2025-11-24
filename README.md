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

## 🛠️ Installation

### 1. Frontend Setup (Next.js)
```bash
npm install
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configuration

Create `backend/.env` from the example:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

**Get a free Gemini API key**: https://makersuite.google.com/app/apikey

## 🚀 Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
python main.py
```
Backend will run on **http://localhost:8000**

### Start Frontend (Terminal 2)
```bash
npm run dev
```
Frontend will run on **http://localhost:3000**

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

---

Built for CodeFest 2025
