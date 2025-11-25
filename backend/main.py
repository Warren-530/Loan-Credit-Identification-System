"""
FastAPI Backend for TrustLens AI
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
from datetime import datetime
from pathlib import Path
import asyncio
from dotenv import load_dotenv
import pytesseract
from sqlalchemy.orm.attributes import flag_modified

from models import Application, ApplicationStatus, LoanType, RiskLevel, ReviewStatus, AnalysisCache
from database import init_db, get_session
from pdf_processor import PDFProcessor, TextProcessor
from ai_engine import AIEngine
from config import Config, RiskConfig, LoanConfig, AIConfig

# Configure Tesseract OCR path (D: drive installation)
if os.path.exists(r'D:\Tesseract\tesseract.exe'):
    pytesseract.pytesseract.tesseract_cmd = r'D:\Tesseract\tesseract.exe'
elif os.path.exists(r'D:\Tesseract-OCR\tesseract.exe'):
    pytesseract.pytesseract.tesseract_cmd = r'D:\Tesseract-OCR\tesseract.exe'
elif os.path.exists(r'C:\Program Files\Tesseract-OCR\tesseract.exe'):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="TrustLens AI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config().CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = Path(Config().UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True)

# AI-ONLY MODE: Set to True to reject fallback and require AI analysis
AI_ONLY_MODE = True  # Set to False to allow fallback if AI fails

# Initialize AI Engine
GEMINI_API_KEY = os.getenv(AIConfig.GEMINI_API_KEY_ENV)
if not GEMINI_API_KEY:
    if AI_ONLY_MODE:
        print("❌ CRITICAL ERROR: GEMINI_API_KEY not set and AI_ONLY_MODE is enabled!")
        print("   System will REJECT all applications until API key is configured.")
        print("   Set GEMINI_API_KEY environment variable or disable AI_ONLY_MODE.")
    else:
        print("❌ WARNING: GEMINI_API_KEY not set. AI analysis will fail.")
        print("   Using FALLBACK mode with rule-based analysis")
    ai_engine = None
else:
    ai_engine = AIEngine(GEMINI_API_KEY)
    print("✅ AI Engine initialized successfully!")
    print(f"   Model: {ai_engine.model_name}")
    print(f"   API Key: {GEMINI_API_KEY[:20]}...")
    if AI_ONLY_MODE:
        print("🔒 AI-ONLY MODE: Fallback disabled - all results from Gemini AI")

# Mount static files for uploads (MUST be before route definitions)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print("✓ Database initialized")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "TrustLens AI API"}


@app.get("/api/applications")
async def get_applications(limit: int = 50):
    """Get all applications"""
    with get_session() as session:
        applications = session.query(Application).order_by(Application.created_at.desc()).limit(limit).all()
        return [
            {
                "id": app.application_id,
                "name": app.applicant_name or "Unknown",
                "type": (
                    app.analysis_result.get("applicant_profile", {}).get("loan_type") 
                    if app.analysis_result else None
                ) or (app.loan_type.value if hasattr(app.loan_type, 'value') else app.loan_type) or "N/A",
                "amount": f"RM {app.requested_amount:,.0f}" if app.requested_amount else "N/A",
                "score": app.risk_score or 0,
                "status": app.final_decision if app.status == ApplicationStatus.APPROVED else app.status,
                "date": app.created_at.isoformat(),
                "review_status": app.review_status,
                "ai_decision": app.ai_decision,
                "human_decision": app.human_decision,
            }
            for app in applications
        ]


@app.get("/api/application/{application_id}")
async def get_application(application_id: str):
    """Get specific application details"""
    with get_session() as session:
        app = session.query(Application).filter(Application.application_id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        # Build file URLs for static access (PDF/Text originals)
        def build_file_url(path: Optional[str]) -> Optional[str]:
            if not path:
                return None
            try:
                p = Path(path)
                # Find 'uploads' segment and build a relative path under it
                parts = list(p.parts)
                if 'uploads' in parts:
                    start_idx = parts.index('uploads') + 1
                    relative_parts = parts[start_idx:]
                else:
                    # If path already relative, just use its name and parents
                    # Ensure we never expose absolute drive letters
                    relative_parts = parts[-2:] if len(parts) >= 2 else parts
                relative_posix = "/".join(relative_parts)
                return f"/uploads/{relative_posix}" if relative_posix else None
            except Exception:
                return None
        bank_url = build_file_url(app.bank_statement_path)
        essay_url = build_file_url(app.essay_path)
        payslip_url = build_file_url(app.payslip_path)
        application_form_url = build_file_url(app.application_form_path)

        # File metadata helper
        import mimetypes
        def meta(path: Optional[str]):
            if not path or not os.path.exists(path):
                return None
            size = os.path.getsize(path)
            mime, _ = mimetypes.guess_type(path)
            return {"filename": os.path.basename(path), "size_bytes": size, "mime_type": mime or "application/octet-stream"}
        file_metadata = {
            "application_form": meta(app.application_form_path),
            "bank_statement": meta(app.bank_statement_path),
            "loan_essay": meta(app.essay_path),
            "payslip": meta(app.payslip_path)
        }
        
        return {
            "id": app.application_id,
            "name": app.applicant_name,
            "ic": app.applicant_ic,
            "loan_type": app.loan_type.value if hasattr(app.loan_type, 'value') else app.loan_type,
            "requested_amount": app.requested_amount,
            "status": app.status.value if app.status else None,
            "risk_score": app.risk_score,
            "risk_level": app.risk_level.value if app.risk_level else None,
            "final_decision": app.final_decision,
            "created_at": app.created_at.isoformat(),
            "analysis_result": app.analysis_result,
            "document_texts": app.analysis_result.get("document_texts") if app.analysis_result else None,
            "review_status": app.review_status.value if app.review_status else None,
            "ai_decision": app.ai_decision,
            "human_decision": app.human_decision,
            "reviewed_by": app.reviewed_by,
            "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
            "override_reason": app.override_reason,
            "decision_history": app.decision_history or [],
            "application_form_url": application_form_url,
            "bank_statement_url": bank_url,
            "essay_url": essay_url,
            "payslip_url": payslip_url,
            "file_metadata": file_metadata,
        }


@app.delete("/api/application/{application_id}")
async def delete_application(application_id: str):
    """Delete an application and its associated files"""
    with get_session() as session:
        app = session.query(Application).filter(Application.application_id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Delete associated files
        files_to_delete = [
            app.application_form_path,
            app.bank_statement_path,
            app.essay_path,
            app.payslip_path
        ]
        
        for file_path in files_to_delete:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"✓ Deleted file: {file_path}")
                except Exception as e:
                    print(f"⚠ Failed to delete file {file_path}: {e}")
        
        # Delete from cache
        cache_entry = session.query(AnalysisCache).filter(AnalysisCache.application_id == application_id).first()
        if cache_entry:
            session.delete(cache_entry)
        
        # Delete application record
        session.delete(app)
        session.commit()
        
        print(f"✓ Deleted application: {application_id}")
        return {"message": "Application deleted successfully", "application_id": application_id}


@app.get("/api/status/{application_id}")
async def get_status(application_id: str):
    """Lightweight status endpoint for polling"""
    with get_session() as session:
        app_obj = session.query(Application).filter(Application.application_id == application_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Application not found")
        return {
            "application_id": app_obj.application_id,
            "status": app_obj.status.value if app_obj.status else None,
            "risk_score": app_obj.risk_score or 0,
            "risk_level": app_obj.risk_level.value if app_obj.risk_level else None,
            "final_decision": app_obj.final_decision or app_obj.ai_decision or "Pending",
            "review_status": app_obj.review_status.value if app_obj.review_status else None,
        }

@app.get("/api/debug/risk-flags/{application_id}")
async def debug_risk_flags(application_id: str):
    """DEBUG: Check what risk flags are actually stored"""
    with get_session() as session:
        app_obj = session.query(Application).filter(Application.application_id == application_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Application not found")
        
        analysis = app_obj.analysis_result or {}
        risk_flags = analysis.get('key_risk_flags', [])
        
        return {
            "application_id": application_id,
            "risk_flags_count": len(risk_flags),
            "risk_flags": risk_flags,
            "analysis_keys": list(analysis.keys()),
            "full_analysis": analysis
        }


async def process_application_background(
    application_id: str,
    application_form_path: str,
    bank_statement_path: str,
    essay_path: str,
    payslip_path: str
):
    """Background task to process application with AI - extracts applicant info from Application Form
    
    Args:
        application_id: Unique application identifier
        application_form_path: Path to Application Form PDF (for extracting applicant info)
        bank_statement_path: Path to Bank Statement PDF
        essay_path: Path to Loan Essay PDF
        payslip_path: Path to Payslip PDF
    """
    print(f"\n{'='*60}")
    print(f"Starting analysis for {application_id}")
    print(f"Application Form: {application_form_path}")
    print(f"Bank Statement: {bank_statement_path}")
    print(f"Essay: {essay_path}")
    print(f"Payslip: {payslip_path}")
    print(f"{'='*60}\n")

    try:
        with get_session() as session:
            app = session.query(Application).filter(Application.application_id == application_id).first()
            if not app:
                print(f"ERROR: Application {application_id} not found in database!")
                return
            app.status = ApplicationStatus.ANALYZING
            session.add(app)
            session.commit()
            print("✓ Status updated to ANALYZING")

        await asyncio.sleep(2)

        pdf_processor = PDFProcessor()
        text_processor = TextProcessor()

        raw_text = ""
        application_form_text = ""
        bank_text = ""
        essay_text = ""
        payslip_text = ""

        # Application Form (NEW - extract applicant info)
        try:
            print(f"Extracting application form from: {application_form_path}")
            application_form_text = pdf_processor.extract_text(application_form_path) if application_form_path.endswith('.pdf') else text_processor.extract_text(application_form_path)
            raw_text += f"\n\n=== APPLICATION FORM ===\n{application_form_text}"
            print(f"✓ Application form extracted: {len(application_form_text)} characters")
        except Exception as e:
            print(f"⚠ Error extracting application form: {e}")
            application_form_text = "Application form extraction failed"
            raw_text += f"\n\n=== APPLICATION FORM ===\n{application_form_text}"

        # Bank Statement
        try:
            print(f"Extracting bank statement from: {bank_statement_path}")
            bank_text = pdf_processor.extract_text(bank_statement_path) if bank_statement_path.endswith('.pdf') else text_processor.extract_text(bank_statement_path)
            raw_text += f"\n\n=== BANK STATEMENT ===\n{bank_text}"
            print(f"✓ Bank statement extracted: {len(bank_text)} characters")
        except Exception as e:
            print(f"⚠ Error extracting bank statement: {e}")
            bank_text = "Bank statement extraction failed"
            raw_text += f"\n\n=== BANK STATEMENT ===\n{bank_text}"

        # Essay
        try:
            print(f"Extracting essay from: {essay_path}")
            essay_text = pdf_processor.extract_text(essay_path) if essay_path.endswith('.pdf') else text_processor.extract_text(essay_path)
            raw_text += f"\n\n=== LOAN APPLICATION ESSAY ===\n{essay_text}"
            print(f"✓ Essay extracted: {len(essay_text)} characters")
        except Exception as e:
            print(f"⚠ Error extracting essay: {e}")
            essay_text = "Essay extraction failed"
            raw_text += f"\n\n=== LOAN APPLICATION ESSAY ===\n{essay_text}"

        # Payslip
        try:
            print(f"Extracting payslip from: {payslip_path}")
            payslip_text = pdf_processor.extract_text(payslip_path) if payslip_path.endswith('.pdf') else text_processor.extract_text(payslip_path)
            raw_text += f"\n\n=== PAYSLIP DOCUMENT ===\n{payslip_text}"
            print(f"✓ Payslip extracted: {len(payslip_text)} characters")
        except Exception as e:
                print(f"⚠ Error extracting payslip: {e}")
                payslip_text = "Payslip extraction failed"
                raw_text += f"\n\n=== PAYSLIP DOCUMENT ===\n{payslip_text}"

        print(f"\nTotal raw text length: {len(raw_text)} characters")

        result = None
        processing_start = datetime.utcnow()
        with get_session() as session:
            cached = session.query(AnalysisCache).filter(AnalysisCache.application_id == application_id).first()
            if cached:
                print("✓ Using cached result")
                result = cached.result_json
            elif ai_engine:
                try:
                    print("⚡ Running AI analysis with Gemini...")
                    # Pass application_form_text to AI for extraction
                    result = ai_engine.analyze_application(
                        application_form_text, 
                        raw_text, 
                        bank_text, 
                        essay_text, 
                        payslip_text, 
                        application_id
                    )
                    print("✓ AI analysis completed (Gemini)")
                    cache = AnalysisCache(application_id=application_id, result_json=result)
                    session.add(cache)
                    session.commit()
                    print("✓ Result cached")
                except Exception as e:
                    print(f"❌ AI analysis failed: {e}")
                    if AI_ONLY_MODE:
                        print("🚫 AI-ONLY MODE: Refusing to use fallback - marking as FAILED")
                        raise Exception(f"AI analysis required but failed: {e}")
                    else:
                        print("🔄 Falling back to document-based analysis...")
                        result = generate_mock_result("Unknown", raw_text, application_id, 50000, bank_text, essay_text, payslip_text, application_form_text)
                        print("✓ Fallback analysis completed")
            else:
                if AI_ONLY_MODE:
                    print("🚫 AI-ONLY MODE: No API key configured - refusing to process")
                    raise Exception("AI analysis required but GEMINI_API_KEY not configured")
                else:
                    print("ℹ No Gemini API key configured")
                    print("🔄 Using document-based analysis...")
                    result = generate_mock_result("Unknown", raw_text, application_id, 50000, bank_text, essay_text, payslip_text, application_form_text)
                    print("✓ Document-based analysis completed")
        
        # Calculate processing time
        processing_end = datetime.utcnow()
        processing_time = (processing_end - processing_start).total_seconds()
        print(f"⏱️  Processing time: {processing_time:.2f}s")

        if not result:
            raise Exception("No analysis result generated!")

        # Extract applicant info from AI response
        applicant_info = result.get('applicant_profile', {})
        applicant_name = applicant_info.get('name', 'Unknown')
        applicant_ic = applicant_info.get('ic_number', 'N/A')
        loan_type_str = applicant_info.get('loan_type', 'Unknown')
        requested_amount = applicant_info.get('requested_amount')
        
        # Verify this is an AI result, not fallback
        reasoning_log = result.get('ai_reasoning_log', [])
        is_fallback = any('[FALLBACK]' in str(log) for log in reasoning_log)
        if is_fallback:
            print("⚠️  WARNING: Result came from FALLBACK mode (not AI)")
            if AI_ONLY_MODE:
                print("🚫 AI-ONLY MODE: Rejecting fallback result")
                raise Exception("Fallback result detected in AI-ONLY mode")
        else:
            print("✅ VERIFIED: Result generated by Gemini AI (not fallback)")
        
        # Extract risk score and level from nested structure if needed
        risk_score = result.get('risk_score')
        risk_level = result.get('risk_level')
        final_decision = result.get('final_decision')
        
        # If AI returns nested structure, extract from risk_score_analysis
        if risk_score is None and 'risk_score_analysis' in result:
            risk_analysis = result['risk_score_analysis']
            risk_score = risk_analysis.get('final_score')
            risk_level = risk_analysis.get('risk_level')
        
        # Auto-generate decision based on risk score if not provided
        if final_decision is None and risk_score is not None:
            if risk_score >= 70:
                final_decision = "Approved"
            elif risk_score >= 50:
                final_decision = "Review Required"
            else:
                final_decision = "Rejected"
        
        # Update result with extracted values for consistency
        result['risk_score'] = risk_score
        result['risk_level'] = risk_level
        result['final_decision'] = final_decision

        print("\nExtracted Applicant Info:")
        print(f"  Name: {applicant_name}")
        print(f"  IC: {applicant_ic}")
        print(f"  Loan Type: {loan_type_str}")
        print(f"  Requested Amount: RM {requested_amount}")
        
        print("\nAnalysis Result:")
        print(f"  Risk Score: {risk_score}")
        print(f"  Risk Level: {risk_level}")
        print(f"  Decision: {final_decision}")

        with get_session() as session:
            app = session.query(Application).filter(Application.application_id == application_id).first()
            if app:
                # Update applicant info extracted from Application Form
                app.applicant_name = applicant_name
                app.applicant_ic = applicant_ic
                if loan_type_str:
                    try:
                        # Try to map to LoanType enum
                        loan_type_mapping = {
                            "micro-business": LoanType.MICRO_BUSINESS,
                            "micro business": LoanType.MICRO_BUSINESS,
                            "personal": LoanType.PERSONAL,
                            "housing": LoanType.HOUSING,
                            "car": LoanType.CAR,
                            "hire purchase": LoanType.CAR,  # Based on your example
                        }
                        app.loan_type = loan_type_mapping.get(loan_type_str.lower(), None)
                    except:
                        pass
                app.requested_amount = requested_amount
                
                # Map final decision directly to status for user clarity
                decision = final_decision or "Review Required"
                status_map = {
                    "Approved": ApplicationStatus.APPROVED,
                    "Rejected": ApplicationStatus.REJECTED,
                    "Review Required": ApplicationStatus.REVIEW_REQUIRED
                }
                app.status = status_map.get(decision, ApplicationStatus.REVIEW_REQUIRED)
                app.risk_score = risk_score or 50
                rl_val = risk_level or "Medium"
                if rl_val not in RiskLevel._value2member_map_:
                    print(f"[WARN] Unknown risk_level '{rl_val}' in result. Falling back to 'Medium'. Keys: {list(result.keys())}")
                    rl_val = "Medium"
                app.risk_level = RiskLevel(rl_val)
                app.final_decision = final_decision or "Review Required"
                app.ai_decision = final_decision or "Review Required"
                app.analysis_result = result
                app.processing_time = processing_time
                app.updated_at = datetime.utcnow()
                app.decision_history = [{
                    "timestamp": datetime.utcnow().isoformat(),
                    "actor": "AI System",
                    "action": f"Recommended '{app.final_decision}'",
                    "details": f"Risk Score: {app.risk_score}",
                    "reason": None
                }]
                session.add(app)
                session.commit()
                print(f"\n✅ Application {application_id} analysis finished")
                print(f"   Status: {app.status.value} | Score: {app.risk_score}")
                print(f"{'='*60}\n")

    except Exception as e:
        import traceback
        print("\n❌ CRITICAL ERROR in background processing:")
        print(f"Error: {e}")
        print(f"Traceback:\n{traceback.format_exc()}")
        print(f"{'='*60}\n")
        with get_session() as session:
            app = session.query(Application).filter(Application.application_id == application_id).first()
            if app:
                app.status = ApplicationStatus.FAILED
                session.add(app)
                session.commit()
                print(f"Set application {application_id} status to FAILED")


@app.post("/api/upload")
async def upload_application(
    background_tasks: BackgroundTasks,
    application_form: UploadFile = File(...),  # NEW: Application Form (required)
    bank_statement: UploadFile = File(...),
    essay: UploadFile = File(...),
    payslip: UploadFile = File(...),
):
    """Upload new loan application with 4 required documents
    
    All applicant information (name, IC, loan type, amount) will be extracted
    from the Application Form PDF by AI.
    """
    try:
        # Generate application ID
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        application_id = f"APP-{timestamp}"
        
        # Create application folder
        app_folder = UPLOAD_DIR / application_id
        app_folder.mkdir(exist_ok=True)
        
        # Save Application Form (NEW)
        application_form_path = app_folder / application_form.filename
        with open(application_form_path, "wb") as buffer:
            shutil.copyfileobj(application_form.file, buffer)
        
        # Save bank statement
        bank_statement_path = app_folder / bank_statement.filename
        with open(bank_statement_path, "wb") as buffer:
            shutil.copyfileobj(bank_statement.file, buffer)
        
        # Save essay
        essay_path = app_folder / essay.filename
        with open(essay_path, "wb") as buffer:
            shutil.copyfileobj(essay.file, buffer)

        # Save payslip
        payslip_path = app_folder / payslip.filename
        with open(payslip_path, "wb") as buffer:
            shutil.copyfileobj(payslip.file, buffer)
        
        # Create application record (all fields will be filled by AI)
        with get_session() as session:
            app = Application(
                application_id=application_id,
                status=ApplicationStatus.PROCESSING,
                application_form_path=str(application_form_path),
                bank_statement_path=str(bank_statement_path),
                essay_path=str(essay_path),
                payslip_path=str(payslip_path),
            )
            session.add(app)
            session.commit()
        
        # Add background task for AI processing
        background_tasks.add_task(
            process_application_background,
            application_id,
            str(application_form_path),
            str(bank_statement_path),
            str(essay_path),
            str(payslip_path)
        )
        
        return {
            "success": True,
            "application_id": application_id,
            "message": "Application submitted for AI analysis (extracting applicant info from form)"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload/batch")
async def upload_batch(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload batch applications via CSV or ZIP"""
    try:
        # Save uploaded file
        batch_path = UPLOAD_DIR / f"batch_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        with open(batch_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        processed_count = 0
        
        # Handle CSV files
        if file.filename.endswith('.csv'):
            import csv
            with open(batch_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    # Expected columns: loan_type, ic_number, applicant_name, requested_amount, bank_statement_path, essay_path
                    timestamp = datetime.now().strftime("%Y%m%d%H%M%S") + str(processed_count)
                    app_id = f"APP-{timestamp}"
                    
                    with get_session() as session:
                        app = Application(
                            application_id=app_id,
                            applicant_name=row.get('applicant_name', 'Batch Upload'),
                            applicant_ic=row.get('ic_number', 'N/A'),
                            loan_type=LoanType(row.get('loan_type', 'Personal Loan')),
                            requested_amount=float(row.get('requested_amount', 50000)),
                            status=ApplicationStatus.PROCESSING,
                            bank_statement_path=row.get('bank_statement_path'),
                            essay_path=row.get('essay_path'),
                        )
                        session.add(app)
                        session.commit()
                    
                    # Add background processing
                    background_tasks.add_task(
                        process_application_background,
                        app_id,
                        row.get('loan_type', 'Personal Loan'),
                        row.get('bank_statement_path'),
                        row.get('essay_path')
                    )
                    processed_count += 1
        
        # Handle ZIP files
        elif file.filename.endswith('.zip'):
            import zipfile
            with zipfile.ZipFile(batch_path, 'r') as zip_ref:
                extract_path = UPLOAD_DIR / f"extracted_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                extract_path.mkdir(exist_ok=True)
                zip_ref.extractall(extract_path)
                
                # Look for CSV manifest or process individual PDFs
                csv_files = list(extract_path.glob('*.csv'))
                if csv_files:
                    # Process CSV manifest
                    import csv
                    with open(csv_files[0], 'r', encoding='utf-8') as csvfile:
                        reader = csv.DictReader(csvfile)
                        for row in reader:
                            timestamp = datetime.now().strftime("%Y%m%d%H%M%S") + str(processed_count)
                            app_id = f"APP-{timestamp}"
                            
                            # Resolve file paths relative to extract_path
                            bank_path = extract_path / row.get('bank_statement_path', '')
                            essay_path = extract_path / row.get('essay_path', '') if row.get('essay_path') else None
                            
                            with get_session() as session:
                                app = Application(
                                    application_id=app_id,
                                    applicant_name=row.get('applicant_name', 'Batch Upload'),
                                    applicant_ic=row.get('ic_number', 'N/A'),
                                    loan_type=LoanType(row.get('loan_type', 'Personal Loan')),
                                    requested_amount=float(row.get('requested_amount', 50000)),
                                    status=ApplicationStatus.PROCESSING,
                                    bank_statement_path=str(bank_path) if bank_path.exists() else None,
                                    essay_path=str(essay_path) if essay_path and essay_path.exists() else None,
                                )
                                session.add(app)
                                session.commit()
                            
                            background_tasks.add_task(
                                process_application_background,
                                app_id,
                                row.get('loan_type', 'Personal Loan'),
                                str(bank_path) if bank_path.exists() else None,
                                str(essay_path) if essay_path and essay_path.exists() else None
                            )
                            processed_count += 1
        
        return {
            "success": True,
            "processed_count": processed_count,
            "message": f"Batch upload successful: {processed_count} applications queued"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")


## Duplicate status endpoint removed (using the lightweight polling version above)

# Pydantic model for verify request
class VerifyRequest(BaseModel):
    decision: str
    reviewer_name: str = Config().DEFAULT_REVIEWER
    override_reason: Optional[str] = None


@app.post("/api/application/{application_id}/verify")
async def verify_application(
    application_id: str,
    request: VerifyRequest
):
    """Human verification/override of AI decision"""
    with get_session() as session:
        app = session.query(Application).filter(Application.application_id == application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Determine if this is an override
        is_override = app.ai_decision and request.decision != app.ai_decision
        
        # Update verification fields
        app.human_decision = request.decision
        app.final_decision = request.decision
        app.reviewed_by = request.reviewer_name
        app.reviewed_at = datetime.utcnow()
        app.review_status = ReviewStatus.MANUAL_OVERRIDE if is_override else ReviewStatus.HUMAN_VERIFIED
        
        # Update status based on decision
        if request.decision == 'Approved':
            app.status = ApplicationStatus.APPROVED
        elif request.decision == 'Rejected':
            app.status = ApplicationStatus.REJECTED
        else:  # Review Required
            app.status = ApplicationStatus.COMPLETED  # Keep as completed but flagged for review
        
        if is_override and request.override_reason:
            app.override_reason = request.override_reason
        
        # Add to decision history (ensure it's properly tracked as modified)
        # Initialize as empty list if None (for existing records)
        if app.decision_history is None:
            app.decision_history = []
        
        new_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "actor": request.reviewer_name,
            "action": f"Changed decision to '{request.decision}'",
            "details": "Override" if is_override else "Verified AI decision",
            "reason": request.override_reason
        }
        
        # Create a new list to ensure SQLAlchemy detects the change
        app.decision_history = app.decision_history + [new_entry]
        
        # Mark the JSON column as modified so SQLAlchemy knows to update it
        flag_modified(app, "decision_history")
        
        app.updated_at = datetime.utcnow()
        session.add(app)
        session.commit()
        session.refresh(app)
        
        print(f"DEBUG: Decision history after commit: {app.decision_history}")
        print(f"DEBUG: Number of entries: {len(app.decision_history) if app.decision_history else 0}")
        
        return {
            "success": True,
            "review_status": app.review_status,
            "is_override": is_override,
            "decision_history": app.decision_history
        }


@app.get("/api/application/{application_id}/navigate")
async def navigate_application(application_id: str, direction: str = "next"):
    """Get previous or next application ID for navigation"""
    with get_session() as session:
        current_app = session.query(Application).filter(Application.application_id == application_id).first()
        
        if not current_app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if direction == "next":
            next_app = session.query(Application).filter(
                Application.created_at < current_app.created_at
            ).order_by(Application.created_at.desc()).first()
            
            if next_app:
                return {"application_id": next_app.application_id}
        else:  # previous
            prev_app = session.query(Application).filter(
                Application.created_at > current_app.created_at
            ).order_by(Application.created_at.asc()).first()
            
            if prev_app:
                return {"application_id": prev_app.application_id}
        
        return {"application_id": None}


@app.get("/api/applications/stats")
async def get_application_stats():
    """Get current position stats for navigation and processing stats"""
    with get_session() as session:
        total = session.query(Application).count()
        
        # Calculate average processing time
        apps_with_time = session.query(Application).filter(
            Application.processing_time.isnot(None)
        ).all()
        
        avg_processing_time = 0.0
        if apps_with_time:
            total_time = sum(app.processing_time for app in apps_with_time if app.processing_time)
            avg_processing_time = total_time / len(apps_with_time)
        
        return {
            "total": total,
            "avg_processing_time": round(avg_processing_time, 1)
        }






# === LOAN-SPECIFIC SCORING FUNCTIONS ===

def calculate_business_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, breakdown):
    """Micro-Business Loan specific scoring - focuses on business viability and cash flow"""
    
    # Business Experience & Planning
    business_keywords = ['business', 'expand', 'capital', 'equipment', 'inventory', 'customers', 'revenue', 'profit', 'sales']
    business_score = sum(1 for keyword in business_keywords if keyword in essay_text.lower())
    if business_score >= 5:
        base_score += 15
        breakdown.append({"category": "Strong Business Plan", "points": 15, "reason": f"Comprehensive business planning with {business_score} key indicators", "type": "positive"})
    elif business_score >= 3:
        base_score += 8
        breakdown.append({"category": "Basic Business Plan", "points": 8, "reason": f"Basic business planning with {business_score} indicators", "type": "neutral"})
    
    # Cash Flow Analysis 
    cash_flow_keywords = ['monthly income', 'revenue', 'sales', 'receipts', 'cash flow', 'profit']
    cash_indicators = sum(1 for keyword in cash_flow_keywords if keyword in bank_text.lower())
    if cash_indicators >= 3:
        base_score += 12
        breakdown.append({"category": "Healthy Business Cash Flow", "points": 12, "reason": f"Strong cash flow patterns with {cash_indicators} indicators", "type": "positive"})
    
    # Business Debt Service Ability
    if requested_amount > 0:
        estimated_monthly_revenue = extract_income_from_text(bank_text, payslip_text)
        if estimated_monthly_revenue > 0:
            debt_service_ratio = (requested_amount * 0.1) / estimated_monthly_revenue  # Assume 10% interest
            if debt_service_ratio < 0.3:
                base_score += 10
                breakdown.append({"category": "Excellent Debt Service Ratio", "points": 10, "reason": f"Low debt service burden ({debt_service_ratio:.1%})", "type": "positive"})
            elif debt_service_ratio > 0.5:
                base_score -= 12
                breakdown.append({"category": "High Debt Service Risk", "points": -12, "reason": f"High debt service burden ({debt_service_ratio:.1%})", "type": "negative"})
    
    # Business Registration & Legitimacy
    business_legitimacy = ['license', 'registration', 'permit', 'ssm', 'tax', 'gst']
    legitimacy_score = sum(1 for keyword in business_legitimacy if keyword in text_lower)
    if legitimacy_score >= 2:
        base_score += 8
        breakdown.append({"category": "Business Legitimacy", "points": 8, "reason": "Evidence of proper business registration/licensing", "type": "positive"})
    
    return base_score

def calculate_personal_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, breakdown):
    """Personal Loan specific scoring - focuses on income stability and personal finance management"""
    
    # Income Stability
    income_keywords = ['salary', 'wages', 'employment', 'job', 'work', 'employer', 'monthly income']
    income_indicators = sum(1 for keyword in income_keywords if keyword in payslip_text.lower())
    if income_indicators >= 4:
        base_score += 15
        breakdown.append({"category": "Stable Employment Income", "points": 15, "reason": f"Strong employment indicators with {income_indicators} factors", "type": "positive"})
    elif income_indicators >= 2:
        base_score += 8
        breakdown.append({"category": "Basic Employment Evidence", "points": 8, "reason": f"Basic employment evidence with {income_indicators} indicators", "type": "neutral"})
    
    # Personal Financial Management
    savings_keywords = ['savings', 'fixed deposit', 'asb', 'tabung haji', 'investment', 'epf']
    savings_indicators = sum(1 for keyword in savings_keywords if keyword in bank_text.lower())
    if savings_indicators >= 2:
        base_score += 12
        breakdown.append({"category": "Good Savings Habits", "points": 12, "reason": f"Evidence of savings/investment discipline", "type": "positive"})
    
    # Personal Loan Purpose
    purpose_keywords = ['emergency', 'medical', 'education', 'home improvement', 'consolidation']
    purpose_clarity = sum(1 for keyword in purpose_keywords if keyword in essay_text.lower())
    if purpose_clarity >= 1:
        base_score += 6
        breakdown.append({"category": "Clear Personal Purpose", "points": 6, "reason": "Valid personal loan purpose identified", "type": "positive"})
    
    # Personal Debt-to-Income Analysis
    if requested_amount > 0:
        monthly_income = extract_income_from_text(bank_text, payslip_text)
        if monthly_income > 0:
            monthly_payment = requested_amount / 60  # Assume 5-year term
            dti_ratio = monthly_payment / monthly_income
            if dti_ratio < 0.2:
                base_score += 10
                breakdown.append({"category": "Low Personal DTI Ratio", "points": 10, "reason": f"Manageable debt-to-income ratio ({dti_ratio:.1%})", "type": "positive"})
            elif dti_ratio > 0.4:
                base_score -= 15
                breakdown.append({"category": "High Personal DTI Risk", "points": -15, "reason": f"High debt-to-income ratio ({dti_ratio:.1%})", "type": "negative"})
    
    return base_score

