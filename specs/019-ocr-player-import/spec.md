# Feature Specification: OCR Player Import

**Feature Branch**: `019-ocr-player-import`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "I want to be able to provide a screenshot containing player names, have an OCR tool interpret the names, match them against the existing player database, and bulk-add/register them — to avoid manual typing of players."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Roster step: Import players from image (Priority: P1)

A host setting up a new event on the Create Event stepper (Step 1 — Roster) has a screenshot showing a list of player names — perhaps copied from a WhatsApp group chat, a tournament bracket, or another app. Rather than typing each name manually, the host wants to paste or upload the screenshot directly in the Roster step and have the app extract the names, match them against the existing player catalog, and bulk-assign the matched players to the event roster.

**Why this priority**: Directly accelerates the most common and most tedious part of event setup. Eliminates manual re-entry that causes typos and delays.

**Independent Test**: Open the Create Event page, navigate to Step 1 (Roster). Confirm an "Import from image" collapsed accordion is visible below the "Players" heading. Expand it and paste (or upload) a screenshot with names. Confirm extracted names are shown with match status. Confirm selecting names and clicking "Add to Roster" assigns the players and collapses the panel.

**Acceptance Scenarios**:

1. **Given** the Create Event Roster step is open, **When** the user views the step, **Then** a collapsed "Import from image" accordion is visible below the "Players" section heading and above the player search form.
2. **Given** the accordion is collapsed, **When** the user clicks "Import from image", **Then** the accordion expands revealing the OCR import panel (drop zone / paste instruction, and a file input).
3. **Given** the accordion is expanded, **When** the user pastes a screenshot image from the clipboard, **Then** the image is accepted and OCR processing begins immediately.
4. **Given** the accordion is expanded, **When** the user selects an image file via the file input, **Then** OCR processing begins immediately.
5. **Given** OCR processing is in progress, **When** the user views the panel, **Then** a loading indicator is shown and the confirm button is disabled.
6. **Given** OCR completes with extracted names, **When** the names are matched against the existing player catalog, **Then** matched names are shown pre-checked and labelled with the matched player's display name; unmatched names are shown unchecked.
7. **Given** a list of extracted names is displayed, **When** the user adjusts the checkboxes (checking or unchecking any name), **Then** only the checked names will be submitted.
8. **Given** the user clicks "Add to Roster", **When** at least one name is checked, **Then** for each checked name: if it matched a catalog player, that player is assigned to the roster; if it did not match, a new player is created and then assigned.
9. **Given** "Add to Roster" is clicked and all API calls succeed, **When** the operation completes, **Then** the accordion collapses and the assigned players are visible in the roster list.
10. **Given** "Add to Roster" is clicked, **When** the user unchecks all names, **Then** the "Add to Roster" button is disabled.

---

### User Story 2 — Register Player page: Bulk import from image (Priority: P2)

A host on the Register Player page (`/players/register`) wants to quickly add a batch of new players from a screenshot without individually typing each name. The OCR import panel is always visible below the name input on that page, and supports the same image input methods (paste + file pick). Since the purpose is adding new players, the panel automatically excludes names that already exist in the catalog and lets the user bulk-register the remainder.

**Why this priority**: Complements the register-player page. High leverage when onboarding a group of new players at once.

**Independent Test**: Open `/players/register`. Confirm the OCR import panel is always visible (not hidden in an accordion). Paste or upload a screenshot with a mix of new and already-registered names. Confirm new names are selectable and already-registered names are labelled "Already registered" and excluded. Confirm clicking "Register All New" calls the registration endpoint for each new name and shows success feedback.

**Acceptance Scenarios**:

1. **Given** the `/players/register` page is open, **When** the user views the page, **Then** the OCR import panel is visible below the name input without requiring any toggle action.
2. **Given** the OCR panel is visible, **When** the user pastes or uploads a screenshot with names, **Then** OCR processing starts and a loading indicator is shown.
3. **Given** OCR completes on the Register Player page, **When** names are matched against the catalog, **Then** names that already exist are labelled "Already registered" and excluded from the registration action; new names are shown with checkboxes pre-checked.
4. **Given** new names are shown, **When** the user clicks "Register All New", **Then** only names that are checked and not already registered are passed to the registration API.
5. **Given** all selected names are registered successfully, **When** the operation completes, **Then** a success message lists the newly registered players and the result list clears.
6. **Given** one or more API calls fail during bulk registration, **When** the operation partially completes, **Then** a per-name error status is shown and successfully registered names are confirmed.

---

### Edge Cases

