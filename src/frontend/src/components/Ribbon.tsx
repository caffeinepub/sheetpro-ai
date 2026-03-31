import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChartBar,
  Clipboard,
  Copy,
  Database,
  Eye,
  FileImage,
  FileText,
  Filter,
  FunctionSquare,
  Italic,
  Link,
  Printer,
  ScissorsIcon,
  SortAsc,
  Sparkles,
  Table2,
  Underline,
  WrapText,
} from "lucide-react";
import type { SpreadsheetHook } from "../hooks/useSpreadsheet";

const RIBBON_TABS = [
  "Home",
  "Insert",
  "Page Layout",
  "Formulas",
  "Data",
  "Review",
  "View",
  "AI",
];

const FONT_FAMILIES = [
  "Calibri",
  "Arial",
  "Times New Roman",
  "Verdana",
  "Courier New",
];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];
const NUMBER_FORMATS = [
  "General",
  "Number",
  "Currency",
  "Percentage",
  "Date",
  "Text",
];

interface Props {
  spreadsheet: SpreadsheetHook;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleAI: () => void;
}

function RibbonGroup({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="ribbon-group">
      <div className="ribbon-group-content">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  );
}

function RibbonBtn({
  icon,
  label,
  active,
  disabled,
  onClick,
  title,
  small,
  "data-ocid": dataOcid,
}: {
  icon: React.ReactNode;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  small?: boolean;
  "data-ocid"?: string;
}) {
  if (small) {
    return (
      <button
        type="button"
        className={`ribbon-btn-small${active ? " active" : ""}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        data-ocid={dataOcid}
        style={{ opacity: disabled ? 0.38 : 1 }}
      >
        {icon}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`ribbon-btn${active ? " active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-ocid={dataOcid}
      style={{ opacity: disabled ? 0.38 : 1 }}
    >
      <span className="ribbon-btn-icon">{icon}</span>
      {label && <span className="ribbon-btn-label">{label}</span>}
    </button>
  );
}

function HomeTab({
  spreadsheet,
  onToggleAI,
}: { spreadsheet: SpreadsheetHook; onToggleAI: () => void }) {
  const {
    selectedCell,
    getCell,
    updateRangeFormat,
    copyRange,
    pasteRange,
    clearRange,
  } = spreadsheet;

  const cell = selectedCell
    ? getCell(selectedCell.row, selectedCell.col)
    : null;
  const isBold = cell?.bold || false;
  const isItalic = cell?.italic || false;
  const isUnderline = cell?.underline || false;
  const align = cell?.align || "left";
  const fontSize = cell?.fontSize || 11;
  const color = cell?.color || "#000000";
  const bgColor = cell?.bgColor || "#ffffff";
  const fontFamily = "Calibri";
  const numberFormat = "General";

  return (
    <div className="ribbon-content-scroll flex items-stretch h-full">
      {/* Clipboard */}
      <RibbonGroup label="Clipboard">
        <div className="flex items-stretch gap-0.5">
          <RibbonBtn
            icon={<Clipboard size={16} />}
            label="Paste"
            onClick={pasteRange}
            title="Paste (Ctrl+V)"
            data-ocid="ribbon.paste.button"
          />
          <div className="flex flex-col gap-0.5">
            <RibbonBtn
              icon={<ScissorsIcon size={13} />}
              label="Cut"
              onClick={clearRange}
              title="Cut (Ctrl+X)"
              small
              data-ocid="ribbon.cut.button"
            />
            <RibbonBtn
              icon={<Copy size={13} />}
              label="Copy"
              onClick={copyRange}
              title="Copy (Ctrl+C)"
              small
              data-ocid="ribbon.copy.button"
            />
          </div>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* Font */}
      <RibbonGroup label="Font">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <select
              value={fontFamily}
              onChange={() => {}}
              className="ribbon-select"
              style={{ width: 88 }}
              title="Font"
              data-ocid="ribbon.font_family.select"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={fontSize}
              onChange={(e) =>
                updateRangeFormat({ fontSize: Number.parseInt(e.target.value) })
              }
              className="ribbon-select"
              style={{ width: 40 }}
              title="Font Size"
              data-ocid="ribbon.font_size.select"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={`ribbon-fmt-btn${isBold ? " active" : ""}`}
              onClick={() => updateRangeFormat({ bold: !isBold })}
              title="Bold (Ctrl+B)"
              data-ocid="ribbon.bold.toggle"
            >
              <Bold size={12} strokeWidth={isBold ? 3 : 2.5} />
            </button>
            <button
              type="button"
              className={`ribbon-fmt-btn${isItalic ? " active" : ""}`}
              onClick={() => updateRangeFormat({ italic: !isItalic })}
              title="Italic (Ctrl+I)"
              data-ocid="ribbon.italic.toggle"
            >
              <Italic size={12} />
            </button>
            <button
              type="button"
              className={`ribbon-fmt-btn${isUnderline ? " active" : ""}`}
              onClick={() => updateRangeFormat({ underline: !isUnderline })}
              title="Underline (Ctrl+U)"
              data-ocid="ribbon.underline.toggle"
            >
              <Underline size={12} />
            </button>
            <div className="ribbon-divider-v" />
            {/* Text color */}
            <div
              className="relative flex flex-col items-center"
              title="Font Color"
              style={{ width: 22, height: 22 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                A
              </span>
              <div
                style={{
                  width: 14,
                  height: 3,
                  background: color,
                  borderRadius: 1,
                  marginTop: 1,
                }}
              />
              <input
                type="color"
                value={color}
                onChange={(e) => updateRangeFormat({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ width: "100%", height: "100%" }}
                title="Font Color"
                data-ocid="ribbon.text_color.input"
              />
            </div>
            {/* Fill color */}
            <div
              className="relative flex flex-col items-center"
              title="Fill Color"
              style={{ width: 22, height: 22 }}
            >
              <div
                style={{
                  width: 14,
                  height: 12,
                  background: bgColor === "#ffffff" ? "transparent" : bgColor,
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  marginTop: 3,
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 3,
                  background: bgColor === "#ffffff" ? "#ffcc00" : bgColor,
                  borderRadius: 1,
                  marginTop: 1,
                }}
              />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => updateRangeFormat({ bgColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ width: "100%", height: "100%" }}
                title="Fill Color"
                data-ocid="ribbon.fill_color.input"
              />
            </div>
          </div>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* Alignment */}
      <RibbonGroup label="Alignment">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Top Align"
              data-ocid="ribbon.align_top.toggle"
            >
              <span style={{ fontSize: 10 }}>⬆</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Middle Align"
              data-ocid="ribbon.align_middle.toggle"
            >
              <span style={{ fontSize: 10 }}>↕</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Bottom Align"
              data-ocid="ribbon.align_bottom.toggle"
            >
              <span style={{ fontSize: 10 }}>⬇</span>
            </button>
            <div className="ribbon-divider-v" />
            <button
              type="button"
              className={`ribbon-fmt-btn${align === "left" ? " active" : ""}`}
              onClick={() => updateRangeFormat({ align: "left" })}
              title="Align Left"
              data-ocid="ribbon.align_left.toggle"
            >
              <AlignLeft size={12} />
            </button>
            <button
              type="button"
              className={`ribbon-fmt-btn${align === "center" ? " active" : ""}`}
              onClick={() => updateRangeFormat({ align: "center" })}
              title="Center"
              data-ocid="ribbon.align_center.toggle"
            >
              <AlignCenter size={12} />
            </button>
            <button
              type="button"
              className={`ribbon-fmt-btn${align === "right" ? " active" : ""}`}
              onClick={() => updateRangeFormat({ align: "right" })}
              title="Align Right"
              data-ocid="ribbon.align_right.toggle"
            >
              <AlignRight size={12} />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Decrease Indent"
              data-ocid="ribbon.indent_decrease.button"
            >
              <span style={{ fontSize: 10 }}>←</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Increase Indent"
              data-ocid="ribbon.indent_increase.button"
            >
              <span style={{ fontSize: 10 }}>→</span>
            </button>
            <div className="ribbon-divider-v" />
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Wrap Text"
              data-ocid="ribbon.wrap_text.toggle"
            >
              <WrapText size={12} />
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Merge & Center"
              data-ocid="ribbon.merge.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 9, fontWeight: 700 }}>⊞</span>
            </button>
          </div>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* Number */}
      <RibbonGroup label="Number">
        <div className="flex flex-col gap-0.5">
          <select
            value={numberFormat}
            onChange={() => {}}
            className="ribbon-select"
            style={{ width: 96 }}
            title="Number Format"
            data-ocid="ribbon.number_format.select"
          >
            {NUMBER_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Accounting"
              data-ocid="ribbon.accounting.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>$</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Percentage"
              data-ocid="ribbon.percentage.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>%</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Comma Style"
              data-ocid="ribbon.comma.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 10, fontWeight: 700 }}>,</span>
            </button>
            <div className="ribbon-divider-v" />
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Decrease Decimal"
              data-ocid="ribbon.decimal_decrease.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 9 }}>.0→</span>
            </button>
            <button
              type="button"
              className="ribbon-fmt-btn"
              title="Increase Decimal"
              data-ocid="ribbon.decimal_increase.button"
              style={{ opacity: 0.4 }}
            >
              <span style={{ fontSize: 9 }}>←.0</span>
            </button>
          </div>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* Styles */}
      <RibbonGroup label="Styles">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Conditional Formatting"
            data-ocid="ribbon.conditional_format.button"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: 10 }}>⚡</span>
          </button>
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Format as Table"
            data-ocid="ribbon.format_table.button"
            style={{ opacity: 0.4 }}
          >
            <Table2 size={12} />
          </button>
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Cell Styles"
            data-ocid="ribbon.cell_styles.button"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: 10 }}>🎨</span>
          </button>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* Cells */}
      <RibbonGroup label="Cells">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Insert Cells"
            data-ocid="ribbon.insert_cells.button"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: 10 }}>+</span>
          </button>
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Delete Cells"
            data-ocid="ribbon.delete_cells.button"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: 10 }}>−</span>
          </button>
          <button
            type="button"
            className="ribbon-fmt-btn"
            title="Format Cells"
            data-ocid="ribbon.format_cells.button"
            style={{ opacity: 0.4 }}
          >
            <span style={{ fontSize: 10 }}>⚙</span>
          </button>
        </div>
      </RibbonGroup>

      <div className="ribbon-divider" />

      {/* AI */}
      <RibbonGroup label="AI">
        <RibbonBtn
          icon={<Sparkles size={16} />}
          label="AI Assistant"
          onClick={onToggleAI}
          title="Open AI Assistant"
          data-ocid="ribbon.ai.button"
        />
      </RibbonGroup>
    </div>
  );
}

