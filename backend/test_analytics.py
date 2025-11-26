import requests
import json

# Test the analytics endpoint
response = requests.get("http://localhost:8000/api/analytics/summary")

if response.status_code == 200:
    data = response.json()
    print("✅ Analytics Endpoint Working!")
    print("\n📊 KPIs:")
    for key, value in data["kpi"].items():
        print(f"  {key}: {value}")
    
    print("\n📈 Loan Composition:")
    for item in data["charts"]["loan_composition"]:
        print(f"  {item['name']}: {item['value']}")
    
    print("\n📊 Status Breakdown:")
    for item in data["charts"]["status_breakdown"]:
        print(f"  {item['name']}: {item['count']}")
    
    print("\n✅ All data retrieved successfully!")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
