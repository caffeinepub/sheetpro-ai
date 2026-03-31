export type GetCellFn = (ref: string) => string;

export function colLetterToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1;
}

export function indexToColLetter(index: number): string {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function parseRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid cell ref: ${ref}`);
  return {
    col: colLetterToIndex(match[1].toUpperCase()),
    row: Number.parseInt(match[2]) - 1,
  };
}

function expandRange(range: string, getCell: GetCellFn): number[] {
  const parts = range.split(":");
  if (parts.length !== 2) return [];
  const start = parseRef(parts[0]);
  const end = parseRef(parts[1]);
  const values: number[] = [];
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      const ref = `${indexToColLetter(c)}${r + 1}`;
      const val = getCell(ref);
      const num = Number.parseFloat(val);
      if (!Number.isNaN(num)) values.push(num);
    }
  }
  return values;
}

function getNumericValues(argsStr: string, getCell: GetCellFn): number[] {
  const results: number[] = [];
  const parts = splitArgs(argsStr);
  for (const p of parts) {
    const trimmed = p.trim();
    if (trimmed.includes(":")) {
      results.push(...expandRange(trimmed, getCell));
    } else if (/^[A-Z]+\d+$/i.test(trimmed)) {
      const v = Number.parseFloat(getCell(trimmed.toUpperCase()));
      if (!Number.isNaN(v)) results.push(v);
    } else {
      const v = Number.parseFloat(trimmed);
      if (!Number.isNaN(v)) results.push(v);
    }
  }
  return results;
}

function splitArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of argsStr) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function resolveArg(arg: string, getCell: GetCellFn): string | number {
  const t = arg.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  if (/^[A-Z]+\d+$/i.test(t)) {
    const val = getCell(t.toUpperCase());
    const num = Number.parseFloat(val);
    return Number.isNaN(num) ? val : num;
  }
  const num = Number.parseFloat(t);
  return Number.isNaN(num) ? t : num;
}

function evalFunction(
  name: string,
  argsStr: string,
  getCell: GetCellFn,
): string | number {
  switch (name.toUpperCase()) {
    case "SUM": {
      return getNumericValues(argsStr, getCell).reduce((a, b) => a + b, 0);
    }
    case "AVERAGE": {
      const vals = getNumericValues(argsStr, getCell);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    case "COUNT": {
      return getNumericValues(argsStr, getCell).length;
    }
    case "IF": {
      const ifArgs = splitArgs(argsStr);
      if (ifArgs.length < 2) return "#ERROR";
      const cond = resolveArg(ifArgs[0], getCell);
      const trueVal = resolveArg(ifArgs[1], getCell);
      const falseVal = ifArgs[2] ? resolveArg(ifArgs[2], getCell) : "";
      const condBool =
        cond !== "" && cond !== 0 && cond !== "FALSE" && cond !== "0";
      return condBool ? trueVal : falseVal;
    }
    case "AND": {
      const andArgs = splitArgs(argsStr);
      return andArgs.every((a) => {
        const v = resolveArg(a, getCell);
        return v !== "" && v !== 0 && v !== "FALSE";
      })
        ? "TRUE"
        : "FALSE";
    }
    case "OR": {
      const orArgs = splitArgs(argsStr);
      return orArgs.some((a) => {
        const v = resolveArg(a, getCell);
        return v !== "" && v !== 0 && v !== "FALSE";
      })
        ? "TRUE"
        : "FALSE";
    }
    case "CONCAT": {
      const concatArgs = splitArgs(argsStr);
      return concatArgs.map((a) => String(resolveArg(a, getCell))).join("");
    }
    case "NOW": {
      return new Date().toLocaleString();
    }
    case "TODAY": {
      return new Date().toLocaleDateString();
    }
    default:
      return "#NAME?";
  }
}

export function evaluateFormula(formula: string, getCell: GetCellFn): string {
  if (!formula.startsWith("=")) return formula;

  try {
    const expr = formula.slice(1).trim();
    const result = evalExpr(expr, getCell);
    if (typeof result === "number") {
      return Number.isInteger(result)
        ? String(result)
        : result.toFixed(2).replace(/\.?0+$/, "");
    }
    return String(result);
  } catch {
    return "#ERROR";
  }
}

function safeEval(expr: string): unknown {
  // biome-ignore lint/security/noGlobalEval: formula engine requires dynamic expression evaluation
  return new Function(`"use strict"; return (${expr})`)();
}

function evalExpr(expr: string, getCell: GetCellFn): string | number {
  const trimmed = expr.trim();

  // Function call: NAME(...)
  const funcMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$/s);
  if (funcMatch) {
    return evalFunction(funcMatch[1], funcMatch[2], getCell);
  }

  // String literal
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }

  // Cell reference
  if (/^[A-Z]+\d+$/i.test(trimmed)) {
    return getCell(trimmed.toUpperCase()) || "";
  }

  // Arithmetic — resolve cell refs first
  const resolved = trimmed.replace(/[A-Z]+\d+/gi, (ref) => {
    const val = getCell(ref.toUpperCase());
    const num = Number.parseFloat(val);
    return Number.isNaN(num) ? `"${val}"` : String(num || 0);
  });

  return safeEval(resolved) as string | number;
}
