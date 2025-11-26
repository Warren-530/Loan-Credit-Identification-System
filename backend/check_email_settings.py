from database import SessionLocal
from models import RiskPolicy

db = SessionLocal()
policy = db.query(RiskPolicy).first()

if policy:
    print(f"Email Notification Mode: {policy.email_notification_mode}")
    print(f"SMTP Enabled: {policy.smtp_enabled}")
else:
    print("No policy found in database")

db.close()
