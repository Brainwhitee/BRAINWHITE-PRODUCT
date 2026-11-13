import { test } from "vitest";
import assert from "node:assert/strict";
import { connectorPath, connectorPoint } from "../src/lib/connector";

test("connectors leave and arrive horizontally, and the midpoint lies between the ports", () => {
  assert.equal(connectorPath(0, 0, 200, 100), "M0 0 C100 0 100 100 200 100");
  const m = connectorPoint(0, 0, 200, 100);
  assert.ok(m.x > 0 && m.x < 200 && m.y > 0 && m.y < 100);
  assert.deepEqual(connectorPoint(10, 20, 210, 20, 0), { x: 10, y: 20 });
  assert.deepEqual(connectorPoint(10, 20, 210, 20, 1), { x: 210, y: 20 });
});

test("nearby ports still get a visible curve (minimum handle length)", () => {
  assert.equal(connectorPath(0, 0, 10, 0), "M0 0 C48 0 -38 0 10 0");
});
