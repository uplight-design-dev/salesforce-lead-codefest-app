"use client";

import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "Show me leads most likely to convert this week.",
  "Which leads are at risk of going cold?",
  "Summarize pipeline health for this month.",
];

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "30 high-intent leads in the tracker (score 85+). Top lead: Alvis Wright at Alabama Power Co — engagement score 99 with 5 touchpoints.",
  "show me leads most likely to convert this week.":
    "30 leads score 85+. Top lead: **Alvis Wright** (Alabama Power Co) — score 99, 5 campaign touchpoints, Platinum-tier account. 56 leads show accelerating momentum.",
  "which leads are at risk of going cold?":
    "26 leads are at risk and 36 are stalled in the tracker. Prioritize Yellow-health accounts and contacts with no recent multi-touch engagement.",
  "summarize pipeline health for this month.":
    "Pipeline: 118 total leads → 6 MQLs/nurturing → 0 SQLs → 0 opportunities → 1 closed won (0.8% conversion). 144 engagement touchpoints across 62 utility accounts.",
};

type CopilotChatProps = {
  className?: string;
};

export function CopilotChat({ className }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm your AI Deal Copilot. Ask me about leads, pipeline health, or who to prioritize this week.",
    },
  ]);
  const [input, setInput] = useState("");

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    const key = text.trim().toLowerCase();
    const response =
      MOCK_RESPONSES[key] ?? MOCK_RESPONSES.default;

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <div
      className={cn(
        "flex min-h-[480px] flex-1 flex-col rounded-2xl border border-border bg-white",
        className
      )}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                msg.role === "assistant"
                  ? "bg-uplight-navy text-white"
                  : "bg-uplight-blue text-white"
              )}
            >
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "assistant"
                  ? "bg-surface text-uplight-black"
                  : "bg-uplight-blue text-white"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-6 py-3">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-uplight-blue hover:text-uplight-blue"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about leads, pipeline, or priorities..."
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-uplight-blue focus:ring-1 focus:ring-uplight-blue"
        />
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-uplight-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-uplight-navy"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
}
