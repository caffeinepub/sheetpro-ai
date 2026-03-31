import { useCallback, useMemo, useState } from "react";
import { evaluateFormula } from "../lib/formulaEngine";
import { colLetterToIndex } from "../lib/formulaEngine";

export interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  fontSize?: number;
  color?: string;
  bgColor?: string;
}

export type CellMap = Record<string, CellData>;
export type SheetMap = Record<string, CellMap>;

export interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

const SEED_SHEET1: CellMap = {
  "0-0": { value: "Task", bold: true },
  "0-1": { value: "Status", bold: true },
  "0-2": { value: "Start Date", bold: true },
  "0-3": { value: "End Date", bold: true },
  "0-4": { value: "Budget", bold: true },
  "0-5": { value: "Spent", bold: true },
  "0-6": { value: "Progress", bold: true },
  "1-0": { value: "Website Redesign" },
  "1-1": { value: "In Progress", color: "#1a73e8" },
  "1-2": { value: "2024-01-15" },
  "1-3": { value: "2024-03-30" },
  "1-4": { value: "50000" },
  "1-5": { value: "32000" },
  "1-6": { value: "64%" },
  "2-0": { value: "Mobile App Dev" },
  "2-1": { value: "Planning", color: "#f59e0b" },
  "2-2": { value: "2024-02-01" },
  "2-3": { value: "2024-06-30" },
  "2-4": { value: "80000" },
  "2-5": { value: "15000" },
  "2-6": { value: "19%" },
  "3-0": { value: "API Integration" },
  "3-1": { value: "Complete", color: "#10b981" },
  "3-2": { value: "2024-01-01" },
  "3-3": { value: "2024-02-28" },
  "3-4": { value: "20000" },
  "3-5": { value: "20000" },
  "3-6": { value: "100%" },
  "4-0": { value: "Database Migration" },
  "4-1": { value: "In Review", color: "#8b5cf6" },
  "4-2": { value: "2024-03-01" },
  "4-3": { value: "2024-04-15" },
  "4-4": { value: "35000" },
  "4-5": { value: "28000" },
  "4-6": { value: "80%" },
  "5-0": { value: "Security Audit" },
  "5-1": { value: "Planning", color: "#f59e0b" },
  "5-2": { value: "2024-04-01" },
  "5-3": { value: "2024-05-31" },
  "5-4": { value: "25000" },
  "5-5": { value: "5000" },
  "5-6": { value: "20%" },
  "7-0": { value: "TOTAL", bold: true },
  "7-4": { value: "", formula: "=SUM(E1:E5)", bold: true },
  "7-5": { value: "", formula: "=SUM(F1:F5)", bold: true },
};

const NUM_COLS = 26;
const NUM_ROWS = 100;

