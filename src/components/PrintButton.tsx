"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded border bg-white px-3 py-1 text-sm">
      Export PDF (print)
    </button>
  );
}
