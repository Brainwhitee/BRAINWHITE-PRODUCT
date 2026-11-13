"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, X, Send, Sparkles, RefreshCw, GripVertical } from "lucide-react";

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
    <motion.div 
      drag 
      dragMomentum={false} 
      className="fixed bottom-6 right-6 z-50 font-sans cursor-move"
      title="Draggable AI assistant (click and drag to move anywhere)"
    >
      {/* Floating Toggle Button (Movable) */}
      {!isOpen && (
        <div className="group relative flex items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-3 text-black shadow-2xl transition-all hover:border-black/40 hover:bg-gray-50 active:scale-95">
          <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-700">
            <GripVertical className="h-4 w-4" />
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer"
            aria-label="Chat with BrainWhite"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <Bot className="h-4 w-4 text-black transition-transform group-hover:rotate-12" />
            <span className="text-xs font-bold tracking-tight text-black">Chat with BrainWhite</span>
          </button>
        </div>
      )}

      {/* Chat Window Panel (Movable) */}
      {isOpen && (
        <div className="flex h-[560px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-black/20 bg-white shadow-2xl transition-all duration-300">
          {/* Header with Drag Handle */}
          <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-neutral-400" />
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/20 bg-black/5 text-black">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-black">BrainWhite AI</span>
                <Sparkles className="h-3 w-3 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset conversation"
                className="rounded-lg p-1.5 text-black/50 transition hover:bg-black/5 hover:text-black cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-black/50 transition hover:bg-black/5 hover:text-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-black scrollbar-thin scrollbar-thumb-black/10 cursor-default">
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
            <div className="border-t border-black/5 bg-white p-2.5 cursor-default">
              <div className="mb-1.5 px-1 text-[11px] font-medium text-black/40">Suggested questions:</div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    disabled={loading}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-left text-[11px] text-black/70 transition hover:border-black/30 hover:bg-black/5 hover:text-black active:scale-95 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-black/10 bg-white p-3 cursor-default">
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
                className="absolute right-2 rounded-lg bg-black p-1.5 text-white transition hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-black cursor-pointer"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
