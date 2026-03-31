import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import AIPanel from "./components/AIPanel";
import FormulaBar from "./components/FormulaBar";
import Grid from "./components/Grid";
import Ribbon from "./components/Ribbon";
import SheetTabs from "./components/SheetTabs";
import TitleBar from "./components/TitleBar";
import { useActor } from "./hooks/useActor";
import { useSpreadsheet } from "./hooks/useSpreadsheet";

export default function App() {
  const { actor } = useActor();
  const spreadsheet = useSpreadsheet();
  const [aiOpen, setAiOpen] = useState(false);
  const [ribbonTab, setRibbonTab] = useState("Home");

  useEffect(() => {
    actor
      ?.healthCheck()
      .then((r: string) => console.log("[SheetPro] Backend:", r))
      .catch(console.error);
  }, [actor]);

  return (
    <div
      className="flex flex-col h-screen bg-background overflow-hidden"
      style={{ fontFamily: "'Segoe UI', Inter, sans-serif" }}
    >
      {/* Title Bar */}
      <TitleBar spreadsheet={spreadsheet} />

      {/* Ribbon */}
      <Ribbon
        spreadsheet={spreadsheet}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        onToggleAI={() => setAiOpen((v) => !v)}
      />

      {/* Formula Bar */}
      <FormulaBar spreadsheet={spreadsheet} />

      {/* Main area: Grid + AI Panel */}
      <div className="flex flex-1 overflow-hidden">
        <Grid spreadsheet={spreadsheet} />
        <AnimatePresence>
          {aiOpen && <AIPanel onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* Sheet Tabs */}
      <SheetTabs spreadsheet={spreadsheet} />

      <Toaster />

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
