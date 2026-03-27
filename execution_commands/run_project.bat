@echo off
echo Starting AI Yoga Coach...

echo Starting Backend on port 8000...
start "Yoga Backend" cmd /k "cd ..\backend && venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo Starting Frontend on port 5173...
start "Yoga Frontend" cmd /k "cd ..\frontend && npm run dev -- --port 5173"

echo ====================================================
echo Application is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ====================================================
