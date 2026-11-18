// Turns the formation content into animation frames: 11 positions per phase,
// resolved arrows, the ball, and the ghost opponent the phase is shown against.
import { BASE, FORMATIONS } from "#/data/formations";
import { SISTEMAS } from "#/data/sistemas";
import type {
  Arrow,
  Block,
  Formation,
  FormationSpec,
  Opponent,
  Phase,
  PhaseSpec,
  Pt,
  Ref,
} from "#/data/types";

interface OpponentShapes {
  build: Pt[];
  defend: Pt[];
  keys: Record<string, number>;
}

// They attack towards x = 0. "build" is them playing out (we press),
// "defend" is their block while we build up.
const OPP: Record<Opponent, OpponentShapes> = {
  "4-1-4-1": {
    build: [
      [97, 50],
      [84, 64],
      [84, 36],
      [74, 92],
      [74, 8],
      [72, 50],
      [60, 68],
      [60, 32],
      [48, 86],
      [44, 50],
      [48, 14],
    ],
    defend: [
      [97, 50],
      [70, 82],
      [72, 61],
      [72, 39],
      [70, 18],
      [60, 50],
      [50, 85],
      [52, 64],
      [52, 36],
      [50, 15],
      [40, 50],
    ],
    keys: {
      "6": 5,
      "8b": 6,
      "8f": 7,
      CBb: 1,
      CBf: 2,
      FBb: 3,
      FBf: 4,
      GK: 0,
      ST: 9,
      Wb: 8,
      Wf: 10,
    },
  },
  "3-5-2": {
    build: [
      [97, 50],
      [86, 72],
      [88, 50],
      [86, 28],
      [62, 94],
      [62, 6],
      [72, 50],
      [60, 66],
      [60, 34],
      [46, 58],
      [46, 42],
    ],
    defend: [
      [97, 50],
      [74, 72],
      [76, 50],
      [74, 28],
      [60, 92],
      [60, 8],
      [58, 50],
      [52, 66],
      [52, 34],
      [38, 60],
      [38, 40],
    ],
    keys: {
      "6": 6,
      "8b": 7,
      "8f": 8,
      CBb: 1,
      CBf: 3,
      CBm: 2,
      GK: 0,
      STb: 9,
      STf: 10,
      WBb: 4,
      WBf: 5,
    },
  },
};

const SHIFT: Record<Block, number> = { high: 0, low: 36, mid: 22 };

const BLOCKS: Record<
  Block,
  { back: number; front: number; shift: number; width: number }
> = {
  high: { back: 42, front: 80, shift: 0, width: 0.95 },
  low: { back: 13, front: 38, shift: 7, width: 0.62 },
  mid: { back: 30, front: 60, shift: 9, width: 0.72 },
};

const round = (v: number) => Math.round(v * 10) / 10;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function opponentShape(kind: Block | "build", vs: Opponent): Pt[] {
  const o = OPP[vs];
  if (kind === "build") {
    return o.defend;
  }
  const shift = SHIFT[kind];
  return o.build.map(
    ([x, y], i): Pt => [
      i === 0 ? Math.max(x - shift * 0.3, 80) : Math.max(x - shift, 12),
      y,
    ]
  );
}

/** Squeezes a shape between two lines and shifts it towards the ball side. */
export function squeeze(
  base: [string, number, number][],
  kind: Block
): Record<string, Pt> {
  const { back, front, shift, width } = BLOCKS[kind];
  const xs = base.slice(1).map((p) => p[1]);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const out: Record<string, Pt> = {};
  base.forEach(([k, x, y], i) => {
    if (i === 0) {
      out[k] = [Math.max(5, round(back * 0.45)), 50 + shift * 0.3];
      return;
    }
    const nx = back + ((x - lo) / (hi - lo || 1)) * (front - back);
    out[k] = [round(nx), round(clamp(50 + (y - 50) * width + shift, 4, 96))];
  });
  return out;
}

function buildPhase(
  f: FormationSpec,
  base: [string, number, number][],
  ph: PhaseSpec
): Phase {
  const vs: Opponent = f.vs ?? "4-1-4-1";
  const basePos: Record<string, Pt> = Object.fromEntries(
    base.map(([k, x, y]) => [k, [x, y] as Pt])
  );
  const start = ph.block ? squeeze(base, ph.block) : basePos;
  const pos: Record<string, Pt> = { ...start, ...ph.pos };
  let oppKind: Block | "build" | null = null;
  if (ph.block) {
    oppKind = ph.block;
  } else if (f.vs && ph.group === "Build-up") {
    oppKind = "build";
  }
  const opp = oppKind ? opponentShape(oppKind, vs) : null;
  const ref = (r: Ref): Pt => {
    if (typeof r !== "string") {
      return r;
    }
    if (r.startsWith("o:")) {
      const idx = OPP[vs].keys[r.slice(2)];
      const p = idx === undefined || !opp ? undefined : opp[idx];
      if (!p) {
        throw new Error(`${f.id} ${ph.id}: unknown opponent ${r}`);
      }
      return p;
    }
    const p = pos[r];
    if (!p) {
      throw new Error(`${f.id} ${ph.id}: unknown player ${r}`);
    }
    return p;
  };
  let ballRef: Ref | undefined = ph.ball;
  if (!ballRef && ph.block) {
    ballRef = `o:${ph.block === "high" || vs === "3-5-2" ? "CBb" : "FBb"}`;
  }
  let ball: Pt | null = null;
  if (ballRef) {
    const b = ref(ballRef);
    ball = typeof ballRef === "string" ? [b[0] + 1.4, b[1] + 1.2] : b;
  }
  const arrows: Arrow[] = (ph.arrows ?? []).map(([a, b, type]) => ({
    from: ref(a),
    to: ref(b),
    type,
  }));
  let oppLabel: string | null = null;
  if (opp) {
    oppLabel = `Opponent ${oppKind === "build" ? "defending" : "building up"} in a ${vs}`;
  }
  return {
    arrows,
    ball,
    block: ph.block,
    group: ph.group,
    id: ph.id,
    opp,
    oppLabel,
    positions: base.map(([k]) => ref(k)),
    text: ph.text,
    title: ph.title,
  };
}

function build(spec: FormationSpec): Formation {
  const f: FormationSpec = { ...spec, ...SISTEMAS[spec.id] };
  const base = BASE[f.id];
  if (!base) {
    throw new Error(`No base shape for ${f.id}`);
  }
  const shape: PhaseSpec = {
    group: "Shape",
    id: "shape",
    text: f.summary,
    title: `Base shape: ${f.id}`,
  };
  return {
    ...f,
    keys: base.map(([k]) => k),
    phases: [shape, ...f.phases].map((ph) => buildPhase(f, base, ph)),
  };
}

export const formations: Formation[] = FORMATIONS.map(build);
export const formationIds = formations.map((f) => f.id);

export function getFormation(id: string): Formation | undefined {
  return formations.find((f) => f.id === id);
}
