# Quickstart: Frontend Visual Redesign

## Prerequisites

- Node.js 20+
- npm installed
- Backend available when validating end-to-end flows

## 1) Install and run frontend

```bash
cd frontend
npm install
npm run dev
```

Open the app and verify primary routes:
- `/`
- `/events/create`
- `/events/<eventId>/preview`
- `/events/<eventId>/run`
- `/events/<eventId>/summary`

## 2) Implement in planned slices

1. Design foundation (tokens, layers, global styles, reusable primitives)
2. App shell redesign (header/background/layout framing)
3. Page migrations (Home, Create, Preview, Run, Summary)
4. Motion and reduced-motion pass
5. Validation pass (workflow parity + quality gates)

## Baseline Capture (Before/After)

Before implementation and after each story phase:

1. Capture desktop screenshots for `/`, `/events/create`, `/events/<eventId>/preview`, `/events/<eventId>/run`, and `/events/<eventId>/summary`.
2. Capture mobile screenshots for the same routes at 390x844 viewport.
3. Record route transition timing for home -> create and run -> summary.
4. Record reduced-motion behavior (`prefers-reduced-motion: reduce`) for interactive transitions.
5. Attach evidence links in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`.

## 3) Validate automated checks

```bash
cd frontend
npm run lint
npm run test
```

## 4) Validate manual quality gates

- Browser matrix: latest 2 stable Chrome/Safari/Firefox/Edge
- Responsive checks: desktop + mobile widths
- Accessibility checks: keyboard/focus/contrast against WCAG 2.1 AA for primary workflows
- Reduced motion: ensure non-essential animations are disabled and static alternatives are visible
- Performance checks: initial page interactive <=2.5s and route transitions <=1.0s under standard broadband test conditions

## 5) Regression parity checklist

- Create event flow outcome unchanged
- Preview flow outcome unchanged
- Run event scoring and round progression unchanged
- Summary outcome semantics unchanged
