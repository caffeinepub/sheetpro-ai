import { Toaster } from "@/components/ui/sonner";
import { Grid as GridIcon, Menu, Sparkles, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import AIPanel from "./components/AIPanel";
import FormulaBar from "./components/FormulaBar";
import Grid from "./components/Grid";
import SheetTabs from "./components/SheetTabs";
import Toolbar from "./components/Toolbar";
import { useActor } from "./hooks/useActor";
import { useSpreadsheet } from "./hooks/useSpreadsheet";

const MENU_ITEMS = [
  "File",
  "Edit",
  "View",
  "Insert",
  "Format",
  "Data",
  "AI",
  "Help",
];

export default function App() {
  const { actor } = useActor();
  const spreadsheet = useSpreadsheet();
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Backend health check
  useEffect(() => {
    actor
      ?.healthCheck()
      .then((r: string) => console.log("[SheetPro] Backend:", r))
      .catch(console.error);
  }, [actor]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      {/* ── Header ── */}
      <header
        className="sheetpro-header flex items-center px-3 gap-2 flex-shrink-0"
        style={{ height: 44 }}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center justify-center rounded"
            style={{ background: "rgba(255,255,255,0.12)", padding: "4px 5px" }}
          >
            <GridIcon size={17} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            SheetPro AI
          </span>
        </div>

        {/* Desktop nav menu */}
        <nav
          className="hidden md:flex items-center gap-0.5 ml-6"
          role="menubar"
        >
          {MENU_ITEMS.map((item) => (
            <button
              type="button"
              key={item}
              role="menuitem"
              onClick={() => item === "AI" && setAiOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 text-sm rounded transition-colors"
              style={{
                color:
                  item === "AI" && aiOpen
                    ? "#a8d4ff"
                    : "rgba(242,246,250,0.85)",
                background:
                  item === "AI" && aiOpen
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#F2F6FA";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  item === "AI" && aiOpen
                    ? "rgba(255,255,255,0.12)"
                    : "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  item === "AI" && aiOpen
                    ? "#a8d4ff"
                    : "rgba(242,246,250,0.85)";
              }}
              data-ocid={`nav.${item.toLowerCase()}.link`}
            >
              {item === "AI" && <Sparkles size={11} />}
              {item}
            </button>
          ))}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="md:hidden ml-auto p-1 rounded text-white/80 hover:text-white"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Open menu"
          data-ocid="nav.menu.button"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Spacer for desktop */}
        <div className="hidden md:block ml-auto" />
      </header>

      {/* ── Mobile menu dropdown ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-border shadow-sm z-50 flex-shrink-0">
            <nav className="flex flex-col py-1">
              {MENU_ITEMS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    if (item === "AI") setAiOpen((v) => !v);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  data-ocid={`nav.mobile.${item.toLowerCase()}.link`}
                >
                  {item === "AI" && <Sparkles size={13} />}
                  {item}
                </button>
              ))}
            </nav>
          </div>
        )}
      </AnimatePresence>

      {/* ── Desktop Toolbar ── */}
      <div className="hidden md:block flex-shrink-0">
        <Toolbar
          spreadsheet={spreadsheet}
          onToggleAI={() => setAiOpen((v) => !v)}
          aiOpen={aiOpen}
        />
      </div>

      {/* ── Formula Bar ── */}
      <FormulaBar spreadsheet={spreadsheet} />

      {/* ── Main area: Grid + AI Panel ── */}
      <div className="flex flex-1 overflow-hidden">
        <Grid spreadsheet={spreadsheet} />
        <AnimatePresence>
          {aiOpen && <AIPanel onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* ── Sheet Tabs ── */}
      <SheetTabs spreadsheet={spreadsheet} />

      {/* ── Mobile bottom toolbar ── */}
      <div className="md:hidden flex-shrink-0 border-t border-border">
        <Toolbar
          spreadsheet={spreadsheet}
          onToggleAI={() => setAiOpen((v) => !v)}
          aiOpen={aiOpen}
        />
      </div>

      <Toaster />

      {/* Footer (hidden in app chrome) */}
      <div className="hidden">
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          © {new Date().getFullYear()}. Built with ❤️ using caffeine.ai
        </a>
      </div>
    </div>
  );
}
