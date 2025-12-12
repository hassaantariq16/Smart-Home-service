@echo off
echo ============================================================
echo  Smart Services Platform - Quick Start
echo ============================================================
echo.

echo [1/6] Checking prerequisites...
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker not found! Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo   - Docker: OK
echo   - Node.js: OK
echo.

echo [2/6] Starting databases with Docker...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start databases!
    pause
    exit /b 1
)
echo   - All 5 databases starting...
echo.

echo [3/6] Waiting for databases to initialize (60 seconds)...
timeout /t 60 /nobreak >nul
echo   - Databases should be ready now
echo.

echo [4/6] Installing backend dependencies...
cd backend
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
)
echo   - Dependencies installed
echo.

echo [5/6] Testing database connections...
call npm run test
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some database connections failed. Retrying in 30 seconds...
    timeout /t 30 /nobreak >nul
    call npm run test
)
echo.

echo [6/6] Initializing databases and seeding data...
call npm run init-db
call npm run seed
echo.

echo ============================================================
echo  Setup Complete!
echo ============================================================
echo.
echo Sample Login:
echo   Email: john@example.com
echo   Password: password123
echo.
echo Starting backend server...
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

call npm run dev
