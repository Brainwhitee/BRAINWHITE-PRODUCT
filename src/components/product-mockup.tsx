"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

const progressData = [
  { label: "Client Context", value: 100, detail: "Business scope & expectations" },
  { label: "Codebase Overview", value: 82, detail: "Architecture & key systems mapped" },
  { label: "Tech Stack", value: 71, detail: "Tools, workflows, conventions" },
  { label: "Hands-on Tasks", value: 54, detail: "Guided exercises completed" },
  { label: "Project Readiness", value: 46, detail: "Overall delivery preparedness" },
];

const tasks = [
  { id: "T-001", title: "Understand payment processing flow", status: "completed" as const, detail: "Core domain mapping" },
  { id: "T-002", title: "Map service dependencies", status: "completed" as const, detail: "Architecture diagram" },
  { id: "T-003", title: "Run local development environment", status: "in-progress" as const, detail: "Environment setup" },
  { id: "T-004", title: "Trace authentication flow", status: "pending" as const, detail: "Security review" },
  { id: "T-005", title: "Implement first API change", status: "pending" as const, detail: "Production contribution" },
];

type TaskStatus = "completed" | "in-progress" | "pending";

const statusStyles: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  completed: { bg: "var(--foreground)", text: "white", border: "var(--foreground)" },
  "in-progress": { bg: "transparent", text: "var(--foreground)", border: "var(--foreground)" },
  pending: { bg: "transparent", text: "var(--muted)", border: "var(--border)" },
};

export function ProductMockup() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      className="relative py-12 md:py-16 border-y border-[var(--border)] overflow-hidden"
      aria-labelledby="mockup-heading"
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.02)_0%,_transparent_70%)]"
        style={{ y: bgParallax }}
      />

      <div className="mx-auto max-w-7xl px-6 md:px-8 relative z-10">
        <motion.div
          className="max-w-2xl mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-4" style={{ letterSpacing: "0.2em" }}>
            PRODUCT MOCKUP
          </p>
          <h2 id="mockup-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Conceptual UI — not a production screenshot.
          </h2>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 gap-8 lg:gap-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          <MockupPanel />
          <TaskPanel />
        </motion.div>
      </div>
    </section>
  );
}

function MockupPanel() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const panelParallax = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const panelRotate = useTransform(scrollYProgress, [0, 1], [-0.5, 0.5]);

  return (
    <motion.div
      className="border border-[var(--border)] overflow-hidden bg-white"
      style={{ y: panelParallax, rotate: panelRotate }}
      transition={{ duration: 0.3, ease }}
    >
      <div className="border-b border-[var(--border)] px-6 py-4 bg-[var(--background)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 15h4" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">PLACEMENT / 04</p>
            <p className="font-medium text-[var(--foreground)]">Alex Morgan → Acme Financial</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <span className="font-mono text-[10px] px-2 py-1 border border-[var(--border)]">CONCEPTUAL UI</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MockupStat label="CLIENT" value="Acme Financial" />
          <MockupStat label="ENGINEER" value="Alex Morgan" />
          <MockupStat label="ENGAGEMENT" value="Payments Platform" />
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">STACK</p>
            <p className="font-mono text-[11px] text-[var(--muted)]">JAVA / SPRING / POSTGRESQL / REACT</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Java", "Spring Boot", "PostgreSQL", "React", "TypeScript", "Docker", "Kubernetes", "GitLab CI"].map((tech) => (
              <span key={tech} className="font-mono text-[10px] px-2.5 py-1 border border-[var(--border)] text-[var(--muted)]">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-4">PROGRESS</p>
          <div className="space-y-4">
            {progressData.map((item, index) => (
              <ProgressBar key={index} {...item} />
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">OVERALL READINESS</p>
            <p className="font-display font-medium text-[36px] text-[var(--foreground)]">64%</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">CURRENT STAGE</p>
            <p className="font-medium text-[var(--foreground)]">Hands-on Tasks</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MockupStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-[var(--border)]">
      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">{label}</p>
      <p className="font-medium text-[var(--foreground)] text-sm">{value}</p>
    </div>
  );
}

function ProgressBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      const duration = 800;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedValue(Math.floor(value * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--foreground)]">{label}</p>
        <p className="font-mono text-[11px] tabular-nums text-[var(--foreground)] font-medium">{animatedValue}%</p>
      </div>
      <div className="relative h-1.5 bg-[var(--border)] overflow-hidden" ref={ref}>
        <motion.div
          className="absolute top-0 left-0 h-full bg-[var(--foreground)]"
          initial={{ width: 0 }}
          animate={{ width: `${animatedValue}%` }}
          transition={{ duration: 0.8, ease }}
        />
      </div>
      <p className="font-mono text-[9px] text-[var(--muted)] mt-1">{detail}</p>
    </div>
  );
}

function TaskPanel() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const panelParallax = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const panelRotate = useTransform(scrollYProgress, [0, 1], [0.5, -0.5]);

  return (
    <motion.div
      className="border border-[var(--border)] overflow-hidden bg-white flex flex-col"
      style={{ y: panelParallax, rotate: panelRotate }}
      transition={{ duration: 0.3, ease }}
    >
      <div className="border-b border-[var(--border)] px-6 py-4 bg-[var(--background)]/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">HANDS-ON TASKS</p>
            <p className="font-medium text-[var(--foreground)]">Alex Morgan • Payments Platform</p>
          </div>
          <span className="font-mono text-[10px] px-2 py-1 border border-[var(--border)] text-[var(--muted)] w-fit">CONCEPTUAL UI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map((task, index) => (
          <TaskRow key={task.id} task={task} index={index} />
        ))}
      </div>

      <div className="border-t border-[var(--border)] p-4 bg-[var(--background)]/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
          <span className="text-[var(--muted)]">5 tasks • 2 completed • 1 in progress</span>
          <button className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1 w-fit">
            View all tasks
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TaskRow({ task, index }: { task: { id: string; title: string; status: TaskStatus; detail: string }; index: number }) {
  const styles = statusStyles[task.status];
  
  return (
    <motion.div
      className="flex items-start gap-3 p-3 border border-[var(--border)] hover:border-[var(--foreground)]/30 transition-colors duration-200"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {task.status === "completed" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {task.status === "in-progress" && (
          <div className="w-4 h-4 border-2 border-[var(--foreground)] rounded animate-pulse" />
        )}
        {task.status === "pending" && (
          <div className="w-4 h-4 border border-[var(--border)] rounded" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] text-[var(--muted)]">{task.id}</span>
          <span 
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${styles.border === "var(--border)" ? "bg-[var(--border)]" : `bg-${styles.bg} text-${styles.text}`}`}
            style={{ 
              borderColor: styles.border,
              backgroundColor: styles.bg === "var(--foreground)" ? "var(--foreground)" : styles.bg,
              color: styles.text
            }}
          >
            {task.status.replace("-", " ")}
          </span>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">{task.title}</p>
        <p className="font-mono text-[9px] text-[var(--muted)]">{task.detail}</p>
      </div>
    </motion.div>
  );
}