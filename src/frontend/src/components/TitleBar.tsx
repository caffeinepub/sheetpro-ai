import { Minus, Redo2, Save, Square, Undo2, X } from "lucide-react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";

interface Props {
  spreadsheet: SpreadsheetHook;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export default function TitleBar({
  spreadsheet,
  onMinimize,
  onMaximize,
  onClose,
}: Props) {
  const { undo, redo, canUndo, canRedo } = spreadsheet;

  return (
    <div
      className="titlebar flex items-center flex-shrink-0 select-none"
      style={{
        background: "#217346",
        height: 30,
        minHeight: 30,
        fontFamily: "'Segoe UI', Inter, sans-serif",
      }}
      data-ocid="titlebar.panel"
    >
      {/* Quick Access Toolbar */}
      <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
        <button
          type="button"
          className="titlebar-qat-btn"
          title="Save (Ctrl+S)"
          data-ocid="titlebar.save.button"
        >
          <Save size={12} />
        </button>
        <button
          type="button"
          className="titlebar-qat-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{ opacity: canUndo ? 1 : 0.4 }}
          data-ocid="titlebar.undo.button"
        >
          <Undo2 size={12} />
        </button>
        <button
          type="button"
          className="titlebar-qat-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{ opacity: canRedo ? 1 : 0.4 }}
          data-ocid="titlebar.redo.button"
        >
          <Redo2 size={12} />
        </button>
      </div>

      {/* Centered title */}
      <div className="flex-1 flex items-center justify-center">
        <span
          style={{
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 400,
            fontFamily: "'Segoe UI', Inter, sans-serif",
            letterSpacing: 0.1,
            userSelect: "none",
          }}
        >
          Book1 - SheetPro AI
        </span>
      </div>

      {/* Window controls */}
      <div className="flex items-center flex-shrink-0">
        <button
          type="button"
          className="win-ctrl-btn"
          onClick={onMinimize}
          title="Minimize"
          data-ocid="titlebar.minimize.button"
        >
          <Minus size={11} />
        </button>
        <button
          type="button"
          className="win-ctrl-btn"
          onClick={onMaximize}
          title="Restore Down"
          data-ocid="titlebar.maximize.button"
        >
          <Square size={10} />
        </button>
        <button
          type="button"
          className="win-ctrl-btn win-close-btn"
          onClick={onClose}
          title="Close"
          data-ocid="titlebar.close.button"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
