# SheetPro AI — Phase 3: Real Excel UI (Title Bar + Ribbon + Formula Bar)

## Current State
- Header: dark navy bar with logo, hamburger menu (mobile), flat nav links (desktop)
- Toolbar: flat single-row buttons (toggle hidden on mobile, shown on desktop)
- Mobile menu: dropdown overlay that opens/closes
- FormulaBar: exists, correct layout
- SheetTabs: exists at bottom

## Requested Changes (Diff)

### Add
- **Title Bar**: Windows-style top bar with Quick Access Toolbar (save, undo, redo icons), centered file title "Book1 - SheetPro AI", and window control buttons (minimize, maximize, close) on the right. Use Excel green (#217346) background.
- **Ribbon Tab Bar**: Always-visible horizontal tab strip below title bar — tabs: Home, Insert, Page Layout, Formulas, Data, Review, View, AI. Active tab underlined/highlighted. Scrollable on mobile with no scrollbar.
- **Ribbon Content Panel**: Always-visible ribbon showing buttons/groups for the active tab. Home tab shows: Clipboard group (Cut, Copy, Paste), Font group (font family select, font size, B/I/U, color), Alignment group (left/center/right, wrap text), Number group (format select), and AI button. Other tabs show relevant placeholder groups. NO toggle, NO collapse — always open like real Excel.
- **Mobile behavior**: Title bar compact, ribbon tabs scroll horizontally, ribbon content scrolls horizontally. No hamburger menu.

### Modify
- Remove hamburger menu and dropdown overlay entirely
- Remove old Toolbar component usage (replaced by Ribbon)
- Keep FormulaBar exactly as-is
- Keep SheetTabs exactly as-is
- App.tsx: replace header + toolbar with TitleBar + RibbonTabs + RibbonContent components

### Remove
- `mobileMenuOpen` state and AnimatePresence mobile dropdown
- `Menu`, `X` imports from lucide used for hamburger
- Old `<header>` element
- Old Toolbar component rendering (both mobile and desktop)

## Implementation Plan
1. Create `TitleBar.tsx` — Windows-style title bar with QAT, filename, window controls
2. Create `Ribbon.tsx` — Ribbon with tab strip + tab content panel (Home, Insert, Page Layout, Formulas, Data, Review, View, AI tabs). Home tab has full formatting controls using existing spreadsheet hook. All buttons wired to real actions.
3. Update `App.tsx` — Replace old header/toolbar with TitleBar + Ribbon, remove mobile menu state
4. Update `index.css` — Add ribbon/titlebar styles
5. Validate and deploy
