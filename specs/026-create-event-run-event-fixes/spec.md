# Spec 026 — Create Event & Run Event UX Fixes

## Overview

Five targeted UX/logic fixes across the Create Event stepper and Run Event page.
All changes are frontend-only; no backend changes required.

---

## Stories

### S1 — `buildEventName()`: unified 4-slot name builder in `validation.ts`

4-slot model:
```
[<Weekday> ]<ModeLabel>[ (Teams)][ - HH:mm]
```
- Weekday prefix: present only when eventDate matches DATE_ISO_PATTERN
- ModeLabel (core): always present via getEventModeLabel(eventType)
- (Teams) suffix: present when eventType === "Mexicano" && isTeamMexicano
- Time suffix: present when isValidEventTime24h(eventTime24h)

getRecommendedEventName() left completely unchanged (existing tests depend on it).

### S2 — Merge auto-name effects + slot-created toast in CreateEvent.tsx

Replace two competing useEffect auto-name effects with one merged effect using
buildEventName(). Add toast.success("Event slot created") in handleNext() Step 0.

### S3 — Team Mexicano toggle moves inside ModeAccordion

Move toggle into Mexicano card. Toggle only appears when active and
onTeamMexicanoChange prop is provided. e.stopPropagation() on toggle click.
Remove standalone team-mexicano-toggle-row div from CreateEvent.tsx.

### S4 — SubstituteModal: filter current players, rename flag, update text

Filter currentPlayers from search results. Rename isCreatingNew -> isStandIn.
Change fallback button text to: Add "<name>" as a stand-in.

### S5 — RunEvent.tsx: reset match state after substitution

Reset completed, submittedPayloads, selectedTeamGroupings, hoveredTeamGroupings,
modalContext before load() in onSubstituted — mirroring what next() does.

---

## Files changed

- frontend/src/features/create-event/validation.ts
- frontend/src/pages/CreateEvent.tsx
- frontend/src/components/mode/ModeAccordion.tsx
- frontend/src/features/run-event/SubstituteModal.tsx
- frontend/src/pages/RunEvent.tsx

No backend changes. No new npm packages. No schema migrations.