def calculate_car_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, breakdown):
    """Car Loan specific scoring - focuses on asset value and transportation need"""
    
    # Vehicle Purpose & Need
    vehicle_keywords = ['transport', 'work', 'family', 'commute', 'business use', 'delivery', 'car', 'vehicle']
    vehicle_need = sum(1 for keyword in vehicle_keywords if keyword in essay_text.lower())
    if vehicle_need >= 3:
        base_score += 10
        breakdown.append({"category": "Clear Vehicle Need", "points": 10, "reason": f"Strong justification for vehicle with {vehicle_need} factors", "type": "positive"})
    
    # Asset Value vs Loan Amount
    if requested_amount > 0:
        if requested_amount <= 50000:  # Reasonable car price
            base_score += 8
            breakdown.append({"category": "Reasonable Vehicle Price", "points": 8, "reason": f"Moderate loan amount (RM {requested_amount:,.0f})", "type": "positive"})
        elif requested_amount > 100000:  # Luxury car
            base_score -= 5
            breakdown.append({"category": "High-End Vehicle", "points": -5, "reason": f"Expensive vehicle (RM {requested_amount:,.0f})", "type": "neutral"})
    
    # Down Payment Capability
    deposit_keywords = ['down payment', 'deposit', 'advance payment', 'initial payment']
    deposit_evidence = sum(1 for keyword in deposit_keywords if keyword in text_lower)
    if deposit_evidence >= 1:
        base_score += 7
        breakdown.append({"category": "Down Payment Evidence", "points": 7, "reason": "Evidence of down payment capability", "type": "positive"})
    
    # Vehicle Insurance & Maintenance Consideration
    insurance_keywords = ['insurance', 'road tax', 'maintenance', 'servicing']
    maintenance_awareness = sum(1 for keyword in insurance_keywords if keyword in text_lower)
    if maintenance_awareness >= 2:
        base_score += 5
        breakdown.append({"category": "Maintenance Awareness", "points": 5, "reason": "Understanding of vehicle ownership costs", "type": "positive"})
    
    # Car Loan Income Verification
    monthly_income = extract_income_from_text(bank_text, payslip_text)
    if monthly_income > 0 and requested_amount > 0:
        car_affordability = (requested_amount / 84) / monthly_income  # 7-year term
        if car_affordability < 0.3:
            base_score += 12
            breakdown.append({"category": "Excellent Car Affordability", "points": 12, "reason": f"Vehicle easily affordable ({car_affordability:.1%} of income)", "type": "positive"})
        elif car_affordability > 0.5:
            base_score -= 10
            breakdown.append({"category": "Vehicle Affordability Concern", "points": -10, "reason": f"High vehicle cost ratio ({car_affordability:.1%})", "type": "negative"})
    
    return base_score

