#!/usr/bin/env python3
import requests
import json

def test_crawl_endpoint():
    url = "http://localhost:5000/crawl-friend-list"
    test_data = {
        "username": "test_user",
        "layers": "0", 
        "friends_per_layer": "1",
        "confirm": "y"
    }
    
    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, json=test_data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Success!")
            print(f"Stdout: {data.get('stdout', 'N/A')}")
            print(f"Stderr: {data.get('stderr', 'N/A')}")
        else:
            print("✗ Failed!")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_crawl_endpoint() 