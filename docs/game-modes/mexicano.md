# Mexicano — Game Mode Guide

## What is Mexicano?

Mexicano is a round-robin padel format where players are paired with different partners each round and the schedule adapts based on how everyone is performing. Strong players gradually face other strong players, and weaker players face others at their level. This makes every round competitive and keeps the event exciting from start to finish.

---

## Scoring

Every match is played to **24 points**. The first team to reach 24 wins the match. The most common format is a continuous rally-scoring game — every point counts regardless of who serves.

- Each player's **total score** is the sum of all the points their team scored across every match they have played.
- There is no points cap per player per round — if your team wins 24–0, each player on your team banks 24 points.
- The organiser decides when to finish the event. There is no fixed number of rounds — play as few or as many rounds as you like.

---

## How Players Are Assigned to Courts

**Round 1:** Players are placed on courts in a random or organiser-defined order. The first four players go to the top court, the next four to the next court, and so on.

**All subsequent rounds:** Players are re-ranked by their total score after each round. The top-ranked players play on the highest-numbered court, and so on down the list.

Within each group of four players on a court, the system chooses partners using the **best-with-worst** rule: the top and bottom scorer in the group are paired together as a team, and the two middle scorers are paired as the opposing team. This balances the courts so every match is as competitive as possible.

---

## Partner Rotation

In standard Mexicano, **partners change every round**. You will never play with the same partner in back-to-back rounds if the system can avoid it. The algorithm checks your recent partner history and picks the pairing that minimises repeated partnerships across all four players on your court.

This means over the course of an event you will pair up with many different players, which is part of what makes Mexicano social and fun.

---

## Team Mexicano Variant

Team Mexicano works exactly like standard Mexicano with one key difference: **your partner is fixed for the entire event**.

- Before the event starts, the organiser pairs all players into fixed teams of two.
- These teams never change — you play every round with the same partner.
- Court assignments and opponents still rotate each round based on how teams are ranked.
- **Team ranking** for court assignment is based on the combined total score of both players on the team.
- The best-vs-worst pairing logic still applies at the team level: the top-ranked team faces the bottom-ranked team, and so on.
- All scoring rules are identical to standard Mexicano (play to 24, total points accumulate).
- Team Mexicano requires an **even number of players** — if the player count is odd, the event cannot be started.

---

## Tiebreaker Rules

When two or more players finish with the same total score, the following tiebreaker hierarchy is applied:

1. **Most wins** — a win is any match in which your team scored **more than 12 points** (i.e. 13 or higher). The player with more wins ranks higher.
2. **Best single-match score** — if wins are also equal, the player whose highest individual match score is greater ranks higher.
3. **Shared rank** — if all three values (total score, wins, best match score) are identical, the players share the same rank. No further tiebreaker is applied.

This hierarchy applies both to the live leaderboard during the event and to the final summary after the event is finished.

---

## Randomisation

- **Round 1** uses the order in which players were added to the event. There is no random shuffle of the initial player list unless the organiser manually reorders players during setup.
- **Subsequent rounds** are fully deterministic — court and partner assignments are driven by the current standings, not by any random draw.
- **Partner selection** within a quartet uses a penalty-based algorithm that minimises repeat pairings. When multiple valid pairings have the same penalty score, the algorithm picks the first candidate in a fixed order (no random element).

---

## Quick Reference

| Topic | Rule |
|---|---|
| Match length | First to 24 points |
| Points scored | Your team's score in every match |
| Partner rotation | New partner each round (standard) / Fixed partner (Team Mexicano) |
| Court assignment | Best-with-worst grouping by current standings |
| Number of rounds | No limit — organiser decides when to finish |
| Tiebreaker 1 | Most wins (team score > 12) |
| Tiebreaker 2 | Highest single-match score |
| Tiebreaker 3 | Shared rank |
