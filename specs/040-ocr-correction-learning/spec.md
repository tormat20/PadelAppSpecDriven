# Feature Specification: OCR/Paste Accuracy Uplift + Learned Corrections

**Feature Branch**: `040-ocr-correction-learning`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Improve OCR/paste accuracy with targeted parser fixes and backend-persisted learned corrections"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct edge-case parsing in bulk paste (Priority: P1)

As an event organizer importing participant lists, I want known jammed name/email edge cases to parse correctly so I can add the roster in one pass without manually fixing obvious mistakes.

**Why this priority**: This removes current high-friction errors while preserving the already strong baseline parser behavior.

**Independent Test**: Paste the known problematic lines and verify parsed name/email output is correct, while existing real-world sample fixtures still pass unchanged.

**Acceptance Scenarios**:

1. **Given** a pasted participant row `Daniel Haglund Theemasirihaglund_daniel@hotmail.com`, **When** the list is parsed, **Then** the parsed name is `Daniel Haglund Theemasiri` and parsed email is `haglund_daniel@hotmail.com`.
2. **Given** a pasted participant row `Mikael Anderssonmicke0522@gmail.com`, **When** the list is parsed, **Then** the parsed name is `Mikael Andersson` and parsed email is `micke0522@gmail.com`.
3. **Given** a previously passing real-world booking sample, **When** the list is parsed, **Then** previously correct participant rows remain correct.

---

### User Story 2 - Auto-correct from learned historical edits (Priority: P2)

As an event organizer importing recurring participant lists, I want the system to remember prior confirmed corrections so similar future noisy rows are auto-corrected without manual review each time.

**Why this priority**: Repeated imports are common, so correction memory provides compounding value and reduces repeated micro-edits.

**Independent Test**: Correct a parsed row once, save it, then re-import a similar noisy row and verify the system auto-applies the most recent correction.

**Acceptance Scenarios**:

1. **Given** a user has confirmed a correction for a noisy row signature, **When** a matching noisy row is imported again, **Then** the system auto-applies the most recent correction.
2. **Given** multiple historical corrections exist for a noisy signature, **When** the row is imported, **Then** the newest confirmed correction is used.
3. **Given** no learned correction exists for a noisy row, **When** the row is imported, **Then** current parser output is shown and normal review behavior remains available.

---

### User Story 3 - Safe conflict handling and review visibility (Priority: P3)

As an event organizer, I want uncertain or conflicting auto-corrections clearly surfaced so I can fix mismatches before confirming import.

**Why this priority**: Protects data quality and prevents silent wrong merges.

**Independent Test**: Import rows that produce ambiguous/conflicting matches and verify they are flagged for review instead of force-applied.

**Acceptance Scenarios**:

1. **Given** a learned correction conflicts with a stronger existing identity match, **When** the row is processed, **Then** the row is flagged for manual review and not silently overwritten.
2. **Given** an auto-correction is applied from correction memory, **When** results are shown, **Then** the row indicates it was auto-corrected from prior confirmed edits.

---

### Edge Cases

- A pasted list contains mixed formats (plain rows, jammed rows, boilerplate lines) in a single import.
- A noisy row partially matches multiple existing players with similar names.
- A learned correction points to an email that no longer maps to the same player identity.
- A user edits only the name or only the email; the system still persists and reuses that partial correction safely.
- Re-import occurs long after prior corrections; recency ordering still picks the latest confirmed correction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve the current parser flow and apply targeted boundary-selection improvements for jammed name/email rows without replacing the full parser approach.
- **FR-002**: The system MUST correctly parse the two known failing examples as explicit regressions.
- **FR-003**: The system MUST keep existing real-world booking parser fixtures passing after targeted improvements.
- **FR-004**: The system MUST store user-confirmed OCR/paste corrections in persistent shared storage so corrections survive sessions and devices.
- **FR-005**: The system MUST generate a deterministic noisy-row signature used to look up learned corrections on future imports.
- **FR-006**: The system MUST apply learned corrections automatically when confidence is high and no higher-priority identity conflict exists.
- **FR-007**: The system MUST use the most recent confirmed correction when multiple learned corrections exist for the same noisy signature family.
- **FR-008**: The system MUST surface uncertain or conflicting learned matches for manual review instead of force-applying them.
- **FR-009**: The system MUST show when a row was auto-corrected from historical corrections.
- **FR-010**: The system MUST allow users to manually edit parsed rows before final confirmation, and confirmed edits MUST feed correction learning.
- **FR-011**: The system MUST track correction usage metadata (at minimum recency and use count) to support ranking and monitoring.
- **FR-012**: The system MUST continue to support one-pass bulk confirmation for correctly parsed or confidently auto-corrected rows.

### Key Entities *(include if feature involves data)*

- **Parsed Participant Row**: A single imported participant candidate containing raw extracted name/email, normalized signature, confidence state, and any resolved correction status.
- **Learned OCR Correction**: A persistent record linking a noisy row signature and source type to a user-confirmed corrected name/email and optional resolved player identity, including recency and usage metadata.
- **Correction Resolution Outcome**: The decision object for each row (`auto-corrected`, `suggested for review`, `unchanged`) with reason metadata used by UI and audit display.

### Assumptions & Dependencies

- Existing parser quality is already acceptable for most rows; improvements are targeted at known edge-case patterns.
- Import users prefer high automation and batch confirmation, with manual intervention only for flagged rows.
- Persistent correction memory is shared for authorized organizer workflows and available during import.
- Existing player catalog matching remains available and can be used to detect higher-priority identity conflicts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The two known failing sample rows are parsed correctly in automated regression tests with 100% pass rate.
- **SC-002**: Existing booking parser fixture suites remain green with no decrease in previously verified participant extraction accuracy.
- **SC-003**: In repeated imports containing previously corrected noisy rows, at least 90% of those rows are auto-corrected without manual edits.
- **SC-004**: For a typical 24-participant import, manual correction actions decrease versus the pre-feature baseline.
- **SC-005**: Conflicting or uncertain correction candidates are surfaced for review in 100% of detected conflict cases (no silent overwrite).
