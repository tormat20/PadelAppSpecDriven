# Contract: Streak Indicators and Recognition Badge Display

## Purpose

Define visual and rule contracts for winner recognition icon replacement and ongoing-event momentum indicators.

## Badge Mapping Contract

## 1) Recent Winner Recognition

- **Qualification Rule**: unchanged from existing behavior.
- **Display Rule**: use crown icon for this rule.
- **Non-qualification**: no recent-winner icon displayed.

## 2) Hot Streak Indicator

- **Qualification Rule**: player reaches 3 consecutive wins in current ongoing event.
- **Display Rule**: fire symbol shown next to player in live/summary displays where momentum markers are rendered.
- **Removal Rule**: remove when consecutive win sequence breaks.

## 3) Cold Streak Indicator

- **Qualification Rule**: player reaches 3 consecutive losses in current ongoing event.
- **Display Rule**: snowflake symbol shown next to player in live/summary displays where momentum markers are rendered.
- **Removal Rule**: remove when consecutive loss sequence breaks.

## Coexistence and Precedence Contract

- Recent-winner crown may coexist with momentum indicator.
- Fire and snowflake are mutually exclusive for a player at a single point in time.

## Winner Score Emphasis Contract

- For recorded match outcomes in ongoing event displays, winning score values are visually emphasized (e.g., underlined) to improve readability.

## Recalculation Contract

Any new result submission or accepted score correction must trigger:
1. standings refresh
2. streak recomputation
3. badge refresh according to qualification and coexistence rules
