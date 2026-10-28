"use client";
import React, { useId } from "react";
import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

export const SparklesCore = (props: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}) => {
  const {
    id,
    className,
    background,
    minSize = 1,
    maxSize = 3,
    speed = 4,
    particleColor = "#ffffff",
    particleDensity = 120,
  } = props;
  const [init, setInit] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < particleDensity; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (maxSize - minSize) + minSize,
          duration: Math.random() * speed + speed,
          delay: Math.random() * 2,
        });
      }
      setParticles(newParticles);
      setInit(true);
    };

    generateParticles();
  }, [maxSize, minSize, particleDensity, speed]);

  if (!init) return null;

  return (
    <div
      className={cn("h-full w-full absolute inset-0 z-0", className)}
      style={{
        background: background || "transparent",
      }}
    >
      <div className="absolute inset-0 w-full h-full">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [`${particle.x}%`, `${particle.x + (Math.random() * 10 - 5)}%`],
              y: [`${particle.y}%`, `${particle.y - (Math.random() * 20 + 10)}%`],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: `${particle.y}%`,
              left: `${particle.x}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particleColor,
              borderRadius: "50%",
              boxShadow: `0 0 ${particle.size * 2}px ${particleColor}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
