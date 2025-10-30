HƯỚNG DẪN SỬ DỤNG OSINT TOOL ALL-IN-ONE
=====================================

**Yêu cầu chuẩn bị:**
- Đảm bảo đã cài Python 3.8+ và các thư viện cần thiết (requests, selenium, rich, ...)
- Đặt biến môi trường (env) phù hợp với tài khoản Facebook và API nếu cần.
- Để đăng nhập Facebook 2 bước, vào file: `./crawl/metaspy/src/facebook/scraper.py` dòng 34, thêm dấu # vào lệnh headless để hiện Chrome và đăng nhập thủ công.
- Đảm bảo đã bật Chrome và đăng nhập thành công trước khi chạy tool.

**Cách chạy tool:**
1. Mở terminal/cmd tại thư mục gốc dự án.
2. Chạy lệnh:
   ```
   python run_all.py
   ```
3. Làm theo hướng dẫn menu trên màn hình.

==== OSINT TOOL MENU ====
1. **Crawl danh sách bạn bè**
   - Nhập UID hoặc username Facebook, số tầng và số bạn bè mỗi node.
   - Tool sẽ crawl danh sách bạn bè theo cấu hình và lưu vào thư mục `friends_data_{timestamp}`.
2. **Crawl thông tin cá nhân từng người từ data**
   - Chọn file data đã crawl ở bước 1, tool sẽ tự động crawl thông tin chi tiết từng người và lưu file chuẩn hóa vào đúng thư mục.
3. **OSINT bằng API**
   - Chạy các tool API trong thư mục `API/` (profile, post, comment, ...).
   - Dữ liệu sẽ được lưu vào đúng thư mục con trong `API/data/` theo loại tool, tên file có dạng: `{loai_tool}_{giờ}h_{phút}_{ngày}_{tháng}_{năm}.json`.
4. **Sinh sơ đồ mạng (network.html)**
   - Chọn file data đã crawl, tool sẽ sinh file `data.js` và mở `network.html` để trực quan hóa mạng lưới bạn bè.
5. **Thống kê tỉnh thành từ dữ liệu**
   - Thực hiện thống kê, phân tích tỉnh thành từ dữ liệu đã crawl (tùy chỉnh theo nhu cầu).
0. **Thoát**
   - Thoát chương trình.

**Lưu ý:**
- Luôn chạy tool ở đúng thư mục gốc dự án.
- Dữ liệu API sẽ được lưu vào `API/data/{loai_tool}/` với tên file tự động, không ghi đè file cũ.
- Nếu gặp lỗi về đăng nhập, hãy kiểm tra lại cookie, tài khoản, hoặc thử đăng nhập lại bằng Chrome.
- Nếu Facebook đổi giao diện, có thể cần cập nhật lại selector trong code crawl.

**Cách sửa API token cho các tool trong thư mục API:**
- Một số tool trong thư mục `API/` yêu cầu bạn phải nhập hoặc sửa token API để truy cập dữ liệu.
- Thông thường, token này được lưu trong biến `API_TOKEN`, `ACCESS_TOKEN` hoặc tương tự ở đầu file Python (ví dụ: `API/pro5_detail.py`, `API/post_details.py`, ...).
- Để sửa token:
  1. Mở file tool bạn muốn sử dụng trong thư mục `API/`.
  2. Tìm dòng có chứa token (ví dụ: `API_TOKEN = "..."`).
  3. Thay giá trị bằng token của bạn (lấy từ Facebook Graph API hoặc nguồn hợp lệ).
  4. Lưu file lại trước khi chạy tool.
- **Lưu ý bảo mật:** Không chia sẻ token cá nhân cho người khác. Token có thể bị lộ thông tin tài khoản hoặc bị khóa nếu sử dụng sai mục đích.

**Cách sửa thông tin RapidAPI cho các tool trong thư mục API:**
- Một số tool sử dụng dịch vụ RapidAPI (ví dụ: [facebook-scraper3](https://rapidapi.com/krasnoludkolo/api/facebook-scraper3)) yêu cầu bạn phải sửa các trường sau trong file Python:
  - `App` (hoặc `X-RapidAPI-Application-Id`): Thường là tên ứng dụng của bạn trên RapidAPI.
  - `X-RapidAPI-Key`: Mã key cá nhân của bạn trên RapidAPI.
  - `Request URL`: Địa chỉ endpoint, thường là `rapidapi.com` hoặc endpoint cụ thể của API.
- Để sửa:
  1. Đăng nhập vào tài khoản RapidAPI, vào trang [facebook-scraper3](https://rapidapi.com/krasnoludkolo/api/facebook-scraper3).
  2. Lấy các giá trị App, X-RapidAPI-Key, Request URL như hình minh họa.
  3. Mở file Python trong thư mục `API/` (ví dụ: `pro5_detail.py`, `post_details.py`, ...).
  4. Tìm các dòng có chứa các trường trên (có thể là biến hoặc trong headers của request).
  5. Thay giá trị bằng thông tin của bạn.
  6. Lưu file lại trước khi chạy tool.

**Ví dụ đoạn code cần sửa:**
```python
headers = {
    "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
    "X-RapidAPI-Host": "facebook-scraper3.p.rapidapi.com",
    "App": "YOUR_APP_ID"
}
url = "https://facebook-scraper3.p.rapidapi.com/..."
```
→ Hãy thay `YOUR_RAPIDAPI_KEY` và `YOUR_APP_ID` bằng giá trị của bạn.

**Lưu ý bảo mật:**  
Không chia sẻ key RapidAPI cho người khác. Nếu nghi ngờ bị lộ, hãy đổi key trên trang RapidAPI.

Chúc bạn sử dụng tool hiệu quả!

