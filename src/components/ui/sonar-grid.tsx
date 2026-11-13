"use client";

import React, { useEffect, useRef, useCallback } from "react";

export interface SonarGridProps {
  dotColor?: string;
  ringColor?: string;
  gridSize?: number;
  dotSize?: number;
  className?: string;
  interactive?: boolean;
}

interface Ping {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

export function SonarGrid({
  dotColor = "rgba(0, 0, 0, 0.16)",
  ringColor = "rgba(0, 0, 0, 0.22)",
  gridSize = 30,
  dotSize = 1.25,
  className = "",
  interactive = true,
}: SonarGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pingsRef = useRef<Ping[]>([]);
  const lastAmbientRef = useRef<number>(0);

  const addPing = useCallback((x: number, y: number, initialRadius = 0) => {
    pingsRef.current.push({
      x,
      y,
      radius: initialRadius,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.6,
      speed: 2.2,
      alpha: 1,
    });
    // Keep max 8 active pings for performance
    if (pingsRef.current.length > 8) {
      pingsRef.current.shift();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initial mid-flight ring at first paint
    addPing(width * 0.5, height * 0.35, 90);

    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addPing(x, y, 4);
    };

    canvas.addEventListener("click", handleClick);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Periodically trigger ambient sonar pings every 4.5 seconds
      if (!prefersReducedMotion && time - lastAmbientRef.current > 4500) {
        lastAmbientRef.current = time;
        const randX = width * (0.2 + Math.random() * 0.6);
        const randY = height * (0.2 + Math.random() * 0.6);
        addPing(randX, randY, 0);
      }

      // 1. Draw Sonar Wave Rings
      if (!prefersReducedMotion) {
        for (let i = pingsRef.current.length - 1; i >= 0; i--) {
          const p = pingsRef.current[i];
          p.radius += p.speed;
          const progress = p.radius / p.maxRadius;
          p.alpha = Math.max(0, 1 - progress);

          if (progress >= 1 || p.alpha <= 0) {
            pingsRef.current.splice(i, 1);
            continue;
          }

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = ringColor.replace(
            /[\d.]+\)$/g,
            `${(p.alpha * 0.35).toFixed(3)})`
          );
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Subtle inner echo ring
          if (p.radius > 30) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0, p.radius - 24), 0, Math.PI * 2);
            ctx.strokeStyle = ringColor.replace(
              /[\d.]+\)$/g,
              `${(p.alpha * 0.15).toFixed(3)})`
            );
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 2. Draw Dot Grid with Sonar Wave Lighting
      const cols = Math.ceil(width / gridSize) + 1;
      const rows = Math.ceil(height / gridSize) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * gridSize;
          const y = r * gridSize;

          let dotAlphaBoost = 0;
          let dotRadius = dotSize;

          if (!prefersReducedMotion) {
            for (const p of pingsRef.current) {
              const dx = x - p.x;
              const dy = y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const ringDist = Math.abs(dist - p.radius);

              if (ringDist < 30) {
                const intensity = (1 - ringDist / 30) * p.alpha;
                dotAlphaBoost = Math.max(dotAlphaBoost, intensity);
              }
            }
          }

          ctx.beginPath();
          if (dotAlphaBoost > 0) {
            dotRadius = dotSize + dotAlphaBoost * 1.6;
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = dotColor.replace(
              /[\d.]+\)$/g,
              `${Math.min(1, 0.2 + dotAlphaBoost * 0.7).toFixed(3)})`
            );
          } else {
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
          }
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animId);
    };
  }, [addPing, dotColor, ringColor, gridSize, dotSize, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto select-none ${className}`}
    />
  );
}

export default SonarGrid;
