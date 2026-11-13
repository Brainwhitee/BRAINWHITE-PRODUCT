import { test } from "vitest";
import assert from "node:assert/strict";
import { lessonOrder, nextToLearn } from "../src/lib/learning-order";

test("files are numbered in the order the path teaches them: sections first, then items", () => {
  const o = lessonOrder([
    { sectionOrder: 1, order: 0, fileId: "late.ts" },
    { sectionOrder: 0, order: 2, fileId: "b.ts" },
    { sectionOrder: 0, order: 1, fileId: "a.ts" },
  ]);
  assert.deepEqual(o, { "a.ts": 1, "b.ts": 2, "late.ts": 3 });
});

test("a file taught twice keeps its first position; lessons without a file are skipped and do not leave gaps", () => {
  const o = lessonOrder([
    { sectionOrder: 0, order: 0, fileId: null }, // a text lesson
    { sectionOrder: 0, order: 1, fileId: "a.ts" },
    { sectionOrder: 0, order: 2, fileId: "b.ts" },
    { sectionOrder: 0, order: 3, fileId: "a.ts" },
  ]);
  assert.deepEqual(o, { "a.ts": 1, "b.ts": 2 });
});

test("nothing to number gives an empty map", () => {
  assert.deepEqual(lessonOrder([]), {});
});

test("nextToLearn picks the lowest-numbered file that is still to learn", () => {
  const order = { "a.ts": 1, "b.ts": 2, "c.ts": 3 };
  assert.equal(nextToLearn(order, { "a.ts": "done", "b.ts": "todo", "c.ts": "todo" }), "b.ts");
  assert.equal(nextToLearn(order, { "a.ts": "todo", "b.ts": "done", "c.ts": "todo" }), "a.ts");
  assert.equal(nextToLearn(order, { "a.ts": "done", "b.ts": "done", "c.ts": "done" }), null);
  assert.equal(nextToLearn({}, {}), null);
});
