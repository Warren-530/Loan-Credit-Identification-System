"""
Backend Configuration Constants
Centralizes all hardcoded values for maintainability
"""
import os
from typing import Dict, List
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Environment Configuration
@dataclass(frozen=True)
class Config:
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DB_URL: str = 'sqlite:///trustlens.db'
    DB_ECHO: bool = False
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: tuple = ('.pdf', '.txt', '.doc', '.docx')
    
    # API Configuration
    CORS_ORIGINS: List[str] = field(default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"])
    REQUEST_TIMEOUT: int = 30
    
    # Default Values
    DEFAULT_REVIEWER: str = "Credit Officer"
    
    # Email Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")  # Gmail address
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")  # Gmail app password
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")  # From email address
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "TrustLens AI")
    DEFAULT_LOAN_TENURE: int = 24
    CURRENCY: str = "RM"
    
    def __post_init__(self):
        if self.CORS_ORIGINS is None:
            object.__setattr__(self, 'CORS_ORIGINS', [
                "http://localhost:3000",
                "http://localhost:3001", 
                "https://trustlens.local"
            ])

# Risk Scoring Configuration
class RiskConfig:
    # Score Ranges
    MIN_SCORE = 0
    MAX_SCORE = 100
    BASELINE_SCORE = 50
    
    # Thresholds
    LOW_RISK_THRESHOLD = 80
    MEDIUM_RISK_THRESHOLD = 60
    
    # Scoring Factors
    INCOME_VERIFIED_BONUS = 15
    INCOME_ACTIVITY_BONUS = 10
    POSITIVE_CASHFLOW_BONUS = 10
    NEGATIVE_CASHFLOW_PENALTY = -15
    INCOME_STABILITY_BONUS = 10
    VOLATILE_INCOME_PENALTY = -8
    GAMBLING_PENALTY = -25
    CRYPTO_PENALTY = -10
    SALARY_EVIDENCE_BONUS = 8
    REPAYMENT_INTENT_BONUS = 5
    WEAK_CAPACITY_PENALTY = -12
    STRONG_CAPACITY_BONUS = 7
    SPARSE_INCOME_PENALTY = -10
    
    # Analysis Keywords
    INCOME_KEYWORDS = [
        'salary', 'gaji', 'duitnow', 'transfer', 'payment', 
        'payout', 'income', 'grab', 'shopee'
    ]
    
    GAMBLING_KEYWORDS = ['genting', 'magnum', 'toto', 'casino']
    CRYPTO_KEYWORDS = ['luno', 'binance', 'remitano'] 
    SAVINGS_KEYWORDS = ['asb', 'tabung haji', 'fixed deposit', 'fd placement']
    SUBSCRIPTION_KEYWORDS = ['netflix', 'spotify', 'youtube', 'apple', 'google']
    FOOD_DELIVERY_KEYWORDS = ['grabfood', 'foodpanda', 'steam', 'playstation']
    
    # Deposit/Withdrawal Detection
    DEPOSIT_KEYWORDS = ['deposit', 'credit', 'payout', 'salary', 'transfer +']
    WITHDRAWAL_KEYWORDS = ['withdraw', 'debit', 'payment', '-', 'atm withdrawal']
    
    # Payslip Keywords  
    SALARY_LINE_KEYWORDS = ['basic', 'salary', 'gaji']
    
    # Essay Intent Keywords
    REPAYMENT_KEYWORDS = ['repay', 'installment', 'commit', 'payment plan']

# Loan Type Configuration
class LoanConfig:
    TYPES = {
        "MICRO_BUSINESS": "Micro-Business Loan",
        "PERSONAL": "Personal Loan", 
        "HOUSING": "Housing Loan",
        "CAR": "Car Loan"
    }
    
    # High Amount Review Thresholds
    HIGH_AMOUNT_THRESHOLDS = {
        "Micro-Business Loan": 50000,
        "Personal Loan": 30000,
        "Housing Loan": 500000,
        "Car Loan": 80000
    }
    
    DEFAULT_INSTALLMENT_MONTHS = 24

