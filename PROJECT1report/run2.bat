@echo off
:: Thiết lập UTF-8 encoding cho tiếng Việt
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONLEGACYWINDOWSSTDIO=1

:: Thiết lập font Consolas cho console để hỗ trợ tiếng Việt
reg add "HKCU\Console" /v FaceName /t REG_SZ /d "Consolas" /f >nul 2>&1
reg add "HKCU\Console" /v FontSize /t REG_DWORD /d 0x00140000 /f >nul 2>&1

echo.
echo Dang khoi dong Backend API Server...
echo Thiet lap encoding UTF-8 va font cho tieng Viet
echo.

:: Dùng đường dẫn tương đối
cd ".\hyvongcuoicung\new2"

:: Khởi động server trực tiếp với các thiết lập encoding (không dùng chcp)
start "Backend API Server - Port 5000" cmd /k "set PYTHONIOENCODING=utf-8 && set PYTHONLEGACYWINDOWSSTDIO=1 && echo ===== Backend API Server - Port 5000 ===== && echo Nhan Ctrl+C de dung server && echo. && python api_server.py"

echo Backend da duoc khoi dong trong cua so rieng
echo Server se chay tai: http://localhost:5000


