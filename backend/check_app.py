from database import get_session
from models import Application
from sqlmodel import select

with get_session() as session:
    statement = select(Application)
    apps = session.exec(statement).all()
    for app in apps:
        print(f"ID: {app.application_id}")
        print(f"Status: {app.status}")
        print(f"Score: {app.risk_score}")
        print(f"Decision: {app.final_decision}")
        print(f"Risk Level: {app.risk_level}")
        print("---")
