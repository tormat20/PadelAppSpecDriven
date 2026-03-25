# Research: OCR/Paste Accuracy Uplift + Learned Corrections

## Decision 1: Keep parser architecture; add targeted jammed-boundary tie-breakers

- **Decision**: Preserve the existing booking-text heuristic pipeline and patch only jammed local-part boundary selection for known edge failures.
- **Rationale**: Current quality is already strong (~22/24), so a surgical fix minimizes regression risk and delivery scope.
- **Alternatives considered**:
  - Full parser rewrite with grammar/state machine: rejected due high risk and unnecessary scope.
  - OCR model-side changes: rejected because failures occur in text parsing stage, not image recognition only.

## Decision 2: Use email-first boundary confidence within existing heuristics

- **Decision**: Introduce narrow scoring/tie-break rules that prefer plausible email local parts (underscore/alnum combinations, surname-local patterns, and non-truncating digit suffix handling) while keeping current rule order.
- **Rationale**: Known failures show premature splits into first-name fragments; email-local plausibility is the most stable disambiguation signal.
- **Alternatives considered**:
  - Use first matching name token boundary only: rejected because it causes early false splits (`daniel@...` extracted from `haglund_daniel`).
  - Aggressive fuzzy NLP/NER parsing: rejected as over-complex for targeted uplift.

## Decision 3: Add explicit regressions from real failed rows

- **Decision**: Add fixture tests for the two reported failures and one non-regression case for current strong patterns (Swedish chars + all-caps jam).
- **Rationale**: Concrete regressions prevent recurrence while protecting already-correct behavior.
- **Alternatives considered**:
  - Rely on broad existing sample tests only: rejected because edge-case fixes need explicit coverage.

## Decision 4: Persist correction memory in backend shared storage

- **Decision**: Store user-confirmed corrections in backend persistence (DuckDB), not local/session-only memory.
- **Rationale**: Corrections must survive sessions/devices and be reusable for organizer workflows.
- **Alternatives considered**:
  - Frontend local storage cache: rejected due device/session isolation.
  - In-memory process cache: rejected due restart loss and lack of shared behavior.

## Decision 5: Resolve corrections by deterministic signature + recency priority

- **Decision**: Use deterministic noisy-row signatures for correction lookup; when multiple candidates exist, choose most recent valid correction and track use metadata.
- **Rationale**: Product requirement explicitly favors “most recent edit wins” while remaining auditable.
- **Alternatives considered**:
  - Frequency-only winner: rejected because stale historical behavior can dominate newer confirmed fixes.
  - Pure raw-string key without normalization: rejected due brittleness against minor OCR/paste variations.

## Decision 6: Auto-apply only when safe; otherwise surface review state

- **Decision**: Apply learned corrections automatically only when confidence is high and no stronger identity conflict exists; otherwise flag for user review.
- **Rationale**: Maintains one-pass automation while preventing silent wrong merges.
- **Alternatives considered**:
  - Always auto-apply learned correction: rejected due silent overwrite risk.
  - Always require review: rejected due unnecessary manual overhead for repeat known patterns.

## Decision 7: Preserve import UX and layer correction indicators into current panel

- **Decision**: Keep current `OcrImportPanel` interaction model and add resolution metadata (auto-corrected/suggested/unchanged) plus edit persistence hooks.
- **Rationale**: Non-goal excludes major UX redesign; incremental UI cues are sufficient.
- **Alternatives considered**:
  - New dedicated correction workflow screen: rejected as scope expansion.