export function useSpreadsheet() {
  const [allCells, setAllCells] = useState<SheetMap>({
    Sheet1: SEED_SHEET1,
    Sheet2: {},
    Sheet3: {},
  });

  const [activeSheet, setActiveSheetState] = useState("Sheet1");
  const [sheets, setSheets] = useState(["Sheet1", "Sheet2", "Sheet3"]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>({ row: 0, col: 0 });
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(
    null,
  );
  const [clipboard, setClipboard] = useState<{
    cells: CellMap;
    rows: number;
    cols: number;
  } | null>(null);
  const [undoStack, setUndoStack] = useState<SheetMap[]>([]);
  const [redoStack, setRedoStack] = useState<SheetMap[]>([]);

  const cells: CellMap = useMemo(
    () => allCells[activeSheet] || {},
    [allCells, activeSheet],
  );

  const getCell = useCallback(
    (row: number, col: number): CellData | undefined => cells[`${row}-${col}`],
    [cells],
  );

  const makeGetCellFn = useCallback(
    (currentCells: CellMap) =>
      (ref: string): string => {
        const match = ref.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return "";
        const col = colLetterToIndex(match[1].toUpperCase());
        const row = Number.parseInt(match[2]) - 1;
        const cell = currentCells[`${row}-${col}`];
        if (!cell) return "";
        if (cell.formula) {
          return evaluateFormula(cell.formula, makeGetCellFn(currentCells));
        }
        return cell.value;
      },
    [],
  );

  const getDisplayValue = useCallback(
    (row: number, col: number): string => {
      const cell = cells[`${row}-${col}`];
      if (!cell) return "";
      if (cell.formula) {
        return evaluateFormula(cell.formula, makeGetCellFn(cells));
      }
      return cell.value;
    },
    [cells, makeGetCellFn],
  );

  const saveSnapshot = useCallback(() => {
    setUndoStack((prev) =>
      [...prev, JSON.parse(JSON.stringify(allCells)) as SheetMap].slice(-30),
    );
    setRedoStack([]);
  }, [allCells]);

  const setCell = useCallback(
    (row: number, col: number, data: Partial<CellData>) => {
      saveSnapshot();
      setAllCells((prev) => ({
        ...prev,
        [activeSheet]: {
          ...prev[activeSheet],
          [`${row}-${col}`]: {
            ...(prev[activeSheet]?.[`${row}-${col}`] || { value: "" }),
            ...data,
          },
        },
      }));
    },
    [activeSheet, saveSnapshot],
  );

  const getRangeNormalized = useCallback(() => {
    if (!selectionRange) {
      const r = selectedCell?.row ?? 0;
      const c = selectedCell?.col ?? 0;
      return { r1: r, c1: c, r2: r, c2: c };
    }
    const { startRow, startCol, endRow, endCol } = selectionRange;
    return {
      r1: Math.min(startRow, endRow),
      c1: Math.min(startCol, endCol),
      r2: Math.max(startRow, endRow),
      c2: Math.max(startCol, endCol),
    };
  }, [selectionRange, selectedCell]);

  const updateRangeFormat = useCallback(
    (format: Partial<CellData>) => {
      const { r1, c1, r2, c2 } = getRangeNormalized();
      setAllCells((prev) => {
        const sheet = { ...(prev[activeSheet] || {}) };
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            const key = `${r}-${c}`;
            sheet[key] = { ...(sheet[key] || { value: "" }), ...format };
          }
        }
        return { ...prev, [activeSheet]: sheet };
      });
    },
    [activeSheet, getRangeNormalized],
  );

  const updateCellFormat = useCallback(
    (format: Partial<CellData>) => updateRangeFormat(format),
    [updateRangeFormat],
  );

  const clearRange = useCallback(() => {
    saveSnapshot();
    const { r1, c1, r2, c2 } = getRangeNormalized();
    setAllCells((prev) => {
      const sheet = { ...(prev[activeSheet] || {}) };
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const key = `${r}-${c}`;
          if (sheet[key]) {
            sheet[key] = { ...sheet[key], value: "", formula: undefined };
          }
        }
      }
      return { ...prev, [activeSheet]: sheet };
    });
  }, [activeSheet, getRangeNormalized, saveSnapshot]);

  const copyRange = useCallback(() => {
    const { r1, c1, r2, c2 } = getRangeNormalized();
    const copiedCells: CellMap = {};
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const key = `${r}-${c}`;
        if (cells[key]) {
          copiedCells[`${r - r1}-${c - c1}`] = { ...cells[key] };
        }
      }
    }
    setClipboard({ cells: copiedCells, rows: r2 - r1 + 1, cols: c2 - c1 + 1 });
  }, [cells, getRangeNormalized]);

  const pasteRange = useCallback(() => {
    if (!clipboard || !selectedCell) return;
    saveSnapshot();
    const { row: baseRow, col: baseCol } = selectedCell;
    setAllCells((prev) => {
      const sheet = { ...(prev[activeSheet] || {}) };
      for (let r = 0; r < clipboard.rows; r++) {
        for (let c = 0; c < clipboard.cols; c++) {
          const srcKey = `${r}-${c}`;
          const dstRow = baseRow + r;
          const dstCol = baseCol + c;
          if (dstRow >= NUM_ROWS || dstCol >= NUM_COLS) continue;
          const dstKey = `${dstRow}-${dstCol}`;
          if (clipboard.cells[srcKey]) {
            sheet[dstKey] = { ...clipboard.cells[srcKey] };
          }
        }
      }
      return { ...prev, [activeSheet]: sheet };
    });
  }, [clipboard, selectedCell, activeSheet, saveSnapshot]);

  const insertRowBelow = useCallback(
    (row: number) => {
      saveSnapshot();
      setAllCells((prev) => {
        const sheet = { ...(prev[activeSheet] || {}) };
        const newSheet: CellMap = {};
        for (const key of Object.keys(sheet)) {
          const [r, c] = key.split("-").map(Number);
          if (r > row) {
            newSheet[`${r + 1}-${c}`] = sheet[key];
          } else {
            newSheet[key] = sheet[key];
          }
        }
        return { ...prev, [activeSheet]: newSheet };
      });
    },
    [activeSheet, saveSnapshot],
  );

  const deleteRow = useCallback(
    (row: number) => {
      saveSnapshot();
      setAllCells((prev) => {
        const sheet = { ...(prev[activeSheet] || {}) };
        const newSheet: CellMap = {};
        for (const key of Object.keys(sheet)) {
          const [r, c] = key.split("-").map(Number);
          if (r < row) newSheet[key] = sheet[key];
          else if (r > row) newSheet[`${r - 1}-${c}`] = sheet[key];
        }
        return { ...prev, [activeSheet]: newSheet };
      });
    },
    [activeSheet, saveSnapshot],
  );

  const insertColRight = useCallback(
    (col: number) => {
      saveSnapshot();
      setAllCells((prev) => {
        const sheet = { ...(prev[activeSheet] || {}) };
        const newSheet: CellMap = {};
        for (const key of Object.keys(sheet)) {
          const [r, c] = key.split("-").map(Number);
          if (c > col) {
            newSheet[`${r}-${c + 1}`] = sheet[key];
          } else {
            newSheet[key] = sheet[key];
          }
        }
        return { ...prev, [activeSheet]: newSheet };
      });
    },
    [activeSheet, saveSnapshot],
  );

  const deleteCol = useCallback(
    (col: number) => {
      saveSnapshot();
      setAllCells((prev) => {
        const sheet = { ...(prev[activeSheet] || {}) };
        const newSheet: CellMap = {};
        for (const key of Object.keys(sheet)) {
          const [r, c] = key.split("-").map(Number);
          if (c < col) newSheet[key] = sheet[key];
          else if (c > col) newSheet[`${r}-${c - 1}`] = sheet[key];
        }
        return { ...prev, [activeSheet]: newSheet };
      });
    },
    [activeSheet, saveSnapshot],
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [
      ...r,
      JSON.parse(JSON.stringify(allCells)) as SheetMap,
    ]);
    setAllCells(prev);
    setUndoStack((u) => u.slice(0, -1));
  }, [undoStack, allCells]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [
      ...u,
      JSON.parse(JSON.stringify(allCells)) as SheetMap,
    ]);
    setAllCells(next);
    setRedoStack((r) => r.slice(0, -1));
  }, [redoStack, allCells]);

  const addSheet = useCallback(() => {
    const name = `Sheet${sheets.length + 1}`;
    setSheets((prev) => [...prev, name]);
    setAllCells((prev) => ({ ...prev, [name]: {} }));
    setActiveSheetState(name);
  }, [sheets]);

  const renameSheet = useCallback(
    (oldName: string, newName: string) => {
      if (!newName.trim() || newName === oldName) return;
      setSheets((prev) => prev.map((s) => (s === oldName ? newName : s)));
      setAllCells((prev) => {
        const next = { ...prev };
        next[newName] = next[oldName] || {};
        delete next[oldName];
        return next;
      });
      if (activeSheet === oldName) setActiveSheetState(newName);
    },
    [activeSheet],
  );

  const deleteSheet = useCallback(
    (name: string) => {
      if (sheets.length <= 1) return;
      setSheets((prev) => prev.filter((s) => s !== name));
      setAllCells((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (activeSheet === name) {
        setActiveSheetState(sheets.find((s) => s !== name) || sheets[0]);
      }
    },
    [sheets, activeSheet],
  );

  const setActiveSheet = useCallback((name: string) => {
    setActiveSheetState(name);
    setSelectedCell({ row: 0, col: 0 });
    setSelectionRange(null);
  }, []);

  return {
    cells,
    selectedCell,
    setSelectedCell,
    selectionRange,
    setSelectionRange,
    clipboard,
    activeSheet,
    sheets,
    getCell,
    getDisplayValue,
    setCell,
    updateCellFormat,
    updateRangeFormat,
    getRangeNormalized,
    clearRange,
    copyRange,
    pasteRange,
    insertRowBelow,
    deleteRow,
    insertColRight,
    deleteCol,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    addSheet,
    renameSheet,
    deleteSheet,
    setActiveSheet,
  };
}

export type SpreadsheetHook = ReturnType<typeof useSpreadsheet>;
