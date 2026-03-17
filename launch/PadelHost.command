#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Padel Host — macOS launcher
# Double-click this file in Finder to start the app.
# Requires: Docker Desktop (https://www.docker.com/products/docker-desktop/)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Move to the repo root (one level up from this script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        Padel Host — Starting         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Check Docker is installed and running ─────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "❌  Docker not found."
    echo "    Download Docker Desktop from https://www.docker.com/products/docker-desktop/"
    echo "    Then run this file again."
    read -rp "Press Enter to close..."
    exit 1
fi

if ! docker info &>/dev/null; then
    echo "⏳  Docker Desktop is installed but not running."
    echo "    Opening Docker Desktop for you..."
    open -a Docker
    echo "    Waiting for Docker to start (this can take ~30 seconds)..."
    for i in $(seq 1 30); do
        sleep 2
        if docker info &>/dev/null; then
            echo "✅  Docker is ready."
            break
        fi
        if [ "$i" -eq 30 ]; then
            echo "❌  Docker did not start in time. Please start Docker Desktop manually and try again."
            read -rp "Press Enter to close..."
            exit 1
        fi
    done
fi

# ── Generate .env if it doesn't exist yet ─────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "🔑  No .env found — generating a JWT secret key..."
    SECRET=$(openssl rand -hex 32)
    echo "PADEL_JWT_SECRET_KEY=$SECRET" > .env
    echo "    Saved to .env (keep this file, it protects your login tokens)"
    echo ""
fi

# ── Build and start ───────────────────────────────────────────────────────────
echo "🐳  Starting containers (first run builds images — ~2 min)..."
echo ""
docker compose up --build --detach

echo ""
echo "✅  Padel Host is running!"
echo "    Opening http://localhost in your browser..."
echo ""
echo "    To stop:  docker compose down"
echo "    To wipe data too: docker compose down -v"
echo ""

# Open the browser after a short delay to let Nginx start
sleep 3
open "http://localhost"
