import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ChatMessage } from "../types";
import { Zap, Clock, Gauge, User, Cpu } from "lucide-react";
import { highlightLanguages } from "../lib/highlightLanguages";

function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`msg-row ${isUser ? "msg-row-user" : "msg-row-assistant"}`}>
      {!isUser && (
        <div className="msg-avatar msg-avatar-assistant">
          <Cpu size={15} />
        </div>
      )}
      <div className={`msg-bubble ${isUser ? "msg-bubble-user" : "msg-bubble-assistant"}`}>
        {isUser ? (
          <div className="msg-plain">{message.content}</div>
        ) : (
          <div className="msg-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[[rehypeHighlight, { languages: highlightLanguages }]]}
            >
              {message.content || "…"}
            </ReactMarkdown>
          </div>
        )}
        {message.stats && (
          <div className="msg-stats">
            <span title="Generation speed">
              <Zap size={12} /> {message.stats.tokensPerSec.toFixed(1)} tok/s
            </span>
            <span title="Time to first token">
              <Clock size={12} /> TTFT {fmtMs(message.stats.ttftMs)}
            </span>
            <span title="Prompt / generated tokens">
              <Gauge size={12} /> {message.stats.promptTokens}→{message.stats.evalTokens} tok
            </span>
            <span title="Total duration">{fmtMs(message.stats.totalDurationMs)} total</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="msg-avatar msg-avatar-user">
          <User size={15} />
        </div>
      )}
    </div>
  );
}
