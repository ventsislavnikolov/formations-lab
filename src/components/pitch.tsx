import { motion, useReducedMotion } from "motion/react";
import type { Arrow, Pt } from "#/data/types";
import { cn } from "#/lib/utils";

// Data x 0..100 → 0..105 m along the pitch, y 0..100 → 0..68 m across it.
const px = (x: number) => (x / 100) * 105;
const py = (y: number) => (y / 100) * 68;

export interface PitchPlayer {
  dim?: boolean;
  /** Short text inside the disc. */
  disc: string;
  key: string;
  /** Role label under the disc; omit when the disc already says it. */
  label?: string;
  order: number;
  pos: Pt;
  team: "a" | "b";
}

const SPRING = {
  damping: 22,
  mass: 0.9,
  stiffness: 120,
  type: "spring",
} as const;

function Markings() {
  return (
    <g>
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          className={i % 2 ? "stripe-b" : "stripe-a"}
          height={68}
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed stripe count
          key={i}
          width={8.75}
          x={i * 8.75}
          y={0}
        />
      ))}
      <rect className="chalk" height={67.4} width={104.4} x={0.3} y={0.3} />
      <line className="chalk" x1={52.5} x2={52.5} y1={0} y2={68} />
      <circle className="chalk" cx={52.5} cy={34} r={9.15} />
      <circle className="chalk-dot" cx={52.5} cy={34} r={0.45} />
      <rect className="chalk" height={40.32} width={16.5} x={0.3} y={13.84} />
      <rect className="chalk" height={18.32} width={5.5} x={0.3} y={24.84} />
      <rect className="chalk" height={40.32} width={16.5} x={88.2} y={13.84} />
      <rect className="chalk" height={18.32} width={5.5} x={99.2} y={24.84} />
      <circle className="chalk-dot" cx={11} cy={34} r={0.45} />
      <circle className="chalk-dot" cx={94} cy={34} r={0.45} />
      <path className="chalk" d="M16.8 26.7 A9.15 9.15 0 0 1 16.8 41.3" />
      <path className="chalk" d="M88.2 26.7 A9.15 9.15 0 0 0 88.2 41.3" />
      <rect fill="#ffffff59" height={7.32} width={1.6} x={-1.6} y={30.34} />
      <rect fill="#ffffff59" height={7.32} width={1.6} x={105} y={30.34} />
    </g>
  );
}

const ARROW_STYLE: Record<
  Arrow["type"],
  { color: string; dash?: string; width: number }
> = {
  pass: { color: "#ffffff", width: 0.5 },
  press: { color: "var(--press)", width: 0.7 },
  run: { color: "var(--ball)", dash: "2 1.2", width: 0.5 },
};

function arrowPath(a: Arrow): string {
  const x1 = px(a.from[0]);
  const y1 = py(a.from[1]);
  const x2 = px(a.to[0]);
  const y2 = py(a.to[1]);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ex = x2 - (dx / len) * 2.2;
  const ey = y2 - (dy / len) * 2.2;
  const sx = x1 + (dx / len) * 1.8;
  const sy = y1 + (dy / len) * 1.8;
  if (a.type === "run") {
    const mx = (sx + ex) / 2 - dy * 0.18;
    const my = (sy + ey) / 2 + dx * 0.18;
    return `M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`;
  }
  return `M${sx} ${sy} L${ex} ${ey}`;
}

