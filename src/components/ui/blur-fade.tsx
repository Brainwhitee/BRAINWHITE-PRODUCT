"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 24,
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const isInView = !inView || inViewResult;
  const defaultVariants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: 0, opacity: 1, filter: `blur(0px)` },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: 0.04 + delay, duration: 0.4, ease: "easeOut" }}
      variants={defaultVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