function PlaceholderTab({ name }: { name: string }) {
  const groups: Record<string, { icon: React.ReactNode; label: string }[]> = {
    Insert: [
      { icon: <Table2 size={15} />, label: "Table" },
      { icon: <FileImage size={15} />, label: "Picture" },
      { icon: <ChartBar size={15} />, label: "Chart" },
      { icon: <Link size={15} />, label: "Link" },
      { icon: <FileText size={15} />, label: "Header" },
    ],
    "Page Layout": [
      { icon: <Printer size={15} />, label: "Print" },
      { icon: <FileText size={15} />, label: "Margins" },
      { icon: <Eye size={15} />, label: "View" },
    ],
    Formulas: [
      { icon: <FunctionSquare size={15} />, label: "Insert Fn" },
      { icon: <Sparkles size={15} />, label: "AutoSum" },
      { icon: <Database size={15} />, label: "Name Mgr" },
    ],
    Data: [
      { icon: <SortAsc size={15} />, label: "Sort" },
      { icon: <Filter size={15} />, label: "Filter" },
      { icon: <Database size={15} />, label: "Get Data" },
    ],
    Review: [
      { icon: <FileText size={15} />, label: "Spelling" },
      { icon: <Eye size={15} />, label: "Protect" },
      { icon: <Copy size={15} />, label: "Share" },
    ],
    View: [
      { icon: <Eye size={15} />, label: "Normal" },
      { icon: <Table2 size={15} />, label: "Freeze" },
      { icon: <FileText size={15} />, label: "Zoom" },
    ],
    AI: [
      { icon: <Sparkles size={15} />, label: "Analyze" },
      { icon: <FunctionSquare size={15} />, label: "Generate" },
      { icon: <Database size={15} />, label: "Insights" },
    ],
  };
  const items = groups[name] || [];
  return (
    <div className="ribbon-content-scroll flex items-stretch h-full">
      <RibbonGroup label={name}>
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <RibbonBtn
              key={item.label}
              icon={item.icon}
              label={item.label}
              disabled
              title={`${item.label} (coming soon)`}
            />
          ))}
        </div>
      </RibbonGroup>
    </div>
  );
}

export default function Ribbon({
  spreadsheet,
  activeTab,
  onTabChange,
  onToggleAI,
}: Props) {
  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ fontFamily: "'Segoe UI', Inter, sans-serif" }}
    >
      {/* Tab strip */}
      <div
        className="ribbon-tabs-scroll flex items-end"
        style={{ background: "#217346", height: 26, minHeight: 26 }}
        data-ocid="ribbon.tabs.panel"
      >
        {RIBBON_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`ribbon-tab${activeTab === tab ? " active" : ""}`}
            data-ocid={`ribbon.${tab.toLowerCase().replace(" ", "_")}.tab`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon content */}
      <div className="ribbon-panel" data-ocid="ribbon.content.panel">
        {activeTab === "Home" ? (
          <HomeTab spreadsheet={spreadsheet} onToggleAI={onToggleAI} />
        ) : (
          <PlaceholderTab name={activeTab} />
        )}
      </div>
    </div>
  );
}