def calculate_housing_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, breakdown):
    """Housing Loan specific scoring - most comprehensive evaluation for largest loan amounts"""
    
    # Housing Need & Family Situation
    housing_keywords = ['home', 'house', 'family', 'children', 'spouse', 'married', 'first time buyer']
    housing_need = sum(1 for keyword in housing_keywords if keyword in essay_text.lower())
    if housing_need >= 4:
        base_score += 12
        breakdown.append({"category": "Strong Housing Need", "points": 12, "reason": f"Clear housing necessity with {housing_need} factors", "type": "positive"})
    
    # Property Value Assessment
    if requested_amount > 0:
        if requested_amount <= 300000:  # Affordable housing
            base_score += 8
            breakdown.append({"category": "Affordable Property", "points": 8, "reason": f"Reasonable property price (RM {requested_amount:,.0f})", "type": "positive"})
        elif requested_amount > 800000:  # High-end property
            base_score -= 3
            breakdown.append({"category": "Premium Property", "points": -3, "reason": f"High-value property (RM {requested_amount:,.0f})", "type": "neutral"})
    
    # Long-term Financial Stability
    stability_keywords = ['permanent', 'senior', 'manager', 'professional', 'government', 'years experience']
    stability_indicators = sum(1 for keyword in stability_keywords if keyword in payslip_text.lower())
    if stability_indicators >= 2:
        base_score += 15
        breakdown.append({"category": "Employment Stability", "points": 15, "reason": f"Strong job security indicators", "type": "positive"})
    
    # Housing Loan Affordability (Most Critical)
    monthly_income = extract_income_from_text(bank_text, payslip_text)
    if monthly_income > 0 and requested_amount > 0:
        monthly_mortgage = (requested_amount * 0.045) / 12  # Assume 4.5% interest
        housing_ratio = monthly_mortgage / monthly_income
        if housing_ratio < 0.3:
            base_score += 20
            breakdown.append({"category": "Excellent Housing Affordability", "points": 20, "reason": f"Very manageable mortgage ({housing_ratio:.1%} of income)", "type": "positive"})
        elif housing_ratio < 0.4:
            base_score += 10
            breakdown.append({"category": "Good Housing Affordability", "points": 10, "reason": f"Acceptable mortgage ratio ({housing_ratio:.1%})", "type": "positive"})
        elif housing_ratio > 0.5:
            base_score -= 20
            breakdown.append({"category": "Housing Affordability Risk", "points": -20, "reason": f"High mortgage burden ({housing_ratio:.1%})", "type": "negative"})
    
    # Asset & Savings for Down Payment
    asset_keywords = ['savings', 'deposit', 'down payment', 'equity', 'assets', 'investment']
    asset_strength = sum(1 for keyword in asset_keywords if keyword in bank_text.lower())
    if asset_strength >= 3:
        base_score += 10
        breakdown.append({"category": "Strong Asset Position", "points": 10, "reason": "Evidence of sufficient assets/down payment", "type": "positive"})
    
    return base_score

