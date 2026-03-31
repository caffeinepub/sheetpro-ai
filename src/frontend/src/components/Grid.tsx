import { useCallback, useEffect, useRef, useState } from "react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";
import { indexToColLetter } from "../lib/formulaEngine";

const NUM_COLS = 26;
const NUM_ROWS = 100;
const COL_WIDTH = 100;
const ROW_HEIGHT = 28;
const ROW_NUM_WIDTH = 48;
const HEADER_HEIGHT = 28;

interface ContextMenuState {
  x: number;
  y: number;
  row: number;
  col: number;
}

interface Props {
  spreadsheet: SpreadsheetHook;
}

export default function Grid({ spreadsheet }: Props) {
  const {
    cells,
    selectedCell,
    setSelectedCell,
    selectionRange,
    setSelectionRange,
    getDisplayValue,
    setCell,
    clearRange,
    copyRange,
    pasteRange,
    getRangeNormalized,
    insertRowBelow,
    deleteRow,
    insertColRight,
    deleteCol,
  } = spreadsheet;

  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fillGhostEnd, setFillGhostEnd] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Drag state refs (no re-render needed)
  const isMouseDown = useRef(false);
  const anchorCell = useRef<{ row: number; col: number } | null>(null);
  const fillDragActive = useRef(false);
  const fillSourceRange = useRef<{
    r1: number;
    c1: number;
    r2: number;
    c2: number;
  } | null>(null);
  const touchSelecting = useRef(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressData = useRef<{
    x: number;
    y: number;
    row: number;
    col: number;
  } | null>(null);

  const colLetters = Array.from({ length: NUM_COLS }, (_, i) =>
    indexToColLetter(i),
  );
  const rows = Array.from({ length: NUM_ROWS }, (_, i) => i);

  // ─── Range helpers ────────────────────────────────────────────────────
  const isInRange = useCallback(
    (row: number, col: number): boolean => {
      if (!selectionRange) return false;
      const { r1, c1, r2, c2 } = getRangeNormalized();
      return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    },
    [selectionRange, getRangeNormalized],
  );

  const isInFillGhost = useCallback(
    (row: number, col: number): boolean => {
      if (!fillGhostEnd || !fillSourceRange.current) return false;
      const src = fillSourceRange.current;
      const end = fillGhostEnd;
      if (end.row > src.r2) {
        // Filling down
        return col >= src.c1 && col <= src.c2 && row > src.r2 && row <= end.row;
      }
      if (end.col > src.c2) {
        // Filling right
        return row >= src.r1 && row <= src.r2 && col > src.c2 && col <= end.col;
      }
      return false;
    },
    [fillGhostEnd],
  );

  // ─── Edit helpers ─────────────────────────────────────────────────────
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

  // ─── Fill logic ───────────────────────────────────────────────────────
  const executeFill = useCallback(
    (ghostEnd: { row: number; col: number }) => {
      if (!fillSourceRange.current) return;
      const src = fillSourceRange.current;
      const fillingDown = ghostEnd.row > src.r2;
      const fillingRight = ghostEnd.col > src.c2;
      if (!fillingDown && !fillingRight) return;

      const srcValues: string[] = [];
      if (fillingDown) {
        for (let r = src.r1; r <= src.r2; r++) {
          srcValues.push(cells[`${r}-${src.c1}`]?.value || "");
        }
      } else {
        for (let c = src.c1; c <= src.c2; c++) {
          srcValues.push(cells[`${src.r1}-${c}`]?.value || "");
        }
      }

      // Detect numeric increment
      const nums = srcValues.map((v) => Number(v));
      const allNumeric = nums.every(
        (n) => !Number.isNaN(n) && srcValues.every((v) => v !== ""),
      );
      let increment = 1;
      if (allNumeric && srcValues.length > 1) {
        increment = nums[1] - nums[0];
      }

      if (fillingDown) {
        const colCount = src.c2 - src.c1 + 1;
        for (let r = src.r2 + 1; r <= ghostEnd.row; r++) {
          for (let c = src.c1; c <= src.c2; c++) {
            const srcCellVal =
              cells[
                `${src.r1 + ((r - src.r2 - 1) % (src.r2 - src.r1 + 1))}-${c}`
              ]?.value || "";
            let fillVal = srcCellVal;
            if (colCount === 1 && allNumeric && srcCellVal !== "") {
              const lastNum = Number(
                cells[`${r - 1}-${c}`]?.value ??
                  srcValues[srcValues.length - 1],
              );
              fillVal = String(lastNum + increment);
            }
            const existing = cells[`${r}-${c}`];
            setCell(r, c, {
              ...(existing || {}),
              value: fillVal,
              formula: undefined,
            });
          }
        }
      } else {
        const rowCount = src.r2 - src.r1 + 1;
        for (let c = src.c2 + 1; c <= ghostEnd.col; c++) {
          for (let r = src.r1; r <= src.r2; r++) {
            const srcCellVal =
              cells[
                `${r}-${src.c1 + ((c - src.c2 - 1) % (src.c2 - src.c1 + 1))}`
              ]?.value || "";
            let fillVal = srcCellVal;
            if (rowCount === 1 && allNumeric && srcCellVal !== "") {
              const lastNum = Number(
                cells[`${r}-${c - 1}`]?.value ??
                  srcValues[srcValues.length - 1],
              );
              fillVal = String(lastNum + increment);
            }
            const existing = cells[`${r}-${c}`];
            setCell(r, c, {
              ...(existing || {}),
              value: fillVal,
              formula: undefined,
            });
          }
        }
      }
    },
    [cells, setCell],
  );

  // ─── Mouse events ─────────────────────────────────────────────────────
  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      if (e.button !== 0) return;
      if (editingCell) commitEdit();
      isMouseDown.current = true;
      anchorCell.current = { row, col };
      if (e.shiftKey && selectedCell) {
        setSelectionRange({
          startRow: selectedCell.row,
          startCol: selectedCell.col,
          endRow: row,
          endCol: col,
        });
      } else {
        setSelectedCell({ row, col });
        setSelectionRange(null);
      }
      gridRef.current?.focus();
    },
    [editingCell, commitEdit, selectedCell, setSelectedCell, setSelectionRange],
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isMouseDown.current || !anchorCell.current) return;
      setSelectionRange({
        startRow: anchorCell.current.row,
        startCol: anchorCell.current.col,
        endRow: row,
        endCol: col,
      });
    },
    [setSelectionRange],
  );

  // Document mouseup
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDown.current = false;
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // ─── Touch events (non-passive) ───────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (fillDragActive.current) {
        e.preventDefault();
        if (touchTimer.current) clearTimeout(touchTimer.current);
        const touch = e.touches[0];
        const target = document.elementFromPoint(
          touch.clientX,
          touch.clientY,
        ) as HTMLElement | null;
        const rowAttr = target?.getAttribute("data-row");
        const colAttr = target?.getAttribute("data-col");
        if (rowAttr != null && colAttr != null) {
          setFillGhostEnd({
            row: Number.parseInt(rowAttr),
            col: Number.parseInt(colAttr),
          });
        }
        return;
      }
      if (!touchSelecting.current) return;
      e.preventDefault();
      if (touchTimer.current) clearTimeout(touchTimer.current);
      const touch = e.touches[0];
      const target = document.elementFromPoint(
        touch.clientX,
        touch.clientY,
      ) as HTMLElement | null;
      const rowAttr = target?.getAttribute("data-row");
      const colAttr = target?.getAttribute("data-col");
      if (rowAttr != null && colAttr != null && anchorCell.current) {
        setSelectionRange({
          startRow: anchorCell.current.row,
          startCol: anchorCell.current.col,
          endRow: Number.parseInt(rowAttr),
          endCol: Number.parseInt(colAttr),
        });
      }
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      if (fillDragActive.current && fillGhostEnd) {
        executeFill(fillGhostEnd);
        fillDragActive.current = false;
        fillSourceRange.current = null;
        setFillGhostEnd(null);
        return;
      }
      touchSelecting.current = false;
      if (touchTimer.current) clearTimeout(touchTimer.current);
      // If it was a tap (no selection drag), start editing on double-tap handled by onClick
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [setSelectionRange, fillGhostEnd, executeFill]);

  const handleCellTouchStart = useCallback(
    (e: React.TouchEvent, row: number, col: number) => {
      anchorCell.current = { row, col };
      touchSelecting.current = true;
      setSelectedCell({ row, col });
      setSelectionRange(null);
      longPressData.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        row,
        col,
      };
      touchTimer.current = setTimeout(() => {
        touchSelecting.current = false;
        if (longPressData.current) {
          setContextMenu({
            x: longPressData.current.x,
            y: longPressData.current.y,
            row: longPressData.current.row,
            col: longPressData.current.col,
          });
        }
      }, 500);
    },
    [setSelectedCell, setSelectionRange],
  );

  // ─── Fill handle mouse drag ───────────────────────────────────────────
  const handleFillHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const norm = getRangeNormalized();
      fillDragActive.current = true;
      fillSourceRange.current = norm;

      const handleMouseMove = (ev: MouseEvent) => {
        if (!fillDragActive.current) return;
        const target = document.elementFromPoint(
          ev.clientX,
          ev.clientY,
        ) as HTMLElement | null;
        const rowAttr = target?.getAttribute("data-row");
        const colAttr = target?.getAttribute("data-col");
        if (rowAttr != null && colAttr != null) {
          setFillGhostEnd({
            row: Number.parseInt(rowAttr),
            col: Number.parseInt(colAttr),
          });
        }
      };

      const handleMouseUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        if (fillDragActive.current) {
          const target = document.elementFromPoint(
            ev.clientX,
            ev.clientY,
          ) as HTMLElement | null;
          const rowAttr = target?.getAttribute("data-row");
          const colAttr = target?.getAttribute("data-col");
          const endCell =
            rowAttr != null && colAttr != null
              ? { row: Number.parseInt(rowAttr), col: Number.parseInt(colAttr) }
              : null;
          if (endCell) executeFill(endCell);
          fillDragActive.current = false;
          fillSourceRange.current = null;
          setFillGhostEnd(null);
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [getRangeNormalized, executeFill],
  );

  const handleFillHandleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const norm = getRangeNormalized();
      fillDragActive.current = true;
      fillSourceRange.current = norm;
      touchSelecting.current = false;
    },
    [getRangeNormalized],
  );

  // ─── Context menu ─────────────────────────────────────────────────────
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, row, col });
    },
    [],
  );

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [contextMenu]);

  // ─── Keyboard ─────────────────────────────────────────────────────────
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

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          copyRange();
          return;
        }
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          pasteRange();
          return;
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setSelectionRange({
            startRow: 0,
            startCol: 0,
            endRow: NUM_ROWS - 1,
            endCol: NUM_COLS - 1,
          });
          return;
        }
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          spreadsheet.undo();
          return;
        }
        if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          spreadsheet.redo();
          return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        clearRange();
        return;
      }

      const shift = e.shiftKey;
      const getRange = () =>
        selectionRange
          ? {
              r1: Math.min(selectionRange.startRow, selectionRange.endRow),
              c1: Math.min(selectionRange.startCol, selectionRange.endCol),
              r2: Math.max(selectionRange.startRow, selectionRange.endRow),
              c2: Math.max(selectionRange.startCol, selectionRange.endCol),
            }
          : { r1: row, c1: col, r2: row, c2: col };

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (shift) {
          const cur = getRange();
          const newEnd = Math.min(cur.r2 + 1, NUM_ROWS - 1);
          setSelectionRange({
            startRow: row,
            startCol: col,
            endRow: newEnd,
            endCol: selectionRange?.endCol ?? col,
          });
        } else {
          setSelectedCell({ row: Math.min(row + 1, NUM_ROWS - 1), col });
          setSelectionRange(null);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (shift) {
          const cur = getRange();
          const newEnd = Math.max(cur.r1 - 1, 0);
          setSelectionRange({
            startRow: row,
            startCol: col,
            endRow: newEnd,
            endCol: selectionRange?.endCol ?? col,
          });
        } else {
          setSelectedCell({ row: Math.max(row - 1, 0), col });
          setSelectionRange(null);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (shift) {
          const cur = getRange();
          const newEnd = Math.min(cur.c2 + 1, NUM_COLS - 1);
          setSelectionRange({
            startRow: row,
            startCol: col,
            endRow: selectionRange?.endRow ?? row,
            endCol: newEnd,
          });
        } else {
          setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
          setSelectionRange(null);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (shift) {
          const cur = getRange();
          const newEnd = Math.max(cur.c1 - 1, 0);
          setSelectionRange({
            startRow: row,
            startCol: col,
            endRow: selectionRange?.endRow ?? row,
            endCol: newEnd,
          });
        } else {
          setSelectedCell({ row, col: Math.max(col - 1, 0) });
          setSelectionRange(null);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
        setSelectionRange(null);
      } else if (e.key === "Enter") {
        e.preventDefault();
        startEditing(row, col);
      } else if (e.key === "F2") {
        startEditing(row, col);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setEditingCell({ row, col });
        setEditingValue(e.key);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [
      selectedCell,
      selectionRange,
      editingCell,
      setSelectedCell,
      setSelectionRange,
      clearRange,
      copyRange,
      pasteRange,
      startEditing,
      spreadsheet,
    ],
  );

  // ─── Auto-scroll to selected cell ─────────────────────────────────────
  useEffect(() => {
    if (!selectedCell || !scrollRef.current) return;
    const { row, col } = selectedCell;
    const el = scrollRef.current;
    const cellLeft = ROW_NUM_WIDTH + col * COL_WIDTH;
    const cellTop = HEADER_HEIGHT + row * ROW_HEIGHT;
    const cellRight = cellLeft + COL_WIDTH;
    const cellBottom = cellTop + ROW_HEIGHT;
    if (cellLeft < el.scrollLeft + ROW_NUM_WIDTH)
      el.scrollLeft = cellLeft - ROW_NUM_WIDTH - 4;
    else if (cellRight > el.scrollLeft + el.clientWidth - 4)
      el.scrollLeft = cellRight - el.clientWidth + 4;
    if (cellTop < el.scrollTop + HEADER_HEIGHT)
      el.scrollTop = cellTop - HEADER_HEIGHT - 4;
    else if (cellBottom > el.scrollTop + el.clientHeight - 4)
      el.scrollTop = cellBottom - el.clientHeight + 4;
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
      backgroundColor: cell.bgColor || undefined,
    };
  };

  const totalWidth = ROW_NUM_WIDTH + NUM_COLS * COL_WIDTH;
  const totalHeight = HEADER_HEIGHT + NUM_ROWS * ROW_HEIGHT;

  // Selection overlay position
  const norm = selectionRange ? getRangeNormalized() : null;
  const fillNorm = getRangeNormalized();
  const fillHandleLeft = ROW_NUM_WIDTH + (fillNorm.c2 + 1) * COL_WIDTH - 4;
  const fillHandleTop = HEADER_HEIGHT + (fillNorm.r2 + 1) * ROW_HEIGHT - 4;

  // Fill ghost overlay
  let fillGhostStyle: React.CSSProperties | null = null;
  if (fillGhostEnd && fillSourceRange.current) {
    const src = fillSourceRange.current;
    const end = fillGhostEnd;
    if (end.row > src.r2) {
      fillGhostStyle = {
        left: ROW_NUM_WIDTH + src.c1 * COL_WIDTH,
        top: HEADER_HEIGHT + (src.r2 + 1) * ROW_HEIGHT,
        width: (src.c2 - src.c1 + 1) * COL_WIDTH,
        height: (end.row - src.r2) * ROW_HEIGHT,
      };
    } else if (end.col > src.c2) {
      fillGhostStyle = {
        left: ROW_NUM_WIDTH + (src.c2 + 1) * COL_WIDTH,
        top: HEADER_HEIGHT + src.r1 * ROW_HEIGHT,
        width: (end.col - src.c2) * COL_WIDTH,
        height: (src.r2 - src.r1 + 1) * ROW_HEIGHT,
      };
    }
  }

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
        <div
          style={{
            width: totalWidth,
            height: totalHeight,
            position: "relative",
          }}
        >
          {/* Selection range overlay */}
          {norm && (
            <div
              className="selection-overlay"
              style={{
                left: ROW_NUM_WIDTH + norm.c1 * COL_WIDTH,
                top: HEADER_HEIGHT + norm.r1 * ROW_HEIGHT,
                width: (norm.c2 - norm.c1 + 1) * COL_WIDTH,
                height: (norm.r2 - norm.r1 + 1) * ROW_HEIGHT,
              }}
            />
          )}

          {/* Fill ghost overlay */}
          {fillGhostStyle && (
            <div className="fill-ghost-overlay" style={fillGhostStyle} />
          )}

          {/* Fill handle */}
          <div
            className="fill-handle-wrapper"
            style={{ left: fillHandleLeft, top: fillHandleTop }}
            onMouseDown={handleFillHandleMouseDown}
            onTouchStart={handleFillHandleTouchStart}
            data-ocid="grid.drag_handle"
            title="Drag to fill"
          >
            <div className="fill-handle" />
          </div>

          {/* Column header row */}
          <div className="grid-header-row" aria-hidden="true">
            <div
              className="header-corner header-corner-cell"
              onClick={() => {
                setSelectedCell({ row: 0, col: 0 });
                setSelectionRange({
                  startRow: 0,
                  startCol: 0,
                  endRow: NUM_ROWS - 1,
                  endCol: NUM_COLS - 1,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedCell({ row: 0, col: 0 });
                  setSelectionRange({
                    startRow: 0,
                    startCol: 0,
                    endRow: NUM_ROWS - 1,
                    endCol: NUM_COLS - 1,
                  });
                }
              }}
              style={{ cursor: "pointer" }}
            />
            {colLetters.map((letter, col) => (
              <div
                key={letter}
                className={`col-header${norm && col >= norm.c1 && col <= norm.c2 ? " col-selected" : ""}`}
                onClick={() => {
                  setSelectedCell({ row: 0, col });
                  setSelectionRange({
                    startRow: 0,
                    startCol: col,
                    endRow: NUM_ROWS - 1,
                    endCol: col,
                  });
                  gridRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCell({ row: 0, col });
                    setSelectionRange({
                      startRow: 0,
                      startCol: col,
                      endRow: NUM_ROWS - 1,
                      endCol: col,
                    });
                    gridRef.current?.focus();
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row) => (
            <div key={row} className="grid-data-row">
              <div
                className={`row-number row-number-cell${norm && row >= norm.r1 && row <= norm.r2 ? " row-selected" : ""}`}
                aria-hidden="true"
                onClick={() => {
                  setSelectedCell({ row, col: 0 });
                  setSelectionRange({
                    startRow: row,
                    startCol: 0,
                    endRow: row,
                    endCol: NUM_COLS - 1,
                  });
                  gridRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedCell({ row, col: 0 });
                    setSelectionRange({
                      startRow: row,
                      startCol: 0,
                      endRow: row,
                      endCol: NUM_COLS - 1,
                    });
                    gridRef.current?.focus();
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {row + 1}
              </div>

              {colLetters.map((letter, col) => {
                const selected = isSelected(row, col);
                const editing = isEditing(row, col);
                const inRange = isInRange(row, col);
                const inFillGhost = isInFillGhost(row, col);
                const displayVal = getDisplayValue(row, col);
                const style = getCellStyle(row, col);

                return (
                  <div
                    key={letter}
                    className={`grid-cell${selected ? " selected" : ""}${editing ? " editing" : ""}${inRange ? " in-range" : ""}${inFillGhost ? " in-fill-ghost" : ""}`}
                    style={style}
                    onMouseDown={(e) => handleCellMouseDown(e, row, col)}
                    onMouseEnter={() => handleCellMouseEnter(row, col)}
                    onTouchStart={(e) => handleCellTouchStart(e, row, col)}
                    onDoubleClick={() => startEditing(row, col)}
                    onContextMenu={(e) => handleCellRightClick(e, row, col)}
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
          data-ocid="grid.dropdown_menu"
        >
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              copyRange();
              setContextMenu(null);
            }}
            data-ocid="grid.copy.button"
          >
            Copy
          </button>
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              pasteRange();
              setContextMenu(null);
            }}
            data-ocid="grid.paste.button"
          >
            Paste
          </button>
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              clearRange();
              setContextMenu(null);
            }}
            data-ocid="grid.clear.button"
          >
            Clear Cells
          </button>
          <div className="ctx-divider" />
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              insertRowBelow(contextMenu.row);
              setContextMenu(null);
            }}
            data-ocid="grid.insert_row.button"
          >
            Insert Row Below
          </button>
          <button
            type="button"
            className="ctx-item ctx-danger"
            onClick={() => {
              deleteRow(contextMenu.row);
              setContextMenu(null);
            }}
            data-ocid="grid.delete_row.button"
          >
            Delete Row
          </button>
          <div className="ctx-divider" />
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              insertColRight(contextMenu.col);
              setContextMenu(null);
            }}
            data-ocid="grid.insert_col.button"
          >
            Insert Column Right
          </button>
          <button
            type="button"
            className="ctx-item ctx-danger"
            onClick={() => {
              deleteCol(contextMenu.col);
              setContextMenu(null);
            }}
            data-ocid="grid.delete_col.button"
          >
            Delete Column
          </button>
        </div>
      )}
    </div>
  );
}
