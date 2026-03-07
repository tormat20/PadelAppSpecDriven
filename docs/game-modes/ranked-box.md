# Ranked Box — Game Mode Guide

## What is Ranked Box?

Ranked Box is a structured padel format where the same group of four players on each court play against every other combination of partners across a fixed three-round cycle. Think of it like a mini round-robin within each court — you play with and against everyone in your group before the final rankings are calculated.

The "box" in Ranked Box refers to the group of four players on a court. The "ranked" part means that after the cycle is complete, players are sorted into a final ladder based on how many points they accumulated.

---

## Scoring

Each match in Ranked Box has three possible results:

- **Win** — your team scores more games than the opposing team.
- **Loss** — the opposing team scores more games than your team.
- **Draw** — both teams score the same number of games.

Wins, losses, and draws each contribute different point values to your **RB score** (Ranked Box score). The organiser sets the exact point values when creating the event (common values are, for example, 3 points for a win, 1 for a draw, 0 for a loss — confirm with your organiser before playing).

Your RB score accumulates across all matches you play.

---

## The Three-Round Cycle

The clever part of Ranked Box is how partners are assigned. Each court has four players — let's call them A, B, C, and D. Over three rounds, they play every possible combination of two-vs-two:

| Round | Match |
|---|---|
| Round 1 (step 1) | A+B vs C+D |
| Round 2 (step 2) | A+C vs B+D |
| Round 3 (step 3) | A+D vs B+C |

After three rounds, every player has partnered with every other player in their group exactly once and faced every other player exactly once. This makes the format extremely fair — no one can benefit from always being paired with the strongest player.

The cycle then repeats. If your event has 6 rounds, each group plays through the three-step cycle twice.

---

## Court Assignment

**Round 1:** Players are placed on courts in the order they were registered. The first four go to the first court, the next four to the next court, and so on. These groups stay together for the full three-round cycle.

**After each three-round cycle (if the event continues beyond 3 rounds):** Players may be re-grouped based on their current standings. The exact re-grouping behaviour depends on the event setup — check with your organiser.

---

## Partner Assignment

Partners are determined entirely by the cycle step — there is no player choice involved. The algorithm assigns partners based on the sorted order of the four players in a group (sorted by player ID, which is fixed at registration). The three partnerships cycle through in a deterministic order as described in the table above.

---

## Final Rankings

At the end of the event, players are ranked using a two-level system:

1. **Global score first**: All players across all courts are sorted by their RB score from highest to lowest. This gives a global ranking.
2. **Group score as tiebreaker**: The global ranking is then used to form groups of four (the top four players form one group, the next four another, and so on). Within each group, players are re-ranked by their RB score within that group. This refines the final order so that players who competed on the same court are compared fairly against each other.

In plain terms: your global score determines which "tier" you finish in, and your performance within your group determines your exact position within that tier.

---

## Tiebreaker Rules

If two players within the same group have the same RB score:

1. They are sorted alphabetically by name for display purposes.
2. No further tiebreaker is currently applied — tied players share their position.

---

## Randomisation

There is no randomisation in Ranked Box. All partner and opponent assignments are fully determined by:
- The initial registration order of players (Round 1 groupings).
- The fixed three-step cycle pattern (partner assignments within each group).
- The current standings (re-grouping between cycles, if applicable).

---

## Quick Reference

| Topic | Rule |
|---|---|
| Match result | Win, draw, or loss |
| Points | Set by organiser (e.g. 3 for win, 1 for draw, 0 for loss) |
| Partners | Fixed three-round cycle — you partner with everyone in your group |
| Court groups | 4 players per court; same group for 3-round cycle |
| Final ranking | Global RB score → group RB score as tiebreaker |
| Randomisation | None — fully deterministic |
| Number of rounds | Fixed by organiser (typically a multiple of 3) |