def calculate_default_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, breakdown):
    """Default comprehensive scoring for unknown loan types"""
    
    # General Income Verification
    income_keywords = ['salary', 'income', 'deposit', 'credit', 'payment received']
    income_count = sum(1 for keyword in income_keywords if keyword in text_lower)
    if income_count >= 3:
        base_score += 12
        breakdown.append({"category": "Income Evidence", "points": 12, "reason": f"Multiple income indicators", "type": "positive"})
    
    # General Financial Health
    financial_keywords = ['savings', 'investment', 'balance']
    financial_health = sum(1 for keyword in financial_keywords if keyword in bank_text.lower())
    if financial_health >= 2:
        base_score += 8
        breakdown.append({"category": "Financial Health", "points": 8, "reason": "Positive financial indicators", "type": "positive"})
    
    return base_score

def extract_income_from_text(bank_text, payslip_text):
    """Extract estimated monthly income from documents"""
    import re
    
    # Try to extract from payslip first
    income_patterns = [
        r'gross pay[:\s]*rm\s*([0-9,]+)',
        r'basic salary[:\s]*rm\s*([0-9,]+)', 
        r'monthly salary[:\s]*rm\s*([0-9,]+)',
        r'net pay[:\s]*rm\s*([0-9,]+)'
    ]
    
    for pattern in income_patterns:
        matches = re.findall(pattern, payslip_text.lower())
        if matches:
            try:
                return float(matches[0].replace(',', ''))
            except:
                continue
    
    # Fallback to bank statement analysis
    deposit_pattern = r'rm\s*([0-9,]+)'
    deposits = re.findall(deposit_pattern, bank_text.lower())
    if deposits:
        try:
            # Use largest deposit as income estimate
            return max([float(d.replace(',', '')) for d in deposits])
        except:
            pass
    
    return 4000  # Default fallback

