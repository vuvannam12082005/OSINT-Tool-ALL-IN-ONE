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

# Hàm tạo URL đầy đủ từ username hoặc UID
def create_profile_url(input_str):
    return f"https://www.facebook.com/{input_str}/"

# Hàm lấy thông tin chi tiết của profile
def get_profile_details(profile_url):
    url = f"{BASE_URL}/profile/details_url"
    params = {"url": profile_url}
    response = requests.get(url, headers=headers, params=params)
    return response

# Hàm in thông tin chi tiết của profile
def print_profile_details(profile_data):
    print("=== Thông tin profile ===")
    profile = profile_data.get("profile", {})
    
    # Kiểm tra trường hợp profile private
    if profile.get("type") == "private_profile":
        print("Profile này là private, không có thông tin chi tiết để hiển thị.")
        return

    name = profile.get("name", "Không có tên")
    profile_id = profile.get("profile_id", "Không có ID")
    url = profile.get("url", "Không có URL")
    image = profile.get("image", "Không có ảnh đại diện")
    intro = profile.get("intro", "Không có giới thiệu")
    cover_image = profile.get("cover_image", "Không có ảnh bìa")
    gender = profile.get("gender", "Không xác định")
    about = profile.get("about", {})

    print(f"Tên: {name}")
    print(f"Profile ID: {profile_id}")
    print(f"URL: {url}")
    print(f"Ảnh đại diện: {image}")
    print(f"Giới thiệu: {intro}")
    print(f"Ảnh bìa: {cover_image}")
    print(f"Giới tính: {gender}")
    print("\nThông tin bổ sung:")

    # Xử lý trường about linh hoạt
    if isinstance(about, dict):
        for key, value in about.items():
            if isinstance(value, dict):
                text = value.get("text", "Không có thông tin")
            elif isinstance(value, str):
                text = value
            else:
                text = "Không có thông tin"
            print(f"- {text}")
    elif isinstance(about, list):
        if not about:
            print("- Không có thông tin bổ sung.")
        else:
            for item in about:
                if isinstance(item, dict):
                    text = item.get("text", "Không có thông tin")
                    print(f"- {text}")
                else:
                    print(f"- {item}")
    else:
        print("- Không có thông tin bổ sung.")

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
    print("=== Tool Lấy Thông Tin Profile ===")
    
    # Nhập username hoặc UID
    input_str = input("Nhập Username hoặc UID (ví dụ: sonnopro123 hoặc 100012158418273): ").strip()
    if not input_str:
        print("Username hoặc UID là bắt buộc! Dừng chương trình.")
        exit()

    # Tạo URL đầy đủ
    profile_url = create_profile_url(input_str)
    print(f"Profile URL: {profile_url}")

    # Gọi API để lấy thông tin profile
    response = get_profile_details(profile_url)
    print(f"API Status Code: {response.status_code}")
    print(f"API Response: {response.text}")

    profile_data = response.json()
    if "profile" in profile_data:
        save_data(profile_data, "profile_details", "profile_details")
        # In thông tin profile
        print_profile_details(profile_data)
    else:
        print("Không thể lấy thông tin profile. Kiểm tra lại username/UID hoặc API response.")