import { useEffect, useState } from "react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";
import { indexToColLetter } from "../lib/formulaEngine";

interface Props {
  spreadsheet: SpreadsheetHook;
}

function rangeToAddress(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): string {
  const topLeft = `${indexToColLetter(c1)}${r1 + 1}`;
  const bottomRight = `${indexToColLetter(c2)}${r2 + 1}`;
  if (topLeft === bottomRight) return topLeft;
  return `${topLeft}:${bottomRight}`;
}

export default function FormulaBar({ spreadsheet }: Props) {
  const { selectedCell, selectionRange, getRangeNormalized, getCell, setCell } =
    spreadsheet;

  const cellAddress = (() => {
    if (selectionRange) {
      const { r1, c1, r2, c2 } = getRangeNormalized();
      return rangeToAddress(r1, c1, r2, c2);
    }
    if (selectedCell)
      return `${indexToColLetter(selectedCell.col)}${selectedCell.row + 1}`;
    return "";
  })();

  const cellData = selectedCell
    ? getCell(selectedCell.row, selectedCell.col)
    : null;
  const rawValue = cellData?.formula || cellData?.value || "";

  const [inputVal, setInputVal] = useState(rawValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setInputVal(rawValue);
  }, [rawValue, isEditing]);

  const handleCommit = () => {
    if (!selectedCell || !isEditing) return;
    const { row, col } = selectedCell;
    const isFormula = inputVal.startsWith("=");
    setCell(row, col, {
      value: isFormula ? "" : inputVal,
      formula: isFormula ? inputVal : undefined,
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCommit();
    else if (e.key === "Escape") {
      setInputVal(rawValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="formula-bar" data-ocid="formulabar.panel">
      <input
        className="name-box"
        value={cellAddress}
        readOnly
        placeholder="A1"
        data-ocid="formulabar.cell_address.input"
        aria-label="Cell address"
      />
      <div className="w-px h-4 bg-border flex-shrink-0" />
      <span
        className="text-xs text-muted-foreground font-mono font-semibold px-1 flex-shrink-0"
        style={{ color: "#5a6a7a" }}
      >
        fx
      </span>
      <input
        className="formula-input"
        value={inputVal}
        onChange={(e) => {
          setInputVal(e.target.value);
          setIsEditing(true);
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        placeholder="Enter value or formula..."
        data-ocid="formulabar.formula.input"
        aria-label="Formula input"
      />
    </div>
  );
}
