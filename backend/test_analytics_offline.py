"""Test analytics data generation without server"""
from database import get_session
from models import Application, ApplicationStatus, ReviewStatus

with get_session() as session:
    apps = session.query(Application).all()
    
    print(f"Total Applications: {len(apps)}")
    
    # Test Loan Type Extraction
    loan_types = {}
    for a in apps:
        l_type = "Unknown"
        if a.analysis_result and "applicant_profile" in a.analysis_result:
            l_type = a.analysis_result["applicant_profile"].get("loan_type", "Unknown")
        elif a.loan_type:
            l_type = a.loan_type.value if hasattr(a.loan_type, 'value') else str(a.loan_type)
        loan_types[l_type] = loan_types.get(l_type, 0) + 1
    
    print("\n✅ Loan Composition (Fixed):")
    for name, count in loan_types.items():
        print(f"  {name}: {count}")
    
    # Test Status Breakdown
    status_breakdown = {
        "Approved": len([a for a in apps if a.final_decision == "Approved"]),
        "Rejected": len([a for a in apps if a.final_decision == "Rejected"]),
        "Pending Review": len([a for a in apps if a.status == ApplicationStatus.REVIEW_REQUIRED]),
        "Processing": len([a for a in apps if a.status == ApplicationStatus.PROCESSING or a.status == ApplicationStatus.ANALYZING]),
    }
    
    print("\n✅ Status Breakdown (New Chart):")
    for name, count in status_breakdown.items():
        if count > 0:
            print(f"  {name}: {count}")
    
    print("\n✅ Analytics data generation successful!")
