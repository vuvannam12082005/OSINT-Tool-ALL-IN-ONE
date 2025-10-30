from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import sys
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.before_request
def log_request_info():
    print('Request:', request.method, request.path)
    # Chỉ parse JSON cho POST/PUT/PATCH request
    if request.method in ['POST', 'PUT', 'PATCH']:
        try:
            if request.is_json and request.json:
                print('Request data:', request.json)
        except Exception as e:
            print(f'JSON parse error: {e}')
    
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 1. Crawl danh sách bạn bè
@app.route('/crawl-friend-list', methods=['POST'])
def crawl_friend_list():
    """
    Wrapper function để đảm bảo luôn trả về JSON response
    """
    try:
        return _crawl_friend_list_impl()
    except Exception as e:
        print(f"CRITICAL ERROR in crawl_friend_list: {str(e)}")
        import traceback
        traceback.print_exc()
        # Đảm bảo luôn trả về JSON valid
        return jsonify({
            'stdout': '',
            'stderr': f'Critical server error: {str(e)}',
            'returncode': -999,
            'success': False,
            'error_type': 'critical_error'
        }), 200

def _crawl_friend_list_impl():
    """
    Implementation thực tế của crawl friend list
    """
    print("=== CRAWL FRIEND LIST START ===")
    
    # Kiểm tra và parse JSON data
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data received'}), 400
        
    username = data.get('username')
    layers = data.get('layers')
    friends_per_layer = data.get('friends_per_layer')
    confirm = data.get('confirm', 'y')
    
    print(f"Received params: username={username}, layers={layers}, friends_per_layer={friends_per_layer}, confirm={confirm}")
    
    if not username:
        return jsonify({'error': 'Missing username parameter'}), 400
        
    # Parse friends_per_layer thành danh sách
    friends_list = [x.strip() for x in friends_per_layer.split(',') if x.strip()]
    
    # Tạo input cho metaspy: layers + từng số bạn bè + confirm
    input_parts = [layers]  # Số tầng
    input_parts.extend(friends_list)  # Từng số bạn bè cho từng tầng
    input_parts.append(confirm)  # Xác nhận
    
    input_str = '\n'.join(input_parts) + '\n'
    
    # Kiểm tra đường dẫn
    metaspy_path = os.path.join('crawl', 'metaspy')
    main_py_path = os.path.join(metaspy_path, 'main.py')
    
    print(f"Current working directory: {os.getcwd()}")
    print(f"Metaspy path: {metaspy_path}")
    print(f"Main.py path: {main_py_path}")
    print(f"Main.py exists: {os.path.exists(main_py_path)}")
    
    if not os.path.exists(main_py_path):
        return jsonify({'error': f'main.py not found at {main_py_path}'}), 404
        
    command = f'"{sys.executable}" main.py friend-layer-crawler {username}'
    print(f"Command to execute: {command}")
    print(f"Input string: {repr(input_str)}")
    
    # Test mode - không thực sự chạy subprocess, chỉ trả về thông tin
    if username == 'test_user':
        print("Test mode detected - returning mock response")
        return jsonify({
            'stdout': f'Test mode: Would run command: {command}\nWith input: {input_str}',
            'stderr': '',
            'returncode': 0,
            'success': True,
            'test_mode': True
        })
    
    # Chạy subprocess thực sự với error handling cẩn thận
    proc = None
    try:
        # Set environment variables để tránh lỗi encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['PYTHONLEGACYWINDOWSSTDIO'] = '1'
        
        print(f"🚀 Bắt đầu crawl friend list cho user: {username}")
        print(f"⚙️ Cấu hình: {layers} tầng, {friends_per_layer} bạn/tầng")
        print("=" * 60)
        
        proc = subprocess.Popen(
            command,
            cwd=metaspy_path,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            env=env,
            encoding='utf-8',
            errors='replace',
            universal_newlines=True,
            bufsize=1  # Line buffered cho real-time output
        )
        
        try:
            # Gửi input ngay lập tức
            proc.stdin.write(input_str)
            proc.stdin.close()
            
            # Đọc output real-time
            print("📝 Output real-time:")
            print("-" * 40)
            
            output_lines = []
            error_lines = []
            
            # Đọc stdout real-time
            for line in iter(proc.stdout.readline, ''):
                if line:
                    print(line.rstrip())  # In ra terminal ngay lập tức
                    output_lines.append(line)
                    
            # Đọc stderr nếu có
            stderr_content = proc.stderr.read()
            if stderr_content:
                print("⚠️ Errors/Warnings:")
                print(stderr_content)
                error_lines.append(stderr_content)
            
            # Đợi process kết thúc 
            proc.wait()
            
            print("-" * 40)
            print(f"✅ Process hoàn thành với return code: {proc.returncode}")
            
            # Gộp output
            out = ''.join(output_lines)
            err = ''.join(error_lines)
            
            # Truncate output nếu quá dài để tránh JSON quá lớn
            max_length = 50000  # 50KB
            if len(out) > max_length:
                out = out[:max_length] + "\n... (output truncated due to length)"
            if len(err) > max_length:
                err = err[:max_length] + "\n... (error truncated due to length)"
            
            # Clean output để đảm bảo JSON valid
            out = out.replace('\x00', '').strip()
            err = err.replace('\x00', '').strip()
            
            return jsonify({
                'stdout': out,
                'stderr': err,
                'returncode': proc.returncode,
                'success': proc.returncode == 0
            })
            
        except Exception as inner_error:
            print(f"💥 Lỗi trong quá trình crawl: {str(inner_error)}")
            if proc:
                proc.kill()
                proc.wait()
            return jsonify({
                'stdout': '',
                'stderr': f'Process error: {str(inner_error)}',
                'returncode': -1,
                'success': False
            }), 200  # Vẫn trả về 200 để không crash
        
    except Exception as subprocess_error:
        print(f"Subprocess error: {subprocess_error}")
        return jsonify({
            'stdout': '',
            'stderr': f'Subprocess error: {str(subprocess_error)}',
            'returncode': -1,
            'success': False
        }), 200  # Vẫn trả về 200 để không crash
        
    finally:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                try:
                    proc.kill()
                except:
                    pass
    
    print("=== CRAWL FRIEND LIST END ===")

