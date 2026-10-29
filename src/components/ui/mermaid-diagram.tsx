"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Load mermaid from CDN if not already loaded
    if (!(window as any).mermaid) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.onload = () => render();
      document.head.appendChild(script);
    } else {
      render();
    }

    function render() {
      ref.current!.innerHTML = `<div class="mermaid">${code}</div>`;
      (window as any).mermaid?.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
      });
      (window as any).mermaid?.init(undefined, ref.current);
    }
  }, [code]);

  return <div ref={ref} className="w-full h-full min-h-[400px] flex items-center justify-center p-4" />;
}
