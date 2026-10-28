"use client";

import React, { useState, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Database, Network, Map, MessageSquareCode } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Connect your private repository",
    description: "Grant read-only access to your GitHub or GitLab repositories. BrainWhite immediately parses the AST, dependencies, and test matrices.",
    icon: <Database className="w-6 h-6 text-[#ff4400]" />,
    className: "lg:col-span-1 lg:row-span-2", // Tall
  },
  {
    title: "Automated AST codebase graph",
    description: "Builds a living knowledge graph of symbol hierarchies, domain boundaries, state flows, and verification scripts — the architectural realities missing from static docs.",
    icon: <Network className="w-6 h-6 text-white" />,
    className: "lg:col-span-2 lg:row-span-1", // Wide
  },
  {
    title: "Personalized DAG lesson paths",
    description: "Tailored to developer seniority and pod assignments. Enforces prerequisite trees so fundamentals precede advanced module assignments.",
    icon: <Map className="w-6 h-6 text-[#ff4400]" />,
    className: "lg:col-span-1 lg:row-span-1", // Square
  },
  {
    title: "Grounded AI architectural tutor",
    description: "Context-bounded AI tutor strictly answers from your project's verified AST and code index. No hallucinations, verified line citations.",
    icon: <MessageSquareCode className="w-6 h-6 text-white" />,
    className: "lg:col-span-1 lg:row-span-1", // Square
  },
];

const FeatureCard = ({
  feature,
  index,
}: {
  feature: typeof features[0];
  index: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 3D Tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  
  // Subtle rotation for a premium feel
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePosition({ x: mouseX, y: mouseY });
    
    // Calculate percentages (-0.5 to 0.5)
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#0c0c0c] border border-white/10 p-8 transition-colors cursor-pointer shadow-2xl hover:border-[#ff4400]/30",
        feature.className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,68,0,0.08), transparent 40%)`,
        }}
      />
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] pointer-events-none" />
      
      <div className="z-10 flex flex-col gap-4 relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
          {feature.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-mono font-semibold text-white/70">
              0{index + 1}
            </span>
            <h3 className="text-xl font-medium tracking-tight text-white group-hover:text-white transition-colors">
              {feature.title}
            </h3>
          </div>
          <p className="text-white/50 font-sans leading-relaxed group-hover:text-white/70 transition-colors text-sm sm:text-base">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="w-full py-24 md:py-32 bg-[#050505] relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">

        <div className="max-w-3xl mb-16 md:mb-24" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono font-medium text-white/80 uppercase tracking-widest mb-6 backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4400]" />
            Readiness Pipeline
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white"
            style={{ lineHeight: 1.15 }}
          >
            From raw repository to first verified commit in under 9 days.
          </motion.h2>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-6 relative"
          style={{ perspective: "1000px" }}
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
