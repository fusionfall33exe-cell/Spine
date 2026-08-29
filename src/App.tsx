import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Send, Square, BarChart3, PanelRightClose, PanelRightOpen, Settings as SettingsIcon, Eraser } from "lucide-react";
import {
  checkOllamaAlive,
  deleteModel,
  listModels,
  pullModel,
  showModel,
  streamChat,
} from "./api/ollama";
import { useSystemStats } from "./hooks/useSystemStats";
import { useSettings, buildChatOptions } from "./hooks/useSettings";
import { Sidebar } from "./components/Sidebar";
import { MessageBubble } from "./components/MessageBubble";
import { SettingsModal } from "./components/SettingsModal";
import type { ChatMessage, ModelShowInfo, OllamaModel, PullProgress } from "./types";
import "./index.css";

const StatsChart = lazy(() => import("./components/StatsChart").then((m) => ({ default: m.StatsChart })));
const TokenSplitDonut = lazy(() =>
  import("./components/TokenSplitDonut").then((m) => ({ default: m.TokenSplitDonut })),
);

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg-${idCounter}-${Date.now()}`;
}

export default function App() {
  const [ollamaAlive, setOllamaAlive] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelShowInfo | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [contextUsedTokens, setContextUsedTokens] = useState(0);
  const [statsPanelOpen, setStatsPanelOpen] = useState(true);

  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { current: sysCurrent, history: sysHistory } = useSystemStats(1000, 60);
  const { settings, update: updateSettings, reset: resetSettings } = useSettings();

  const refreshModels = useCallback(async () => {
    try {
      const list = await listModels();
      setModels(list);
      setSelectedModel((prev) => {
        if (prev && list.some((m) => m.name === prev)) return prev;
        const sec = list.find((m) => m.name.startsWith("secmodel"));
        return sec?.name ?? list[0]?.name ?? null;
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const alive = await checkOllamaAlive();
      if (!mounted) return;
      setOllamaAlive(alive);
      if (alive) await refreshModels();
    })();
    const poll = setInterval(async () => {
      const alive = await checkOllamaAlive();
      setOllamaAlive(alive);
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [refreshModels]);

  useEffect(() => {
    if (!selectedModel) {
      setModelInfo(null);
      return;
    }
    showModel(selectedModel).then(setModelInfo).catch(console.error);
  }, [selectedModel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedModel || streaming) return;

    const userMsg: ChatMessage = { id: nextId(), role: "user", content: input.trim() };
    const assistantMsg: ChatMessage = { id: nextId(), role: "assistant", content: "" };
    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let fullContent = "";

    try {
      for await (const chunk of streamChat(
        selectedModel,
        history.map((m) => ({ role: m.role, content: m.content })),
        controller.signal,
        buildChatOptions(settings),
      )) {
        if (chunk.message?.content) {
          if (firstTokenTime === null) firstTokenTime = performance.now();
          fullContent += chunk.message.content;
          const snapshot = fullContent;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: snapshot } : m)),
          );
        }
        if (chunk.done) {
          const evalCount = chunk.eval_count ?? 0;
          const evalDurationNs = chunk.eval_duration ?? 1;
          const promptTokens = chunk.prompt_eval_count ?? 0;
          const ttftMs = firstTokenTime ? firstTokenTime - startTime : 0;
          const stats = {
            promptTokens,
            evalTokens: evalCount,
            promptDurationMs: (chunk.prompt_eval_duration ?? 0) / 1e6,
            evalDurationMs: evalDurationNs / 1e6,
            totalDurationMs: (chunk.total_duration ?? 0) / 1e6,
            loadDurationMs: (chunk.load_duration ?? 0) / 1e6,
            tokensPerSec: evalCount / (evalDurationNs / 1e9),
            ttftMs,
          };
          setContextUsedTokens(promptTokens + evalCount);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsg.id ? { ...m, stats } : m)),
          );
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        console.error(e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content + "\n\n*[error: " + (e as Error).message + "]*" }
              : m,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, selectedModel, streaming, messages, settings]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handlePullModel = useCallback(
    async (name: string) => {
      setPulling(true);
      setPullProgress({ status: "starting…" });
      try {
        for await (const progress of pullModel(name)) {
          setPullProgress(progress);
        }
        await refreshModels();
      } catch (e) {
        console.error(e);
        setPullProgress({ status: `error: ${(e as Error).message}` });
      } finally {
        setTimeout(() => setPulling(false), 1500);
      }
    },
    [refreshModels],
  );

  const handleDeleteModel = useCallback(
    async (name: string) => {
      if (!confirm(`Delete model "${name}"? This frees disk space but cannot be undone locally.`)) return;
      try {
        await deleteModel(name);
        await refreshModels();
      } catch (e) {
        console.error(e);
      }
    },
    [refreshModels],
  );

  const clearConversation = useCallback(() => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setContextUsedTokens(0);
  }, [streaming]);

  return (
    <div className={`app-shell ${!statsPanelOpen ? "stats-collapsed" : ""}`}>
      <Sidebar
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        modelInfo={modelInfo}
        contextUsedTokens={contextUsedTokens}
        onRefreshModels={refreshModels}
        onPullModel={handlePullModel}
        pulling={pulling}
        pullProgress={pullProgress}
        onDeleteModel={handleDeleteModel}
        sysCurrent={sysCurrent}
        sysHistory={sysHistory}
        numCtxOverride={settings.numCtx}
      />

      <main className="chat-main">
        <div className="chat-topbar">
          <div className="chat-topbar-title">
            {!ollamaAlive && (
              <span className="dot dot-inline dot-dead" title="Ollama not reachable" />
            )}
            {selectedModel ?? "No model selected"}
          </div>
          <div className="chat-topbar-actions">
            <button
              className="icon-btn"
              onClick={clearConversation}
              disabled={messages.length === 0}
              title="Clear conversation"
            >
              <Eraser size={15} />
            </button>
            <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              <SettingsIcon size={15} />
            </button>
            <button className="icon-btn" onClick={() => setStatsPanelOpen((v) => !v)} title="Toggle stats panel">
              {statsPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </div>

        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="chat-empty">
              {ollamaAlive
                ? "Send a message to start chatting."
                : "Ollama isn't reachable at 127.0.0.1:11434 — is the service running?"}
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!selectedModel}
            rows={2}
          />
          {streaming ? (
            <button className="send-btn stop" onClick={stopGeneration} title="Stop generating">
              <Square size={16} />
            </button>
          ) : (
            <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || !selectedModel} title="Send">
              <Send size={16} />
            </button>
          )}
        </div>
      </main>

      {statsPanelOpen && (
        <aside className="stats-panel">
          <div className="sidebar-section-title">
            <BarChart3 size={14} /> Session stats
          </div>

          {(() => {
            const assistantMsgs = messages.filter((m) => m.role === "assistant" && m.stats);
            const totalGenerated = assistantMsgs.reduce((sum, m) => sum + (m.stats?.evalTokens ?? 0), 0);
            const avgSpeed =
              assistantMsgs.length > 0
                ? assistantMsgs.reduce((sum, m) => sum + (m.stats?.tokensPerSec ?? 0), 0) / assistantMsgs.length
                : 0;
            return (
              <div className="summary-grid">
                <div className="summary-cell">
                  <span className="summary-value">{assistantMsgs.length}</span>
                  <span className="summary-label">Responses</span>
                </div>
                <div className="summary-cell">
                  <span className="summary-value">{totalGenerated.toLocaleString()}</span>
                  <span className="summary-label">Tokens generated</span>
                </div>
                <div className="summary-cell">
                  <span className="summary-value">{avgSpeed.toFixed(1)}</span>
                  <span className="summary-label">Avg tok/s</span>
                </div>
              </div>
            );
          })()}

          <Suspense fallback={<div className="stats-chart-loading" />}>
            <StatsChart messages={messages} />
          </Suspense>

          {messages.some((m) => m.role === "assistant" && m.stats) && (
            <div className="latest-stats">
              <div className="stats-chart-title">Last response</div>
              {(() => {
                const last = [...messages].reverse().find((m) => m.role === "assistant" && m.stats);
                if (!last?.stats) return null;
                const s = last.stats;
                const rows: [string, string][] = [
                  ["Prompt tokens", `${s.promptTokens}`],
                  ["Generated tokens", `${s.evalTokens}`],
                  ["Time to first token", `${s.ttftMs.toFixed(0)} ms`],
                  ["Prompt eval time", `${s.promptDurationMs.toFixed(0)} ms`],
                  ["Generation time", `${s.evalDurationMs.toFixed(0)} ms`],
                  ["Model load time", `${s.loadDurationMs.toFixed(0)} ms`],
                  ["Total duration", `${s.totalDurationMs.toFixed(0)} ms`],
                ];
                return (
                  <div className="stats-rows">
                    {rows.map(([label, value]) => (
                      <div className="stats-row" key={label}>
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                    <div className="stats-row stats-row-highlight">
                      <span>Speed</span>
                      <span>{s.tokensPerSec.toFixed(2)} tok/s</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="donut-section">
            <div className="stats-chart-title">Token split</div>
            <Suspense fallback={null}>
              <TokenSplitDonut messages={messages} />
            </Suspense>
          </div>
        </aside>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        onReset={resetSettings}
        modelInfo={modelInfo}
      />
    </div>
  );
}
