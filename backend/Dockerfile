# syntax=docker/dockerfile:1
# ── Padel Host — Backend ──────────────────────────────────────────────────────
# Python 3.12 + uv (from Astral's official image)
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Non-root user for security
RUN groupadd --system --gid 999 nonroot \
 && useradd  --system --gid 999 --uid 999 --create-home nonroot

WORKDIR /app

# uv settings ─────────────────────────────────────────────────────────────────
# Compile .pyc files so first-import is fast
ENV UV_COMPILE_BYTECODE=1
# Copy files from the cache rather than symlinking (works inside Docker)
ENV UV_LINK_MODE=copy
# Skip dev-only packages (pytest, ruff, mypy, …)
ENV UV_NO_DEV=1
# Make the virtualenv's bin directory the first thing on PATH
ENV PATH="/app/.venv/bin:$PATH"

# Install dependencies first — this layer is cached as long as the lockfile
# and pyproject.toml don't change.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the rest of the source and install the project itself
COPY . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# The data directory is where the DuckDB file lives (mounted as a volume)
RUN mkdir -p /app/data && chown nonroot:nonroot /app/data

USER nonroot

EXPOSE 8000

# Production server — no hot-reload
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
