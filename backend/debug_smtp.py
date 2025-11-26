import os
from dotenv import load_dotenv
from database import get_session
from models import RiskPolicy

# Load .env
load_dotenv()

print("=== Environment Variables ===")
print(f"SMTP_HOST: {os.getenv('SMTP_HOST')}")
print(f"SMTP_PORT: {os.getenv('SMTP_PORT')}")
print(f"SMTP_USERNAME: {os.getenv('SMTP_USERNAME')}")
print(f"SMTP_PASSWORD: {'***' if os.getenv('SMTP_PASSWORD') else 'NOT SET'}")
print(f"SMTP_FROM_EMAIL: {os.getenv('SMTP_FROM_EMAIL')}")

print("\n=== Database Settings ===")
with get_session() as db:
    policy = db.query(RiskPolicy).first()
    
    if policy:
        print(f"email_notification_mode: {policy.email_notification_mode}")
        print(f"smtp_enabled: {policy.smtp_enabled}")
        print(f"smtp_host: {policy.smtp_host}")
        print(f"smtp_port: {policy.smtp_port}")
        print(f"smtp_username: {policy.smtp_username}")
        print(f"smtp_from_email: {policy.smtp_from_email}")
    else:
        print("No policy found in database")

print("\n=== Test SMTP Config Load ===")
from email_service import EmailService
email_svc = EmailService()
with get_session() as db2:
    config = email_svc._load_smtp_config(db2)
    print(f"Loaded config:")
    print(f"  host: {config[0]}")
    print(f"  port: {config[1]}")
    print(f"  username: {config[2]}")
    print(f"  password: {'***' if config[3] else 'NOT SET'}")
    print(f"  from_email: {config[4]}")
    print(f"  from_name: {config[5]}")

