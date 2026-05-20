@echo off
echo Starting Todo PWA dev server...
echo.

:: Try Python first
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Using Python http.server on port 8000
  echo Open http://localhost:8000
  echo.
  python -m http.server 8000
  goto :eof
)

:: Fallback to npx serve
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Using npx serve on port 8000
  echo Open http://localhost:8000
  echo.
  npx serve . -p 8000
  goto :eof
)

echo Error: Neither Python nor Node.js found. Install one of them:
echo   Python: https://python.org
echo   Node.js: https://nodejs.org
pause
