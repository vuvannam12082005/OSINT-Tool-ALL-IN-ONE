#!/usr/bin/env python3
"""
Test script để verify export path logic
"""

import re
import os

# Simulate output từ module info-crawl
sample_output = """Bắt đầu quá trình khởi tạo...
Bắt đầu chương trình chính...
Bước 1: Tìm kiếm thư mục friends_data_*
...
...
💾 Đã lưu dữ liệu thành công vào 
friends_data_111704062025\\data_0_phuc.duy.980944.json
Chương trình đã hoàn thành!"""

print("=== TEST REGEX PATTERN ===")

# Test các pattern khác nhau
patterns = [
    r"Đã lưu dữ liệu thành công vào (.+\.json)",  # Pattern cũ
    r"Đã lưu dữ liệu thành công vào\s+(.+\.json)",  # Pattern mới
    r"💾 Đã lưu dữ liệu thành công vào\s+(.+\.json)",  # Với emoji
    r"💾 Đã lưu dữ liệu thành công vào\s*\n*(.+\.json)",  # Với newline explicit
]

for i, pattern in enumerate(patterns, 1):
    print(f"\nPattern {i}: {pattern}")
    match = re.search(pattern, sample_output)
    if match:
        print(f"✓ MATCH: '{match.group(1)}'")
    else:
        print("✗ NO MATCH")

print("\n=== TEST FILE PATH PROCESSING ===")

# Test file path từ kết quả match thành công
file_path = "friends_data_111704062025\\data_0_phuc.duy.980944.json"
print(f"Original path: {file_path}")

# Test logic backend xử lý path
print(f"Starts with friends_data_: {file_path.startswith('friends_data_')}")
has_backslash = '\\' in file_path
print(f"Contains backslash: {has_backslash}")
first_part = file_path.split('\\')[0] if '\\' in file_path else 'NO SPLIT'
print(f"First part: {first_part}")

# Simulate backend logic
if file_path.startswith('friends_data_'):
    processed_path = os.path.join('crawl', 'metaspy', file_path)
elif '\\' in file_path and file_path.split('\\')[0].startswith('friends_data_'):
    processed_path = os.path.join('crawl', 'metaspy', file_path)
else:
    processed_path = file_path

print(f"Processed path: {processed_path}")

# Check if file exists
full_path = os.path.join(os.getcwd(), processed_path.replace('\\', os.sep))
print(f"Full path: {full_path}")
print(f"File exists: {os.path.exists(full_path)}")

if os.path.exists(full_path):
    print(f"✓ File found! Size: {os.path.getsize(full_path)} bytes")
else:
    print("✗ File not found!")
    
    # List files in directory to debug
    dir_path = os.path.dirname(full_path)
    if os.path.exists(dir_path):
        print(f"Directory exists: {dir_path}")
        print("Files in directory:")
        for f in os.listdir(dir_path):
            print(f"  - {f}")
    else:
        print(f"Directory doesn't exist: {dir_path}") 