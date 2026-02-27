# Quickstart: Branding and Interaction Polish

## 1) Validate branded logo button

1. Launch frontend and open app shell header.
2. Confirm logo button uses `images/logos/Molndal-padel-bg-removed.png`.
3. Confirm mark is centered inside circular logo button.
4. On larger viewport, confirm optional logo text appears inside the same circular button.
5. On small/mobile viewport, confirm optional text may hide while centered mark remains intact.

## 2) Validate shared interaction language across clickable controls

1. Identify multiple clickable controls across screens (buttons, cards, list items, logo button).
2. On hover-capable device, verify visible edge definition in resting state.
3. Hover each control and verify border glow appears.
4. Move pointer within control and verify localized pointer-proximity highlight behavior.

## 3) Validate disabled control behavior

1. Locate disabled clickable controls.
2. Verify disabled controls retain static disabled styling.
3. Verify disabled controls do not show hover/proximity effects.

## 4) Validate accessibility and mobile behavior

1. Navigate clickable controls with keyboard only.
2. Confirm focus-visible state remains clear without pointer interaction.
3. Test mobile/touch viewport and verify controls remain readable and tappable without hover.

## 5) Validate reduced-motion behavior

1. Enable reduced-motion preference.
2. Verify pointer-proximity animation is disabled.
3. Verify static edge/focus affordance cues remain visible.

## 6) Automated checks

```bash
cd frontend
npm run lint
npm run test
```

## 7) Execution Evidence

- Frontend validation run: `npm run lint && npm run test` -> PASS.
- Current suite status after implementation: 31 test files, 68 tests passed.

## 8) Manual Walkthrough Notes

- Hover-capable surfaces now use shared `interactive-surface` styling with visible edge and glow.
- Disabled controls retain static appearance and do not animate proximity effects.
- Reduced-motion behavior suppresses animated proximity layer while keeping focus/edge affordances.
- Mobile breakpoint hides optional logo text while preserving centered logo mark and touch target.
