from database import get_session
from models import Application

with get_session() as session:
    apps = session.query(Application).limit(5).all()
    for a in apps:
        loan_type_db = a.loan_type
        loan_type_analysis = a.analysis_result.get("applicant_profile", {}).get("loan_type") if a.analysis_result else None
        print(f"App: {a.applicant_name}")
        print(f"  DB LoanType: {loan_type_db}")
        print(f"  Analysis LoanType: {loan_type_analysis}")
        print(f"  Has analysis_result: {bool(a.analysis_result)}")
        print("---")
