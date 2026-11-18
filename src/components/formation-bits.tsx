import { Link } from "@tanstack/react-router";
import type { PitchPlayer } from "#/components/pitch";
import type { Formation, Phase } from "#/data/types";
import { cn } from "#/lib/utils";

export const JERSEY = [1, 2, 4, 5, 3, 6, 7, 8, 9, 10, 11];

export function phasePlayers(f: Formation, phase: Phase): PitchPlayer[] {
  return phase.positions.map((pos, i) => ({
    disc: String(JERSEY[i]),
    key: `s${i}`,
    label: f.keys[i],
    order: i,
    pos,
    team: "a",
  }));
}

export function MiniShape({ f }: { f: Formation }) {
  const [first] = f.phases;
  return (
    <svg aria-hidden="true" className="w-[46px]" viewBox="0 0 40 26">
      <rect
        className="stripe-a"
        height={25}
        rx={2}
        width={39}
        x={0.5}
        y={0.5}
      />
      {first?.positions.map((p, i) => (
        <circle
          className="group-aria-[current=page]:fill-ball fill-white"
          cx={2 + (p[0] / 100) * 36}
          cy={1.5 + (p[1] / 100) * 23}
          // biome-ignore lint/suspicious/noArrayIndexKey: 11 fixed slots
          key={i}
          r={1.25}
        />
      ))}
    </svg>
  );
}

export function FormationPicker({
  formations,
  current,
}: {
  current: string;
  formations: Formation[];
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
      {formations.map((x) => (
        <Link
          className={cn(
            "group border-line bg-surface grid flex-none grid-cols-[46px_1fr] items-center gap-x-2.5 rounded-lg border px-2 py-1.5 text-left transition hover:translate-x-0.5",
            x.id === current && "border-accent ring-accent ring-1"
          )}
          key={x.id}
          params={{ formationId: x.id }}
          search={{ phase: 0 }}
          to="/formations/$formationId"
        >
          <span className="row-span-2">
            <MiniShape f={x} />
          </span>
          <span className="font-display text-xl leading-none font-bold">
            {x.id}
          </span>
          <span className="text-muted text-[11px]">
            {x.family}
            {x.source === "sistemas" ? " · SISTEMAS" : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}

const PILL: Record<string, string> = {
  high: "bg-[#c2362b]",
  low: "bg-[#3b6fb6]",
  mid: "bg-[#c27a12]",
};

export function BlockPill({ block }: { block: string }) {
  return (
    <span
      className={cn(
        "flex-none rounded px-1.5 py-px font-mono text-[10px] text-white uppercase",
        PILL[block]
      )}
    >
      {block}
    </span>
  );
}

export function PhaseList({ f, index }: { f: Formation; index: number }) {
  const groups: { items: [Phase, number][]; name: string }[] = [];
  f.phases.forEach((p, i) => {
    let g = groups.find((x) => x.name === p.group);
    if (!g) {
      g = { items: [], name: p.group };
      groups.push(g);
    }
    g.items.push([p, i]);
  });
  return (
    <div className="grid gap-3.5">
      {groups.map((g) => (
        <div className="grid gap-1" key={g.name}>
          <div className="eyebrow">{g.name}</div>
          {g.items.map(([p, i]) => (
            <Link
              className={cn(
                "border-line text-muted hover:text-ink flex items-baseline gap-2 border-l-2 px-2.5 py-1.5 transition",
                i === index && "border-accent text-ink font-semibold"
              )}
              key={p.id}
              params={{ formationId: f.id }}
              replace
              resetScroll={false}
              search={{ phase: i }}
              to="/formations/$formationId"
            >
              {p.block ? <BlockPill block={p.block} /> : null}
              <span>{p.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
