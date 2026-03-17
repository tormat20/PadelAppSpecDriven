@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM Padel Host — Windows launcher
REM Double-click this file in Explorer to start the app.
REM Requires: Docker Desktop (https://www.docker.com/products/docker-desktop/)
REM ─────────────────────────────────────────────────────────────────────────────

title Padel Host — Launcher

REM Move to the repo root (one level up from this script's directory)
cd /d "%~dp0.."

echo.
echo ╔══════════════════════════════════════╗
echo ║        Padel Host — Starting         ║
echo ╚══════════════════════════════════════╝
echo.

REM ── Check Docker is installed ────────────────────────────────────────────────
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found.
    echo         Download Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo         Then run this file again.
    pause
    exit /b 1
)

REM ── Check Docker daemon is responding ────────────────────────────────────────
docker info >nul 2>&1
if errorlevel 1 (
    echo [INFO] Docker Desktop is installed but not running.
    echo        Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo        Waiting for Docker to start (this can take ~30 seconds)...
    :wait_loop
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 goto wait_loop
    echo [OK] Docker is ready.
    echo.
)

REM ── Generate .env if it doesn't exist ────────────────────────────────────────
if not exist ".env" (
    echo [INFO] No .env found - generating a JWT secret key...
    REM Use PowerShell to generate a hex secret
    for /f "delims=" %%i in ('powershell -NoProfile -Command "[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('-','').ToLower()"') do (
        echo PADEL_JWT_SECRET_KEY=%%i> .env
    )
    echo        Saved to .env
    echo.
)

REM ── Build and start ───────────────────────────────────────────────────────────
echo [INFO] Starting containers (first run builds images - ~2 min)...
echo.
docker compose up --build --detach
if errorlevel 1 (
    echo.
    echo [ERROR] docker compose failed. See output above.
    pause
    exit /b 1
)

echo.
echo [OK] Padel Host is running!
echo      Opening http://localhost in your browser...
echo.
echo      To stop:           docker compose down
echo      To wipe data too:  docker compose down -v
echo.

REM Wait a moment for Nginx to be ready, then open browser
timeout /t 4 /nobreak >nul
start "" "http://localhost"

echo Press any key to close this window (the app keeps running in the background).
pause >nul
