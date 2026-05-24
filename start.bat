@echo off
echo Starting Ktaliman Trading Platform...

start "Backend" cmd /k "cd backend && py -3 -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

start "Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173