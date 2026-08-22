@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js/npm is required in PATH. & exit /b 1)
where cargo >nul 2>nul || (echo Rust/Cargo is required in PATH. & exit /b 1)
call npm run tauri -- build
