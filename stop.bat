@echo off
echo Stopping Smart Services Platform...
echo.

echo [1/2] Stopping backend server...
taskkill /F /IM node.exe >nul 2>nul
echo   - Backend stopped
echo.

echo [2/2] Stopping Docker containers...
docker-compose down
echo   - All databases stopped
echo.

echo ============================================================
echo  Platform stopped successfully
echo ============================================================
pause
