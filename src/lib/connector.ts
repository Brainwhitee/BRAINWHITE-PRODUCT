// Smooth connector between two ports (leaves horizontally, arrives horizontally), used by the tree explorer. Pure; tested in scripts/connector.test.ts.
export function connectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.5);
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

// Point on that connector at t (0..1), used to place a count label on the line.
export function connectorPoint(x1: number, y1: number, x2: number, y2: number, t = 0.5): { x: number; y: number } {
  const dx = Math.max(48, Math.abs(x2 - x1) * 0.5);
  const c1x = x1 + dx, c2x = x2 - dx;
  const m = 1 - t;
  return {
    x: m * m * m * x1 + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * x2,
    y: m * m * m * y1 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y2,
  };
}
