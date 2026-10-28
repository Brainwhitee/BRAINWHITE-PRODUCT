"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";
import { cn } from "@/lib/utils";

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

interface VelocityScrollProps {
  text: string;
  defaultVelocity?: number;
  className?: string;
}

function ParallaxText({
  children,
  baseVelocity = 100,
}: {
  children: React.ReactNode;
  baseVelocity: number;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="parallax overflow-hidden flex whitespace-nowrap m-0 flex-nowrap">
      <motion.div className="scroller font-display font-medium text-[8vw] md:text-[6vw] flex whitespace-nowrap flex-nowrap uppercase tracking-tighter" style={{ x }}>
        <span className="block mr-[2vw]">{children} </span>
        <span className="block mr-[2vw]">{children} </span>
        <span className="block mr-[2vw]">{children} </span>
        <span className="block mr-[2vw]">{children} </span>
      </motion.div>
    </div>
  );
}

export function VelocityScroll({ text, defaultVelocity = 5, className }: VelocityScrollProps) {
  return (
    <section className={cn("relative w-full overflow-hidden z-20", className)}>
      <ParallaxText baseVelocity={defaultVelocity}>{text}</ParallaxText>
    </section>
  );
}
