"""Check actual financial metrics structure"""
from database import get_session
from models import Application
import json

with get_session() as session:
    apps = session.query(Application).limit(3).all()
    
    for a in apps:
        print(f"\n{'='*60}")
        print(f"App: {a.applicant_name}")
        if a.analysis_result and "financial_metrics" in a.analysis_result:
            print("Financial Metrics:")
            print(json.dumps(a.analysis_result["financial_metrics"], indent=2))
        else:
            print("No financial_metrics found")
            if a.analysis_result:
                print("Available keys:", list(a.analysis_result.keys()))