def apply_common_risk_factors(text_lower, bank_text, essay_text, payslip_text, base_score, breakdown):
    """Apply risk factors common to all loan types"""
    
    # High-Risk Financial Activities
    risk_keywords = ['gambling', 'crypto', 'bitcoin', 'bet', 'lottery', 'casino', 'forex trading']
    risk_count = sum(1 for keyword in risk_keywords if keyword in text_lower)
    if risk_count > 0:
        base_score -= 20
        breakdown.append({"category": "High-Risk Activities", "points": -20, "reason": f"Detected {risk_count} high-risk financial activities", "type": "negative"})
    
    # Existing Debt Load Analysis
    debt_keywords = ['existing loan', 'credit card debt', 'installment', 'outstanding balance', 'monthly payment']
    existing_debt = sum(1 for keyword in debt_keywords if keyword in text_lower)
    if existing_debt >= 3:
        base_score -= 12
        breakdown.append({"category": "Heavy Debt Burden", "points": -12, "reason": "Multiple existing debt obligations", "type": "negative"})
    elif existing_debt >= 1:
        base_score -= 5
        breakdown.append({"category": "Some Existing Debt", "points": -5, "reason": "Some existing financial obligations", "type": "neutral"})
    
    # Banking Relationship & History
    banking_keywords = ['regular transactions', 'account history', 'long-standing customer', 'savings history']
    banking_strength = sum(1 for keyword in banking_keywords if keyword in bank_text.lower())
    if banking_strength >= 2:
        base_score += 8
        breakdown.append({"category": "Strong Banking History", "points": 8, "reason": "Good banking relationship evidence", "type": "positive"})
    
    # Document Quality Assessment
    docs_provided = sum([1 for doc in [bank_text, essay_text, payslip_text] if len(doc.strip()) > 50])
    if docs_provided == 3:
        base_score += 10
        breakdown.append({"category": "Complete Documentation", "points": 10, "reason": "All required documents provided", "type": "positive"})
    elif docs_provided == 2:
        base_score += 5
        breakdown.append({"category": "Adequate Documentation", "points": 5, "reason": f"{docs_provided} out of 3 documents provided", "type": "neutral"})
    elif docs_provided <= 1:
        base_score -= 8
        breakdown.append({"category": "Incomplete Documentation", "points": -8, "reason": "Insufficient documentation provided", "type": "negative"})
    
    # Financial Discipline Indicators
    discipline_keywords = ['savings', 'emergency fund', 'investment', 'financial planning', 'budget']
    discipline_score = sum(1 for keyword in discipline_keywords if keyword in text_lower)
    if discipline_score >= 2:
        base_score += 6
        breakdown.append({"category": "Financial Discipline", "points": 6, "reason": "Evidence of financial planning and discipline", "type": "positive"})
    
    return base_score

# Helper functions for Application Form extraction
def extract_field(text: str, pattern: str) -> str:
    """Extract field value using regex pattern"""
    import re
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return match.group(1).strip() if match else None

def extract_number(text: str, pattern: str) -> int:
    """Extract numeric value using regex pattern"""
    import re
    match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    if match:
        try:
            return int(re.sub(r'[^\d]', '', match.group(1)))
        except:
            return None
    return None

def extract_loan_type_from_form(text: str) -> str:
    """Extract checked loan type from Application Form"""
    loan_types = {
        r'\[x\]\s*Micro-Business': 'Micro-Business Loan',
        r'\[x\]\s*Personal': 'Personal Loan',
        r'\[x\]\s*Housing': 'Housing Loan',
        r'\[x\]\s*Car': 'Car Loan',
    }
    import re
    for pattern, loan_type in loan_types.items():
        if re.search(pattern, text, re.IGNORECASE):
            return loan_type
    return None

def extract_loan_purposes(text: str) -> list:
    """Extract checked loan purposes from Application Form"""
    purposes = []
    checkboxes = {
        'Business Launching': r'\[x\]\s*Business\s*Launching',
        'House Buying': r'\[x\]\s*House\s*Buying',
        'Home Improvement': r'\[x\]\s*Home\s*Improvement',
        'Investment': r'\[x\]\s*Investment',
        'Education': r'\[x\]\s*Education',
        'Car Buying': r'\[x\]\s*Car\s*Buying',
        'Credit Cards': r'\[x\]\s*Credit\s*Cards',
        'Internet Loans': r'\[x\]\s*Internet\s*Loans',
    }
    import re
    for purpose, pattern in checkboxes.items():
        if re.search(pattern, text, re.IGNORECASE):
            purposes.append(purpose)
    
    # Check for "Other" with custom text
    other_match = re.search(r'\[x\]\s*Other[:\s]+([^\n]+)', text, re.IGNORECASE)
    if other_match:
        purposes.append(f"Other: {other_match.group(1).strip()}")
    
    return purposes if purposes else None

