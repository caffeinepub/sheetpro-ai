import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Printer,
  Redo2,
  Sparkles,
  Underline,
  Undo2,
} from "lucide-react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];

interface Props {
  spreadsheet: SpreadsheetHook;
  onToggleAI: () => void;
  aiOpen: boolean;
}

export default function Toolbar({ spreadsheet, onToggleAI, aiOpen }: Props) {
  const {
    selectedCell,
    getCell,
    updateRangeFormat,
    undo,
    redo,
    canUndo,
    canRedo,
  } = spreadsheet;

  // Read format state from anchor/selected cell
  const cell = selectedCell
    ? getCell(selectedCell.row, selectedCell.col)
    : null;

  const isBold = cell?.bold || false;
  const isItalic = cell?.italic || false;
  const isUnderline = cell?.underline || false;
  const align = cell?.align || "left";
  const fontSize = cell?.fontSize || 12;
  const color = cell?.color || "#000000";
  const bgColor = cell?.bgColor || "#ffffff";

  return (
    <div
      className="flex items-center gap-1 px-3 py-1 bg-white border-b border-border"
      style={{ minHeight: 38, flexShrink: 0 }}
      data-ocid="toolbar.panel"
    >
      {/* Undo / Redo */}
      <button
        type="button"
        className="toolbar-btn"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.35 }}
        data-ocid="toolbar.undo.button"
      >
        <Undo2 size={14} />
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        style={{ opacity: canRedo ? 1 : 0.35 }}
        data-ocid="toolbar.redo.button"
      >
        <Redo2 size={14} />
      </button>
      <button
        type="button"
        className="toolbar-btn"
        title="Print"
        data-ocid="toolbar.print.button"
      >
        <Printer size={14} />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Font size */}
      <select
        value={fontSize}
        onChange={(e) =>
          updateRangeFormat({ fontSize: Number.parseInt(e.target.value) })
        }
        className="h-6 text-xs border border-border rounded px-1 outline-none focus:border-ring"
        style={{ width: 52 }}
        title="Font size"
        data-ocid="toolbar.font_size.select"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-border mx-1" />

      {/* B / I / U */}
      <button
        type="button"
        className={`toolbar-btn font-bold${isBold ? " active" : ""}`}
        onClick={() => updateRangeFormat({ bold: !isBold })}
        title="Bold (Ctrl+B)"
        data-ocid="toolbar.bold.toggle"
      >
        <Bold size={13} strokeWidth={isBold ? 3 : 2} />
      </button>
      <button
        type="button"
        className={`toolbar-btn${isItalic ? " active" : ""}`}
        onClick={() => updateRangeFormat({ italic: !isItalic })}
        title="Italic (Ctrl+I)"
        data-ocid="toolbar.italic.toggle"
      >
        <Italic size={13} />
      </button>
      <button
        type="button"
        className={`toolbar-btn${isUnderline ? " active" : ""}`}
        onClick={() => updateRangeFormat({ underline: !isUnderline })}
        title="Underline (Ctrl+U)"
        data-ocid="toolbar.underline.toggle"
      >
        <Underline size={13} />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Text color */}
      <div className="relative flex flex-col items-center" title="Text color">
        <span className="text-xs font-bold leading-none" style={{ color }}>
          A
        </span>
        <input
          type="color"
          value={color}
          onChange={(e) => updateRangeFormat({ color: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ width: 26, height: 26 }}
          title="Text color"
          data-ocid="toolbar.text_color.input"
        />
        <div
          className="w-4 h-1 rounded-sm mt-px"
          style={{ background: color }}
        />
      </div>

      {/* Fill / Background color */}
      <div className="relative flex flex-col items-center" title="Fill color">
        <span
          className="text-xs font-bold leading-none"
          style={{
            background: bgColor === "#ffffff" ? "transparent" : bgColor,
            color: bgColor === "#ffffff" ? "#374151" : "transparent",
            width: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ccc",
            borderRadius: 2,
          }}
        >
          &nbsp;
        </span>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => updateRangeFormat({ bgColor: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          style={{ width: 26, height: 26 }}
          title="Fill color"
          data-ocid="toolbar.fill_color.input"
        />
        <div
          className="w-4 h-1 rounded-sm mt-px"
          style={{ background: bgColor === "#ffffff" ? "#e5e7eb" : bgColor }}
        />
      </div>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Alignment */}
      <button
        type="button"
        className={`toolbar-btn${align === "left" ? " active" : ""}`}
        onClick={() => updateRangeFormat({ align: "left" })}
        title="Align left"
        data-ocid="toolbar.align_left.toggle"
      >
        <AlignLeft size={13} />
      </button>
      <button
        type="button"
        className={`toolbar-btn${align === "center" ? " active" : ""}`}
        onClick={() => updateRangeFormat({ align: "center" })}
        title="Align center"
        data-ocid="toolbar.align_center.toggle"
      >
        <AlignCenter size={13} />
      </button>
      <button
        type="button"
        className={`toolbar-btn${align === "right" ? " active" : ""}`}
        onClick={() => updateRangeFormat({ align: "right" })}
        title="Align right"
        data-ocid="toolbar.align_right.toggle"
      >
        <AlignRight size={13} />
      </button>

      <div className="ml-auto" />

      {/* AI toggle */}
      <button
        type="button"
        className={`toolbar-btn px-3 flex items-center gap-1 text-xs font-semibold${aiOpen ? " active" : ""}`}
        onClick={onToggleAI}
        style={{
          width: "auto",
          minWidth: 60,
          color: aiOpen ? "#1a73e8" : undefined,
        }}
        title="Toggle AI Assistant"
        data-ocid="toolbar.ai.toggle"
      >
        <Sparkles size={12} />
        AI
      </button>
    </div>
  );
}
