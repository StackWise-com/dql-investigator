@echo off
chcp 65001 >nul
echo ==========================================================
echo         DQL Investigator - Starting...
echo ==========================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking dependencies...
if not exist "node_modules" (
  echo   - node_modules not found. Running npm install...
  call npm install
  if errorlevel 1 (
    echo   X npm install failed.
    pause
    exit /b 1
  )
  echo   + Dependencies installed.
) else (
  echo   + node_modules exists.
)

echo.
echo [2/2] Starting Next.js dev server...
echo   - Open http://localhost:3000 in your browser
echo   - Press Ctrl+C to stop
echo.

npm run dev

if errorlevel 1 (
  echo.
  echo X Dev server exited with an error.
  pause
)
