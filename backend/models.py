"""
Database models for TrustLens AI
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON
from enum import Enum


class LoanType(str, Enum):
    MICRO_BUSINESS = "Micro-Business Loan"
    PERSONAL = "Personal Loan"
    HOUSING = "Housing Loan"
    CAR = "Car Loan"


class ApplicationStatus(str, Enum):
    PROCESSING = "Processing"
    ANALYZING = "Analyzing"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    REVIEW_REQUIRED = "Review Required"
    FAILED = "Failed"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class ReviewStatus(str, Enum):
    AI_PENDING = "AI_Pending"
    HUMAN_VERIFIED = "Human_Verified"
    MANUAL_OVERRIDE = "Manual_Override"


class Application(SQLModel, table=True):
    """Main application table"""
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: str = Field(index=True, unique=True)
    # Applicant info extracted from Application Form by AI
    applicant_name: Optional[str] = None
    applicant_ic: Optional[str] = None
    loan_type: Optional[LoanType] = None
    requested_amount: Optional[float] = None
    status: ApplicationStatus = ApplicationStatus.PROCESSING
    risk_score: Optional[int] = None
    risk_level: Optional[RiskLevel] = None
    final_decision: Optional[str] = None
    
    # Human Verification Fields
    review_status: ReviewStatus = ReviewStatus.AI_PENDING
    ai_decision: Optional[str] = None  # Store original AI decision
    human_decision: Optional[str] = None  # Human override decision
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    override_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Store file paths (4 required documents)
    application_form_path: Optional[str] = None  # NEW: Application Form PDF
    bank_statement_path: Optional[str] = None
    essay_path: Optional[str] = None
    payslip_path: Optional[str] = None
    
    # AI Analysis Results (JSON)
    analysis_result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Decision Audit History (JSON array)
    decision_history: Optional[List[dict]] = Field(default=None, sa_column=Column(JSON))


class AnalysisCache(SQLModel, table=True):
    """Cache for AI analysis to avoid re-processing"""
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: str = Field(index=True)
    result_json: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


def init_db():
    """Initialize database tables"""
    from sqlmodel import create_engine
    
    sqlite_file_name = "trustlens.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    engine = create_engine(sqlite_url, echo=False)
    
    SQLModel.metadata.create_all(engine)
    return engine
