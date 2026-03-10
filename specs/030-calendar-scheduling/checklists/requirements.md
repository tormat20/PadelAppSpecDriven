# Requirements Checklist: Calendar Scheduling

**Purpose**: Validates that the spec.md for feature 030 is complete, internally consistent, and ready for planning.
**Created**: 2026-03-10
**Feature**: [spec.md](../spec.md)

## Completeness

- [x] CHK001 All user stories have a priority assigned (P1/P2/P3)
- [x] CHK002 All user stories have acceptance scenarios with Given/When/Then format
- [x] CHK003 All user stories have an "Independent Test" description
- [x] CHK004 Edge cases section is populated with realistic boundary conditions
- [x] CHK005 All functional requirements use MUST/MUST NOT language
- [x] CHK006 Success criteria are measurable and technology-agnostic
- [x] CHK007 Key entities are defined
- [x] CHK008 Assumptions are explicitly listed and numbered
- [x] CHK009 Dependencies on existing endpoints and services are identified

## Consistency

- [x] CHK010 FR-001 to FR-031 align with the acceptance scenarios in user stories 1–6
- [x] CHK011 Running/Finished locked-event behaviour is consistently described in user stories, edge cases, and FRs (FR-007, FR-013, FR-019, FR-028)
- [x] CHK012 Recurring event scope (client-side only, backend receives individual calls) is consistent between Assumption A3, FR-025–FR-028, and User Story 5
- [x] CHK013 Drag behaviour (30-minute snap, ghost block, optimistic update, revert on error) is consistently described in User Stories 1–4 and FR-008 to FR-014
- [x] CHK014 `recurrence_tag` is mentioned in FR-026 and Assumption A3 with matching semantics
- [x] CHK015 Duration derivation formula (`round_count × round_duration_minutes`, default 60) is consistent between FR-003, Assumption A1, and edge cases

## Feasibility

- [x] CHK016 No new npm packages are required — drag-and-drop uses native HTML5/pointer events (Assumption A6)
- [x] CHK017 Backend changes are scoped to: (1) exposing `round_duration_minutes` in the event API, (2) adding optional `recurrence_tag` field — no migration of existing data required
- [x] CHK018 `PATCH /api/v1/events/{id}` partial-update requirement is flagged in Assumption A7 and Dependencies
- [x] CHK019 All P1 stories (weekly view, drag-reschedule, click-to-edit) are independently deliverable without P2/P3 stories
- [x] CHK020 Daily court view (P3) is clearly scoped as additive to the weekly view and does not break the P1 MVP

## Risks & Open Questions

- [x] CHK021 RESOLVED (research.md Finding 3 + spec.md Assumption A7): PATCH supports partial updates — only sent fields are written; frontend sends only changed fields on drag/save
- [x] CHK022 RESOLVED (research.md Finding 1 + data-model.md): `round_duration_minutes` is already in DuckDB (`INTEGER NOT NULL`); no migration required; add to `EventResponse` schema only
- [x] CHK023 RESOLVED (spec.md clarification 2026-03-10): Side drawer — slides in from right, calendar grid remains visible behind it
- [x] CHK024 RESOLVED (spec.md Assumption A3 + clarification): No `recurrence_tag` stored; recurrence is pure frontend calculation; each occurrence is a plain independent Lobby event
- [x] CHK025 RESOLVED (spec.md clarification 2026-03-10 + research.md Finding 5): Admin-only route (`/calendar` under `RequireAdmin`); no navigation entry for regular users

## Notes

- Check items off as completed: `[x]`
- Open items (CHK021–CHK025) should be resolved during the planning phase before tasks are written
- SC-006 and SC-007 (no regressions) must be verified by running `PYTHONPATH=. uv run python -m pytest tests/ -q` (backend) and `npm test -- --run` (frontend) after implementation
