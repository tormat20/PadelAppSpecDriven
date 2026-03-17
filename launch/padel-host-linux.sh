#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Padel Host — Linux launcher
# Called by PadelHost.desktop when double-clicked in a file manager.
# Requires: Docker (https://docs.docker.com/engine/install/)
#           docker compose plugin or docker-compose v2
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        Padel Host — Starting         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Check Docker ──────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "❌  Docker not found."
    echo "    Install Docker: https://docs.docker.com/engine/install/"
    read -rp "Press Enter to close..."
    exit 1
fi

if ! docker info &>/dev/null; then
    echo "⏳  Docker daemon not running. Trying to start it..."
    sudo systemctl start docker || true
    sleep 3
    if ! docker info &>/dev/null; then
        echo "❌  Could not start Docker. Please start it manually:"
        echo "    sudo systemctl start docker"
        read -rp "Press Enter to close..."
        exit 1
    fi
    echo "✅  Docker is ready."
    echo ""
fi

# ── Generate .env if missing ──────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    echo "🔑  No .env found — generating a JWT secret key..."
    SECRET=$(openssl rand -hex 32)
    echo "PADEL_JWT_SECRET_KEY=$SECRET" > .env
    echo "    Saved to .env"
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

sleep 3

# Try common Linux browser openers
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost"
elif command -v gnome-open &>/dev/null; then
    gnome-open "http://localhost"
fi

echo "    To stop:           docker compose down"
echo "    To wipe data too:  docker compose down -v"
echo ""
read -rp "Press Enter to close this window (the app keeps running)..."
