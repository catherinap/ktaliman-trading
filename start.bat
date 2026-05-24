@echo off
echo Starting Ktaliman Trading Platform...

start "Backend" cmd /k "cd /d %~dp0backend && py -3 -m uvicorn main:app --reload --port 8000"

timeout /t 4 /nobreak >nul

start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 6 /nobreak >nul

start "" "http://localhost:5173"