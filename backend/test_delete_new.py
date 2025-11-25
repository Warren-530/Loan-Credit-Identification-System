import requests
import json

# 测试删除功能
BASE_URL = "http://localhost:8000"

# 获取所有应用
print("获取所有应用...")
response = requests.get(f"{BASE_URL}/api/applications")
print(f"状态码: {response.status_code}")

if response.status_code == 200:
    apps = response.json()
    print(f"总共有 {len(apps)} 个应用")
    
    if apps:
        # 选择第一个应用进行测试
        test_app = apps[0]
        app_id = test_app.get('id') or test_app.get('application_id')
        print(f"\n测试删除应用: {app_id}")
        print(f"应用名称: {test_app.get('applicant_name', test_app.get('name', 'Unknown'))}")
        
        # 尝试删除
        print(f"\n发送删除请求到: {BASE_URL}/api/application/{app_id}")
        delete_response = requests.delete(f"{BASE_URL}/api/application/{app_id}")
        
        print(f"删除响应状态码: {delete_response.status_code}")
        print(f"删除响应内容: {delete_response.text}")
        
        if delete_response.status_code == 200:
            print("✓ 删除成功!")
            
            # 验证删除
            print("\n验证删除...")
            verify_response = requests.get(f"{BASE_URL}/api/applications")
            if verify_response.status_code == 200:
                new_apps = verify_response.json()
                print(f"删除后剩余应用数量: {len(new_apps)}")
        else:
            print(f"✗ 删除失败!")
            print(f"错误信息: {delete_response.text}")
    else:
        print("数据库中没有应用")
else:
    print(f"获取应用失败: {response.text}")
