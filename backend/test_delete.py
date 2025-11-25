import requests

url = "http://localhost:8000/api/application/APP-20251125230138"
print(f"Testing DELETE: {url}")

try:
    response = requests.delete(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
