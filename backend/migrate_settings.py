"""
Migration script to add RiskPolicy and AuditLog tables
"""
from sqlmodel import create_engine, Session, select
from models import SQLModel, RiskPolicy, AuditLog
import os

def migrate():
    """Create new tables and initialize default settings"""
    
    # Connect to database
    sqlite_file_name = "trustlens.db"
    sqlite_url = f"sqlite:///{sqlite_file_name}"
    engine = create_engine(sqlite_url, echo=True)
    
    print("Creating new tables...")
    SQLModel.metadata.create_all(engine)
    
    # Initialize default risk policy if not exists
    with Session(engine) as session:
        existing_policy = session.exec(select(RiskPolicy)).first()
        
        if not existing_policy:
            print("Creating default risk policy...")
            default_policy = RiskPolicy(
                dsr_threshold=60.0,
                min_savings_rate=10.0,
                confidence_threshold=75.0,
                auto_reject_gambling=True,
                auto_reject_high_dsr=True,
                max_loan_micro_business=50000.0,
                max_loan_personal=100000.0,
                max_loan_housing=500000.0,
                max_loan_car=150000.0,
                updated_by="System"
            )
            session.add(default_policy)
            session.commit()
            print("✅ Default risk policy created")
        else:
            print("✅ Risk policy already exists")
        
        # Add initial audit log
        initial_log = AuditLog(
            user="System",
            action="System Initialized",
            details="Settings database tables created and initialized with default values"
        )
        session.add(initial_log)
        session.commit()
        print("✅ Initial audit log created")
    
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
