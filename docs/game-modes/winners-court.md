# Winners Court — Game Mode Guide

## What is Winners Court?

Winners Court (also called Americano with court movement) is a padel format where players move up or down the courts after every round based on their results. Win a match and you move to a higher court next round. Lose and you drop to a lower court. Over time, the strongest players naturally rise to the top court and the weakest settle at the bottom — but the format keeps every court competitive because players of similar ability end up facing each other.

---

## Scoring

Winners Court uses a **win/loss** result for each match. There is no point tracking during the match beyond what is needed to determine a winner — the team that wins the most games, or the first team to reach a set target, wins the match (your organiser will confirm the exact match format before the event starts).

- There are **no running score totals** accumulated across rounds the way Mexicano works.
- The only thing that matters each round is: **did your team win or lose?**

---

## Court Movement Rules

After every round, players move courts based on their result:

- **Winners** move **up** one court (toward the highest-numbered court, which is considered the top court).
- **Losers** move **down** one court (toward the lowest-numbered court).

The top court is the most prestigious — winning there keeps you at the top. Losing on the top court drops you to the second court. Winning on the bottom court moves you up. Players who are sitting out (if the player count means some players have a bye) stay on the same court for the next round.

**Edge cases handled automatically:**
- If you are already on the top court and you win, you stay on the top court.
- If you are already on the bottom court and you lose, you stay on the bottom court.
- When too many players end up assigned to the same court after movement, the system shuffles them fairly to fill all available courts.

---

## Partner Assignment

Partners **change every round** based on court movement. When the four players on a court are determined, two are paired as one team and two as the other. The pairing follows the same order in which players arrived at the court — there is no complex partner-avoidance algorithm as in Mexicano.

---

## Final Rankings

At the end of the event (after the final round), rankings are determined by the results of the **final round only**, not by a cumulative score across all rounds:

1. Players on the **highest court** rank highest — the winners of the final match on the top court rank 1st and 2nd, and the losers rank 3rd and 4th.
2. Players on the **second court** rank next, with the same winners-before-losers order.
3. This continues down through all courts.

Within each group (winners of a court or losers of a court), if both players have identical outcomes, they are listed alphabetically by name.

Any players who did not participate in the final round (e.g. due to uneven numbers) are listed after all players who did play.

---

## Tiebreaker Rules

Because final rankings in Winners Court are position-based rather than score-based, there is no complex tiebreaker calculation:

- The two winners of a court rank above the two losers of the same court.
- Two players who both won (or both lost) on the same court share an identical position in the event — they are sorted alphabetically by name for display purposes only, with no competitive significance.

---

## Randomisation

- **Round 1** assigns players to courts in the order they were registered. No random shuffle is applied.
- **Subsequent rounds** are fully deterministic — court assignments come directly from the previous round's results.
- If a court ends up with more than four players due to movement collisions, a seeded random shuffle is used to select which four play on that court. The seed is based on the event ID and court number, so the result is reproducible.

---

## Quick Reference

| Topic | Rule |
|---|---|
| Match result | Win or loss (no running score total) |
| After winning | Move up one court |
| After losing | Move down one court |
| Partners | Change every round |
| Final ranking | Based on final-round court position and result |
| Tiebreaker | Winners rank above losers on same court; alphabetical within equal groups |
| Number of rounds | Fixed — set by the organiser when creating the event |
