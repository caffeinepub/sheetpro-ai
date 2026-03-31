import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";

interface Props {
  spreadsheet: SpreadsheetHook;
}

export default function SheetTabs({ spreadsheet }: Props) {
  const {
    sheets,
    activeSheet,
    setActiveSheet,
    addSheet,
    renameSheet,
    deleteSheet,
  } = spreadsheet;

  const [renamingSheet, setRenamingSheet] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (name: string) => {
    setRenamingSheet(name);
    setRenameValue(name);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = () => {
    if (renamingSheet && renameValue.trim()) {
      renameSheet(renamingSheet, renameValue.trim());
    }
    setRenamingSheet(null);
  };

  return (
    <div
      className="flex items-center bg-white border-t border-border"
      style={{ minHeight: 36, flexShrink: 0 }}
      data-ocid="sheettabs.panel"
    >
      <div className="tabs-scroll flex items-end flex-1 px-2 gap-1 py-1">
        {sheets.map((sheet, idx) => {
          const isActive = sheet === activeSheet;
          const isRenaming = renamingSheet === sheet;
          return (
            <div
              key={sheet}
              className="relative flex items-center group"
              data-ocid={`sheettabs.tab.${idx + 1}`}
            >
              <button
                type="button"
                onClick={() => setActiveSheet(sheet)}
                onDoubleClick={() => startRename(sheet)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-t transition-all"
                style={{
                  background: isActive ? "#fff" : "#f0f4f8",
                  color: isActive ? "#0E2235" : "#5a6a7a",
                  border: isActive
                    ? "1px solid #d0d9e4"
                    : "1px solid transparent",
                  borderBottom: isActive
                    ? "1px solid #fff"
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? "0 -1px 3px rgba(14,34,53,0.08)"
                    : "none",
                  fontWeight: isActive ? 600 : 400,
                  minWidth: 72,
                  position: "relative",
                  bottom: isActive ? 1 : 0,
                }}
                data-ocid="sheettabs.sheet.tab"
              >
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingSheet(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="outline-none bg-transparent text-xs w-20 border-b border-ring"
                    data-ocid="sheettabs.rename.input"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                ) : (
                  <span className="truncate max-w-[100px]">{sheet}</span>
                )}
              </button>

              {sheets.length > 1 && (
                <button
                  type="button"
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-100 text-red-500 items-center justify-center hidden group-hover:flex transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSheet(sheet);
                  }}
                  title={`Delete ${sheet}`}
                  data-ocid={`sheettabs.delete.button.${idx + 1}`}
                >
                  <X size={9} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addSheet}
        className="flex items-center justify-center w-7 h-7 mr-2 rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex-shrink-0"
        title="Add sheet"
        data-ocid="sheettabs.add.button"
      >
        <Plus size={14} />
      </button>

      <div className="pr-3 text-xs text-muted-foreground flex-shrink-0 hidden md:flex items-center gap-2">
        <span style={{ color: "#8a9ab0" }}>
          {new Date().getFullYear()} © SheetPro AI
        </span>
      </div>
    </div>
  );
}
