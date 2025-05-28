import requests
import json
import http.client
import os
from datetime import datetime

# Cấu hình API
API_KEY = "e382d0f7aemshadc9522fd22005ep1f18e5jsn12dc29eeae7a"
API_HOST = "facebook-scraper3.p.rapidapi.com"
BASE_URL = "https://facebook-scraper3.p.rapidapi.com"

headers = {
    "X-RapidAPI-Key": API_KEY,
    "X-RapidAPI-Host": API_HOST
}

# Hàm kiểm tra và trích xuất post_id (pfbid...) từ URL nếu cần
def extract_post_info(input_str):
    if "facebook.com" in input_str:
        # Nếu là URL, trả về URL để gọi với post_url
        return {"post_url": input_str}
    else:
        # Nếu là pfbid..., trả về post_id
        return {"post_id": input_str}

# Hàm lấy thông tin chi tiết của bài post
def get_post_details(params):
    url = f"{BASE_URL}/post"
    response = requests.get(url, headers=headers, params=params)
    return response

# Hàm in thông tin chi tiết của bài post
def print_post_details(post_data):
    print("=== Thông tin bài post ===")
    post = post_data.get("results", {})
    post_id = post.get("post_id", "Không có ID")
    post_type = post.get("type", "Không xác định")
    url = post.get("url", "Không có URL")
    message = post.get("message", "Không có nội dung")
    timestamp = post.get("timestamp", None)
    comments_count = post.get("comments_count", 0)
    reactions_count = post.get("reactions_count", 0)
    reshare_count = post.get("reshare_count", 0)
    reactions = post.get("reactions", {})
    author = post.get("author", {})
    author_name = author.get("name", "Không có tác giả")
    image = post.get("image", "Không có ảnh")

    print(f"Post ID: {post_id}")
    print(f"Loại bài: {post_type}")
    print(f"URL: {url}")
    print(f"Nội dung: {message}")
    print(f"Thời gian đăng: {timestamp if timestamp else 'Không có thời gian'}")
    print(f"Số lượng comment: {comments_count}")
    print(f"Số lượng tương tác: {reactions_count}")
    print(f"Chi tiết tương tác: {reactions}")
    print(f"Số lượng chia sẻ: {reshare_count}")
    print(f"Tác giả: {author_name}")
    print(f"Link ảnh: {image}")

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
    print("=== Tool Lấy Thông Tin Bài Post ===")
    
    # Nhập post_id hoặc URL
    input_str = input("Nhập Post ID (pfbid...) hoặc URL bài viết: ").strip()
    if not input_str:
        print("Post ID hoặc URL là bắt buộc! Dừng chương trình.")
        exit()

    # Xác định tham số để gọi API
    params = extract_post_info(input_str)
    if "post_id" in params:
        print(f"Post ID: {params['post_id']}")
    else:
        print(f"Post URL: {params['post_url']}")

    # Gọi API để lấy thông tin bài post
    response = get_post_details(params)
    print(f"API Status Code: {response.status_code}")
    print(f"API Response: {response.text}")

    post_data = response.json()
    if "results" in post_data:
        save_data(post_data, "post_details", "post_details")
        # In thông tin bài post
        print_post_details(post_data)
    else:
        print("Không thể lấy thông tin bài post. Kiểm tra lại post_id hoặc URL, hoặc API response.")