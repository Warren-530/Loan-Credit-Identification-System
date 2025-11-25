import requests
import time

BASE_URL = "http://localhost:8000"

def test_delete():
    print("Testing delete functionality...")
    
    # 1. Get all applications
    try:
        response = requests.get(f"{BASE_URL}/api/applications")
        if response.status_code != 200:
            print(f"Failed to get applications: {response.status_code}")
            return
        
        apps = response.json()
        print(f"Found {len(apps)} applications")
        
        if not apps:
            print("No applications to delete. Please upload one first.")
            return

        # 2. Pick the first one
        target_app = apps[0]
        app_id = target_app['id']
        print(f"Target application to delete: {app_id}")
        
        # 3. Delete it
        print(f"Sending DELETE request for {app_id}...")
        del_response = requests.delete(f"{BASE_URL}/api/application/{app_id}")
        print(f"Delete response status: {del_response.status_code}")
        print(f"Delete response body: {del_response.text}")
        
        if del_response.status_code == 200:
            print("Delete request successful.")
        else:
            print("Delete request failed.")
            return

        # 4. Verify it's gone
        print("Verifying deletion...")
        verify_response = requests.get(f"{BASE_URL}/api/applications")
        new_apps = verify_response.json()
        
        found = any(app['id'] == app_id for app in new_apps)
        if not found:
            print("✅ SUCCESS: Application was deleted.")
        else:
            print("❌ FAILURE: Application still exists in list.")
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_delete()
