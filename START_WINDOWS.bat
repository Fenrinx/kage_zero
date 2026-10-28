@echo off
setlocal
cd /d "%~dp0"
title KAGE ZERO 13.0.0 - Port 3060
cls
echo ==========================================================
echo  KAGE//ZERO 13.0.0
 echo  URL: http://127.0.0.1:3060/
echo  Health: http://127.0.0.1:3060/healthz
echo ==========================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20+ required
  pause
  exit /b 1
)
set "PORT=3060"
node server.mjs
echo.
echo Server stopped.
pause
endlocal
