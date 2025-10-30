# 🛡️ OSINT Tool Suite - Professional Intelligence Platform

## 📋 Mô tả tổng quan

**OSINT Tool Suite** là một nền tảng thu thập thông tin mã nguồn mở (Open Source Intelligence) chuyên nghiệp, được thiết kế để tự động hóa việc crawl, phân tích và hiển thị dữ liệu từ các mạng xã hội, đặc biệt là Facebook.

### ✨ Tính năng chính

1. **📱 Crawl danh sách bạn bè** - Thu thập thông tin danh sách bạn bè từ Facebook
2. **👤 Crawl thông tin cá nhân** - Thu thập thông tin chi tiết của từng người
3. **🔗 OSINT bằng API** - Sử dụng các API scripts có sẵn
4. **🌐 Sinh sơ đồ mạng** - Tạo sơ đồ network topology tự động mở trong tab mới
5. **🗺️ Thống kê tỉnh thành** - Phân tích dữ liệu địa lý tự động mở bản đồ
6. **📍 Lấy thông tin di chuyển** - Crawler thông tin check-in
7. **📊 Thống kê lịch trình** - Phân tích lịch trình di chuyển tự động mở visualization
8. **🚪 Thoát** - Kết thúc phiên làm việc

## 🚀 Cài đặt và Setup

### Yêu cầu hệ thống
- **Node.js** v16+ 
- **npm** hoặc **yarn**
- **Python** 3.8+ (cho backend)
- **Git**

### Bước 1: Clone repository

```bash
git clone <YOUR_GIT_URL>
cd web-tool-tuyet-dep
```

### Bước 2: Cài đặt dependencies

```bash
# Cài đặt frontend dependencies
npm install

# Cài đặt backend dependencies (trong thư mục backend)
cd ../hyvongcuoicung/new2
pip install -r requirements.txt
```

### Bước 3: Setup cấu trúc thư mục

Đảm bảo cấu trúc thư mục như sau:
```
Project Root/
├── web-tool-tuyet-dep/          # Frontend React app
│   ├── public/
│   │   └── hyvongcuoicung/
│   │       └── new2/           # HTML files và data files
│   ├── src/
│   ├── sync-files.js           # File đồng bộ tự động
│   └── package.json
└── hyvongcuoicung/
    └── new2/                   # Backend Python server
        ├── api_server.py
        ├── data.js            # Network data (auto-generated)
        ├── data_checkin.js    # Check-in data (auto-generated)
        ├── network.html       # Network visualization
        ├── checkin_routes.html # Check-in routes visualization
        └── map/
            └── index.html     # Province statistics map
```

## 🔧 Chạy ứng dụng

### Terminal 1: Chạy Backend Server
```bash
cd hyvongcuoicung/new2
python api_server.py
```
Backend sẽ chạy trên: `http://localhost:5000`

### Terminal 2: Chạy File Sync Watcher
```bash
cd web-tool-tuyet-dep
npm run sync
```
Script này tự động đồng bộ file `data.js` và `data_checkin.js` từ backend sang frontend.

### Terminal 3: Chạy Frontend
```bash
cd web-tool-tuyet-dep
npm run dev
```
Frontend sẽ chạy trên: `http://localhost:5173`

## 📖 Hướng dẫn sử dụng

### 1. 📱 Crawl danh sách bạn bè
- **Input**: Username/UID, số tầng, số bạn bè mỗi tầng
- **Output**: File JSON chứa danh sách bạn bè theo tầng
- **Mục đích**: Thu thập dữ liệu đầu vào cho các chức năng khác

### 2. 👤 Crawl thông tin cá nhân
- **Input**: Thư mục chứa file danh sách bạn bè
- **Output**: File JSON chi tiết thông tin từng người
- **Dữ liệu thu thập**: Tên, quê quán, học vấn, mối quan hệ, social media links, v.v.

### 3. 🌐 Sinh sơ đồ mạng ⭐
- **Input**: Thư mục và tên file dữ liệu đã crawl
- **Process**: 
  1. Chọn file → API xử lý → Backend tạo `data.js` mới
  2. File sync tự động copy `data.js` sang public
  3. **Tự động mở** `network.html` trong tab mới
- **Features**: Interactive network diagram, zoom, physics simulation, tooltips

### 4. 🗺️ Thống kê tỉnh thành ⭐
- **Process**: Bấm nút → **Tự động mở** bản đồ Việt Nam trong tab mới
- **Features**: Upload JSON data, interactive SVG map, province statistics, zoom controls

### 5. 📊 Thống kê lịch trình di chuyển ⭐
- **Input**: File check-in data
- **Process**:
  1. Chọn file → API xử lý → Backend tạo `data_checkin.js` mới
  2. File sync tự động copy `data_checkin.js` sang public
  3. **Tự động mở** `checkin_routes.html` trong tab mới
