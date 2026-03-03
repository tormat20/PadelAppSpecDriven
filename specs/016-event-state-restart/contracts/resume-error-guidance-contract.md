# Contract: Resume/Load Error Guidance and Duplicate Warning Accuracy

## Purpose

Define actionable resume/load failure messaging and self-duplicate warning correctness.

## Rules

1. Resume/load failures provide actionable next-step guidance.
2. UI must not display only a generic `Network error` message for resume/load failures.
3. Edit duplicate warning excludes the currently edited event when checking same name/date/time.
4. Duplicate warning appears only when another matching event exists.

## Response Expectations

1. Failure payloads include stable error identifiers and human-readable guidance.
2. Edit/create validation can differentiate self from true duplicate records.

## Verification Targets

- Backend contract tests for structured resume/load failure responses.
- Frontend tests for actionable error rendering and self-duplicate warning suppression.
