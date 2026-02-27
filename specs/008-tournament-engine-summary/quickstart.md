# Quickstart: Tournament Engine and Round Summary Overhaul

## 1) Validate Americano movement and boundaries

1. Create Americano event with at least two selected courts.
2. Complete all matches in round 1 with winners.
3. Advance round.
4. Confirm winners moved one court toward highest selected court.
5. Confirm losers moved one court toward lowest selected court.
6. Confirm top and bottom court players do not move beyond boundaries.

## 2) Validate Americano overflow determinism

1. Use scenario where movement targets overcrowd one court.
2. Advance round and capture assignments.
3. Re-run from identical state.
4. Confirm overflow reassignment is pseudo-random looking but identical across runs.

## 3) Validate Mexicano regrouping and partner anti-repeat

1. Create Mexicano event with at least 8 players and 2 courts.
2. Complete one round with non-uniform scores.
3. Advance round.
4. Confirm top 4 cumulative players are on top selected court.
5. Confirm tied totals are ordered by previous round rank, then player ID.
6. Confirm no player has same partner as previous round.

## 4) Validate BeatTheBox fixed cycle

1. Create BeatTheBox event and record quartet labels (A, B, C, D) per court group.
2. Verify pairings follow cycle:
   - Round step 1: `AB vs CD`
   - Round step 2: `AC vs BD`
   - Round step 3: `AD vs BC`
3. Confirm no player migrates to another court group.

## 5) Validate final summary matrix

1. Finish an event and open summary page.
2. Confirm columns are `R1..RN` and `Total` only.
3. Confirm round values are numeric for all modes.
4. Confirm each player's `Total` equals sum of round values.

## 6) Automated checks

```bash
cd backend
PYTHONPATH=. uv run pytest tests/unit/test_scheduling.py tests/contract/test_progress_summary_api.py tests/contract/test_completed_summary_compatibility.py tests/integration/test_us3_modes_and_summary.py

cd ../frontend
npm run lint
npm run test
```

## 7) Validation Notes

- Record Americano seeded overflow behavior using identical-state reruns.
- Record Mexicano partner anti-repeat outcomes for consecutive rounds.
- Record BeatTheBox cycle evidence for round steps 1 -> 2 -> 3.
- Record final summary matrix evidence (`R1..RN`, numeric cells, total sums).
