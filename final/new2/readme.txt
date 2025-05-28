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

Chúc bạn sử dụng tool hiệu quả!

