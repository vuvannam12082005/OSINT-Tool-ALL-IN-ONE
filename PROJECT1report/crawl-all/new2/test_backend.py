#!/usr/bin/env python3
"""
OSINT Tool Backend Test Script
Tự động kiểm tra và chẩn đoán vấn đề backend
"""
import subprocess
import sys
import os
import time
import socket
import threading
import requests
from datetime import datetime

class BackendTester:
    def __init__(self):
        self.results = []
        self.flask_process = None
        self.test_port = 5000
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        symbols = {"PASS": "✓", "FAIL": "✗", "INFO": "ℹ", "WARN": "⚠"}
        symbol = symbols.get(status, "•")
        log_message = f"[{timestamp}] {symbol} {message}"
        print(log_message)
        self.results.append((status, message))
        
    def check_python_version(self):
        """Kiểm tra Python version"""
        version = sys.version_info
        if version.major >= 3 and version.minor >= 7:
            self.log(f"Python {version.major}.{version.minor}.{version.micro} - OK", "PASS")
            return True
        else:
            self.log(f"Python {version.major}.{version.minor}.{version.micro} - Cần Python 3.7+", "FAIL")
            return False
            
    def check_flask_installation(self):
        """Kiểm tra Flask có được cài đặt không"""
        try:
            import flask
            self.log(f"Flask {flask.__version__} - Đã cài đặt", "PASS")
            return True
        except ImportError:
            self.log("Flask chưa được cài đặt", "FAIL")
            return False
            
    def check_flask_cors(self):
        """Kiểm tra Flask-CORS"""
        try:
            import flask_cors
            self.log("Flask-CORS - Đã cài đặt", "PASS")
            return True
        except ImportError:
            self.log("Flask-CORS chưa được cài đặt", "FAIL")
            return False
            
    def install_dependencies(self):
        """Cài đặt dependencies"""
        self.log("Đang cài đặt Flask và Flask-CORS...", "INFO")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 
                'flask==2.3.3', 'flask-cors==4.0.0', 'requests'
            ], capture_output=True)
            self.log("Dependencies đã được cài đặt thành công", "PASS")
            return True
        except subprocess.CalledProcessError as e:
            self.log(f"Lỗi cài đặt dependencies: {e}", "FAIL")
            return False
            
    def check_files_exist(self):
        """Kiểm tra file cần thiết"""
        files_to_check = [
            'api_server.py',
            'crawl/metaspy/main.py',
            'crawl/metaspy'
        ]
        
        all_exist = True
        for file_path in files_to_check:
            if os.path.exists(file_path):
                self.log(f"File/Folder tồn tại: {file_path}", "PASS")
            else:
                self.log(f"File/Folder KHÔNG tồn tại: {file_path}", "FAIL")
                all_exist = False
                
        return all_exist
        
    def check_port_available(self):
        """Kiểm tra port có sẵn không"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(('localhost', self.test_port))
            sock.close()
            self.log(f"Port {self.test_port} sẵn sàng", "PASS")
            return True
        except OSError:
            self.log(f"Port {self.test_port} đã bị chiếm", "FAIL")
            return False
            
    def start_flask_server(self):
        """Khởi động Flask server"""
        self.log("Đang khởi động Flask server...", "INFO")
        try:
            self.flask_process = subprocess.Popen(
                [sys.executable, 'api_server.py'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            # Đợi server khởi động
            time.sleep(3)
            
            if self.flask_process.poll() is None:
                self.log("Flask server đã khởi động", "PASS")
                return True
            else:
                stdout, stderr = self.flask_process.communicate()
                self.log(f"Flask server bị crash: {stderr.decode()}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"Lỗi khởi động Flask: {e}", "FAIL")
            return False
            
    def test_endpoints(self):
        """Test các endpoint"""
        endpoints_to_test = [
            '/test',
            '/list-api-scripts',
            '/list-friends-data',
            '/list-checkin-files'
        ]
        
        base_url = f"http://localhost:{self.test_port}"
        all_passed = True
        
        for endpoint in endpoints_to_test:
            try:
                # Gửi GET request không có Content-Type header
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    self.log(f"Endpoint {endpoint} - OK", "PASS")
                else:
                    self.log(f"Endpoint {endpoint} - Status {response.status_code}", "FAIL")
                    all_passed = False
            except requests.exceptions.RequestException as e:
                self.log(f"Endpoint {endpoint} - Lỗi kết nối: {e}", "FAIL")
                all_passed = False
                
        return all_passed
        
    def test_crawl_endpoint(self):
        """Test endpoint crawl chính"""
        url = f"http://localhost:{self.test_port}/crawl-friend-list"
        test_data = {
            "username": "test_user",
            "layers": "0",
            "friends_per_layer": "1",
            "confirm": "y"
        }
        
        try:
            # Gửi POST request với proper JSON headers
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, json=test_data, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'stdout' in data or 'stderr' in data:
                    self.log("Endpoint /crawl-friend-list - OK", "PASS")
                    return True
                else:
                    self.log("Endpoint /crawl-friend-list - Response không đúng format", "FAIL")
                    return False
            else:
                self.log(f"Endpoint /crawl-friend-list - Status {response.status_code}", "FAIL")
                return False
        except requests.exceptions.RequestException as e:
            self.log(f"Endpoint /crawl-friend-list - Lỗi: {e}", "FAIL")
            return False
            
    def stop_flask_server(self):
        """Dừng Flask server"""
        if self.flask_process:
            self.flask_process.terminate()
            try:
                self.flask_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.flask_process.kill()
            self.log("Flask server đã được dừng", "INFO")
            
    def print_summary(self):
        """In tóm tắt kết quả"""
        print("\n" + "="*60)
        print("TÓM TẮT KẾT QUẢ TEST")
        print("="*60)
        
        pass_count = len([r for r in self.results if r[0] == "PASS"])
        fail_count = len([r for r in self.results if r[0] == "FAIL"])
        
        print(f"✓ PASS: {pass_count}")
        print(f"✗ FAIL: {fail_count}")
        
        if fail_count == 0:
            print("\n🎉 TẤT CẢ TEST ĐỀU PASS! Backend sẵn sàng hoạt động!")
            print("\nCách sử dụng:")
            print("1. Chạy: python api_server.py")
            print("2. Mở web và test kết nối")
        else:
            print(f"\n⚠️  Có {fail_count} vấn đề cần khắc phục:")
            for status, message in self.results:
                if status == "FAIL":
                    print(f"   ✗ {message}")
                    
            print("\nHƯỚNG DẪN KHẮC PHỤC:")
            if not any("Flask" in msg for _, msg in self.results if _ == "FAIL"):
                print("• Cài đặt Flask: pip install flask flask-cors")
            if not any("tồn tại" in msg for _, msg in self.results if _ == "FAIL"):
                print("• Kiểm tra đường dẫn file api_server.py và thư mục crawl/metaspy")
            if any("Port" in msg for _, msg in self.results if _ == "FAIL"):
                print("• Thay đổi port trong api_server.py (ví dụ: port=5000)")
                
    def run_full_test(self):
        """Chạy test đầy đủ"""
        print("="*60)
        print("OSINT TOOL BACKEND TESTER")
        print("="*60)
        print("Đang kiểm tra hệ thống...")
        print()
        
        # Kiểm tra cơ bản
        self.check_python_version()
        
        # Kiểm tra dependencies
        flask_ok = self.check_flask_installation()
        cors_ok = self.check_flask_cors()
        
        if not flask_ok or not cors_ok:
            self.log("Đang cài đặt dependencies...", "INFO")
            if self.install_dependencies():
                flask_ok = self.check_flask_installation()
                cors_ok = self.check_flask_cors()
                
        # Kiểm tra file
        self.check_files_exist()
        
        # Kiểm tra port
        port_ok = self.check_port_available()
        
        if flask_ok and cors_ok and port_ok:
            # Test server
            if self.start_flask_server():
                time.sleep(2)
                self.test_endpoints()
                self.test_crawl_endpoint()
                self.stop_flask_server()
        
        self.print_summary()

def main():
    tester = BackendTester()
    try:
        tester.run_full_test()
    except KeyboardInterrupt:
        print("\n\nTest bị hủy bởi người dùng")
        tester.stop_flask_server()
    except Exception as e:
        print(f"\nLỗi không mong muốn: {e}")
        tester.stop_flask_server()

if __name__ == "__main__":
    main() 