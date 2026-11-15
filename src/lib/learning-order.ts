// The order in which a candidate's path teaches files, so the code map can number them ("start here, then this").
// Pure: tested in scripts/learning-order.test.ts.
export type LessonRef = { sectionOrder: number; order: number; fileId: string | null };

// file id -> 1-based position of the first lesson that teaches it (sections first, then items inside a section).
export function lessonOrder(items: LessonRef[]): Record<string, number> {
  const out: Record<string, number> = {};
  let n = 0;
  for (const it of [...items].sort((a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order)) {
    if (!it.fileId || out[it.fileId] !== undefined) continue;
    out[it.fileId] = ++n;
  }
  return out;
}

// The next file to read: the lowest-numbered file whose lesson is not completed yet.
export function nextToLearn(order: Record<string, number>, status: Record<string, "done" | "todo">): string | null {
  let best: string | null = null;
  for (const [id, pos] of Object.entries(order)) if (status[id] === "todo" && (best === null || pos < order[best])) best = id;
  return best;
}