# Mock Data Templates
class MockDataTemplates:
    # Fallback text when extraction fails
    BANK_STATEMENT_FALLBACK = "Sample bank statement - Regular deposits: RM 5,000/month. Expenses: RM 3,500/month. Balance: RM 15,000."
    ESSAY_FALLBACK = "Sample essay - I am applying for this loan to expand my business operations."
    PAYSLIP_FALLBACK = "Sample payslip - Basic Salary: RM 4,500. Allowances: RM 300. Deductions: RM 250. Net: RM 4,550."
    
    # Claim Templates by Loan Type
    CLAIMS_BY_LOAN_TYPE = {
        "Micro-Business Loan": [
            {
                "claim_topic": "Business Income",
                "essay_quote": "I receive daily payments from my customers via DuitNow",
                "statement_evidence": "Multiple 'DuitNow' inflows detected in Bank Statement.",
                "status": "Verified",
                "confidence": 95
            },
            {
                "claim_topic": "Supplier Payments",
                "essay_quote": "I pay my suppliers in cash or transfer",
                "statement_evidence": "No regular outflows to business entities found. High cash withdrawals detected.",
                "status": "Contradicted", 
                "confidence": 88
            }
        ],
        "Personal Loan": [
            {
                "claim_topic": "Debt Consolidation",
                "essay_quote": "I want to clear my credit card debts",
                "statement_evidence": "Recurring payments to major credit card companies found.",
                "status": "Verified",
                "confidence": 90
            },
            {
                "claim_topic": "No Other Loans",
                "essay_quote": "I do not have other outside loans", 
                "statement_evidence": "Monthly transfer to individual detected.",
                "status": "Suspicious",
                "confidence": 75
            }
        ],
        "Car Loan": [
            {
                "claim_topic": "Income Source",
                "essay_quote": "I drive Grab full time",
                "statement_evidence": "Weekly 'GRAB' payouts detected.",
                "status": "Verified",
                "confidence": 92
            },
            {
                "claim_topic": "Down Payment",
                "essay_quote": "I have saved enough for the 10% down payment",
                "statement_evidence": "Account balance is consistently low.",
                "status": "Contradicted",
                "confidence": 95
            }
        ],
        "Housing Loan": [
            {
                "claim_topic": "Savings",
                "essay_quote": "I have consistent savings",
                "statement_evidence": "Monthly transfers to ASB detected.",
                "status": "Verified",
                "confidence": 85
            },
            {
                "claim_topic": "Source of Funds", 
                "essay_quote": "My income is purely from salary",
                "statement_evidence": "Large deposit from external source detected.",
                "status": "Suspicious",
                "confidence": 80
            }
        ]
    }
    
    # Evidence Quote Templates
    EVIDENCE_QUOTES = {
        "stable_cashflow": "DuitNow Transfer +RM50.00 ... DuitNow Transfer +RM35.00",
        "irregular_income": "Last deposit: 05-12 ... Next deposit: 05-20", 
        "lifestyle_inflation": "Starbucks RM25.00 ... Zara RM350.00 ... Atome RM120.00",
        "prudent_spending": "Total Withdrawals: RM 1,200 (20% of Income)",
        "wealth_verified": "Transfer to ASB RM500.00 (Monthly Recurring)",
        "large_deposit": "Deposit RM 50,000.00 Ref: 'Private Transfer'",
        "gig_income": "Grab Payout +RM 350.00 ... Lalamove Payout +RM 120.00",
        "operational_risk": "JPJ Saman RM 300.00 ... Ah Seng Workshop RM 450.00"
    }

# AI Configuration
class AIConfig:
    GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
    MODEL_NAME = "gemini-1.5-flash"
    MAX_TOKENS = 8192
    TEMPERATURE = 0.3
    
    # Prompt Templates
    SYSTEM_PROMPT_TEMPLATE = """
    You are a Malaysian loan risk assessment AI. Analyze the provided documents and return a structured JSON response.
    
    Context: {loan_type}
    Documents: Bank statement, loan essay, payslip
    
    Focus on Malaysian context (RM currency, local banks, Malay terms).
    """

# Application Constants
APP_CONFIG = Config()
RISK = RiskConfig()
LOAN = LoanConfig()
MOCK = MockDataTemplates()
AI = AIConfig()

# Export commonly used values
__all__ = [
    'APP_CONFIG', 'RISK', 'LOAN', 'MOCK', 'AI',
    'Config', 'RiskConfig', 'LoanConfig', 'MockDataTemplates', 'AIConfig'
]