"use client";
// Small interactive pieces for the signed-in app: theme toggle, cursor spotlight on cards, count-up numbers,
// animated progress bar. All respect prefers-reduced-motion.
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ThemeToggle({ initial }: { initial: "dark" | "light" }) {
  const [theme, setTheme] = useState(initial);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.querySelector(".app-shell")?.setAttribute("data-theme", next);
    document.cookie = `bw-theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" onClick={flip} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Switch theme"
      className="grid h-8 w-8 place-items-center rounded-full border text-sm hover:bg-slate-100">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

// Moves the glow on whichever card the pointer is over (CSS reads --mx / --my).
export function Spotlight() {
  useEffect(() => {
    if (reduced()) return;
    const move = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".bg-white[class*='rounded-']");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}

export function CountUp({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const target = typeof value === "number" ? value : Number(value);
  const numeric = Number.isFinite(target);
  const [n, setN] = useState(numeric && !reduced() ? 0 : target);
  const raf = useRef(0);
  useEffect(() => {
    if (!numeric || reduced()) { setN(target); return; }
    const t0 = performance.now(), dur = 800;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, numeric]);
  return <>{numeric ? n : String(value)}{suffix}</>;
}

export function ProgressBar({ pct, className = "h-2 rounded bg-slate-100" }: { pct: number; className?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, pct)))); return () => cancelAnimationFrame(id); }, [pct]);
  return (
    <div className={`bw-bar ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${w}%` }} />
    </div>
  );
}
