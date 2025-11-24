from database import get_session
from models import Application

with get_session() as session:
    apps = session.query(Application).all()
    print(f"\n=== Total Applications: {len(apps)} ===\n")
    
    for app in apps:
        print(f"ID: {app.application_id}")
        print(f"Name: {app.applicant_name}")
        print(f"IC: {app.applicant_ic}")
        print(f"Loan Type: {app.loan_type}")
        print(f"Amount: {app.requested_amount}")
        print(f"Status: {app.status}")
        print(f"Risk Score: {app.risk_score}")
        print(f"Risk Level: {app.risk_level}")
        print(f"Final Decision: {app.final_decision}")
        print(f"AI Decision: {app.ai_decision}")
        print(f"Review Status: {app.review_status}")
        print(f"Bank Statement: {app.bank_statement_path}")
        print(f"Essay: {app.essay_path}")
        print(f"Analysis Result: {app.analysis_result}")
        print("-" * 80)
