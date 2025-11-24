from database import get_session
from models import Application

try:
    with get_session() as session:
        applications = session.query(Application).all()
        print(f"Found {len(applications)} applications")
        for app in applications:
            print(f"  - {app.applicant_name}: {app.loan_type}")
except Exception as e:
    print(f"Error: {e}")