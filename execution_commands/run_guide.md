# Project Execution Guide

This guide contains all the commands required to set up and run the AI Yoga Coach project.

## 1. Backend Setup & Run

### Initial Setup (One-time)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Run Backend
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

---

## 2. Frontend Setup & Run

### Initial Setup (One-time)
```powershell
cd frontend
npm install
```

### Run Frontend
```powershell
cd frontend
npm run dev -- --port 5173
```

---

## 3. Automation (One-click)
You can run the `run_project.bat` file in this folder to start both servers automatically.
