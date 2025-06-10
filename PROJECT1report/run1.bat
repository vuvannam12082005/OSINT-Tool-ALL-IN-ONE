@echo off
echo ================================
echo  KHOI DONG OSINT TOOL SYSTEM
echo ================================
echo.

:: Set UTF-8 encoding for Python
set PYTHONIOENCODING=utf-8
set PYTHONLEGACYWINDOWSSTDIO=1

echo [1/2] Dang khoi dong Frontend React (npm run dev)...
cd web-tool-tuyet-dep
start /B cmd /c "npm run dev"

:: Wait a moment for Vite to start
timeout /t 5 /nobreak > nul

:: Open browser after Vite starts
echo [1/2] Mo trinh duyet web...
start http://localhost:8080

echo.
echo [2/2] Dang chay dong bo file (sync)...
npm run sync
echo [2/2] Dong bo file hoan thanh!


echo.
echo ================================
echo  TAT CA DICH VU DA KHOI DONG!
echo ================================
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:5000
echo.
echo Nhan Enter de dong cua so...
pause > nul 