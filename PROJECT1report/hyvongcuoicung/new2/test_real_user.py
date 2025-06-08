#!/usr/bin/env python3
import requests
import json

def test_real_user():
    url = "http://localhost:5000/crawl-friend-list"
    test_data = {
        "username": "phuc.duy.980944",  # Username thật từ web
        "layers": "0", 
        "friends_per_layer": "1",
        "confirm": "y"
    }
    
    try:
        headers = {'Content-Type': 'application/json'}
        print("Sending request...")
        response = requests.post(url, json=test_data, headers=headers, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Raw Response Length: {len(response.text)}")
        
        # Kiểm tra response có phải JSON không
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                data = response.json()
                print("✓ Valid JSON!")
                print(f"Success: {data.get('success')}")
                print(f"Return code: {data.get('returncode')}")
                print(f"Stdout length: {len(data.get('stdout', ''))}")
                print(f"Stderr length: {len(data.get('stderr', ''))}")
                
                # In một phần stdout để debug
                stdout = data.get('stdout', '')
                if len(stdout) > 500:
                    print(f"Stdout preview: {stdout[:500]}...")
                else:
                    print(f"Stdout: {stdout}")
                    
            except json.JSONDecodeError as e:
                print(f"✗ JSON Decode Error: {e}")
                print(f"Raw response first 1000 chars: {response.text[:1000]}")
        else:
            print("✗ Response is not JSON!")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Raw response first 1000 chars: {response.text[:1000]}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {e}")

if __name__ == "__main__":
    test_real_user() 