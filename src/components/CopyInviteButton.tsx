"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyInviteButton({ tokenHash }: { tokenHash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/invite/${tokenHash}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
        copied
          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80"
      }`}
      title="Copy invitation link directly to clipboard"
    >
      {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 text-slate-600" />}
      <span>{copied ? "Link Copied!" : "Copy Link"}</span>
    </button>
  );
}
