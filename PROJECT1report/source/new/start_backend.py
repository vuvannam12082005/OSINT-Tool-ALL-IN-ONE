#!/usr/bin/env python3
import subprocess
import sys
import os

def install_requirements():
    """Cài đặt các thư viện cần thiết"""
    print("Checking and installing requirements...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors'])
        print("✓ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to install dependencies: {e}")
        return False

def check_flask_cors():
    """Kiểm tra xem flask-cors đã được cài đặt chưa"""
    try:
        import flask_cors
        return True
    except ImportError:
        return False

def main():
    print("=" * 50)
    print("OSINT Tool Backend Startup")
    print("=" * 50)
    
    # Kiểm tra và cài đặt dependencies
    if not check_flask_cors():
        print("Flask-CORS not found. Installing...")
        if not install_requirements():
            print("Failed to install dependencies. Please install manually:")
            print("pip install flask flask-cors")
            return
    
    # Kiểm tra file api_server.py tồn tại
    if not os.path.exists('api_server.py'):
        print("✗ api_server.py not found in current directory")
        print("Please run this script from the hyvongcuoicung/new2 directory")
        return
    
    print("✓ All checks passed!")
    print("Starting Flask backend on port 5000...")
    print("Backend will be available at: http://localhost:5000")
    print("Test endpoint: http://localhost:5000/test")
    print("-" * 50)
    
    # Chạy Flask backend
    try:
        subprocess.run([sys.executable, 'api_server.py'])
    except KeyboardInterrupt:
        print("\n✓ Backend stopped by user")
    except Exception as e:
        print(f"✗ Error starting backend: {e}")

if __name__ == "__main__":
    main() 