# 2. Crawl thông tin cá nhân từng người từ data
@app.route('/crawl-profile-data', methods=['POST'])
def crawl_profile_data():
    try:
        print("=== CRAWL PROFILE DATA START ===")
        
        # Kiểm tra và parse JSON data
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        friends_dir = data.get('friends_dir')
        if not friends_dir:
            return jsonify({'error': 'Missing friends_dir parameter'}), 400
        
        print(f"Received friends_dir: {friends_dir}")
        
        # Kiểm tra thư mục tồn tại
        metaspy_path = os.path.join('crawl', 'metaspy')
        friends_data_path = os.path.join(metaspy_path, friends_dir)
        
        if not os.path.exists(friends_data_path):
            return jsonify({'error': f'Friends data directory not found: {friends_dir}'}), 404
        
        # Đếm số lượng file JSON để ước tính thời gian
        json_files = [f for f in os.listdir(friends_data_path) if f.endswith('.json')]
        estimated_time = len(json_files) * 2.5  # ~2.5 phút/file trung bình
        
        print(f"Found {len(json_files)} JSON files. Estimated time: {estimated_time:.1f} minutes")
        
        # Tạo input cho script như trên terminal
        # Script sẽ hỏi chọn thư mục, ta cần tìm index của thư mục trong danh sách
        all_dirs = [d for d in os.listdir(metaspy_path) if d.startswith('friends_data_') and os.path.isdir(os.path.join(metaspy_path, d))]
        all_dirs.sort()
        
        try:
            dir_index = all_dirs.index(friends_dir) + 1  # +1 vì script bắt đầu từ 1
            input_str = f"{dir_index}\n"
            print(f"Directory index: {dir_index}")
        except ValueError:
            return jsonify({'error': f'Directory {friends_dir} not found in friends_data list'}), 404
        
        # Chạy script crawl_profile_data
        command = ["python", "-m", "src.facebook.account.crawl_profile_data"]
        print(f"Command to execute: {' '.join(command)}")
        print(f"Input string: {repr(input_str)}")
        
        # Set environment cho encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['PYTHONLEGACYWINDOWSSTDIO'] = '1'
        
        print(f"🚀 Bắt đầu crawl profile data từ {friends_dir}")
        print(f"📊 Ước tính crawl {len(json_files)} profiles (~{estimated_time:.1f} phút)")
        print("=" * 60)
        
        proc = subprocess.Popen(
            command,
            cwd=metaspy_path,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            env=env,
            encoding='utf-8',
            errors='replace',
            universal_newlines=True,
            bufsize=1  # Line buffered để có real-time output
        )
        
        try:
            # Gửi input ngay lập tức
            proc.stdin.write(input_str)
            proc.stdin.close()
            
            # Đọc output real-time
            print("📝 Output real-time:")
            print("-" * 40)
            
            output_lines = []
            error_lines = []
            
            # Đọc stdout real-time
            for line in iter(proc.stdout.readline, ''):
                if line:
                    print(line.rstrip())  # In ra terminal ngay lập tức
                    output_lines.append(line)
                    
            # Đọc stderr nếu có
            stderr_content = proc.stderr.read()
            if stderr_content:
                print("⚠️ Errors/Warnings:")
                print(stderr_content)
                error_lines.append(stderr_content)
            
            # Đợi process kết thúc
            proc.wait()
            
            print("-" * 40)
            print(f"✅ Process hoàn thành với return code: {proc.returncode}")
            
            # Gộp output
            out = ''.join(output_lines)
            err = ''.join(error_lines)
            
            # Truncate output nếu quá dài
            max_length = 50000
            if len(out) > max_length:
                out = out[:max_length] + "\n... (output truncated due to length)"
            if len(err) > max_length:
                err = err[:max_length] + "\n... (error truncated due to length)"
            
            out = out.replace('\x00', '').strip()
            err = err.replace('\x00', '').strip()
            
            return jsonify({
                'stdout': out,
                'stderr': err,
                'returncode': proc.returncode,
                'success': proc.returncode == 0,
                'friends_dir': friends_dir,
                'total_profiles': len(json_files),
                'estimated_time_minutes': estimated_time
            })
            
        except Exception as e:
            print(f"💥 Lỗi trong quá trình crawl: {str(e)}")
            if proc:
                proc.kill()
                proc.wait()
            return jsonify({
                'stdout': '',
                'stderr': f'Process error: {str(e)}',
                'returncode': -1,
                'success': False
            }), 200
            
    except Exception as e:
        print(f"EXCEPTION in crawl_profile_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'stdout': '',
            'stderr': f'Server error: {str(e)}',
            'returncode': -1,
            'success': False
        }), 200

