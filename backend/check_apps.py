from database import get_session
from models import Application

with get_session() as session:
    apps = session.query(Application).all()
    print(f'Found {len(apps)} applications')
    for app in apps[-5:]:
        print(f'ID: {app.id}, Status: {app.status}, Name: {app.applicant_name}, Type: {app.loan_type}')