export function Pitch({
  arrows = [],
  ball = null,
  caption,
  className,
  compact,
  opp = null,
  phaseKey,
  players,
}: {
  arrows?: Arrow[];
  ball?: Pt | null;
  caption?: string;
  className?: string;
  compact?: boolean;
  opp?: Pt[] | null;
  phaseKey?: string;
  players: PitchPlayer[];
}) {
  const reduce = useReducedMotion();
  const spring = reduce ? { duration: 0 } : SPRING;
  return (
    <figure className={cn("m-0", className)}>
      <svg
        aria-label={caption ?? "Football pitch"}
        className="bg-grass block h-auto w-full rounded-xl shadow-[0_12px_30px_-18px_#00000080]"
        role="img"
        viewBox="-3 -3 111 74"
      >
        <defs>
          {(Object.keys(ARROW_STYLE) as Arrow["type"][]).map((t) => (
            <marker
              id={`head-${t}`}
              key={t}
              markerHeight={4.2}
              markerWidth={4.2}
              orient="auto-start-reverse"
              refX={6}
              refY={5}
              viewBox="0 0 10 10"
            >
              <path d="M0 0 L10 5 L0 10 z" fill={ARROW_STYLE[t].color} />
            </marker>
          ))}
        </defs>
        <Markings />

        <motion.g
          animate={{ opacity: opp ? 1 : 0 }}
          initial={false}
          transition={{ duration: 0.4 }}
        >
          {(opp ?? Array.from({ length: 11 }, (): Pt => [90, 34])).map(
            (p, i) => (
              <motion.g
                animate={{ x: px(p[0]), y: py(p[1]) }}
                initial={false}
                // biome-ignore lint/suspicious/noArrayIndexKey: opponent slots are positional
                key={i}
                transition={{ ...spring, delay: reduce ? 0 : i * 0.018 }}
              >
                <circle className="ghost" r={1.55} />
              </motion.g>
            )
          )}
        </motion.g>

        <g key={phaseKey}>
          {arrows.map((a, i) => {
            const s = ARROW_STYLE[a.type];
            return (
              <motion.path
                animate={{ opacity: 1, pathLength: 1 }}
                d={arrowPath(a)}
                fill="none"
                initial={{
                  opacity: 0,
                  // Runs keep their dashes, so they fade in instead of drawing.
                  pathLength: reduce || a.type === "run" ? 1 : 0,
                }}
                // biome-ignore lint/suspicious/noArrayIndexKey: arrows are an ordered sequence
                key={i}
                markerEnd={`url(#head-${a.type})`}
                stroke={s.color}
                strokeDasharray={s.dash}
                strokeWidth={s.width}
                transition={{
                  delay: reduce ? 0 : 0.7 + i * 0.38,
                  duration: 0.65,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </g>

        {players.map((p) => (
          <motion.g
            animate={{
              opacity: p.dim ? 0.45 : 1,
              x: px(p.pos[0]),
              y: py(p.pos[1]),
            }}
            initial={false}
            key={p.key}
            transition={{ ...spring, delay: reduce ? 0 : p.order * 0.028 }}
          >
            <circle
              className={p.team === "a" ? "disc-a" : "disc-b"}
              r={compact ? 2.3 : 2.5}
              stroke="#fffffff2"
              strokeWidth={0.35}
            />
            <text
              fill="#fff"
              fontSize={p.disc.length > 2 ? 1.55 : 2.3}
              fontWeight={700}
              pointerEvents="none"
              textAnchor="middle"
              y={p.disc.length > 2 ? 0.6 : 0.85}
            >
              {p.disc}
            </text>
            {p.label ? (
              <text
                fill="#fff"
                fontSize={1.7}
                fontWeight={600}
                paintOrder="stroke"
                stroke="#00000073"
                strokeWidth={0.45}
                textAnchor="middle"
                y={compact ? 4.9 : 5.2}
              >
                {p.label}
              </text>
            ) : null}
          </motion.g>
        ))}

        {ball ? (
          <motion.g
            animate={{ x: px(ball[0]), y: py(ball[1]) }}
            initial={false}
            transition={{ ...spring, delay: reduce ? 0 : 0.25 }}
          >
            <circle
              fill="var(--ball)"
              r={1.05}
              stroke="#1b1b1b"
              strokeWidth={0.25}
            />
          </motion.g>
        ) : null}
      </svg>
      {caption ? (
        <figcaption className="text-muted mt-1.5 text-xs">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function Legend({ oppLabel }: { oppLabel?: string | null }) {
  const item = "inline-flex items-center gap-1.5";
  return (
    <div className="text-muted mt-2.5 flex flex-wrap gap-3.5 text-xs">
      <span className={item}>
        <i className="border-muted inline-block w-5 border-t-2" />
        Pass
      </span>
      <span className={item}>
        <i className="inline-block w-5 border-t-2 border-dashed border-[#d4a514]" />
        Run
      </span>
      <span className={item}>
        <i className="border-press inline-block w-5 border-t-2" />
        Press
      </span>
      {oppLabel ? (
        <span className={item}>
          <i className="border-muted inline-block size-2.5 rounded-full border-[1.5px] border-dashed" />
          {oppLabel}
        </span>
      ) : null}
    </div>
  );
}
