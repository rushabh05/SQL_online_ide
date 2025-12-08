---
description: Start the SQL Playground application (backend + frontend)
---

# Start SQL Playground

This workflow starts both the backend API server and the frontend development server.

## Prerequisites
- Python dependencies installed (`pip install -r backend/requirements.txt`)
- Node dependencies installed (`npm install` in frontend directory)

## Steps

### 1. Start Backend Server
```bash
cd backend
python main.py
```
**Expected output:**
- Server running on http://localhost:8000
- API docs available at http://localhost:8000/docs

### 2. Start Frontend Development Server
Open a new terminal and run:
```bash
cd frontend
npm run dev
```
**Expected output:**
- Vite dev server running on http://localhost:5173
- Application opens automatically in browser

### 3. Verify Application
- Open http://localhost:5173 in your browser
- You should see the SQL Playground interface
- Check that "Session Active" badge appears in the header

### 4. Test with Sample Data
- Upload the sample_data.csv file from the project root
- Run a test query: `SELECT * FROM sample_data LIMIT 10;`
- Verify results appear in the results panel

## Troubleshooting

**Backend won't start:**
- Check if port 8000 is already in use
- Verify Python dependencies are installed
- Check Python version (3.9+ required)

**Frontend won't start:**
- Check if port 5173 is already in use
- Verify npm dependencies are installed
- Clear node_modules and run `npm install` again

**Session not connecting:**
- Ensure backend is running first
- Check browser console for errors
- Verify CORS settings in backend/main.py

## Quick Test Commands

After both servers are running:

1. **Health check backend:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Create session:**
   ```bash
   curl -X POST http://localhost:8000/api/session/create
   ```

3. **Open frontend:**
   Navigate to http://localhost:5173

## Stopping the Application

1. Stop frontend: Press `Ctrl + C` in the frontend terminal
2. Stop backend: Press `Ctrl + C` in the backend terminal
