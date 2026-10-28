"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200",
              toast.type === "success" && "border-emerald-500/30 bg-[var(--surface)] text-[var(--foreground)]",
              toast.type === "error" && "border-rose-500/30 bg-[var(--surface)] text-[var(--foreground)]",
              toast.type === "warning" && "border-amber-500/30 bg-[var(--surface)] text-[var(--foreground)]",
              (!toast.type || toast.type === "info") && "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {toast.type === "error" && <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />}
            {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {(!toast.type || toast.type === "info") && <Info className="h-5 w-5 text-[var(--brand-blue)] shrink-0 mt-0.5" />}

            <div className="flex-1 text-sm">
              <p className="font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Graceful fallback if ToastProvider is not yet in tree
    return {
      addToast: () => {},
      removeToast: () => {},
      toasts: [],
    };
  }
  return context;
}
