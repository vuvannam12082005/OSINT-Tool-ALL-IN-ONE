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

# Hàm lấy comment của một post
def get_comments(post_id=None, cursor=None):
    url = f"{BASE_URL}/post/comments"
    params = {}
    if post_id:
        params["post_id"] = post_id
    if cursor:
        params["cursor"] = cursor
    response = requests.get(url, headers=headers, params=params)
    return response

# Hàm in thông tin chi tiết của comment
def print_comment_details(comment_data):
    print("=== Danh sách comment ===")
    for comment in comment_data.get("results", []):
        # Sử dụng legacy_comment_id thay vì comment_id để hiển thị
        comment_id = comment.get("legacy_comment_id", "Không có ID")
        comment_text = comment.get("message", "Không có nội dung")
        reactions_count = comment.get("reactions_count", "0")
        author = comment.get("author", {})
        author_name = author.get("name", "Không có tác giả")
        print(f"\nComment ID: {comment_id}")
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
    print("=== Tool Lấy Comment ===")
    choice = input("Bạn muốn lấy comment bằng (1) Post ID (pfbid...) hay (2) Cursor? Nhập 1 hoặc 2: ").strip()
    
    if choice == "1":
        post_id = input("Nhập Post ID (pfbid..., ví dụ: pfbid02HXLE9XfxtxdVnj9mg25WpUmtR3Kc1rgFNVuvM39rtafB3nZvgySgPkgF6qcTXvLGl): ").strip()
        response = get_comments(post_id=post_id)
    elif choice == "2":
        cursor = input("Nhập Cursor (lấy từ kết quả của /profile/posts hoặc /post/comments): ").strip()
        response = get_comments(cursor=cursor)
    else:
        print("Lựa chọn không hợp lệ! Dừng chương trình.")
        exit()

    print(f"API Status Code: {response.status_code}")
    print(f"API Response: {response.text}")

    comment_data = response.json()
    if "results" in comment_data:
        save_data(comment_data, "cmt", "cmt")
        # In thông tin comment
        print_comment_details(comment_data)
    else:
        print("Không thể lấy danh sách comment. Kiểm tra lại post_id, cursor, hoặc API response.")