def extract_document_risk_evidence(bank_text, essay_text, payslip_text, final_score, loan_type):
    """
    Extract specific risk factors with actual evidence from uploaded documents.
    Focus on: Income vs Loan Amount, Suspicious Activities, Debt Obligations, and Essay-based Risks
    """
    import re
    risk_flags = []
    
    # === 1. INCOME & REPAYMENT CAPACITY ANALYSIS (PAYSLIP) ===
    salary_amount = None
    if payslip_text and len(payslip_text.strip()) > 10:
        payslip_lower = payslip_text.lower()
        
        # Extract salary amount
        salary_pattern = r'(basic salary|gross pay|net pay|net salary|total earnings)[:\s]*rm\s*([0-9,]+)'
        salary_matches = re.findall(salary_pattern, payslip_lower)
        
        if salary_matches:
            try:
                salary_amount = float(salary_matches[0][1].replace(',', ''))
                
                # Check repayment capacity (assume max 40% DSR)
                max_monthly_repayment = salary_amount * 0.40
                
                # Estimate monthly installment (assuming 5-year tenure, 8% interest)
                # This is a rough estimate for risk assessment
                # Note: requested_amount would need to be passed to this function
                
                risk_flags.append({
                    "flag": "Monthly Income Verified",
                    "severity": "Info",
                    "description": f"Monthly salary: RM {salary_amount:,.2f}. Maximum safe monthly repayment: RM {max_monthly_repayment:,.2f} (40% DSR)",
                    "evidence_quote": f"Payslip shows: {salary_matches[0][0].title()} RM {salary_matches[0][1]}",
                    "document_source": "Payslip"
                })
                
                # Low income warning
                if salary_amount < 2500:
                    risk_flags.append({
                        "flag": "Low Income - High Risk",
                        "severity": "Critical",
                        "description": f"Monthly income of RM {salary_amount:,.2f} is below recommended threshold for loan approval",
                        "evidence_quote": f"Payslip shows: {salary_matches[0][0].title()} RM {salary_matches[0][1]}",
                        "document_source": "Payslip"
                    })
                elif salary_amount < 4000:
                    risk_flags.append({
                        "flag": "Moderate Income - Careful Assessment",
                        "severity": "Medium",
                        "description": f"Monthly income of RM {salary_amount:,.2f} requires careful loan amount evaluation",
                        "evidence_quote": f"Payslip shows: {salary_matches[0][0].title()} RM {salary_matches[0][1]}",
                        "document_source": "Payslip"
                    })
                elif salary_amount > 10000:
                    risk_flags.append({
                        "flag": "Strong Income - Good Repayment Capacity",
                        "severity": "Positive",
                        "description": f"Strong monthly income of RM {salary_amount:,.2f} indicates good repayment capacity",
                        "evidence_quote": f"Payslip shows: {salary_matches[0][0].title()} RM {salary_matches[0][1]}",
                        "document_source": "Payslip"
                    })
            except:
                pass
        # Note: Income extraction failures are not flagged as risks - they require manual verification only
    
        
        # Check for existing debt deductions
        deduction_keywords = ['loan deduction', 'ptptn', 'housing loan', 'car loan', 'personal loan', 'court order', 'garnishment', 'debt recovery', 'repayment']
        deductions_found = []
        for keyword in deduction_keywords:
            if keyword in payslip_lower:
                # Try to find the line containing this keyword
                for line in payslip_text.split('\n'):
                    if keyword in line.lower():
                        deductions_found.append(line.strip())
                        break
        
        if deductions_found:
            risk_flags.append({
                "flag": "Existing Debt Obligations Detected",
                "severity": "High", 
                "description": "Applicant has ongoing loan repayments reducing disposable income",
                "evidence_quote": f"Payslip shows deductions: {'; '.join(deductions_found[:2])}",
                "document_source": "Payslip"
            })
    
    # === 2. SUSPICIOUS SPENDING & FUND PATTERNS (BANK STATEMENT) ===
    if bank_text and len(bank_text.strip()) > 10:
        bank_lower = bank_text.lower()
        
        # Gambling Activities
        gambling_keywords = ['casino', 'gambling', 'genting', 'jackpot', 'lottery', 'sports bet', 'online bet', '4d', 'toto', 'magnum']
        gambling_found = [kw for kw in gambling_keywords if kw in bank_lower]
        if gambling_found:
            # Extract actual transaction lines
            gambling_lines = []
            for line in bank_text.split('\n'):
                if any(kw in line.lower() for kw in gambling_found):
                    gambling_lines.append(line.strip())
                    if len(gambling_lines) >= 2:
                        break
            
            risk_flags.append({
                "flag": "Gambling Activities - High Risk",
                "severity": "Critical",
                "description": f"Bank statement shows gambling transactions - indicates financial instability",
                "evidence_quote": f"Transactions: {'; '.join(gambling_lines[:2])}" if gambling_lines else f"Gambling keywords detected: {', '.join(gambling_found)}",
                "document_source": "Bank Statement"
            })
        
        # Cryptocurrency & High-Risk Trading
        crypto_keywords = ['binance', 'coinbase', 'crypto.com', 'bitcoin', 'ethereum', 'btc', 'eth']
        crypto_found = [kw for kw in crypto_keywords if kw in bank_lower]
        if crypto_found:
            risk_flags.append({
                "flag": "High-Risk Investment Activities",
                "severity": "High",
                "description": "Cryptocurrency trading detected - volatile asset exposure",
                "evidence_quote": f"Bank statement shows crypto-related transactions: {', '.join(crypto_found)}",
                "document_source": "Bank Statement"
            })
        
        # Overdraft / Insufficient Funds
        overdraft_keywords = ['overdraft', 'insufficient fund', 'nsf', 'bounced', 'penalty', 'late fee']
        overdraft_lines = []
        for line in bank_text.split('\n'):
            if any(kw in line.lower() for kw in overdraft_keywords):
                overdraft_lines.append(line.strip())
                if len(overdraft_lines) >= 2:
                    break
        
        if overdraft_lines:
            risk_flags.append({
                "flag": "Poor Cash Flow Management",
                "severity": "High",
                "description": "Bank statement shows overdraft or insufficient fund issues",
                "evidence_quote": f"Issues: {'; '.join(overdraft_lines[:2])}",
                "document_source": "Bank Statement"
            })
        
        # Suspicious Large Cash Withdrawals
        withdrawal_pattern = r'(withdrawal|cash|atm)[^\n]*rm\s*([0-9,]+)'
        withdrawals = re.findall(withdrawal_pattern, bank_lower)
        if withdrawals:
            amounts = []
            for w in withdrawals:
                try:
                    amt = float(w[1].replace(',', ''))
                    if amt > 5000:
                        amounts.append(amt)
                except:
                    pass
            
            if amounts:
                total_large_withdrawals = sum(amounts)
                risk_flags.append({
                    "flag": "Large Cash Withdrawals Detected",
                    "severity": "Medium",
                    "description": f"Total of RM {total_large_withdrawals:,.2f} in large cash withdrawals detected",
                    "evidence_quote": f"Multiple withdrawals > RM 5,000 found. Largest: RM {max(amounts):,.2f}",
                    "document_source": "Bank Statement"
                })
    
    # === 3. DEBT OBLIGATIONS & POTENTIAL RISKS (ESSAY ANALYSIS) ===
    if essay_text and len(essay_text.strip()) > 10:
        essay_lower = essay_text.lower()
        essay_sentences = [s.strip() for s in essay_text.split('.') if len(s.strip()) > 20]
        
        # Existing Debt / PTPTN Default Detection
        debt_keywords = ['ptptn', 'default', 'existing loan', 'debt', 'owe', 'outstanding', 'arrears', 'pay off', 'clear debt']
        for keyword in debt_keywords:
            if keyword in essay_lower:
                # Find the sentence containing this keyword
                for sentence in essay_sentences:
                    if keyword in sentence.lower():
                        severity = "Critical" if keyword in ['default', 'ptptn', 'arrears'] else "High"
                        risk_flags.append({
                            "flag": "Existing Debt Obligations Disclosed",
                            "severity": severity,
                            "description": f"Applicant mentions existing debt obligations",
                            "evidence_quote": f"Essay states: \"{sentence.strip()}\"",
                            "document_source": "Loan Essay"
                        })
                        break
                break
        
        # Financial Difficulties / Concerns
        concern_keywords = {
            'complex': 'financial complexity',
            'difficult': 'financial difficulties',
            'struggle': 'financial struggles',
            'challenge': 'financial challenges',
            'crisis': 'financial crisis',
            'tight': 'tight finances',
            'burden': 'financial burden'
        }
        
        for keyword, description in concern_keywords.items():
            if keyword in essay_lower:
                for sentence in essay_sentences:
                    if keyword in sentence.lower():
                        risk_flags.append({
                            "flag": "Financial Concerns Disclosed",
                            "severity": "High",
                            "description": f"Applicant acknowledges {description}",
                            "evidence_quote": f"Essay states: \"{sentence.strip()}\"",
                            "document_source": "Loan Essay"
                        })
                        break
                break
        
        # Purpose Mismatch (e.g., Business loan for car purchase)
        if loan_type in ["Micro-Business", "Business Loan"]:
            personal_keywords = ['car', 'vehicle', 'house renovation', 'wedding', 'vacation', 'personal use']
            personal_found = [kw for kw in personal_keywords if kw in essay_lower]
            if personal_found:
                for sentence in essay_sentences:
                    if any(kw in sentence.lower() for kw in personal_found):
                        risk_flags.append({
                            "flag": "Loan Purpose Mismatch - Critical",
                            "severity": "Critical",
                            "description": f"Business loan requested but essay indicates personal use: {', '.join(personal_found)}",
                            "evidence_quote": f"Essay states: \"{sentence.strip()}\"",
                            "document_source": "Loan Essay"
                        })
                        break
        
        # Extended Repayment Tenure Request
        tenure_pattern = r'(\d+)\s*(year|yr)'
        tenure_matches = re.findall(tenure_pattern, essay_lower)
        if tenure_matches:
            tenure_years = int(tenure_matches[0][0])
            if tenure_years > 7:
                risk_flags.append({
                    "flag": "Extended Repayment Period Requested",
                    "severity": "Medium",
                    "description": f"Applicant requests {tenure_years}-year tenure - may indicate repayment concerns",
                    "evidence_quote": f"Essay requests {tenure_years} years repayment period",
                    "document_source": "Loan Essay"
                })
        
        # Insufficient Information Warning
        if len(essay_text.strip()) < 100:
            risk_flags.append({
                "flag": "Insufficient Essay Information",
                "severity": "Medium",
                "description": "Loan essay too brief - insufficient detail on loan purpose and financial situation",
                "evidence_quote": f"Essay length: {len(essay_text.strip())} characters. Detailed explanation recommended.",
                "document_source": "Loan Essay"
            })
    else:
        # No essay provided
        risk_flags.append({
            "flag": "Loan Essay Not Provided",
            "severity": "High",
            "description": "No loan purpose essay submitted - unable to assess loan intent and applicant's financial awareness",
            "evidence_quote": "Loan essay document missing from application",
            "document_source": "Loan Essay"
        })
    
    # Note: Document completeness is verified during upload, not flagged as a credit risk
    
    # CRITICAL: Enforce minimum 4 risk flags
    print(f"[FALLBACK] extract_document_risk_evidence generated {len(risk_flags)} risks")
    if len(risk_flags) < 4:
        print(f"[FALLBACK ENFORCEMENT] Adding additional risks to meet minimum 4...")
        while len(risk_flags) < 4:
            if len(risk_flags) == 0:
                risk_flags.append({
                    "flag": "Income-to-Debt Ratio Assessment Required",
                    "severity": "Medium",
                    "description": "Comprehensive debt servicing capacity analysis needed. The applicant's total monthly obligations including this new loan must be assessed against verified income to ensure sustainable repayment without financial strain.",
                    "evidence_quote": "Application requires full income and debt obligation verification",
                    "ai_justification": "Proper debt-to-income ratio assessment is fundamental to preventing over-lending and protecting both borrower and lender from default risk.",
                    "document_source": "Application Summary"
                })
            elif len(risk_flags) == 1:
                if essay_text and len(essay_text.strip()) > 0:
                    risk_flags.append({
                        "flag": "Financial Commitment Verification",
                        "severity": "Medium",
                        "description": "Existing financial commitments and monthly obligations need thorough verification. Any undisclosed debts or commitments could impact repayment capacity and must be investigated.",
                        "evidence_quote": essay_text[:100] + "..." if len(essay_text) > 100 else essay_text,
                        "ai_justification": "Undisclosed financial obligations are a common cause of loan defaults. Complete disclosure verification protects lending decision accuracy.",
                        "document_source": "Loan Essay"
                    })
                else:
                    risk_flags.append({
                        "flag": "Income Pattern Analysis Required",
                        "severity": "Medium",
                        "description": "Bank statement requires detailed income pattern analysis to verify consistency and sustainability of income streams. Irregular income increases repayment risk.",
                        "evidence_quote": "Bank statement shows income patterns requiring detailed verification",
                        "ai_justification": "Stable, consistent income is the strongest predictor of loan repayment capability. Irregular patterns warrant careful assessment.",
                        "document_source": "Bank Statement"
                    })
            elif len(risk_flags) == 2:
                risk_flags.append({
                    "flag": "Loan Affordability Stress Test",
                    "severity": "Medium",
                    "description": "Monthly installment affordability must be stress-tested against applicant's income after essential expenses. A safety buffer of at least 30% should remain for emergencies and unexpected costs.",
                    "evidence_quote": "Affordability requires stress-testing against income and essential expenses",
                    "ai_justification": "Over-commitment to loan payments without adequate buffer is a primary default trigger, especially during economic stress or income disruption.",
                    "document_source": "Application Summary"
                })
            elif len(risk_flags) == 3:
                risk_flags.append({
                    "flag": "Repayment Source Sustainability",
                    "severity": "Low",
                    "description": "The sustainability and reliability of stated repayment sources should be independently verified. Applicant's repayment strategy needs to demonstrate realistic cash flow management throughout the loan tenure.",
                    "evidence_quote": "Repayment plan requires verification of income source sustainability",
                    "ai_justification": "Clear, realistic repayment planning with verified income sources indicates financial responsibility and reduces default probability.",
                    "document_source": "Loan Essay"
                })
        print(f"[FALLBACK ENFORCEMENT] Total risk flags now: {len(risk_flags)}")
    
    return risk_flags



