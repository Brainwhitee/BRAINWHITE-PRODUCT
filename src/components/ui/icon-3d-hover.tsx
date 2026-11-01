"use client";

import React, { useRef, useState, useCallback } from "react";
import { 
  Workflow,
  Cpu,
  Network,
  Layers,
  Share2,
  GitBranch,
  Terminal,
  CheckCircle2,
  Briefcase,
  Users,
  Code2,
  ShieldCheck,
  Lock,
  KeyRound,
  EyeOff,
  FileCheck2,
  Server,
  BarChart3,
  Sparkles,
  GitPullRequest,
  HelpCircle,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  workflow: Workflow,
  cpu: Cpu,
  network: Network,
  layers: Layers,
  share: Share2,
  branch: GitBranch,
  gitbranch: GitBranch,
  terminal: Terminal,
  check: CheckCircle2,
  checkcircle: CheckCircle2,
  briefcase: Briefcase,
  users: Users,
  code: Code2,
  shield: ShieldCheck,
  lock: Lock,
  key: KeyRound,
  eye: EyeOff,
  filecheck: FileCheck2,
  server: Server,
  barchart: BarChart3,
  sparkles: Sparkles,
  gitpr: GitPullRequest,
};

export interface Icon3DHoverProps {
  iconName?: string;
  icon?: React.ReactNode;
  stepNumber?: string;
  title: string;
  description: string;
  footerText?: string;
  className?: string;
}

export function Icon3DHoverCard({
  iconName,
  icon,
  stepNumber,
  title,
  description,
  footerText = "Automated Stage",
  className,
}: Icon3DHoverProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateX = -(mouseY / (rect.height / 2)) * 10;
    const rotateY = (mouseX / (rect.width / 2)) * 10;

    setRotate({ x: rotateX, y: rotateY });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const ResolvedIcon = iconName ? (ICON_MAP[iconName.toLowerCase()] || HelpCircle) : null;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative rounded-2xl bg-white border border-neutral-200 transition-all duration-300 ease-out select-none",
        "hover:border-neutral-900 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)]",
        className
      )}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="p-6 flex flex-col justify-between h-full transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div>
          {/* Top Row: 3D Rotating Cube Icon + Step Number */}
          <div className="flex items-center justify-between mb-6" style={{ transform: "translateZ(30px)" }}>
            <div className="relative w-12 h-12 [perspective:600px]">
              <div
                className={cn(
                  "w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d]",
                  isHovered ? "[transform:rotateX(20deg)_rotateY(35deg)_translateZ(10px)]" : "[transform:rotateX(0deg)_rotateY(0deg)]"
                )}
              >
                {/* Front Face */}
                <div className="absolute inset-0 rounded-xl bg-neutral-950 text-white flex items-center justify-center border border-neutral-800 shadow-md [transform:translateZ(14px)] transition-all">
                  {ResolvedIcon ? (
                    <ResolvedIcon className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
                  ) : (
                    icon
                  )}
                </div>
                {/* 3D Depth Shadow Ring */}
                <div className="absolute inset-0 rounded-xl bg-neutral-200/80 -z-10 [transform:translateZ(-14px)]" />
              </div>
            </div>

            {stepNumber && (
              <span className="font-mono text-2xl font-black text-neutral-300 group-hover:text-neutral-900 transition-colors">
                {stepNumber}
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className="text-base sm:text-lg font-bold text-neutral-950 mb-2 tracking-tight transition-colors duration-200"
            style={{ transform: "translateZ(25px)" }}
          >
            {title}
          </h4>

          {/* Description */}
          <p
            className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans font-light"
            style={{ transform: "translateZ(15px)" }}
          >
            {description}
          </p>
        </div>

        {/* Footer line without micro-badges */}
        <div
          className="pt-4 mt-6 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-500"
          style={{ transform: "translateZ(20px)" }}
        >
          <span className="font-medium text-neutral-700">{footerText}</span>
          <span className="w-2 h-2 rounded-full bg-neutral-300 group-hover:bg-neutral-950 transition-colors" />
        </div>
      </div>
    </div>
  );
}
