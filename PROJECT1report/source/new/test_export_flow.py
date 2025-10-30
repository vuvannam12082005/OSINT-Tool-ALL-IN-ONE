#!/usr/bin/env python3
"""
Test script để kiểm tra toàn bộ quy trình export file
"""
import requests
import json
import re

def test_export_flow():
    print("=== Testing Export Flow ===")
    
    # 1. Test crawl với test_user
    print("\n1. Testing crawl with test_user...")
    crawl_url = "http://localhost:5000/crawl-friend-list"
    test_data = {
        "username": "test_user",
        "layers": "0", 
        "friends_per_layer": "1",
        "confirm": "y"
    }
    
    response = requests.post(crawl_url, json=test_data)
    if response.status_code == 200:
        print("✓ Crawl test_user: OK")
    else:
        print(f"✗ Crawl test_user failed: {response.status_code}")
        return
    
    # 2. Test với real user
    print("\n2. Testing crawl with real user...")
    real_data = {
        "username": "phuc.duy.980944",
        "layers": "0", 
        "friends_per_layer": "1",
        "confirm": "y"
    }
    
    response = requests.post(crawl_url, json=real_data, timeout=60)
    if response.status_code == 200:
        result = response.json()
        print("✓ Crawl real user: OK")
        
        # Parse output để tìm file path
        stdout = result.get('stdout', '')
        file_match = re.search(r'Dữ liệu đã được lưu tại: (.+\.json)', stdout)
        
        if file_match:
            file_path = file_match.group(1).strip()
            print(f"✓ Found file path: {file_path}")
            
            # 3. Test HEAD request
            print("\n3. Testing file existence check...")
            check_url = f"http://localhost:5000/download-file?path={file_path}"
            head_response = requests.head(check_url)
            
            if head_response.status_code == 200:
                print("✓ File exists: OK")
                
                # 4. Test actual download
                print("\n4. Testing file download...")
                download_response = requests.get(check_url)
                
                if download_response.status_code == 200:
                    print("✓ File download: OK")
                    print(f"File size: {len(download_response.content)} bytes")
                    
                    # Parse JSON content
                    try:
                        file_data = download_response.json()
                        print("✓ Valid JSON content")
                        print(f"Root user: {file_data.get('root_user')}")
                        print(f"Total accounts: {file_data.get('total_accounts')}")
                        print(f"Crawled at: {file_data.get('crawled_at')}")
                        
                        return True
                        
                    except json.JSONDecodeError:
                        print("✗ Invalid JSON content")
                        
                else:
                    print(f"✗ File download failed: {download_response.status_code}")
                    print(f"Response: {download_response.text}")
                    
            else:
                print(f"✗ File not found: {head_response.status_code}")
                print(f"Response: {head_response.text}")
                
        else:
            print("✗ Could not find file path in output")
            
    else:
        print(f"✗ Crawl real user failed: {response.status_code}")
        print(f"Response: {response.text}")
    
    return False

def test_existing_files():
    """Test với file đã tồn tại"""
    print("\n=== Testing Existing Files ===")
    
    # List thư mục friends_data
    list_url = "http://localhost:5000/list-friends-data"
    response = requests.get(list_url)
    
    if response.status_code == 200:
        data = response.json()
        friends_data = data.get('data', {})
        
        if friends_data:
            for dir_name, files in friends_data.items():
                if files:
                    for file_name in files[:1]:  # Test first file only
                        file_path = f"{dir_name}\\{file_name}"
                        print(f"\nTesting existing file: {file_path}")
                        
                        # Test download
                        check_url = f"http://localhost:5000/download-file?path={file_path}"
                        download_response = requests.get(check_url)
                        
                        if download_response.status_code == 200:
                            print("✓ Existing file download: OK")
                            print(f"File size: {len(download_response.content)} bytes")
                            return True
                        else:
                            print(f"✗ Existing file download failed: {download_response.status_code}")
                            
        else:
            print("No existing friends_data found")
    else:
        print(f"✗ List friends data failed: {response.status_code}")
    
    return False

if __name__ == "__main__":
    print("Backend Export Flow Tester")
    print("=" * 40)
    
    # Test với file có sẵn trước
    existing_ok = test_existing_files()
    
    # Test full flow
    full_ok = test_export_flow()
    
    print("\n" + "=" * 40)
    print("SUMMARY:")
    print(f"Existing files test: {'✓ PASS' if existing_ok else '✗ FAIL'}")
    print(f"Full flow test: {'✓ PASS' if full_ok else '✗ FAIL'}")
    
    if existing_ok or full_ok:
        print("\n🎉 Export functionality is working!")
        print("Web interface export should work correctly.")
    else:
        print("\n⚠️  Export functionality has issues.")
        print("Check backend logs and file paths.") 