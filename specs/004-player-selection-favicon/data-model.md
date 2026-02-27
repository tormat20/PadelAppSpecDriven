# Data Model: Player Selection and Favicon Improvements

## Overview

This feature adds no new backend domain type, but formalizes behavior across player catalog lookup, event draft assignment state, and favicon branding assets.

## Entities

### 1) PlayerCatalogEntry
- **Purpose**: Represents a reusable player identity available to all events.
- **Fields**:
  - `playerId`: unique identifier
  - `displayName`: user-visible player name
  - `normalizedName`: case-normalized form used for duplicate checks and prefix matching
- **Validation rules**:
  - `displayName` must be non-empty after trimming.
  - `normalizedName` must be unique for case-insensitive duplicate handling.

### 2) EventDraft
- **Purpose**: Represents in-progress event setup before final event creation.
- **Fields**:
  - `draftId`: active draft identity
  - `selectedPlayerIds`: ordered list of assigned player IDs
  - `updatedAt`: last assignment update timestamp
- **Validation rules**:
  - `selectedPlayerIds` contains no duplicates.
  - Draft can be restored consistently for same `draftId`.

### 3) AssignedPlayerRow
- **Purpose**: UI representation of each assigned player in event setup.
- **Fields**:
  - `playerId`: link to `PlayerCatalogEntry`
  - `displayName`: rendered name text
  - `removeAction`: left-aligned minus action
- **Validation rules**:
  - Remove action only unassigns from `EventDraft`.
  - Remove action never deletes `PlayerCatalogEntry`.

### 4) SearchSuggestion
- **Purpose**: Candidate player rows shown while typing in the search box.
- **Fields**:
  - `query`: current typed input
  - `matches`: list of player entries with prefix match
  - `triggerThreshold`: minimum input length for suggestions (1 character)
- **Validation rules**:
  - Matching is case-insensitive prefix.
  - Empty-result state appears when no match exists.

### 5) AppFaviconAssetSet
- **Purpose**: Browser-tab icon configuration for branding.
- **Fields**:
  - `primaryIcon`: Molndal logo SVG asset
  - `fallbackIcon`: PNG fallback asset
  - `cacheRefreshNote`: guidance for browser cache refresh when verifying updates
- **Validation rules**:
  - Primary and fallback icon references resolve at app load.

## Relationships

- `EventDraft.selectedPlayerIds` references `PlayerCatalogEntry.playerId`.
- `AssignedPlayerRow` is a presentation mapping of `EventDraft` + `PlayerCatalogEntry`.
- `SearchSuggestion.matches` are derived from `PlayerCatalogEntry.normalizedName` prefix comparisons.

## State Transitions

### Event draft assignment lifecycle
1. `empty`: draft has zero assigned players.
2. `assigned`: one or more players assigned.
3. `updated`: assignments changed by add or remove actions.
4. `restored`: draft assignments reloaded for same draft after refresh/return.

### Add-player flow lifecycle
1. Host enters name.
2. Duplicate check runs using case-insensitive comparison.
3. Either `reused_existing` or `created_new` outcome.
4. Player becomes assigned to active draft immediately.
