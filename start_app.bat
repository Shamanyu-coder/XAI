@echo off
echo Starting Yoga App...

echo Starting Backend...
start "Yoga Backend" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload"

echo Starting Frontend...
start "Yoga Frontend" cmd /k "cd frontend && npm run dev"

echo ====================================================
echo App is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ====================================================
