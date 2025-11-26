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
    comment: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[float] = None  # Processing time in seconds
    
    # Store file paths (4 required documents)
    application_form_path: Optional[str] = None  # NEW: Application Form PDF
    bank_statement_path: Optional[str] = None
    essay_path: Optional[str] = None
    payslip_path: Optional[str] = None
    
    # Supporting Documents (Max 3)
    supporting_doc_1_path: Optional[str] = None
    supporting_doc_2_path: Optional[str] = None
    supporting_doc_3_path: Optional[str] = None
    
    # AI Analysis Results (JSON)
    analysis_result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Decision Audit History (JSON array)
    decision_history: Optional[List[dict]] = Field(default_factory=list, sa_column=Column(JSON))


class AnalysisCache(SQLModel, table=True):
    """Cache for AI analysis to avoid re-processing"""
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: str = Field(index=True)
    result_json: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RiskPolicy(SQLModel, table=True):
    """Risk policy configuration settings"""
    id: Optional[int] = Field(default=None, primary_key=True)
    dsr_threshold: float = Field(default=60.0)  # Debt Service Ratio threshold %
    min_savings_rate: float = Field(default=10.0)  # Minimum savings rate %
    confidence_threshold: float = Field(default=75.0)  # AI confidence threshold %
    auto_reject_gambling: bool = Field(default=True)
    auto_reject_high_dsr: bool = Field(default=True)
    max_loan_micro_business: float = Field(default=50000.0)
    max_loan_personal: float = Field(default=100000.0)
    max_loan_housing: float = Field(default=500000.0)
    max_loan_car: float = Field(default=150000.0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str = Field(default="System")


class AuditLog(SQLModel, table=True):
    """System audit trail for tracking all important actions"""
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    user: str = Field(default="System")  # Officer name/ID
    action: str  # e.g., "Approved Application", "Changed DSR Threshold"
    details: str  # Detailed description
    application_id: Optional[str] = None  # Related application if applicable
    old_value: Optional[str] = None  # For setting changes
    new_value: Optional[str] = None  # For setting changes


def init_db():
    """Initialize database tables"""
    from sqlmodel import create_engine
    
    sqlite_file_name = "trustlens.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    engine = create_engine(sqlite_url, echo=False)
    
    SQLModel.metadata.create_all(engine)
    return engine
