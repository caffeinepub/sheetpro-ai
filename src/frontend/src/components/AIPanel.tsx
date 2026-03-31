import { CheckCircle, Key, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  onClose: () => void;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "👋 Hello! I'm SheetPro AI. I can help you analyze data, generate formulas, clean tables, and much more.\n\nPlease add your API key below to get started!",
    timestamp: new Date(),
  },
];

export default function AIPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<"openai" | "gemini">(
    () =>
      (localStorage.getItem("ai_provider") as "openai" | "gemini") || "openai",
  );
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ai_api_key") || "",
  );
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [showKeySection, setShowKeySection] = useState(!apiKey);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    localStorage.setItem("ai_api_key", apiKeyInput.trim());
    localStorage.setItem("ai_provider", provider);
    setApiKey(apiKeyInput.trim());
    setShowKeySection(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ ${provider === "openai" ? "OpenAI" : "Google Gemini"} API key saved! AI features will be fully enabled in Phase 15. For now, I can answer general questions about your spreadsheet.`,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getPlaceholderResponse(text),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, aiResponse]);
    setInput("");
  };

  const getPlaceholderResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("sum") || q.includes("total"))
      return "💡 To sum a range, use: =SUM(A1:A10). I can help you build complex formulas in Phase 15 when AI is fully activated!";
    if (q.includes("formula"))
      return "📐 SheetPro AI supports SUM, AVERAGE, COUNT, IF, AND, OR, CONCAT, NOW, and TODAY. Type = to start a formula in any cell!";
    if (q.includes("chart") || q.includes("graph"))
      return "📊 Chart generation is coming in Phase 9! I'll be able to auto-create charts from your data.";
    if (q.includes("sort") || q.includes("filter"))
      return "🔍 Sorting and filtering features are planned for Phase 10. Stay tuned!";
    if (q.includes("import") || q.includes("csv"))
      return "📁 CSV/Excel import is coming in Phase 10. You'll be able to drag & drop files directly!";
    return `🤖 Great question! Full AI integration (powered by ${
      provider === "openai" ? "OpenAI GPT-4" : "Google Gemini"
    }) is coming in Phase 15. I'll be able to: analyze your data, predict trends, generate insights, and much more!`;
  };

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="flex flex-col border-l border-border bg-white shadow-panel"
      style={{
        width: 320,
        minWidth: 320,
        maxWidth: "100vw",
        flexShrink: 0,
        zIndex: 40,
      }}
      data-ocid="ai_panel.panel"
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#0E2235", flexShrink: 0 }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-white/10">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">
            AI ASSISTANT
          </span>
          {apiKey && (
            <span className="flex items-center gap-1 text-xs text-green-300">
              <CheckCircle size={10} /> Ready
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors p-1 rounded"
          data-ocid="ai_panel.close.button"
          aria-label="Close AI panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* API Key section */}
      <AnimatePresence>
        {showKeySection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-3 border-b border-border"
              style={{ background: "#f7fafc" }}
            >
              <div className="flex items-center gap-1 mb-2">
                <Key size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  API Configuration
                </span>
              </div>
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as "openai" | "gemini")
                }
                className="w-full h-7 text-xs border border-border rounded px-2 mb-2 bg-white outline-none focus:border-ring"
                data-ocid="ai_panel.provider.select"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="gemini">Google Gemini</option>
              </select>
              <div className="flex gap-1">
                <input
                  type={keyVisible ? "text" : "password"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                  placeholder={`Enter ${
                    provider === "openai" ? "OpenAI" : "Gemini"
                  } key...`}
                  className="flex-1 h-7 text-xs border border-border rounded px-2 outline-none focus:border-ring font-mono"
                  data-ocid="ai_panel.api_key.input"
                />
                <button
                  type="button"
                  onClick={() => setKeyVisible((v) => !v)}
                  className="h-7 w-7 flex items-center justify-center border border-border rounded text-xs text-muted-foreground hover:bg-accent"
                  title={keyVisible ? "Hide key" : "Show key"}
                  data-ocid="ai_panel.toggle_key.button"
                >
                  {keyVisible ? "🙈" : "👁"}
                </button>
              </div>
              <button
                type="button"
                onClick={saveApiKey}
                className="w-full mt-2 h-7 text-xs font-semibold rounded text-white transition-colors"
                style={{ background: "#1a73e8" }}
                data-ocid="ai_panel.save_key.button"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setShowKeySection(false)}
                  className="w-full mt-1 h-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="ai_panel.hide_key.button"
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show key button when hidden */}
      {!showKeySection && (
        <button
          type="button"
          onClick={() => setShowKeySection(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border-b border-border transition-colors"
          style={{ background: "#f7fafc", flexShrink: 0 }}
          data-ocid="ai_panel.show_key_section.button"
        >
          <Key size={10} />
          {apiKey ? "Change API Key" : "Add API Key"}
        </button>
      )}

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ scrollbarWidth: "thin" }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div
        className="flex items-center gap-2 p-2 border-t border-border"
        style={{ flexShrink: 0 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask SheetPro AI…"
          className="flex-1 h-8 text-xs border border-border rounded-full px-3 outline-none focus:border-ring bg-white"
          data-ocid="ai_panel.chat.input"
          aria-label="Ask the AI assistant"
        />
        <button
          type="button"
          onClick={sendMessage}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity"
          style={{ background: "#1a73e8", opacity: input.trim() ? 1 : 0.5 }}
          disabled={!input.trim()}
          data-ocid="ai_panel.send.button"
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </div>
    </motion.aside>
  );
}
