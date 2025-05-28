import subprocess
import sys
import os
import webbrowser
import json
import re
import time
import threading

server_proc = None

def run_account_friend_layer():
    print("Chạy account_friend_layer.py...")
    # Cho phép nhập uid/username
    username = input("Nhập uid hoặc username: ").strip()
    if not username:
        print("Không được để trống uid/username!")
        return
    
    # Chạy main.py với tham số như khi chạy thủ công
    process = subprocess.Popen(
        ["python", "main.py", "friend-layer-crawler", username],
        cwd="crawl/metaspy",
        shell=True
    )
    # Đợi process hoàn thành
    process.wait()

def run_crawl_profile_data():
    print("Chạy crawl_profile_data.py...")
    # Chạy script crawl_profile_data
    process = subprocess.Popen(
        ["python", "-m", "src.facebook.account.crawl_profile_data"],
        cwd="crawl/metaspy",
        shell=True
    )
    # Đợi process hoàn thành
    process.wait()

def run_api_scripts():
    api_dir = "API"
    scripts = [f for f in os.listdir(api_dir) if f.endswith('.py')]
    print("Chọn script API để chạy:")
    for idx, script in enumerate(scripts, 1):
        print(f"{idx}. {script}")
    choice = int(input("Nhập số: "))
    script_path = os.path.join(api_dir, scripts[choice-1])
    
    # Lưu thư mục hiện tại
    current_dir = os.getcwd()
    try:
        # Chuyển vào thư mục API
        os.chdir(api_dir)
        # Chạy script trong thư mục API
        subprocess.run([sys.executable, scripts[choice-1]])
    finally:
        # Quay lại thư mục ban đầu
        os.chdir(current_dir)

def run_network_html():
    # Lấy danh sách thư mục friends_data_*
    dirs = [d for d in os.listdir('crawl/metaspy') if d.startswith('friends_data_')]
    if not dirs:
        print("Không tìm thấy thư mục friends_data_*")
        return
    print("Chọn thư mục dữ liệu:")
    for idx, d in enumerate(dirs, 1):
        print(f"{idx}. {d}")
    d_idx = int(input("Chọn số: ")) - 1
    data_dir = os.path.join('crawl/metaspy', dirs[d_idx])
    files = [f for f in os.listdir(data_dir) if f.endswith('.json')]
    if not files:
        print("Không có file JSON trong thư mục này!")
        return
    print("Chọn file JSON:")
    for idx, f in enumerate(files, 1):
        print(f"{idx}. {f}")
    f_idx = int(input("Chọn số: ")) - 1
    json_path = os.path.join(data_dir, files[f_idx])

    # Đọc dữ liệu JSON gốc
    with open(json_path, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    # CHUẨN HÓA DỮ LIỆU
    if isinstance(raw_data, dict):
        if 'tree_data' in raw_data:
            tree_data = raw_data['tree_data']
        else:
            tree_data = raw_data
    else:
        tree_data = raw_data

    # Tạo dữ liệu chuẩn
    normalized_data = {
        'root_user': tree_data.get('id', ''),
        'max_layers': 2,  # hoặc lấy từ file nếu có
        'friends_per_layer': 3,  # hoặc lấy từ file nếu có
        'crawled_at': '',
        'total_accounts': 0,
        'tree_data': tree_data
    }

    # Ghi đè file data.js với định dạng chuẩn
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write('const jsonData = ')
        json.dump(normalized_data, f, ensure_ascii=False, indent=2)
        f.write(';')

    print(f'Đã ghi đè data.js từ {json_path}')
    webbrowser.open('file://' + os.path.abspath('network.html'))

def run_npm_serve():
    global server_proc
    map_dir = os.path.join(os.getcwd(), 'tsx hometown', 'map')
    if not os.path.isdir(map_dir):
        print(f"Không tìm thấy thư mục: {map_dir}")
        return
    print(f"Chuyển vào thư mục: {map_dir} và chạy npx serve dist...")

    # Chạy server tĩnh trong process con
    server_proc = subprocess.Popen(
        ["npx", "serve", "dist", "-l", "5000"],
        cwd=map_dir,
        shell=True
    )

    time.sleep(2)
    webbrowser.open("http://localhost:5000")
    print("Đã chạy server và mở trình duyệt tại http://localhost:5000")
    print("Nhấn Ctrl+C để dừng server và quay lại menu.")
    
    try:
        while True:
            if server_proc.poll() is not None:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nĐã nhận Ctrl+C! Đang dừng server và khởi động lại...")
        if server_proc:
            server_proc.terminate()
            try:
                server_proc.wait(timeout=3)
            except:
                server_proc.kill()
        server_proc = None
        # Khởi động lại chương trình
        subprocess.run([sys.executable, __file__])
        sys.exit(0)

def stop_npm_serve(silent=False):
    global server_proc
    if server_proc and server_proc.poll() is None:
        if not silent:
            print("Đang dừng server...")
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except:
            server_proc.kill()
        if not silent:
            print("Đã dừng server.")
        server_proc = None
    elif not silent:
        print("Không có server nào đang chạy.")

def main():
    while True:
        print("\n==== OSINT TOOL ====")
        print("1. Crawl danh sách bạn bè")
        print("2. Crawl thông tin cá nhân từng người từ data")
        print("3. OSINT bằng API")
        print("4. Sinh sơ đồ mạng (network.html)")
        print("5. Thống kê tỉnh thành từ dữ liệu")
        print("0. Thoát")
        try:
            choice = input("Chọn chức năng: ")
        except KeyboardInterrupt:
            print("\nĐang thoát tool...")
            stop_npm_serve(silent=True)
            sys.exit(0)
        if choice == "1":
            run_account_friend_layer()
        elif choice == "2":
            run_crawl_profile_data()
        elif choice == "3":
            run_api_scripts()
        elif choice == "4":
            run_network_html()
        elif choice == "5":
            run_npm_serve()
        elif choice == "0":
            print("\nĐang thoát tool...")
            stop_npm_serve(silent=True)
            break
        else:
            print("Lựa chọn không hợp lệ!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nĐang thoát tool...")
        stop_npm_serve(silent=True)
        sys.exit(0) 