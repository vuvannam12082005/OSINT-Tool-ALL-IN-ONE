#!/usr/bin/env python3
"""
Test script để verify toàn bộ export flow với data thực tế
"""

import re
import requests
import json

# Data thực tế từ request
real_result = {
    "module": "info-crawl",
    "timestamp": "2025-06-04T04:43:33.380Z",
    "data": {
        "friends_dir": "friends_data_111704062025",
        "returncode": 0,
        "stderr": "",
        "stdout": """Bắt đầu quá trình khởi tạo...
Bắt đầu chương trình chính...
Bước 1: Tìm kiếm thư mục friends_data_*
Bước 2: Chọn thư mục để xử lý

Danh sách thư mục friends_data_* có sẵn:
1. friends_data_003603062025
2. friends_data_023604062025
3. friends_data_083624052025
4. friends_data_110904062025
5. friends_data_111404062025
6. friends_data_111604062025
7. friends_data_111704062025
8. friends_data_112304062025
9. friends_data_112804062025
10. friends_data_130825052025
11. friends_data_152426052025
12. friends_data_155528052025
13. friends_data_173325052025
14. friends_data_174226052025
15. friends_data_174226052025_1
16. friends_data_174226052025_1_1
17. friends_data_174226052025_2
18. friends_data_183626052025
19. friends_data_184626052025
20. friends_data_202302062025
21. friends_data_202402062025
22. friends_data_202502062025
23. friends_data_202802062025
24. friends_data_203702062025
25. friends_data_204002062025
26. friends_data_205102062025
27. friends_data_221023052025
28. friends_data_222402062025
29. friends_data_223102062025

Chọn số thứ tự thư mục (1-29): Đã chọn: friends_data_111704062025
...
✓ Đã hoàn thành crawl profile!
Bước 7: Lưu dữ liệu đã crawl

📦 Bắt đầu quá trình lưu dữ liệu

🌳 Bắt đầu cập nhật dữ liệu vào cây
✅ Đã cập nhật dữ liệu cho node: phuc.duy.980944
🔁 Cập nhật 1 node con
✅ Đã cập nhật dữ liệu cho node: vu.van.nam.oneforall147
🔁 Cập nhật 0 node con

💾 Đã lưu dữ liệu thành công vào 
friends_data_111704062025\\data_0_phuc.duy.980944.json
Chương trình đã hoàn thành!""",
        "success": True
    },
    "status": "success"
}

print("=== TEST FRONTEND EXPORT LOGIC ===")

# Test regex pattern như trong frontend
stdout = real_result["data"]["stdout"]
filePathMatch = re.search(r'💾 Đã lưu dữ liệu thành công vào\s+(.+\.json)', stdout)

if filePathMatch:
    filePath = filePathMatch.group(1).strip()
    print(f"✓ REGEX MATCH: '{filePath}'")
    
    # Test backend API
    print("\n=== TEST BACKEND API ===")
    
    check_url = f"http://localhost:5000/download-file?path={filePath}"
    print(f"Check URL: {check_url}")
    
    try:
        # Test HEAD request
        response = requests.head(check_url, timeout=10)
        print(f"HEAD Response: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Backend confirms file exists")
            
            # Test actual download
            download_response = requests.get(check_url, timeout=10)
            print(f"GET Response: {download_response.status_code}")
            
            if download_response.status_code == 200:
                print(f"✓ Download successful! Size: {len(download_response.content)} bytes")
                
                # Parse as JSON để verify
                try:
                    data = download_response.json()
                    print(f"✓ Valid JSON with keys: {list(data.keys())[:5]}")
                    if 'tree_data' in data:
                        tree_data = data['tree_data']
                        print(f"✓ Contains tree_data with ID: {tree_data.get('id', 'N/A')}")
                except:
                    print("! Content is not JSON (might be file download)")
                    
            else:
                print(f"✗ Download failed: {download_response.text}")
        else:
            print(f"✗ File check failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend - is it running on port 5000?")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        
else:
    print("✗ REGEX NO MATCH")
    print("Available patterns in stdout:")
    lines = stdout.split('\n')
    for line in lines:
        if 'lưu' in line.lower() or 'json' in line:
            print(f"  - {line}")

print("\n=== SUMMARY ===")
print("Para testar completamente:")
print("1. Inicie o backend: cd hyvongcuoicung/new2 && python api_server.py")
print("2. Execute este script novamente")
print("3. Se tudo funcionar, teste no frontend web") 