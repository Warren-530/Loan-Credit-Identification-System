"""
Database Migration: Add Email Notification and Decision Locking Features
Adds new fields to Application and RiskPolicy tables
"""
from sqlalchemy import create_engine, text, inspect
from datetime import datetime

# Database connection
DATABASE_URL = "sqlite:///trustlens.db"
engine = create_engine(DATABASE_URL)

def migrate():
    """Add email notification and decision locking fields"""
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # Get existing columns
        app_columns = {col['name'] for col in inspector.get_columns('application')}
        policy_columns = {col['name'] for col in inspector.get_columns('riskpolicy')}
        
        print("="*60)
        print("MIGRATION: Email Notification & Decision Locking Feature")
        print("="*60)
        
        # ========== APPLICATION TABLE MIGRATIONS ==========
        print("\n[1] Migrating Application table...")
        
        # Decision Locking Fields
        if 'decision_locked' not in app_columns:
            print("  ✓ Adding 'decision_locked' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN decision_locked BOOLEAN DEFAULT 0"))
            conn.commit()
        else:
            print("  ⊘ 'decision_locked' already exists")
        
        if 'decision_locked_at' not in app_columns:
            print("  ✓ Adding 'decision_locked_at' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN decision_locked_at DATETIME"))
            conn.commit()
        else:
            print("  ⊘ 'decision_locked_at' already exists")
        
        if 'decision_locked_by' not in app_columns:
            print("  ✓ Adding 'decision_locked_by' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN decision_locked_by VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'decision_locked_by' already exists")
        
        # Email Notification Fields
        if 'email_sent' not in app_columns:
            print("  ✓ Adding 'email_sent' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN email_sent BOOLEAN DEFAULT 0"))
            conn.commit()
        else:
            print("  ⊘ 'email_sent' already exists")
        
        if 'email_sent_at' not in app_columns:
            print("  ✓ Adding 'email_sent_at' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN email_sent_at DATETIME"))
            conn.commit()
        else:
            print("  ⊘ 'email_sent_at' already exists")
        
        if 'email_status' not in app_columns:
            print("  ✓ Adding 'email_status' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN email_status VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'email_status' already exists")
        
        if 'email_error' not in app_columns:
            print("  ✓ Adding 'email_error' column...")
            conn.execute(text("ALTER TABLE application ADD COLUMN email_error VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'email_error' already exists")
        
        # Initialize existing applications
        print("\n  ↻ Initializing existing applications...")
        result = conn.execute(text("""
            UPDATE application 
            SET decision_locked = 0, email_sent = 0 
            WHERE decision_locked IS NULL OR email_sent IS NULL
        """))
        conn.commit()
        print(f"  ✓ Updated {result.rowcount} existing records")
        
        # ========== RISKPOLICY TABLE MIGRATIONS ==========
        print("\n[2] Migrating RiskPolicy table...")
        
        if 'email_notification_mode' not in policy_columns:
            print("  ✓ Adding 'email_notification_mode' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN email_notification_mode VARCHAR DEFAULT 'manual'"))
            conn.commit()
        else:
            print("  ⊘ 'email_notification_mode' already exists")
        
        if 'smtp_enabled' not in policy_columns:
            print("  ✓ Adding 'smtp_enabled' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN smtp_enabled BOOLEAN DEFAULT 0"))
            conn.commit()
        else:
            print("  ⊘ 'smtp_enabled' already exists")
        
        if 'smtp_host' not in policy_columns:
            print("  ✓ Adding 'smtp_host' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN smtp_host VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'smtp_host' already exists")
        
        if 'smtp_port' not in policy_columns:
            print("  ✓ Adding 'smtp_port' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN smtp_port INTEGER"))
            conn.commit()
        else:
            print("  ⊘ 'smtp_port' already exists")
        
        if 'smtp_username' not in policy_columns:
            print("  ✓ Adding 'smtp_username' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN smtp_username VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'smtp_username' already exists")
        
        if 'smtp_from_email' not in policy_columns:
            print("  ✓ Adding 'smtp_from_email' column...")
            conn.execute(text("ALTER TABLE riskpolicy ADD COLUMN smtp_from_email VARCHAR"))
            conn.commit()
        else:
            print("  ⊘ 'smtp_from_email' already exists")
        
        # Initialize RiskPolicy if it exists
        print("\n  ↻ Initializing RiskPolicy settings...")
        result = conn.execute(text("""
            UPDATE riskpolicy 
            SET email_notification_mode = 'manual', smtp_enabled = 0
            WHERE email_notification_mode IS NULL
        """))
        conn.commit()
        if result.rowcount > 0:
            print(f"  ✓ Updated {result.rowcount} policy record(s)")
        else:
            print("  ⊘ No RiskPolicy records to update")
        
        # ========== VERIFICATION ==========
        print("\n[3] Verifying migration...")
        
        # Count applications
        result = conn.execute(text("SELECT COUNT(*) FROM application")).fetchone()
        app_count = result[0]
        print(f"  ✓ Total applications: {app_count}")
        
        # Count locked decisions
        result = conn.execute(text("SELECT COUNT(*) FROM application WHERE decision_locked = 1")).fetchone()
        locked_count = result[0]
        print(f"  ✓ Locked decisions: {locked_count}")
        
        # Count sent emails
        result = conn.execute(text("SELECT COUNT(*) FROM application WHERE email_sent = 1")).fetchone()
        email_count = result[0]
        print(f"  ✓ Emails sent: {email_count}")
        
        # Check RiskPolicy
        result = conn.execute(text("SELECT COUNT(*) FROM riskpolicy")).fetchone()
        policy_count = result[0]
        print(f"  ✓ RiskPolicy records: {policy_count}")
        
        if policy_count > 0:
            result = conn.execute(text("SELECT email_notification_mode, smtp_enabled FROM riskpolicy LIMIT 1")).fetchone()
            mode, enabled = result
            print(f"  ✓ Email mode: {mode}, SMTP enabled: {bool(enabled)}")
        
        print("\n" + "="*60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nNew Features Available:")
        print("  • Decision locking prevents changes after final approval/rejection")
        print("  • Email notifications can be sent to applicants")
        print("  • Settings page allows configuring email mode (auto/manual)")
        print("  • SMTP settings stored in RiskPolicy table")
        print("\nNext Steps:")
        print("  1. Configure SMTP credentials in .env file")
        print("  2. Update Settings page to configure email notification mode")
        print("  3. Test decision locking flow in application detail page")
        print("  4. Test email sending (manual and auto modes)")
        print("="*60)


if __name__ == "__main__":
    migrate()
