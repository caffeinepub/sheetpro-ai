# SheetPro AI - Phase 2

## Current State
Phase 1 is complete: grid with single-cell selection, basic formula engine, cell editing, formatting (bold/italic/underline/align/color/font-size), multi-sheet tabs, AI panel shell, undo/redo, formula bar, mobile bottom toolbar.

Key files:
- `src/frontend/src/hooks/useSpreadsheet.ts` - state management, `selectedCell`, `setSelectedCell`, `updateCellFormat` (single cell)
- `src/frontend/src/components/Grid.tsx` - renders grid, handles keyboard/mouse for single cell
- `src/frontend/src/components/Toolbar.tsx` - formatting buttons acting on single selected cell
- `src/frontend/src/components/FormulaBar.tsx` - name box shows single cell address

## Requested Changes (Diff)

### Add
- **Range selection state**: `selectionRange: { startRow, startCol, endRow, endCol } | null` in useSpreadsheet
- **Range selection interactions** in Grid:
  - Click+drag on desktop to select range (mousedown → mousemove → mouseup)
  - Touch drag on mobile (touchstart → touchmove → touchend) to select range
  - Shift+click extends selection from anchor cell
  - Shift+Arrow keys extend selection (Shift+ArrowDown/Up/Left/Right)
  - Ctrl+Shift+End selects to last used cell
  - Click column/row headers to select entire column/row
- **Visual range highlight**: cells in selection range get a blue tint background, selection border drawn around entire range (not individual cells)
- **Fill handle** (drag-fill):
  - Small blue square (6×6px) at bottom-right corner of selected cell (or bottom-right of range)
  - On drag down/right: auto-fill values (increment numbers, repeat text, extend series)
  - Touch-friendly: larger hit target (16×16px touch area) on mobile
  - Show "ghost" preview of fill range while dragging
- **Range formatting**: `updateRangeFormat(format)` applies to all cells in `selectionRange`
- **Clear range**: Delete/Backspace clears all cells in the selected range
- **Name box**: shows range address (e.g. "B2:D5") when range is selected; single cell otherwise
- **Range copy/paste**: Ctrl+C copies range, Ctrl+V pastes at anchor
- **Context menu** (right-click / long-press mobile): Insert row, Delete row, Insert column, Delete column, Clear cells, Copy, Paste

### Modify
- `useSpreadsheet.ts`: Add `selectionRange`, `setSelectionRange`, `updateRangeFormat`, `clearRange`, `copyRange`, `pasteRange` to hook return
- `Grid.tsx`: Rewrite cell rendering to highlight range selection; add fill handle element; add drag logic for selection and fill
- `Toolbar.tsx`: `updateCellFormat` calls replaced with `updateRangeFormat` so formatting applies to whole selection
- `FormulaBar.tsx`: Name box shows range address when range selected

### Remove
- Nothing removed — all Phase 1 features retained

## Implementation Plan
1. Extend `useSpreadsheet.ts`:
   - Add `selectionRange` state (anchor + active corner)
   - Add `setSelectionRange(range)` 
   - Add `updateRangeFormat(format)` iterates all cells in range and updates
   - Add `clearRange()` deletes all cells in range
   - Add clipboard state + `copyRange()` / `pasteRange()` helpers
2. Rewrite `Grid.tsx`:
   - Track `isMouseDown` + `isDraggingFill` refs
   - On mousedown on cell: set anchor, start selection
   - On mousemove over cell (while down): update active corner → `setSelectionRange`
   - On shift+click: extend range from anchor
   - `isInRange(row, col)` helper to determine highlight
   - Render range selection overlay (absolute positioned border) instead of per-cell border
   - Render fill handle at bottom-right corner of selection
   - Fill handle mousedown → track fill drag direction → apply fill on mouseup
   - Touch equivalents using touchstart/touchmove/touchend with coordinate-to-cell mapping
   - Column header click → select full column; row number click → select full row
3. Update `Toolbar.tsx`: call `updateRangeFormat` instead of `updateCellFormat`
4. Update `FormulaBar.tsx`: show range address when `selectionRange` is set
5. Add context menu component (right-click/long-press): insert/delete row/col, clear, copy, paste
