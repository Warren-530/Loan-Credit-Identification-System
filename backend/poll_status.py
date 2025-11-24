import time, requests, sys

app_id = sys.argv[1] if len(sys.argv) > 1 else None
if not app_id:
    print('Usage: python poll_status.py <APPLICATION_ID>'); sys.exit(1)

url = f'http://localhost:8000/api/status/{app_id}'
for i in range(30):  # up to ~60s (2s interval)
    r = requests.get(url)
    if r.status_code != 200:
        print('Status error', r.status_code, r.text); time.sleep(2); continue
    data = r.json()
    print(f"[{i}] status={data.get('status')} score={data.get('risk_score')} decision={data.get('final_decision')} risk={data.get('risk_level')} review={data.get('review_status')}")
    if data.get('status') not in ('Processing','Analyzing'):
        print('Done.'); break
    time.sleep(2)
else:
    print('Timeout waiting for completion.')
