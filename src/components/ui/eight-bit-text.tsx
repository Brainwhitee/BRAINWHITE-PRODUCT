"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const CHARS = "█▓▒░><[]{}*^#01";

export function EightBitText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isScrambling, setIsScrambling] = useState(false);
  const iterations = useRef(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const scramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    iterations.current = 0;

    const interval = setInterval(() => {
      setDisplayText((prev) =>
        text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char;
            if (index < iterations.current) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iterations.current >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
        setDisplayText(text);
      }

      iterations.current += 1/2; // Adjust speed here
    }, 30);
  };

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        scramble();
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, delay]);

  return (
    <span
      ref={ref}
      className={cn("inline-block font-[family-name:var(--font-vt323)] tracking-normal", isScrambling && "font-mono tracking-tighter opacity-80", className)}
    >
      {displayText || text.replace(/./g, "░")}
    </span>
  );
}
