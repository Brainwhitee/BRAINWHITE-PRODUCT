"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!ref.current || !code.trim()) return;
    setHasError(false);

    let isMounted = true;

    async function loadAndRender() {
      try {
        if (!(window as any).mermaid) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          script.async = true;
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load mermaid"));
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !ref.current) return;

        const id = `mermaid_${Math.random().toString(36).slice(2, 9)}`;
        (window as any).mermaid?.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
        });

        const { svg } = await (window as any).mermaid.render(id, code.trim());
        if (isMounted && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        console.warn("[MermaidDiagram] Render fallback:", err);
        if (isMounted) {
          setHasError(true);
        }
      }
    }

    loadAndRender();

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (hasError) {
    return (
      <div className="w-full max-w-2xl p-4 rounded-xl border border-neutral-800 bg-neutral-900/80 text-neutral-300 font-mono text-xs overflow-x-auto my-2">
        <p className="text-[#FC7819] font-sans text-xs mb-1.5 font-bold uppercase tracking-wider">Architecture Diagram Flow</p>
        <pre className="text-[11px] leading-relaxed">{code}</pre>
      </div>
    );
  }

  return <div ref={ref} className="w-full max-w-3xl min-h-[220px] flex items-center justify-center p-2 overflow-auto" />;
}
