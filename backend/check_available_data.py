"""Check what data we actually have for better charts"""
from database import get_session
from models import Application, ApplicationStatus
import json

with get_session() as session:
    apps = session.query(Application).all()
    
    print(f"Total Applications: {len(apps)}\n")
    
    # Check what we can use for time-based trends
    print("=== TIME-BASED DATA ===")
    dates = [a.created_at.strftime("%Y-%m-%d") for a in apps if a.created_at]
    print(f"Date range: {min(dates)} to {max(dates)}")
    print(f"Applications by date:")
    from collections import Counter
    date_counts = Counter(dates)
    for date, count in sorted(date_counts.items())[-5:]:
        print(f"  {date}: {count} apps")
    
    # Check risk levels
    print("\n=== RISK LEVEL DISTRIBUTION ===")
    risk_levels = [a.risk_level.value if a.risk_level else "Unknown" for a in apps]
    risk_counts = Counter(risk_levels)
    for level, count in risk_counts.items():
        print(f"  {level}: {count}")
    
    # Check decision history
    print("\n=== DECISION HISTORY ===")
    has_history = len([a for a in apps if a.decision_history and len(a.decision_history) > 0])
    print(f"Apps with decision history: {has_history}")
    
    # Check review status
    print("\n=== REVIEW STATUS ===")
    review_statuses = [a.review_status.value if a.review_status else "Unknown" for a in apps]
    review_counts = Counter(review_statuses)
    for status, count in review_counts.items():
        print(f"  {status}: {count}")
    
    # Check processing times
    print("\n=== PROCESSING TIMES ===")
    times = [a.processing_time for a in apps if a.processing_time]
    if times:
        print(f"  Min: {min(times):.1f}s")
        print(f"  Max: {max(times):.1f}s")
        print(f"  Avg: {sum(times)/len(times):.1f}s")
    
    # Check key risk flags
    print("\n=== AVAILABLE RISK FLAGS ===")
    all_flags = []
    for a in apps:
        if a.analysis_result and "key_risk_flags" in a.analysis_result:
            all_flags.extend([f.get("flag", "Unknown") for f in a.analysis_result["key_risk_flags"]])
    flag_counts = Counter(all_flags)
    print(f"Total unique flags: {len(flag_counts)}")
    for flag, count in flag_counts.most_common(5):
        print(f"  {flag}: {count}")
