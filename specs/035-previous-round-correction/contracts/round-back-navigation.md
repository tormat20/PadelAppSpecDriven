# Contract: Previous Round Navigation and Correction Rebuild

## Purpose

Define expected behavior when hosts navigate backward in an ongoing event, correct prior-round scores, and move forward again.

## Navigation Contract

## 1) Previous Round Action

- **Trigger**: Host selects `Previous Round`.
- **Allowed When**: Current round number is greater than 1.
- **Result**:
  - Event view loads immediately prior round match setup.
  - Saved results for that round are available for correction.

## 2) First Round Boundary

- **Trigger**: Host selects `Previous Round` while on Round 1.
- **Result**:
  - No navigation occurs.
  - Warning-style message is shown in existing orange warning format.

## Correction & Rebuild Contract

## 3) Correct Previous Round Score

- **Trigger**: Host edits and saves a score in previous-round context.
- **Validation**:
  - Existing per-mode score rules apply.
  - Existing auth and stale-write conflict checks apply.

## 4) Rebuild Downstream Rounds

- **On Successful Correction**:
  - All downstream rounds generated from pre-correction data are invalidated.
  - Next round assignments are regenerated from corrected prior results.
  - Forward progression then uses regenerated state.

## 5) Failure Handling

- **Validation failure**: correction rejected, existing saved results remain unchanged.
- **Conflict failure**: correction rejected with refresh/retry guidance.

## Audit Contract

- Accepted corrections preserve correction history metadata (before/after values, editor, timestamp) using existing correction audit pathway.
