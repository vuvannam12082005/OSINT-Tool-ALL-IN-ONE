@echo off
REM ======================
REM Script: run1.bat
REM Mô tả: Khởi động đồng thời Backend API và Frontend (sync + dev) trong 3 cửa sổ CMD tách biệt.
REM ======================

REM Cài đặt các Python packages cần thiết
echo Dang kiem tra va cai dat Python packages...
pip install networkx sqlalchemy
echo Hoan thanh cai dat Python packages!
echo.

REM Khởi động Backend API (Terminal 1)
echo Dang khoi dong Backend API...
start "Backend API" cmd /k "cd /d C:\Users\vuvan\Downloads\PROJECT1report\crawl-all\new2 && python api_server.py"

REM Chờ 3 giây để Backend ổn định (tuỳ chọn)
timeout /t 3 /nobreak > nul

REM Khởi động tiến trình đồng bộ (Terminal 2)
echo Dang khoi dong tien trinh dong bo (npm install + npm run sync)...
start "Web Sync" cmd /k "cd /d C:\Users\vuvan\Downloads\PROJECT1report\web-tool && npm install && npm run sync"

REM Chờ 3 giây để Sync hoàn tất khởi tạo (tuỳ chọn)
timeout /t 3 /nobreak > nul

REM Khởi động Development server (Terminal 3)
echo Dang khoi dong Development server...
start "Web Dev" cmd /k "cd /d C:\Users\vuvan\Downloads\PROJECT1report\web-tool && npm run dev"

REM Chờ 8 giây để Frontend khởi động hoàn toàn
timeout /t 8 /nobreak > nul

REM Mở trình duyệt web tự động
echo Dang mo trinh duyet web...
start http://localhost:8080

echo Da mo tat ca cac cua so va trinh duyet web!
echo ================================
echo  TAT CA DICH VU DA KHOI DONG!
echo ================================
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:5000
echo. 