# SheetPro AI

## Current State
Empty project with Motoko backend scaffold and React frontend scaffold.

## Requested Changes (Diff)

### Add
- Phase 1: Full mobile-first spreadsheet UI foundation
- Virtualized grid with column labels (A, B, C...) and row numbers (1, 2, 3...)
- Cell selection (single and range), cell editing with inline input
- Multiple sheet tabs (add, rename, delete)
- Home toolbar: Bold, Italic, Underline, font size, text color, alignment, merge cells, wrap text
- Formula bar showing cell address and content/formula
- AI assistant panel (shell UI with API key input for OpenAI/Gemini, chat interface placeholder)
- Undo/Redo, Cut/Copy/Paste
- Basic formula engine: SUM, AVERAGE, COUNT, IF, AND, OR, CONCAT, NOW, TODAY
- Mobile bottom toolbar, desktop ribbon-style header
- Zoom in/out, gridline toggle
- Motoko backend: health check ping

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Generate Motoko backend with health check endpoint
2. Build React spreadsheet grid with virtual scrolling (window-based rendering for performance)
3. Cell state management using React state (Map of row-col to cell data)
4. Formula engine module parsing =FORMULA(...) syntax
5. Sheet tab system with add/rename/delete
6. Toolbar component with formatting controls
7. Formula bar component
8. AI panel shell with API key storage (localStorage) and chat UI
9. Mobile bottom nav + desktop ribbon layout
10. Undo/Redo stack
