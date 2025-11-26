"""Test advanced analytics data generation"""
from database import get_session
from models import Application, ApplicationStatus, ReviewStatus

with get_session() as session:
    apps = session.query(Application).all()
    
    print(f"Total Applications: {len(apps)}")
    
    # Test Financial Scatter Data
    scatter_count = 0
    for a in apps:
        if a.analysis_result and "financial_metrics" in a.analysis_result:
            metrics = a.analysis_result["financial_metrics"]
            
            # Extract income (handle nested structure)
            income = 0
            if "net_disposable_income" in metrics:
                ndi = metrics["net_disposable_income"]
                income = ndi.get("calculation", {}).get("net_income", 0)
            
            # Extract DSR (handle nested structure)
            dsr = 0
            if "debt_service_ratio" in metrics:
                dsr_data = metrics["debt_service_ratio"]
                dsr = dsr_data.get("value", 0)
            
            if income > 0 and dsr > 0:
                scatter_count += 1
    
    print(f"\n✅ Financial Scatter Points: {scatter_count}")
    
    # Test Income Brackets
    income_brackets = {
        "Low (< RM 3000)": {"approved": 0, "total": 0},
        "Mid (RM 3000-6000)": {"approved": 0, "total": 0},
        "High (> RM 6000)": {"approved": 0, "total": 0}
    }
    
    for a in apps:
        if a.analysis_result and "financial_metrics" in a.analysis_result:
            metrics = a.analysis_result["financial_metrics"]
            
            # Extract income
            income = 0
            if "net_disposable_income" in metrics:
                ndi = metrics["net_disposable_income"]
                income = ndi.get("calculation", {}).get("net_income", 0)
            
            if income > 0:
                if income < 3000:
                    bracket = "Low (< RM 3000)"
                elif income <= 6000:
                    bracket = "Mid (RM 3000-6000)"
                else:
                    bracket = "High (> RM 6000)"
                
                income_brackets[bracket]["total"] += 1
                if a.final_decision == "Approved":
                    income_brackets[bracket]["approved"] += 1
    
    print("\n✅ Approval by Income Bracket:")
    for bracket, data in income_brackets.items():
        if data["total"] > 0:
            rate = (data["approved"] / data["total"] * 100)
            print(f"  {bracket}: {rate:.1f}% ({data['approved']}/{data['total']})")
    
    # Test Override Reasons
    override_count = len([a for a in apps if a.review_status == ReviewStatus.MANUAL_OVERRIDE])
    print(f"\n✅ Manual Overrides: {override_count}")
    
    print("\n✅ Advanced analytics data generation successful!")
