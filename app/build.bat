@echo off
setlocal
cd /d "%~dp0src-tauri"
where cargo >nul 2>nul || (echo Rust/Cargo is required in PATH. & exit /b 1)
cargo %*
