# Quickstart: OCR/Paste Accuracy Uplift + Learned Corrections

## Goal

Validate targeted parser fixes for known jammed name/email failures and verify backend-persisted learned corrections auto-apply safely on repeated imports.

## Prerequisites

- Frontend dependencies installed (`frontend/`).
- Backend dependencies installed (`backend/`).
- Test database/migrations available.
- Organizer-access flow to OCR/Paste import panel.

## Manual Validation Flow

1. Open player OCR/Paste import panel and paste:
   - `Daniel Haglund Theemasirihaglund_daniel@hotmail.com`
   - `Mikael Anderssonmicke0522@gmail.com`
2. Verify parser outputs:
   - `Daniel Haglund Theemasiri` + `haglund_daniel@hotmail.com`
   - `Mikael Andersson` + `micke0522@gmail.com`
3. Confirm import and ensure rows can be added in one pass.
4. Force one manual edit for a noisy row and confirm save.
5. Re-import same noisy row.
6. Verify correction is auto-applied from learned memory and row is marked as auto-corrected.
7. Create a conflict case (learned correction vs stronger exact identity match).
8. Verify row is flagged for review (not silently overwritten).

## Automated Validation Commands

Frontend lint/type check:

```bash
cd frontend
npm run lint
```

Frontend parser and OCR flow tests (targeted):

```bash
cd frontend
npm test -- --run tests/booking-text-parser.test.ts tests/ocr-import.test.ts
```

Backend correction contract tests (targeted):

```bash
cd backend
PYTHONPATH=. pytest tests/contract/test_ocr_corrections_api.py
```

Full regression:

```bash
cd frontend && npm test
cd backend && PYTHONPATH=. pytest
```

## Expected Outcomes

- Known failing parser samples pass reliably.
- Existing parser fixture suite does not regress.
- Learned corrections persist and are reused on repeated imports.
- Conflict scenarios are surfaced for manual review instead of force-applied.

## Validation Outcomes (2026-03-25)

- Frontend type/lint check passed: `cd frontend && npm run lint`
- Frontend targeted OCR/parser tests passed: `cd frontend && npm test -- --run tests/booking-text-parser.test.ts tests/ocr-import.test.ts`
- Frontend full suite passed: `cd frontend && npm test`
- Backend syntax validation passed for changed OCR files: `cd backend && python -m py_compile app/repositories/ocr_corrections_repo.py app/services/ocr_correction_service.py app/api/routers/ocr.py app/api/deps.py tests/contract/test_ocr_corrections_api.py`
- Backend `pytest` verification could not run in this environment because `pytest` is not installed (`pytest: command not found` for both targeted and full commands)

## Edge-case Notes

- Suggested corrections are never auto-applied; they are surfaced as review indicators.
- If parsed email has an exact catalog match but learned auto-correction points to a different catalog identity, the row is forced to `conflict` and parsed values are kept.
