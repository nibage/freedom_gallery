@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Freedom Gallery needs Node.js 20 or newer for the optional offline launcher.
  echo Install Node.js or double-click index.html to use the original file mode.
  pause
  exit /b 1
)
node "%~dp0gallery-local-server.cjs"
if errorlevel 1 pause
