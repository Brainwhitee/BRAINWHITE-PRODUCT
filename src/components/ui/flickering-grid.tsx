"use client";

import React, { useEffect, useRef } from "react";

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  color?: string;
  maxOpacity?: number;
  flickerChance?: number;
  className?: string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  color = "rgb(255, 102, 0)",
  maxOpacity = 0.3,
  flickerChance = 0.1,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let squares: Float32Array;

    const setup = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      cols = Math.floor(width / (squareSize + gridGap));
      rows = Math.floor(height / (squareSize + gridGap));
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance) {
          squares[i] = Math.random() * maxOpacity;
        }
        const x = (i % cols) * (squareSize + gridGap);
        const y = Math.floor(i / cols) * (squareSize + gridGap);
        ctx.fillStyle = color.replace(")", `, ${squares[i]})`).replace("rgb", "rgba");
        ctx.fillRect(x, y, squareSize, squareSize);
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    setup();
    draw();

    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("resize", setup);
      cancelAnimationFrame(animationFrameId);
    };
  }, [squareSize, gridGap, color, maxOpacity, flickerChance]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
};