- What if the pasted image contains no recognisable names? → The result list is empty and a message reads "No names found — try a clearer image."
- What if the pasted clipboard item is not an image? → The panel ignores non-image clipboard events; no error is shown.
- What if OCR fails entirely (e.g. Tesseract worker error)? → An inline error message is shown: "OCR failed — please try again." The panel remains open.
- What if the same name appears multiple times in the OCR output? → Duplicates are deduplicated before display; only one entry per normalised name is shown.
- What if a name is very short (1 character) or purely numeric? → Such tokens are filtered out before display; they are not offered as player names.
- What if the image is very large and OCR takes a long time? → The loading indicator remains until processing completes; the user can cancel (close/collapse the panel) at any time.
- What if all extracted names already exist in the catalog (Register page mode)? → All are labelled "Already registered"; no registration action is available; a message reads "All names already registered."
- What if the user collapses the accordion (Roster mode) while OCR is in progress? → The OCR worker is terminated and its result discarded.

---

## Requirements *(mandatory)*

### Functional Requirements

**FR-001**: The `PlayerSelector` component on the Create Event Roster step MUST display a collapsed "Import from image" accordion toggle below the "Players" section heading.

**FR-002**: Clicking the "Import from image" toggle MUST expand an OCR import panel below it.

**FR-003**: The OCR import panel MUST accept image input via two methods: (a) pasting an image from the clipboard; (b) selecting an image file via a file input control.

**FR-004**: When an image is received, the panel MUST run OCR using Tesseract.js (client-side, WebAssembly) with English and Swedish language models.

**FR-005**: While OCR is running, the panel MUST display a loading indicator and disable the confirm button.

**FR-006**: After OCR completes, the panel MUST parse the raw text output into a deduplicated list of candidate player names by splitting on newlines, trimming whitespace, and removing empty lines, lines shorter than 2 characters, and lines that are purely numeric.

**FR-007**: Each candidate name MUST be matched against the existing player catalog using case-insensitive normalisation.

**FR-008**: In roster mode (Roster step accordion): matched names MUST be displayed pre-checked alongside the matched player's display name; unmatched names MUST be displayed unchecked.

**FR-009**: In roster mode: when the user clicks "Add to Roster", for each checked name — if matched, assign the existing catalog player; if unmatched, call `createOrReusePlayer` and then assign.

**FR-010**: In roster mode: after a successful "Add to Roster" action, the accordion MUST collapse automatically.

**FR-011**: In register mode (Register Player page): names already in the catalog MUST be labelled "Already registered" and excluded from the registration action.

**FR-012**: In register mode: when the user clicks "Register All New", only checked names that are not already registered MUST be passed to `createPlayer`.

**FR-013**: In register mode: on successful bulk registration, a success message MUST list all newly registered player names.

**FR-014**: The "Add to Roster" / "Register All New" button MUST be disabled when no eligible names are checked.

**FR-015**: If OCR produces no usable names after filtering, the panel MUST display a message: "No names found — try a clearer image."

**FR-016**: If OCR fails with an error, the panel MUST display a message: "OCR failed — please try again."

**FR-017**: The OCR functionality MUST be entirely client-side; no image data or OCR results MUST be sent to the backend.

**FR-018**: The Tesseract.js worker MUST be terminated when the panel is unmounted or the accordion is collapsed, to free WebAssembly memory.

### Key Entities

- **OcrImportPanel**: A reusable React component that accepts an image (paste or file), runs OCR, displays match results with checkboxes, and triggers a confirm callback. Works in `roster` mode and `register` mode.
- **OcrMatchResult**: A data structure pairing a raw OCR name string with a matched catalog player (or null if no match).
- **parseOcrNames**: A pure function that converts raw Tesseract output text into a cleaned, deduplicated list of candidate player name strings.
- **matchNamesToCatalog**: A pure function that maps a list of candidate names to `OcrMatchResult` objects using the existing `findDuplicateByName` helper.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can paste a screenshot on the Roster step and see extracted player names in under 10 seconds on a modern desktop browser (cold Tesseract load excluded).
- **SC-002**: Names already in the catalog are correctly matched and pre-checked in roster mode, with zero false positives on a catalog of up to 50 players.
- **SC-003**: All matched players are assigned to the roster in a single "Add to Roster" click with no additional steps.
- **SC-004**: The accordion collapses automatically after a successful import, returning the user to the normal roster flow.
- **SC-005**: No player name data is transmitted over the network during OCR — confirmed by absence of relevant network requests.
- **SC-006**: All new pure-function unit tests pass (parseOcrNames, matchNamesToCatalog, any additional helpers).
- **SC-007**: All existing frontend tests (170+) continue to pass after the feature is introduced.
- **SC-008**: TypeScript compiles with zero errors after all changes.
