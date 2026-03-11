// ---------------------------------------------------------------------------
// Grid layout constants — shared between Calendar.tsx and sub-components.
// Kept in a separate file to avoid circular import issues.
// ---------------------------------------------------------------------------

export const GRID_START_HOUR = 7          // 07:00
export const GRID_END_HOUR = 24           // 00:00 next day (midnight)
export const GRID_TOTAL_MINUTES = (GRID_END_HOUR - GRID_START_HOUR) * 60  // 1020
export const SNAP_MINUTES = 30
export const PX_PER_MINUTE = 1            // 1 px per minute → grid height = 1020 px
