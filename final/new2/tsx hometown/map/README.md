# Hướng dẫn chạy project cho người mới

## Bước 1: Cài đặt Node.js
```powershell
winget install OpenJS.NodeJS
```

## Bước 2: Refresh PATH (sau khi cài Node.js)
```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')
```

## Bước 3: Set execution policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Bước 4: Cài đặt dependencies
```powershell
npm install
```

## Bước 5: Build project
```powershell
npm run build
```

## Bước 6: Chạy server
```powershell
npx serve dist
```

Sau đó mở trình duyệt và truy cập: http://localhost:3000