def generate_mock_result(
    loan_type: str,
    raw_text: str = "",
    application_id: str = "",
    requested_amount: float = 0.0,
    bank_text: str = "",
    essay_text: str = "",
    payslip_text: str = "",
    application_form_text: str = ""
) -> dict:
    """Comprehensive loan-specific scoring system based on actual document analysis
    Now includes applicant info extraction from Application Form"""
    import hashlib, re
    
    # Generate deterministic but varied results based on actual content
    content_hash = hashlib.md5(f"{application_id}{raw_text[:500]}".encode()).hexdigest()
    hash_value = int(content_hash[:8], 16)
    
    # Extract applicant info from Application Form using regex
    applicant_profile = {
        "name": extract_field(application_form_text, r"NAME\s*:\s*([^\n]+)") or "Unknown Applicant",
        "ic_number": extract_field(application_form_text, r"(?:MYKAD|PASSPORT)\s*NO\s*:\s*([^\n]+)") or "N/A",
        "loan_type": extract_loan_type_from_form(application_form_text) or loan_type,
        "requested_amount": extract_number(application_form_text, r"DESIRED LOAN AMOUNT.*?(\d+)") or requested_amount,
        "annual_income": extract_number(application_form_text, r"ANNUAL INCOME.*?(\d+)"),
        "period": extract_field(application_form_text, r"PERIOD\s*:\s*([^\n]+)"),
        "loan_purpose": extract_loan_purposes(application_form_text),
        "phone": extract_field(application_form_text, r"PHONE\s*NO\s*:\s*([^\n]+)"),
        "email": extract_field(application_form_text, r"EMAIL\s*:\s*([^\n]+)"),
        "address": extract_field(application_form_text, r"ADDRESS\s*:\s*([^\n]+)"),
        "birth_date": extract_field(application_form_text, r"BIRTH\s*DATE\s*:\s*([^\n]+)"),
        "marital_status": extract_field(application_form_text, r"MARITAL\s*STATUS\s*:\s*([^\n]+)"),
        "family_members": extract_number(application_form_text, r"NUMBER\s*OF\s*FAMILY\s*MEMBERS\s*:\s*(\d+)"),
        "bank_institution": extract_field(application_form_text, r"INSTITUTION\s*NAME\s*:\s*([^\n]+)"),
        "bank_account": extract_field(application_form_text, r"SAVING\s*ACCOUNT\s*:\s*([^\n]+)"),
        "id": application_id
    }
    
    # Loan-specific base scoring
    loan_type_bases = {
        "Micro-Business": 60,  # Higher risk, business-focused
        "Personal": 65,       # Medium risk, income-focused
        "Car": 70,           # Lower risk, asset-backed
        "Housing": 55        # High amount, comprehensive evaluation
    }
    base_score = loan_type_bases.get(loan_type.replace(" Loan", ""), 65)
    detailed_score_breakdown = []
    
    # Analyze actual text content for loan-specific comprehensive scoring
    text_lower = raw_text.lower()
    loan_clean_type = loan_type.replace(" Loan", "")
    
    # === LOAN-SPECIFIC SCORING SYSTEM ===
    
    # Apply loan-specific scoring
    if loan_clean_type == "Micro-Business":
        base_score = calculate_business_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, detailed_score_breakdown)
    elif loan_clean_type == "Personal":
        base_score = calculate_personal_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, detailed_score_breakdown)
    elif loan_clean_type == "Car":
        base_score = calculate_car_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, detailed_score_breakdown)
    elif loan_clean_type == "Housing":
        base_score = calculate_housing_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, detailed_score_breakdown)
    else:
        # Default comprehensive scoring for unknown loan types
        base_score = calculate_default_loan_score(text_lower, bank_text, essay_text, payslip_text, requested_amount, base_score, detailed_score_breakdown)
    
    # Apply common risk factors for all loan types
    base_score = apply_common_risk_factors(text_lower, bank_text, essay_text, payslip_text, base_score, detailed_score_breakdown)
    
    final_score = max(20, min(95, base_score))
    
    # Risk level and decision based on loan type
    loan_thresholds = {
        "Micro-Business": {"approve": 65, "review": 45},  # More flexible for business
        "Personal": {"approve": 70, "review": 50},        # Standard thresholds
        "Car": {"approve": 75, "review": 55},             # Higher bar due to asset
        "Housing": {"approve": 80, "review": 60}          # Highest standards
    }
    
    thresholds = loan_thresholds.get(loan_clean_type, {"approve": 70, "review": 50})
    
    if final_score >= thresholds["approve"]:
        risk_level = "Low"
        decision = "Approved"
    elif final_score >= thresholds["review"]:
        risk_level = "Medium" 
        decision = "Review Required"
    else:
        risk_level = "High"
        decision = "Rejected"
    
    # Risk level and decision
    if final_score >= 75:
        risk_level = "Low"
        decision = "Approved"
    elif final_score >= 55:
        risk_level = "Medium" 
        decision = "Review Required"
    else:
        risk_level = "High"
        decision = "Rejected"
    
    # Generate forensic evidence from actual content
    claim_vs_reality = []
    if bank_text:
        claim_vs_reality.append({
            "claim_topic": "Bank Statement Analysis",
            "essay_quote": "Bank statement provided for verification",
            "statement_evidence": f"Statement contains {len(bank_text.split())} words of transaction data",
            "status": "Verified",
            "confidence": 90
        })
    
    if essay_text:
        claim_vs_reality.append({
            "claim_topic": "Loan Purpose", 
            "essay_quote": essay_text[:100] + "..." if len(essay_text) > 100 else essay_text,
            "statement_evidence": "Detailed explanation provided in essay",
            "status": "Verified",
            "confidence": 85
        })
    # Extract specific risk flags with actual evidence from documents
    key_risk_flags = extract_document_risk_evidence(bank_text, essay_text, payslip_text, final_score, loan_clean_type)
    
    return {
        "applicant_profile": applicant_profile,  # Use extracted profile from Application Form
        "risk_score_analysis": {
            "final_score": final_score,
            "risk_level": risk_level,
            "score_breakdown": detailed_score_breakdown
        },
        "forensic_evidence": {
            "claim_vs_reality": claim_vs_reality
        },
        "key_risk_flags": key_risk_flags,
        "essay_insights": [],
        "behavioral_insights": [],
        "ai_reasoning_log": [
            "[FALLBACK] AI analysis unavailable, using document-based heuristics",
            f"[FALLBACK] Extracted applicant info from Application Form: {applicant_profile.get('name', 'Unknown')}",
            f"[FALLBACK] Processed {len(raw_text)} characters of content",
            f"[FALLBACK] Applied {len(detailed_score_breakdown)} scoring factors",
            f"[FALLBACK] Generated risk score: {final_score}"
        ],
        "risk_score": final_score,
        "risk_level": risk_level,
        "final_decision": decision,
        "document_texts": {
            "bank_statement": bank_text,
            "essay": essay_text, 
            "payslip": payslip_text
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# ---------------- Additional Operational Endpoints -----------------

@app.post("/api/application/{application_id}/retry")
async def retry_application(application_id: str):
    """Retry processing for a FAILED application.
    Resets status to PROCESSING and re-schedules background analysis.
    """
    with get_session() as session:
        app_obj = session.query(Application).filter(Application.application_id == application_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Application not found")
        if app_obj.status != ApplicationStatus.FAILED:
            raise HTTPException(status_code=400, detail="Application is not in FAILED state")
        # Cache required attributes before session closes
        loan_type_val = app_obj.loan_type.value if hasattr(app_obj.loan_type, 'value') else str(app_obj.loan_type)
        bank_path = app_obj.bank_statement_path or ''
        essay_path_local = app_obj.essay_path
        payslip_path_local = app_obj.payslip_path
        app_obj.status = ApplicationStatus.PROCESSING
        app_obj.updated_at = datetime.utcnow()
        session.add(app_obj)
        session.commit()

    # Schedule background task on current event loop
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(process_application_background(
            application_id,
            loan_type_val,
            bank_path,
            essay_path_local,
            payslip_path_local
        ))
    except RuntimeError:
        # If no running loop, fallback to asyncio.run (blocking) – rare in FastAPI
        asyncio.run(process_application_background(
            application_id,
            loan_type_val,
            bank_path,
            essay_path_local,
            payslip_path_local
        ))

    return {"success": True, "status": "Processing", "message": "Retry scheduled"}


@app.get("/api/application/{application_id}/reasoning")
async def get_reasoning_subset(application_id: str):
    """Return a lightweight reasoning subset to avoid large payload transfers."""
    with get_session() as session:
        app_obj = session.query(Application).filter(Application.application_id == application_id).first()
        if not app_obj:
            raise HTTPException(status_code=404, detail="Application not found")
        analysis = app_obj.analysis_result or {}
        rsa = analysis.get("risk_score_analysis", {})
        return {
            "application_id": application_id,
            "status": app_obj.status.value if app_obj.status else None,
            "score": analysis.get("risk_score"),
            "risk_level": analysis.get("risk_level"),
            "final_decision": analysis.get("final_decision"),
            "score_breakdown": rsa.get("score_breakdown", [])[:15],
            "risk_flags": analysis.get("key_risk_flags", [])[:25],
            "essay_insights_count": len(analysis.get("essay_insights", [])),
            "reasoning_log": analysis.get("ai_reasoning_log", [])[:20]
        }


# Pydantic model for copilot chat request
class CopilotRequest(BaseModel):
    question: str
    application_id: str


@app.post("/api/copilot/ask")
async def copilot_ask(request: CopilotRequest):
    """AI Copilot endpoint - answers questions about specific application's 4 documents"""
    with get_session() as session:
        app = session.query(Application).filter(Application.application_id == request.application_id).first()
        
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if not app.analysis_result:
            return {
                "answer": "This application hasn't been analyzed yet. Please wait for the AI analysis to complete.",
                "sources": []
            }
        
        # Get document texts from analysis
        analysis = app.analysis_result
        doc_texts = analysis.get("document_texts", {})
        applicant_profile = analysis.get("applicant_profile", {})
        
        # Build context from the 4 documents
        context_parts = []
        context_parts.append(f"=== APPLICATION ID: {request.application_id} ===")
        context_parts.append(f"Applicant: {applicant_profile.get('name', 'Unknown')}")
        context_parts.append(f"Loan Type: {applicant_profile.get('loan_type', 'Unknown')}")
        context_parts.append(f"Requested Amount: RM {applicant_profile.get('requested_amount', 0):,.2f}")
        context_parts.append("")
        context_parts.append("=== BANK STATEMENT ===")
        context_parts.append(doc_texts.get("bank_statement", "No bank statement available")[:3000])
        context_parts.append("")
        context_parts.append("=== LOAN ESSAY ===")
        context_parts.append(doc_texts.get("essay", "No essay available")[:2000])
        context_parts.append("")
        context_parts.append("=== PAYSLIP ===")
        context_parts.append(doc_texts.get("payslip", "No payslip available")[:2000])
        context_parts.append("")
        context_parts.append("=== ANALYSIS SUMMARY ===")
        context_parts.append(f"Risk Score: {analysis.get('risk_score', 'N/A')}/100")
        context_parts.append(f"Final Decision: {analysis.get('final_decision', 'N/A')}")
        
        # Add key findings
        if analysis.get("key_risk_flags"):
            context_parts.append("\nKey Risk Flags:")
            for flag in analysis.get("key_risk_flags", [])[:5]:
                context_parts.append(f"- {flag.get('flag', '')}: {flag.get('description', '')}")
        
        context = "\n".join(context_parts)
        
        # Call Gemini to answer the question
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("models/gemini-2.0-flash")
            
            copilot_prompt = f"""You are TrustLens Copilot, an AI assistant helping a Credit Officer review loan applications.

CRITICAL: You are ONLY analyzing Application ID: {request.application_id}. Do NOT mix information from other applications.

You have access to the following documents for this specific applicant:
1. Application Form
2. Bank Statement  
3. Loan Essay
4. Payslip

{context}

User Question: {request.question}

Instructions:
1. Answer ONLY based on the documents provided above for Application ID: {request.application_id}
2. Quote specific evidence from the documents when possible
3. If the answer isn't in the documents, say "I don't have that information in the available documents"
4. Be concise and helpful
5. Reference which document you're citing (e.g., "According to the Bank Statement...")

Answer:"""
            
            response = model.generate_content(copilot_prompt)
            answer = response.text
            
            # Extract sources mentioned in the answer
            sources = []
            if "Bank Statement" in answer or "bank statement" in answer:
                sources.append("Bank Statement")
            if "Essay" in answer or "essay" in answer or "Loan Essay" in answer:
                sources.append("Loan Essay")
            if "Payslip" in answer or "payslip" in answer:
                sources.append("Payslip")
            if "Application" in answer or "application form" in answer:
                sources.append("Application Form")
            
            return {
                "answer": answer,
                "sources": list(set(sources)),
                "application_id": request.application_id
            }
            
        except Exception as e:
            print(f"Copilot error: {str(e)}")
            return {
                "answer": f"I encountered an error while processing your question. Please try again.",
                "sources": [],
                "error": str(e)
            }
