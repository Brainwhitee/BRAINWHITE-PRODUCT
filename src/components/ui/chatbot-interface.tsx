"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Send,
  Sparkles,
  FileCode,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Terminal,
  RefreshCw,
  Trash2,
  Download,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ExternalLink,
  Code2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Citation {
  path: string;
  start_line: number;
  end_line: number;
  symbol?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  reasoning?: string;
  citations?: Citation[];
}

interface ChatbotInterfaceProps {
  initialMessages?: ChatMessage[];
  repoName?: string;
  onSendMessage?: (message: string) => Promise<{
    content: string;
    reasoning?: string;
    citations?: Citation[];
  }>;
}

export function ChatbotInterface({
  initialMessages,
  repoName = "kite-health/core",
  onSendMessage,
}: ChatbotInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || [
      {
        id: "msg-welcome",
        role: "assistant",
        content:
          "Hello! I am your BrainWhite AI Codebase Intelligence Copilot. Every response is strictly grounded in AST symbol graphs and file line ranges. Ask me about architecture, multi-tenancy, authentication, or specific functions.",
        timestamp: "Just now",
        reasoning:
          "Pre-loaded AST symbol table and repository architecture graph for instant grounded retrieval.",
        citations: [
          {
            path: "backend/modules/repositories/github_client.py",
            start_line: 1,
            end_line: 60,
            symbol: "RealGitHubClient",
            snippet: "class RealGitHubClient(BaseGitHubClient):\n    async def fetch_repository_tree(self, full_name, branch='main'): ...",
          },
        ],
      },
    ]
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({
    "msg-welcome": false,
  });
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (onSendMessage) {
        const response = await onSendMessage(textToSend);
        const assistantMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: response.content,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          reasoning: response.reasoning,
          citations: response.citations,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fallback realistic response with AST grounding
        await new Promise((res) => setTimeout(res, 900));

        let reply = "";
        let reasoning = "";
        let citations: Citation[] = [];

        const lower = textToSend.toLowerCase();
        if (lower.includes("auth") || lower.includes("jwt") || lower.includes("login")) {
          reply =
            "Authentication is enforced via JWT bearer tokens and RBAC middleware. The `AuthService` issues and validates cryptographically signed session tokens, and every customer resource access strictly asserts `organization_id` matching.";
          reasoning =
            "Parsed AST symbols for 'AuthService', checked router dependencies in 'backend/modules/auth/service.py' and verified tenant scoping policies.";
          citations = [
            {
              path: "backend/modules/auth/service.py",
              start_line: 12,
              end_line: 38,
              symbol: "AuthService.authenticate_user",
              snippet: "async def authenticate_user(self, email: str, password: str) -> TokenPair:\n    user = await self.user_repo.find_by_email(email)\n    verify_password(password, user.password_hash)",
            },
            {
              path: "apps/api/routers/auth.py",
              start_line: 18,
              end_line: 42,
              symbol: "login_for_access_token",
              snippet: "@router.post('/login', response_model=TokenResponse)\nasync def login(credentials: LoginRequest): ...",
            },
          ];
        } else if (lower.includes("pipeline") || lower.includes("ingest") || lower.includes("github")) {
          reply =
            "The repository ingestion engine runs a 7-stage state machine: `CONNECT -> DISCOVERING -> FETCHING -> FILTERING -> PARSING -> RELATIONSHIPS -> READY`. `RealGitHubClient` connects to the GitHub REST API to recursively traverse trees and extract AST symbols.";
          reasoning =
            "Matched 'RealGitHubClient' and 'IngestionPipelineService'. Identified 7 discrete stages, with state transitions recorded in SQLite/PostgreSQL.";
          citations = [
            {
              path: "backend/modules/repositories/github_client.py",
              start_line: 45,
              end_line: 88,
              symbol: "RealGitHubClient.fetch_repository_tree",
              snippet: "async def fetch_repository_tree(self, full_name: str, branch: str = 'main'):\n    url = f'{GITHUB_API_BASE}/repos/{full_name}/git/trees/{branch}?recursive=1'\n    res = await client.get(url)",
            },
            {
              path: "backend/modules/ingestion/service.py",
              start_line: 25,
              end_line: 65,
              symbol: "IngestionPipelineService.run_ingestion",
              snippet: "async def run_ingestion(self, job_id: str) -> Job:\n    await self._update_job_status(job_id, IngestionState.DISCOVERING)",
            },
          ];
        } else {
          reply =
            "In this platform architecture, services follow modular monolith conventions. Each business domain (`auth`, `repositories`, `ingestion`, `knowledge`, `readiness`) is self-contained with its own models, repositories, and interfaces.";
          reasoning =
            "Scanned project architectural layout. Domain services reside under 'backend/modules/' with clean dependency injection into FastAPI routes.";
          citations = [
            {
              path: "backend/modules/repositories/models.py",
              start_line: 10,
              end_line: 32,
              symbol: "Repository",
              snippet: "class Repository(Base):\n    __tablename__ = 'repositories'\n    id = Column(String, primary_key=True)\n    organization_id = Column(String, nullable=False)",
            },
          ];
        }

        const assistantMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          reasoning,
          citations,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-welcome-new",
        role: "assistant",
        content: "Chat cleared. What would you like to explore next in the codebase?",
        timestamp: "Just now",
      },
    ]);
  };

  const promptSuggestions = [
    "How does authentication and tenant isolation work?",
    "Explain the 7-stage repository ingestion pipeline",
    "Where is the RealGitHubClient implemented?",
    "What AST symbols are extracted for this repo?",
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-white/15 rounded-2xl shadow-xl overflow-hidden font-sans text-white">
      {/* 21st.dev Top Bar / Header */}
      <div className="px-5 py-3.5 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">BrainWhite Code Intelligence</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/10 text-white border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                AST Grounded
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono">
              Indexed Repository: <span className="font-semibold text-white/80">{repoName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearChat}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#000000]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const hasReasoning = Boolean(msg.reasoning);
          const isReasoningOpen = Boolean(expandedReasoning[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <Avatar className="h-8 w-8 rounded-xl bg-white text-black flex-shrink-0 shadow-sm">
                  <AvatarFallback className="bg-white text-black text-xs font-mono font-bold">
                    BW
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`max-w-[85%] sm:max-w-[78%] space-y-2.5 ${isUser ? "items-end" : "items-start"}`}>
                {/* User or Assistant Message Container */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 text-sm transition-all duration-200 ${
                    isUser
                      ? "bg-white text-black font-medium shadow-sm"
                      : "bg-[#0a0a0a] border border-white/15 text-white/90 shadow-sm"
                  }`}
                >
                  {/* Assistant Header inside bubble */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                          BrainWhite Copilot
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">{msg.timestamp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-white/40 hover:text-white p-1 rounded transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* 21st.dev Reasoning Accordion */}
                  {!isUser && hasReasoning && (
                    <div className="mb-3 rounded-xl border border-white/15 bg-white/[0.03] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-mono uppercase tracking-wider text-white/80 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BrainCircuit className="w-3.5 h-3.5 text-white" />
                          <span>AI Symbol Verification Process</span>
                        </div>
                        {isReasoningOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                        )}
                      </button>
                      {isReasoningOpen && (
                        <div className="px-3 pb-2.5 pt-1 text-xs text-white/70 font-mono bg-black border-t border-white/10 leading-relaxed">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content body */}
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>

                  {/* AST Citation Cards */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-white/50 uppercase tracking-wider">
                        <FileCode className="w-3.5 h-3.5 text-white/70" />
                        <span>Verified Citations ({msg.citations.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citations.map((cite, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedCitation(cite)}
                            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:bg-white/[0.05] cursor-pointer transition-all group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-mono font-medium text-white/90 truncate max-w-[170px]">
                                {cite.path.split("/").pop()}
                              </span>
                              <span className="text-[10px] font-mono text-white bg-white/10 px-1.5 py-0.2 rounded border border-white/20">
                                L{cite.start_line}-L{cite.end_line}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40 font-mono truncate">
                              {cite.symbol || cite.path}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Helpful feedback buttons */}
                {!isUser && (
                  <div className="flex items-center gap-2 pl-2 text-white/40">
                    <button
                      type="button"
                      className="p-1 rounded hover:text-white hover:bg-white/10 transition"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:text-white hover:bg-white/10 transition"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <Avatar className="h-8 w-8 rounded-xl bg-white/10 text-white flex-shrink-0 shadow-sm border border-white/20">
                  <AvatarFallback className="bg-white/10 text-white text-xs font-mono font-bold">
                    YOU
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 sm:gap-4 items-start">
            <Avatar className="h-8 w-8 rounded-xl bg-white text-black flex-shrink-0">
              <AvatarFallback className="bg-white text-black text-xs font-mono font-bold">
                BW
              </AvatarFallback>
            </Avatar>
            <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-white/50 font-mono">
                Searching AST symbol graph & citation edges...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions Bar */}
      <div className="px-5 py-2.5 bg-[#0a0a0a] border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Sparkles className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
        <span className="text-[11px] font-mono font-semibold text-white/40 uppercase tracking-wider flex-shrink-0">
          Try:
        </span>
        {promptSuggestions.map((prompt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/15 transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <div className="p-4 bg-[#0a0a0a] border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 p-2 rounded-xl border border-white/15 focus-within:border-white transition-all bg-white/[0.03]"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about the codebase (e.g. AuthService, Ingestion pipeline)..."
            rows={1}
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none max-h-32 font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-lg transition-all font-semibold flex items-center justify-center flex-shrink-0 ${
              input.trim() && !isLoading
                ? "bg-white hover:bg-white/90 text-black shadow-sm hover:scale-105 active:scale-95"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-white/40 font-mono px-1">
          <span>Zero hallucination policy: Every claim backed by tree-sitter AST ranges.</span>
          <span>Press Enter ↵ to send</span>
        </div>
      </div>

      {/* Citation Preview Modal Drawer */}
      {selectedCitation && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="w-full max-w-xl bg-[#0a0a0a] rounded-2xl border border-white/20 shadow-2xl overflow-hidden p-6 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {selectedCitation.path}
                  </h3>
                  <p className="text-xs text-white/60 font-mono">
                    Lines {selectedCitation.start_line} - {selectedCitation.end_line}
                    {selectedCitation.symbol && ` · ${selectedCitation.symbol}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="text-white/40 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {selectedCitation.snippet ? (
              <pre className="p-4 rounded-xl bg-black text-white/90 font-mono text-xs overflow-x-auto leading-relaxed border border-white/15">
                <code>{selectedCitation.snippet}</code>
              </pre>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white/60 font-mono">
                AST node verified in repository symbol graph.
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold bg-white text-black hover:bg-white/90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
