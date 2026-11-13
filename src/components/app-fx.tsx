"use client";
// Theme toggle for the signed-in app. The choice is stored in a cookie so the server renders the right theme on the next request.
import { useState } from "react";

export function ThemeToggle({ initial }: { initial: "dark" | "light" }) {
  const [theme, setTheme] = useState(initial);
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.querySelector(".app-shell")?.setAttribute("data-theme", next);
    document.cookie = `bw-theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" onClick={flip} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={theme === "dark" ? "Light theme" : "Dark theme"}
      className="grid h-8 w-8 place-items-center rounded-full border text-slate-600 hover:bg-slate-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === "dark" ? (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
