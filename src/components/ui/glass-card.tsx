"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "relative flex h-full w-full flex-col items-start justify-start overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
