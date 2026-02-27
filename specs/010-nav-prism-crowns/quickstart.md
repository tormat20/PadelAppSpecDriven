# Quickstart: Navigation Shell, Prism Background, and Final Winner Crowns

## 1) Validate full-width top navigation shell

1. Start frontend app and open any route.
2. Confirm top navigation shell spans full viewport width.
3. Confirm main content remains in expected layout below top nav.

## 2) Validate logo-only home button

1. Locate header logo button in top nav.
2. Confirm text label is absent.
3. Confirm button uses `images/logos/Molndal-padel-bg-removed.png` and logo is centered within circular button.
4. Confirm button remains keyboard-focusable and activates home navigation.

## 3) Validate global prism background

1. Visit multiple app routes.
2. Confirm prism background appears globally and stays behind content.
3. Confirm foreground buttons/inputs remain interactive.
4. Enable reduced-motion preference and confirm animation is reduced/disabled while visual background remains coherent.

## 4) Validate final-summary crowns

1. Load an in-progress event summary and confirm no crown icons appear.
2. Load a Mexicano final summary fixture with top-score tie and confirm all tied top-score players show crowns.
3. Load an Americano final summary fixture and confirm exactly two crown icons on winning team from final-round highest-court match.
4. Load a BeatTheBox final summary and confirm no crowns.

## 5) Automated checks

```bash
# Frontend
cd frontend
npm run lint
npm run test

# Backend (from repository root)
cd /home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1
uv sync --directory backend
PYTHONPATH=. uv run --directory backend pytest tests/contract tests/integration
```
