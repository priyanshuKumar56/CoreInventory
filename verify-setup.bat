@echo off
echo 🔍 CoreInventory Setup Verification
echo ==================================

REM Check Docker
echo 📦 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed
    pause
    exit /b 1
)
echo ✅ Docker is installed

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check docker-compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed
    pause
    exit /b 1
)
echo ✅ Docker Compose is installed

REM Check Node.js
echo 🟢 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js is installed (%NODE_VERSION%)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm is installed (%NPM_VERSION%)

REM Check PostgreSQL
echo 🐘 Checking PostgreSQL...
pg_isready -q -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not running ^(required for manual development^)
) else (
    echo ✅ PostgreSQL is running on localhost:5432
)

REM Check project structure
echo 📁 Checking Project Structure...
if exist Backend (
    if exist Frontend (
        echo ✅ Backend and Frontend directories exist
    ) else (
        echo ❌ Frontend directory missing
        pause
        exit /b 1
    )
) else (
    echo ❌ Backend directory missing
    pause
    exit /b 1
)

REM Check Backend dependencies
if exist Backend\package.json (
    echo ✅ Backend package.json exists
    if exist Backend\node_modules (
        echo ✅ Backend dependencies installed
    ) else (
        echo ⚠️  Backend dependencies not installed ^(run: cd Backend ^&^& npm install^)
    )
) else (
    echo ❌ Backend package.json missing
)

REM Check Frontend dependencies
if exist Frontend\package.json (
    echo ✅ Frontend package.json exists
    if exist Frontend\node_modules (
        echo ✅ Frontend dependencies installed
    ) else (
        echo ⚠️  Frontend dependencies not installed ^(run: cd Frontend ^&^& npm install^)
    )
) else (
    echo ❌ Frontend package.json missing
)

REM Check Docker files
if exist docker-compose.yml (
    echo ✅ docker-compose.yml exists
    docker-compose config >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose configuration has errors
    ) else (
        echo ✅ Docker Compose configuration is valid
    )
) else (
    echo ❌ docker-compose.yml missing
)

if exist Backend\Dockerfile (
    if exist Frontend\Dockerfile (
        echo ✅ Dockerfiles exist
    ) else (
        echo ❌ Frontend Dockerfile missing
    )
) else (
    echo ❌ Backend Dockerfile missing
)

REM Check environment files
if exist Backend\env.example (
    echo ✅ Backend env.example exists
    if exist Backend\.env (
        echo ✅ Backend .env exists ^(manual development ready^)
    ) else (
        echo ⚠️  Backend .env missing ^(copy env.example to .env for manual development^)
    )
) else (
    echo ❌ Backend env.example missing
)

echo.
echo 🎉 Setup Verification Complete!
echo ===============================
echo.
echo Next Steps:
echo 1. For Docker development: docker-compose up -d
echo 2. For manual development: start-dev.bat
echo 3. View documentation: README-DOCKER.md
echo.
echo Services will be available at:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:5000
echo - API Docs: http://localhost:5000/api
echo.
pause
