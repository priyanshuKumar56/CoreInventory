@echo off
echo 🚀 Starting CoreInventory Development Environment
echo ==============================================

REM Check if PostgreSQL is running (Windows check)
pg_isready -q -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not running on localhost:5432
    echo Please start PostgreSQL service first:
    echo   - On Windows: net start postgresql-x64-14
    pause
    exit /b 1
)

echo ✅ PostgreSQL is running

REM Start Backend
echo 📦 Starting Backend...
cd Backend

if not exist .env (
    echo 📝 Creating .env file from env.example...
    copy env.example .env
    echo ⚠️  Please update Backend\.env with your database credentials
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing Backend dependencies...
    npm install
)

REM Run migrations and start server in background
start /B cmd /c "npm run migrate && npm run seed && npm run dev"
echo ✅ Backend started on http://localhost:5000
echo 📋 API Documentation: http://localhost:5000/api

REM Start Frontend
echo 🎨 Starting Frontend...
cd ..\Frontend

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing Frontend dependencies...
    npm install
)

REM Start frontend dev server
start /B cmd /c "npm run dev"
echo ✅ Frontend started on http://localhost:5173

echo.
echo 🎉 Development Environment Ready!
echo =================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo API Docs: http://localhost:5000/api
echo.
echo Press any key to stop...
pause >nul

REM Stop all node processes
taskkill /f /im node.exe >nul 2>&1
echo 🛑 Services stopped
