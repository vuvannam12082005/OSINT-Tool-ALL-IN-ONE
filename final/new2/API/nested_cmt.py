import requests
import json
import http.client
import os
from datetime import datetime

# Cấu hình API
API_KEY = "e8d3149b81mshcf22e53e1ed5dddp1c125cjsna542e41b57e0"
API_HOST = "facebook-scraper3.p.rapidapi.com"
BASE_URL = "https://facebook-scraper3.p.rapidapi.com"

headers = {
    "X-RapidAPI-Key": API_KEY,
    "X-RapidAPI-Host": API_HOST
}

# Hàm lấy nested comment của một comment
def get_nested_comments(post_id, comment_id, expansion_token):
    url = f"{BASE_URL}/post/comments_nested"
    params = {
        "post_id": post_id,  # Dạng số
        "comment_id": comment_id,  # Dạng số (legacy_comment_id)
        "expansion_token": expansion_token
    }
    response = requests.get(url, headers=headers, params=params)
    return response

# Hàm in thông tin chi tiết của nested comment
def print_nested_comment_details(nested_comment_data):
    print("=== Danh sách nested comment ===")
    for comment in nested_comment_data.get("results", []):
        comment_id = comment.get("legacy_comment_id", "Không có ID")
        comment_text = comment.get("message", "Không có nội dung")
        reactions_count = comment.get("reactions_count", "0")
        depth = comment.get("depth", 0)
        author = comment.get("author", {})
        author_name = author.get("name", "Không có tác giả")
        print(f"\nNested Comment ID: {comment_id}")
        print(f"Độ sâu (Depth): {depth}")
        print(f"Tác giả: {author_name}")
        print(f"Nội dung: {comment_text}")
        print(f"Số lượng tương tác: {reactions_count}")

def save_data(data, subfolder, tool_name):
    base_dir = os.path.join(os.path.dirname(__file__), "data", subfolder)
    os.makedirs(base_dir, exist_ok=True)
    now = datetime.now()
    time_str = now.strftime("%Hh_%M_%d_%m_%Y")
    filename = f"{tool_name}_{time_str}.json"
    file_path = os.path.join(base_dir, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Đã lưu dữ liệu vào {file_path}")

# Thực thi
if __name__ == "__main__":
    print("=== Tool Lấy Nested Comment ===")
    
    # Nhập 3 tham số bắt buộc
    post_id = input("Nhập Post ID (dạng số, ví dụ: 2159964654418794): ").strip()
    if not post_id:
        print("Post ID là bắt buộc! Dừng chương trình.")
        exit()

    comment_id = input("Nhập Comment ID (dạng số, ví dụ: 1408532983485285): ").strip()
    if not comment_id:
        print("Comment ID là bắt buộc! Dừng chương trình.")
        exit()

    expansion_token = input("Nhập Expansion Token (lấy từ /post/comments): ").strip()
    if not expansion_token:
        print("Expansion Token là bắt buộc! Dừng chương trình.")
        exit()

    # Gọi API để lấy nested comment
    response = get_nested_comments(post_id, comment_id, expansion_token)
    print(f"API Status Code: {response.status_code}")
    print(f"API Response: {response.text}")

    nested_comment_data = response.json()
    if "results" in nested_comment_data:
        save_data(nested_comment_data, "nested_cmt", "nested_cmt")
        # In thông tin nested comment
        print_nested_comment_details(nested_comment_data)
    else:
        print("Không thể lấy danh sách nested comment. Kiểm tra lại post_id, comment_id, expansion_token, hoặc API response.")