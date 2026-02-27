# UI Workflow Contract: Frontend Visual Redesign

## Purpose

Define the user-facing behavior contract that must remain stable while visual presentation is redesigned.

## Contract Scope

- Applies to primary host workflows on:
  - `/`
  - `/events/create`
  - `/events/:eventId/preview`
  - `/events/:eventId/run`
  - `/events/:eventId/summary`

## Behavioral Invariants

1. Existing route destinations and navigation paths remain unchanged.
2. Event creation validations and constraints remain unchanged.
3. Live event run actions (result entry and round advancement) remain unchanged.
4. Summary and preview data semantics remain unchanged.
5. Backend request/response semantics used by current workflows remain unchanged.

## UX Quality Contract

1. Browser support: latest 2 stable versions of Chrome, Safari, Firefox, and Edge.
2. Performance: initial page interactive <=2.5s; route transitions <=1.0s under standard broadband test conditions.
3. Accessibility: WCAG 2.1 AA across primary workflows.
4. Motion: non-essential animations disabled when reduced-motion preference is present; static alternatives available.
5. Responsive behavior: primary actions remain usable at desktop and mobile widths without horizontal overflow in default state.

## Allowed vs Prohibited Changes

### Allowed
- Visual styling updates (colors, spacing, typography, surfaces, backgrounds).
- Layout refinements that do not remove required controls or change workflow outcomes.
- Bug fixes needed to preserve existing workflow outcomes.

### Prohibited
- New product features unrelated to redesign.
- Intentional workflow behavior changes.
- API/contract changes that alter existing domain outcomes.

## Verification Matrix (Minimum)

- Create event flow parity: pass/fail
- Preview event flow parity: pass/fail
- Run event flow parity: pass/fail
- Summary flow parity: pass/fail
- Browser matrix pass (4 browsers): pass/fail
- Accessibility validation pass: pass/fail
- Reduced-motion validation pass: pass/fail
- Performance target pass: pass/fail

## Verification Log

- 2026-02-26: Route coverage smoke check confirms all primary workflow routes remain registered.
- 2026-02-26: Automated frontend validation passes (`npm run lint` and `npm run test` in `frontend/`).
- 2026-02-26: Manual browser matrix, reduced-motion behavior verification, and performance timing capture remain tracked in `specs/001-frontend-visual-redesign/checklists/qa-validation.md`.
