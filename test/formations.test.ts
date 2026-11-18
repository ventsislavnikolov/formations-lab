import { describe, expect, it } from "vitest";
import { formations } from "#/lib/formations";
import { shapeKey, stats } from "#/lib/stats";

const inside = ([x, y]: readonly [number, number]) =>
  x >= 0 && x <= 100 && y >= 0 && y <= 100;

describe("formations", () => {
  it("has the eight systems, each with eight phases of eleven players", () => {
    expect(formations.map((f) => f.id)).toEqual([
      "4-3-3",
      "4-2-3-1",
      "4-4-2",
      "4-1-4-1",
      "3-5-2",
      "3-4-3",
      "3-4-2-1",
      "4-1-2-1-2",
    ]);
    for (const f of formations) {
      expect(f.phases).toHaveLength(8);
      for (const p of f.phases) {
        expect(p.positions).toHaveLength(11);
        expect(p.positions.every(inside), `${f.id} ${p.id}`).toBe(true);
      }
    }
  });

  it("shows every pressing phase against an opponent and a ball", () => {
    for (const f of formations) {
      for (const p of f.phases.filter((x) => x.block)) {
        expect(p.opp, `${f.id} ${p.id}`).toHaveLength(11);
        expect(p.ball, `${f.id} ${p.id}`).not.toBeNull();
      }
    }
  });

  it("uses SISTEMAS for its four systems, with the document's opponent", () => {
    const sis = formations.filter((f) => f.source === "sistemas");
    expect(sis.map((f) => [f.id, f.vs])).toEqual([
      ["4-4-2", "4-1-4-1"],
      ["4-1-4-1", "3-5-2"],
      ["3-5-2", "4-1-4-1"],
      ["3-4-3", "4-1-4-1"],
    ]);
    for (const f of sis) {
      expect(f.training.map((t) => t.name)).toEqual([
        "Organised attack",
        "Defensive transition",
        "Offensive transition",
        "Organised defence",
      ]);
      expect(
        f.phases.filter((p) => p.group === "Build-up").every((p) => p.opp)
      ).toBe(true);
    }
  });

  it("gives every role a job", () => {
    for (const f of formations) {
      for (const k of f.keys) {
        expect(f.roles[k], `${f.id} ${k}`).toBeTruthy();
      }
    }
  });
});

describe("statsbomb aggregate", () => {
  it("has unique coach shape keys for links", () => {
    const keys = stats.shapes.map(shapeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("covers every starting line-up", () => {
    const counted = stats.formations.reduce((a, [, n]) => a + n, 0);
    expect(counted).toBe(stats.meta.starts);
  });
});
