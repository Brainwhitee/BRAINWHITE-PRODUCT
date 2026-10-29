"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Send, Sparkles, MessageSquare, RefreshCw, ChevronDown } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
};

const SUGGESTIONS = [
  "What is BrainWhite?",
  "How does the 3-pane learning workspace work?",
  "How is PR quality scored?",
  "How do I try the demo?",
];

export function SupportChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am the BrainWhite AI assistant. Ask me anything about how BrainWhite turns company codebases into knowledge graphs, accelerates developer onboarding, and scores pull requests.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (pathname?.startsWith("/learn")) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: data.answer || "I'm having trouble retrieving an answer right now. Please try again.",
        provider: data.provider,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered a network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Chat cleared. What questions can I answer about BrainWhite's developer onboarding platform?",
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 rounded-full border border-black/20 bg-white px-5 py-3.5 text-black shadow-2xl transition-all duration-300 hover:scale-105 hover:border-black/40 hover:bg-gray-50 active:scale-95"
          aria-label="Chat with BrainWhite"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-black" />
          </span>
          <Bot className="h-5 w-5 text-black transition-transform group-hover:rotate-12" />
          <span className="text-sm font-medium tracking-tight text-black">Chat with BrainWhite</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="flex h-[560px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-black/20 bg-white shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/20 bg-black/5 text-black">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-black">BrainWhite AI</span>
                  <Sparkles className="h-3 w-3 text-black" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset conversation"
                className="rounded-lg p-1.5 text-black/50 transition hover:bg-black/5 hover:text-black"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-black/50 transition hover:bg-black/5 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-black scrollbar-thin scrollbar-thumb-black/10">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black/5 text-black">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-xs bg-black text-white font-medium shadow-md"
                      : "rounded-bl-xs border border-black/10 bg-gray-50 text-black/90"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[13px]">{m.content}</p>
                  {m.provider && m.provider !== "fallback" && (
                    <div className="mt-1.5 text-[9px] uppercase tracking-wider text-black/40">
                      ⚡ via {m.provider}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-black/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black/5 text-black">
                  <Bot className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border border-black/10 bg-gray-50 px-3 py-2 text-[12px]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:0.4s]" />
                  <span className="ml-1 text-black/50">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills */}
          {messages.length <= 2 && (
            <div className="border-t border-black/5 bg-white p-2.5">
              <div className="mb-1.5 px-1 text-[11px] font-medium text-black/40">Suggested questions:</div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-left text-[11px] text-black/70 transition hover:border-black/30 hover:bg-black/5 hover:text-black active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-black/10 bg-white p-3">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about onboarding, workspace, PR scoring…"
                rows={1}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-black/20 bg-white py-2.5 pl-3.5 pr-11 text-xs text-black placeholder-black/40 outline-none transition focus:border-black/50 focus:ring-1 focus:ring-black/50 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="absolute right-2 rounded-lg bg-black p-1.5 text-white transition hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-black"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
