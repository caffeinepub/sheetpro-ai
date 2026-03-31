import { useCallback, useEffect, useRef, useState } from "react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";
import { indexToColLetter } from "../lib/formulaEngine";

const NUM_COLS = 26;
const NUM_ROWS = 100;
const COL_WIDTH = 100;
const ROW_HEIGHT = 28;
const ROW_NUM_WIDTH = 48;
const HEADER_HEIGHT = 28;

interface Props {
  spreadsheet: SpreadsheetHook;
}

export default function Grid({ spreadsheet }: Props) {
  const { cells, selectedCell, setSelectedCell, getDisplayValue, setCell } =
    spreadsheet;

  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const colLetters = Array.from({ length: NUM_COLS }, (_, i) =>
    indexToColLetter(i),
  );
  const rows = Array.from({ length: NUM_ROWS }, (_, i) => i);

  const startEditing = useCallback(
    (row: number, col: number) => {
      const key = `${row}-${col}`;
      const cell = cells[key];
      const val = cell?.formula || cell?.value || "";
      setEditingCell({ row, col });
      setEditingValue(val);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [cells],
  );

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const isFormula = editingValue.startsWith("=");
    setCell(row, col, {
      value: isFormula ? "" : editingValue,
      formula: isFormula ? editingValue : undefined,
    });
    setEditingCell(null);
    setEditingValue("");
  }, [editingCell, editingValue, setCell]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditingValue("");
  }, []);

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      if (e.key === "Enter") {
        commitEdit();
        setSelectedCell({ row: row + 1, col });
      } else if (e.key === "Escape") {
        cancelEdit();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        setSelectedCell({ row, col: col + 1 < NUM_COLS ? col + 1 : col });
      }
    },
    [commitEdit, cancelEdit, setSelectedCell],
  );

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell || editingCell) return;
      const { row, col } = selectedCell;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCell({ row: Math.min(row + 1, NUM_ROWS - 1), col });
      } else if (e.key === "Enter") {
        e.preventDefault();
        startEditing(row, col);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCell({ row: Math.max(row - 1, 0), col });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
      } else if (e.key === "Tab") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.max(col - 1, 0) });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        setCell(row, col, { value: "", formula: undefined });
      } else if (e.key === "F2") {
        startEditing(row, col);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setEditingCell({ row, col });
        setEditingValue(e.key);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [selectedCell, editingCell, setSelectedCell, setCell, startEditing],
  );

  useEffect(() => {
    if (!selectedCell || !scrollRef.current) return;
    const { row, col } = selectedCell;
    const el = scrollRef.current;
    const cellLeft = ROW_NUM_WIDTH + col * COL_WIDTH;
    const cellTop = HEADER_HEIGHT + row * ROW_HEIGHT;
    const cellRight = cellLeft + COL_WIDTH;
    const cellBottom = cellTop + ROW_HEIGHT;

    if (cellLeft < el.scrollLeft + ROW_NUM_WIDTH) {
      el.scrollLeft = cellLeft - ROW_NUM_WIDTH - 4;
    } else if (cellRight > el.scrollLeft + el.clientWidth - 4) {
      el.scrollLeft = cellRight - el.clientWidth + 4;
    }
    if (cellTop < el.scrollTop + HEADER_HEIGHT) {
      el.scrollTop = cellTop - HEADER_HEIGHT - 4;
    } else if (cellBottom > el.scrollTop + el.clientHeight - 4) {
      el.scrollTop = cellBottom - el.clientHeight + 4;
    }
  }, [selectedCell]);

  const isSelected = (row: number, col: number) =>
    selectedCell?.row === row && selectedCell?.col === col;
  const isEditing = (row: number, col: number) =>
    editingCell?.row === row && editingCell?.col === col;

  const getCellStyle = (row: number, col: number): React.CSSProperties => {
    const cell = cells[`${row}-${col}`];
    if (!cell) return {};
    return {
      fontWeight: cell.bold ? 700 : undefined,
      fontStyle: cell.italic ? "italic" : undefined,
      textDecoration: cell.underline ? "underline" : undefined,
      textAlign: cell.align,
      fontSize: cell.fontSize ? `${cell.fontSize}px` : undefined,
      color: cell.color || undefined,
    };
  };

  const totalWidth = ROW_NUM_WIDTH + NUM_COLS * COL_WIDTH;

  return (
    <div
      ref={gridRef}
      className="flex-1 overflow-hidden"
      style={{ minWidth: 0, outline: "none" }}
      onKeyDown={handleGridKeyDown}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: spreadsheet grid requires keyboard focus
      tabIndex={0}
      aria-label="Spreadsheet grid"
      data-ocid="grid.canvas_target"
      onClick={() => gridRef.current?.focus()}
    >
      <div ref={scrollRef} className="grid-scroll">
        <div style={{ width: totalWidth }}>
          {/* Column header row */}
          <div className="grid-header-row" aria-hidden="true">
            <div className="header-corner header-corner-cell" />
            {colLetters.map((letter) => (
              <div key={letter} className="col-header">
                {letter}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row) => (
            <div key={row} className="grid-data-row">
              <div className="row-number row-number-cell" aria-hidden="true">
                {row + 1}
              </div>

              {colLetters.map((letter, col) => {
                const selected = isSelected(row, col);
                const editing = isEditing(row, col);
                const displayVal = getDisplayValue(row, col);
                const style = getCellStyle(row, col);

                return (
                  <div
                    key={letter}
                    className={`grid-cell${
                      selected ? " selected" : ""
                    }${editing ? " editing" : ""}`}
                    style={style}
                    onClick={() => {
                      if (editingCell && !editing) commitEdit();
                      setSelectedCell({ row, col });
                      gridRef.current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        startEditing(row, col);
                      }
                    }}
                    onDoubleClick={() => startEditing(row, col)}
                    data-row={row}
                    data-col={col}
                    aria-rowindex={row + 1}
                    aria-colindex={col + 1}
                  >
                    {editing ? (
                      <input
                        ref={inputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, row, col)}
                        onBlur={commitEdit}
                        style={{
                          width: "100%",
                          height: "100%",
                          padding: "0 4px",
                          fontSize: style.fontSize || "12px",
                          fontFamily: "Inter, sans-serif",
                          border: "none",
                          outline: "none",
                          background: "#fff",
                          fontWeight: style.fontWeight,
                          fontStyle: style.fontStyle,
                        }}
                      />
                    ) : (
                      displayVal
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