- **Features**: Route visualization, timeline analysis, location mapping

## ⚙️ File Synchronization System

### Cơ chế hoạt động
1. **Backend** tạo/cập nhật file `data.js` hoặc `data_checkin.js` trong thư mục gốc
2. **File Watcher** (`sync-files.js`) theo dõi thay đổi và tự động copy sang `public/`
3. **Frontend** đọc file từ `public/` để hiển thị trong HTML files

### Script đồng bộ
```javascript
// Tự động watch và copy files
npm run sync

// Files được theo dõi:
- data.js (network diagram data)
- data_checkin.js (check-in routes data)
```

### Manual copy (nếu cần)
```bash
# Copy network data
copy "../hyvongcuoicung/new2/data.js" "public/hyvongcuoicung/new2/"

# Copy check-in data  
copy "../hyvongcuoicung/new2/data_checkin.js" "public/hyvongcuoicung/new2/"
```

## 🔧 Configuration

### Backend API Endpoint
Mặc định: `http://localhost:5000`

Có thể thay đổi trong **Settings tab** của frontend.

### Timeout Settings
Mặc định: 300 seconds (5 phút)

Có thể điều chỉnh tùy theo kích thước dữ liệu cần xử lý.

## 🎨 Giao diện

- **🌙 Dark Theme** với gradient background
- **📱 Responsive Design** 
- **⚡ Real-time Results** với loading states
- **🎯 Tabbed Interface**: Modules, Results, Settings
- **🔔 Toast Notifications** cho feedback
- **🎨 Modern UI** với shadcn/ui components

## 🛠️ Technologies Used

### Frontend
- **React 18** với TypeScript
- **Vite** build tool
- **Tailwind CSS** styling
- **shadcn/ui** component library  
- **Lucide React** icons

### Backend  
- **Python 3.8+** 
- **Flask** web framework
- **Requests** cho HTTP calls
- **BeautifulSoup** cho web scraping

### Visualization
- **vis-network** cho network diagrams
- **Chart.js** cho biểu đồ thống kê
- **SVG Maps** cho bản đồ Việt Nam
- **D3.js** cho data visualization

## 📋 API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/test` | GET | Test kết nối backend |
| `/crawl-friend-list` | POST | Crawl danh sách bạn bè |
| `/crawl-profile-data` | POST | Crawl thông tin cá nhân |
| `/osint-api` | POST | Chạy OSINT scripts |
| `/network-diagram` | POST | Tạo sơ đồ mạng |
| `/province-stats` | GET | Thống kê tỉnh thành |
| `/move-info` | POST | Thu thập thông tin di chuyển |
| `/move-history` | POST | Phân tích lịch trình |

## 🚨 Troubleshooting

### Backend không kết nối được
```bash
# Kiểm tra backend có chạy không
curl http://localhost:5000/test

# Khởi động lại backend
cd hyvongcuoicung/new2
python api_server.py
```

### File sync không hoạt động
```bash
# Khởi động lại file watcher
cd web-tool-tuyet-dep
npm run sync
```

### HTML files trắng khi mở
- Đảm bảo file sync đang chạy
- Kiểm tra file `data.js` / `data_checkin.js` có trong `public/hyvongcuoicung/new2/`
- Manual copy files nếu cần

### Permission errors
```bash
# Windows - chạy terminal as Administrator
# Linux/Mac - check file permissions
chmod +x sync-files.js
```

## 🔒 Security & Privacy

- **Chỉ sử dụng cho mục đích nghiên cứu và giáo dục**
- **Tuân thủ Terms of Service** của các platform
- **Không lưu trữ credentials** trong code
- **Rate limiting** để tránh bị block
- **Respect robots.txt** và privacy settings

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra [Troubleshooting](#-troubleshooting)
2. Xem logs trong browser console và terminal
3. Đảm bảo tất cả dependencies đã được cài đặt
4. Kiểm tra network connectivity

## 📄 License

Dự án này chỉ dành cho mục đích giáo dục và nghiên cứu. Vui lòng sử dụng có trách nhiệm và tuân thủ pháp luật địa phương.

---

**⚡ Quick Start:**
```bash
# Terminal 1: Backend
cd hyvongcuoicung/new2 && python api_server.py

# Terminal 2: File Sync  
cd web-tool-tuyet-dep && npm run sync

# Terminal 3: Frontend
cd web-tool-tuyet-dep && npm run dev
```

**🎯 Features hoạt động tự động:**
- ✅ Thống kê tỉnh thành → Tự động mở bản đồ
- ✅ Sinh sơ đồ mạng → Tự động mở network diagram  
- ✅ Thống kê lịch trình → Tự động mở route visualization