# 3. OSINT bằng API (chạy script bất kỳ trong thư mục API)
@app.route('/osint-api', methods=['POST'])
def osint_api():
    try:
        print("=== OSINT API START ===")
        
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        # Xử lý data mới với script và params
        if isinstance(data, dict) and 'script' in data:
            script_name = data.get('script')
            params = data.get('params', {})
        else:
            # Backward compatibility với format cũ
            script_name = data.get('script_name', data)
            params = {}
            
        if not script_name:
            return jsonify({'error': 'Missing script_name'}), 400
            
        print(f"Script: {script_name}")
        print(f"Parameters: {params}")
        
        api_dir = 'API'
        script_path = os.path.join(api_dir, script_name)
        if not os.path.exists(script_path):
            return jsonify({'error': 'Script not found'}), 404
        
        # Tạo input string tương tự như khi nhập thủ công
        input_str = ""
        
        if script_name == 'getcmt.py':
            input_str = f"1\n{params.get('post_id', '')}\n"
            
        elif script_name == 'nested_cmt.py':
            input_str = f"{params.get('post_id', '')}\n{params.get('comment_id', '')}\n{params.get('expansion_token', '')}\n"
            
        elif script_name == 'post_details.py':
            input_str = f"{params.get('post_id', '')}\n"
            
        elif script_name == 'pro5_detail.py':
            input_str = f"{params.get('username', '')}\n"
            
        elif script_name == 'post_data.py':
            profile_id = params.get('profile_id', '')
            start_date = params.get('start_date', '')
            end_date = params.get('end_date', '')
            input_str = f"{profile_id}\n{start_date}\n{end_date}\n"
            
        print(f"Input string for script: {repr(input_str)}")
        
        # Set environment để tránh lỗi encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['PYTHONLEGACYWINDOWSSTDIO'] = '1'
        
        print(f"🚀 Bắt đầu chạy {script_name}")
        print("=" * 60)
        
        proc = subprocess.Popen(
            [sys.executable, script_name],
            cwd=api_dir,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            env=env,
            encoding='utf-8',
            errors='replace',
            universal_newlines=True,
            bufsize=1
        )
        
        try:
            # Gửi input nếu có
            if input_str:
                proc.stdin.write(input_str)
            proc.stdin.close()
            
            # Đọc output real-time
            print("📝 Output real-time:")
            print("-" * 40)
            
            output_lines = []
            error_lines = []
            
            # Đọc stdout real-time
            for line in iter(proc.stdout.readline, ''):
                if line:
                    print(line.rstrip())  # In ra terminal ngay lập tức
                    output_lines.append(line)
                    
            # Đọc stderr nếu có
            stderr_content = proc.stderr.read()
            if stderr_content:
                print("⚠️ Errors/Warnings:")
                print(stderr_content)
                error_lines.append(stderr_content)
            
            # Đợi process kết thúc
            proc.wait()
            
            print("-" * 40)
            print(f"✅ Process hoàn thành với return code: {proc.returncode}")
            
            # Gộp output
            out = ''.join(output_lines)
            err = ''.join(error_lines)
            
            return jsonify({
                'stdout': out,
                'stderr': err,
                'returncode': proc.returncode,
                'success': proc.returncode == 0,
                'script': script_name,
                'params': params
            })
            
        except Exception as e:
            print(f"💥 Lỗi trong quá trình chạy script: {str(e)}")
            if proc:
                proc.kill()
                proc.wait()
            return jsonify({
                'stdout': '',
                'stderr': f'Script error: {str(e)}',
                'returncode': -1,
                'success': False
            }), 200
            
    except Exception as e:
        print(f"EXCEPTION in osint_api: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 4. Sinh sơ đồ mạng (network.html)
@app.route('/network-diagram', methods=['POST'])
def network_diagram():
    try:
        print("=== NETWORK DIAGRAM START ===")
        
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        # Lấy tên thư mục và file từ request
        dir_name = data.get('dir_name')
        file_name = data.get('file_name')
        if not dir_name or not file_name:
            return jsonify({'error': 'Missing dir_name or file_name'}), 400
            
        print(f"Selected directory: {dir_name}")
        print(f"Selected file: {file_name}")
        
        # Chọn file json đầu vào
        data_dir = os.path.join('crawl', 'metaspy')
        dirs = [d for d in os.listdir(data_dir) if d.startswith('friends_data_')]
        if not dirs:
            return jsonify({'error': 'No friends_data_* directory found'}), 404
            
        json_path = os.path.join(data_dir, dir_name, file_name)
        print(f"JSON path: {json_path}")
        
        if not os.path.exists(json_path):
            return jsonify({'error': 'JSON file not found'}), 404
            
        # Đọc và chuẩn hóa dữ liệu
        print("Reading and normalizing JSON data...")
        import json as pyjson
        with open(json_path, 'r', encoding='utf-8') as f:
            raw_data = pyjson.load(f)
            
        if isinstance(raw_data, dict):
            tree_data = raw_data.get('tree_data', raw_data)
        else:
            tree_data = raw_data
            
        normalized_data = {
            'root_user': tree_data.get('id', ''),
            'max_layers': 2,
            'friends_per_layer': 3,
            'crawled_at': '',
            'total_accounts': 0,
            'tree_data': tree_data
        }
        
        # Ghi đè file data.js với định dạng chuẩn
        data_js_path = 'data.js'
        print(f"Writing to {data_js_path}...")
        with open(data_js_path, 'w', encoding='utf-8') as f:
            f.write('const jsonData = ')
            pyjson.dump(normalized_data, f, ensure_ascii=False, indent=2)
            f.write(';')
            
        output_message = f'Đã ghi đè data.js từ {json_path}'
        print(output_message)
        
        # Thông tin về file HTML
        network_html_path = os.path.abspath('network.html')
        
        return jsonify({
            'stdout': output_message,
            'stderr': '',
            'returncode': 0,
            'success': True,
            'message': output_message,
            'data_js_created': True,
            'network_html_path': network_html_path,
            'instructions': 'Mở file network.html trong browser để xem sơ đồ mạng',
            'tree_data': normalized_data  # Thêm tree_data để component có thể render
        })
        
    except Exception as e:
        print(f"EXCEPTION in network_diagram: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 5. Thống kê tỉnh thành từ dữ liệu (mở map/index.html)
@app.route('/province-stats', methods=['GET'])
def province_stats():
    try:
        map_dir = os.path.join(os.getcwd(), 'map')
        index_path = os.path.join(map_dir, 'index.html')
        if not os.path.exists(index_path):
            return jsonify({'error': 'index.html not found'}), 404
        return jsonify({'message': f'File available at {index_path}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 6. Lấy thông tin di chuyển (check-in)
@app.route('/move-info', methods=['POST'])
def move_info():
    try:
        # Parse request data
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        username = data.get('username', '')
        posts_count = data.get('posts_count', '')
        year = data.get('year', '')
        month = data.get('month', '')
        day = data.get('day', '')
        
        # Validate required fields
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        # Build command with arguments
        command = [
            'node', 'main.js',
            username,
            posts_count if posts_count else '100',  # Default to 100 if empty
            year if year else '',
            month if month else '',
            day if day else ''
        ]
        
        print(f"Running command: {' '.join(command)}")
        print(f"With parameters: username={username}, posts={posts_count}, year={year}, month={month}, day={day}")
        
        # Set environment variables để tránh lỗi encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['PYTHONLEGACYWINDOWSSTDIO'] = '1'
        
        # Run the crawler with a longer timeout
        proc = subprocess.Popen(
            command,
            cwd='CrawCheckin',
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True,
            env=env,
            encoding='utf-8',
            errors='replace',
            universal_newlines=True
        )
        
        # Wait for completion with timeout (1 hour)
        try:
            out, err = proc.communicate(timeout=3600)
            
            print(f"Crawler completed with return code: {proc.returncode}")
            print(f"Output: {out}")
            if err:
                print(f"Errors: {err}")
            
            # Extract generated filename from output
            generated_file = None
            if proc.returncode == 0 and out:
                # Look for "Data saved to:" in output
                lines = out.split('\n')
                for line in lines:
                    if 'Data saved to:' in line:
                        # Extract filename from full path
                        file_path = line.split('Data saved to:')[1].strip()
                        generated_file = file_path.split('\\')[-1]  # Get just filename
                        break
            
            response_data = {
                'stdout': out,
                'stderr': err,
                'returncode': proc.returncode,
                'success': proc.returncode == 0,
                'message': f'Crawler finished for user {username}'
            }
            
            # Add generated filename if found
            if generated_file:
                response_data['generated_file'] = generated_file
                response_data['message'] = f'Crawler finished for user {username}. Generated file: {generated_file}'
            
            return jsonify(response_data)
            
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
            return jsonify({
                'stdout': '',
                'stderr': 'Crawler timeout after 1 hour',
                'returncode': -1,
                'success': False,
                'error': 'timeout'
            }), 200
            
    except Exception as e:
        print(f"Error in move_info: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'stdout': '',
            'stderr': f'Server error: {str(e)}',
            'returncode': -1,
            'success': False,
            'error': 'server_error'
        }), 500

# 7. Thống kê lịch trình di chuyển (hiển thị checkin_routes.html)
@app.route('/move-history', methods=['POST'])
def move_history():
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        data_dir = os.path.join('CrawCheckin', 'src', 'data')
        file_name = data.get('file_name')
        if not file_name:
            return jsonify({'error': 'Missing file_name'}), 400
        json_path = os.path.join(data_dir, file_name)
        if not os.path.exists(json_path):
            return jsonify({'error': 'JSON file not found'}), 404
        import json as pyjson
        with open(json_path, 'r', encoding='utf-8') as f:
            checkin_data = pyjson.load(f)
        with open('data_checkin.js', 'w', encoding='utf-8') as f:
            f.write('const jsonData = ')
            pyjson.dump(checkin_data, f, ensure_ascii=False, indent=2)
            f.write(';')
        return jsonify({'message': f'Wrote data_checkin.js from {json_path}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list-api-scripts', methods=['GET'])
def list_api_scripts():
    try:
        api_dir = 'API'
        if not os.path.exists(api_dir):
            return jsonify({'scripts': []})
        scripts = [f for f in os.listdir(api_dir) if f.endswith('.py')]
        return jsonify({'scripts': scripts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list-friends-data', methods=['GET'])
def list_friends_data():
    try:
        data_dir = os.path.join('crawl', 'metaspy')
        if not os.path.exists(data_dir):
            return jsonify({'data': {}})
        dirs = [d for d in os.listdir(data_dir) if d.startswith('friends_data_')]
        result = {}
        for d in dirs:
            dir_path = os.path.join(data_dir, d)
            if os.path.isdir(dir_path):
                files = [f for f in os.listdir(dir_path) if f.endswith('.json')]
                result[d] = files
        return jsonify({'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list-checkin-files', methods=['GET'])
def list_checkin_files():
    try:
        data_dir = os.path.join('CrawCheckin', 'src', 'data')
        if not os.path.exists(data_dir):
            return jsonify({'files': []})
        files = [f for f in os.listdir(data_dir) if f.endswith('.json')]
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint để tải file thực tế đã crawl
@app.route('/download-file', methods=['GET', 'HEAD'])
def download_file():
    """
    Download file thực tế đã crawl
    HEAD method để check file tồn tại
    """
    try:
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({'error': 'Missing file path parameter'}), 400
            
        # Security check - chỉ cho phép download từ thư mục dự án
        if '..' in file_path or file_path.startswith('/') or ':' in file_path:
            return jsonify({'error': 'Invalid file path'}), 400
        
        print(f"Original file path: {file_path}")
        
        # Tự động thêm prefix cho friends_data files và normalize path
        if file_path.startswith('friends_data_'):
            # Nếu path chứa cả thư mục friends_data_ và file name
            file_path = os.path.join('crawl', 'metaspy', file_path)
        elif '\\' in file_path and file_path.split('\\')[0].startswith('friends_data_'):
            # Trường hợp có backslash separator (Windows)
            file_path = os.path.join('crawl', 'metaspy', file_path)
        elif '/' in file_path and file_path.split('/')[0].startswith('friends_data_'):
            # Trường hợp có forward slash separator
            file_path = os.path.join('crawl', 'metaspy', file_path)
        
        print(f"Looking for file at: {file_path}")
        
        # Normalize path
        full_path = os.path.join(os.getcwd(), file_path.replace('\\', os.sep))
        
        print(f"Full path: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")
        
        if not os.path.exists(full_path):
            return jsonify({'error': f'File not found: {file_path}'}), 404
            
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Path is not a file'}), 400
        
        # Nếu là HEAD request, chỉ trả về status
        if request.method == 'HEAD':
            return '', 200
            
        directory = os.path.dirname(full_path)
        filename = os.path.basename(full_path)
        
        return send_from_directory(directory, filename, as_attachment=True)
        
    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'error': f'Download error: {str(e)}'}), 500

# OPTIONS handler cho CORS preflight
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

# Test endpoint để kiểm tra kết nối
@app.route('/test', methods=['GET', 'POST'])
def test():
    return jsonify({'message': 'Backend is working!', 'method': request.method})

if __name__ == '__main__':
    app.run(port=5000, debug=False, host='0.0.0.0')  # Tắt debug để tránh auto-reload 