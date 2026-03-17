# Padel Host — Launchers

Double-click the right file for your operating system. No terminal needed.

| Platform | File to double-click | Prerequisite |
|---|---|---|
| **macOS** | `PadelHost.command` | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Windows** | `PadelHost.bat` | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Linux** | `PadelHost.desktop` | [Docker Engine](https://docs.docker.com/engine/install/) |

### First run

1. The script checks that Docker is running (and tries to start it if not).
2. It generates a `.env` file in the repo root with a random JWT secret key — **keep this file**, it protects your login tokens.
3. It runs `docker compose up --build` — first build takes ~2 minutes.
4. It opens **http://localhost** in your browser automatically.

### macOS — one extra step

macOS quarantines downloaded files. Before the first double-click, run this once in Terminal:

```bash
chmod +x /path/to/PadelAppSpecDriven/launch/PadelHost.command
```

Or: right-click → Open → Open (to bypass Gatekeeper).

### Linux — mark as executable

```bash
chmod +x launch/PadelHost.desktop launch/padel-host-linux.sh
```

In most file managers: right-click the `.desktop` file → Properties → Allow executing as program.
