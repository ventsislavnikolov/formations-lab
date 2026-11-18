import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, Square } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { AppShell } from "#/components/app-shell";
import { Pitch, type PitchPlayer } from "#/components/pitch";
import { formationIds } from "#/lib/formations";
import {
  type CoachShape,
  METRICS,
  metricScale,
  SB_POSITION,
  shapeKey,
  stats,
} from "#/lib/stats";
import { useAutoplay } from "#/lib/use-autoplay";
import { cn } from "#/lib/utils";

const byKey = new Map(stats.shapes.map((s) => [shapeKey(s), s]));
const find = (name: string, fm: string) =>
  stats.shapes.find((s) => s.display.includes(name) && s.formation === fm) ??
  stats.shapes[0];
const DEFAULT_A = shapeKey(find("Guardiola", "4-3-3") as CoachShape);
const DEFAULT_B = shapeKey(find("Simeone", "4-4-2") as CoachShape);

export const Route = createFileRoute("/coaches")({
  component: CoachesPage,
  head: () => ({ meta: [{ title: "Coaches · Formations Lab" }] }),
  validateSearch: z.object({
    a: z.string().catch(DEFAULT_A).default(DEFAULT_A),
    b: z.string().catch(DEFAULT_B).default(DEFAULT_B),
    mode: z.enum(["in", "out"]).catch("in").default("in"),
    view: z.enum(["side", "overlay"]).catch("side").default("side"),
  }),
});

const ORDER = Object.keys(SB_POSITION).map(Number);

function shapePlayers(
  s: CoachShape,
  mode: "in" | "out",
  team: "a" | "b"
): PitchPlayer[] {
  const src = mode === "in" ? s.inPossession : s.outOfPossession;
  const other = mode === "in" ? s.outOfPossession : s.inPossession;
  return ORDER.filter((id) => src[id] || other[id]).map((id, i) => {
    const p = src[id] ?? other[id] ?? [60, 40, 0];
    return {
      dim: !src[id],
      disc: SB_POSITION[id] ?? "?",
      key: `${team}${id}`,
      order: i,
      pos: [p[0] / 1.2, p[1] / 0.8],
      team,
    };
  });
}

function CoachSelect({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (v: string) => void;
  value: string;
}) {
  const handle = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
    [onChange]
  );
  const groups = new Map<string, CoachShape[]>();
  for (const s of stats.shapes) {
    groups.set(s.formation, [...(groups.get(s.formation) ?? []), s]);
  }
  const rank = (fm: string) =>
    formationIds.includes(fm) ? formationIds.indexOf(fm) : 99;
  const order = [...groups.keys()].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b)
  );
  return (
    <label className="grid min-w-0 flex-[1_1_260px] gap-1" htmlFor={id}>
      <span className="eyebrow">{label}</span>
      <select
        className="border-line bg-surface text-ink max-w-full rounded-lg border px-2.5 py-2"
        id={id}
        onChange={handle}
        value={value}
      >
        {order.map((fm) => (
          <optgroup key={fm} label={fm}>
            {[...(groups.get(fm) ?? [])]
              .sort((a, b) => a.display.localeCompare(b.display))
              .map((s) => (
                <option key={shapeKey(s)} value={shapeKey(s)}>
                  {s.display} · {s.team} ({s.matches.length} games)
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function CoachCard({ s, team }: { s: CoachShape; team: "a" | "b" }) {
  const c = stats.coaches.find((x) => x.display === s.display);
  const [first] = s.matches;
  const last = s.matches.at(-1);
  const seasons =
    first && last && first.season !== last.season
      ? `${first.season}–${last.season}`
      : (first?.season ?? "");
  const color = team === "a" ? "bg-accent" : "bg-team-b";
  return (
    <div className="grid gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className={cn("h-9 w-3 flex-none rounded-sm", color)} />
        <div>
          <h3 className="font-display text-[26px] leading-none font-bold">
            {s.display}
          </h3>
          <p className="text-muted mt-0.5 text-[13px]">
            {s.team} · {s.formation} · {s.matches.length} matches, {first?.comp}{" "}
            {seasons}
          </p>
        </div>
      </div>
      {c ? (
        <div className="grid gap-1">
          <span className="eyebrow">
            Formation mix across {c.matches} matches in the data
          </span>
          <div className="flex h-5 gap-0.5 overflow-hidden rounded">
            {c.formations.slice(0, 5).map(([fm, n], i) => (
              <i
                className={cn(
                  "grid min-w-[3px] place-items-center overflow-hidden font-mono text-[11px] whitespace-nowrap text-white not-italic",
                  color
                )}
                key={fm}
                style={{ flex: n, opacity: [1, 0.75, 0.55, 0.4, 0.4][i] }}
                title={`${fm}: ${n}`}
              >
                {n / c.matches > 0.12 ? fm : ""}
              </i>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const MODE_OPTIONS = [
  { label: "In possession", value: "in" },
  { label: "Out of possession", value: "out" },
];
const VIEW_OPTIONS = [
  { label: "Side by side", value: "side" },
  { label: "Overlay", value: "overlay" },
];

function Segmented({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  const handle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => onChange(e.currentTarget.value),
    [onChange]
  );
  return (
    <fieldset
      aria-label={label}
      className="border-line bg-surface inline-flex overflow-hidden rounded-lg border p-0"
    >
      {options.map((o) => (
        <button
          aria-pressed={o.value === value}
          className={cn(
            "text-muted px-3 py-1.5 font-semibold",
            o.value === value && "bg-ink text-bg"
          )}
          key={o.value}
          onClick={handle}
          type="button"
          value={o.value}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}

function CoachesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = useCallback(
    (patch: Partial<typeof search>) =>
      navigate({
        replace: true,
        resetScroll: false,
        search: (s) => ({ ...s, ...patch }),
      }),
    [navigate]
  );
  const flip = useAutoplay(
    2,
    search.mode === "in" ? 0 : 1,
    (i) => set({ mode: i === 0 ? "in" : "out" }),
    3200
  );
  const A = byKey.get(search.a) ?? (byKey.get(DEFAULT_A) as CoachShape);
  const B = byKey.get(search.b) ?? (byKey.get(DEFAULT_B) as CoachShape);
  const setA = useCallback((a: string) => set({ a }), [set]);
  const setB = useCallback((b: string) => set({ b }), [set]);
  const setMode = useCallback(
    (mode: string) => set({ mode: mode === "out" ? "out" : "in" }),
    [set]
  );
  const setView = useCallback(
    (view: string) => set({ view: view === "overlay" ? "overlay" : "side" }),
    [set]
  );

  return (
    <AppShell>
      <div className="grid gap-4 pt-5">
        <div className="flex flex-wrap items-end gap-3">
          <CoachSelect
            id="coach-a"
            label="Coach A"
            onChange={setA}
            value={shapeKey(A)}
          />
          <CoachSelect
            id="coach-b"
            label="Coach B"
            onChange={setB}
            value={shapeKey(B)}
          />
          <Segmented
            label="Phase"
            onChange={setMode}
            options={MODE_OPTIONS}
            value={search.mode}
          />
          <Segmented
            label="Layout"
            onChange={setView}
            options={VIEW_OPTIONS}
            value={search.view}
          />
          <button className="btn" onClick={flip.toggle} type="button">
            {flip.on ? (
              <Square className="size-4" />
            ) : (
              <ArrowLeftRight className="size-4" />
            )}
            {flip.on ? "Stop" : "Animate in ↔ out"}
          </button>
        </div>

        {search.view === "overlay" ? (
          <div className="grid gap-2.5">
            <div className="grid gap-3 md:grid-cols-2">
              <CoachCard s={A} team="a" />
              <CoachCard s={B} team="b" />
            </div>
            <Pitch
              caption={`Average position of each starter's ${search.mode === "in" ? "on-ball actions" : "defensive actions"}. Both teams attack left to right.`}
              players={[
                ...shapePlayers(A, search.mode, "a"),
                ...shapePlayers(B, search.mode, "b"),
              ]}
            />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {[A, B].map((s, i) => (
              <div
                className="grid min-w-0 content-start gap-2.5"
                key={shapeKey(s)}
              >
                <CoachCard s={s} team={i === 0 ? "a" : "b"} />
                <Pitch
                  compact
                  players={shapePlayers(s, search.mode, i === 0 ? "a" : "b")}
                />
              </div>
            ))}
          </div>
        )}

        <p className="text-muted text-[13px]">
          Shapes use the matches where the coach named the same eleven positions
          ({A.display}: {A.shapeMatches} of {A.matches.length}, {B.display}:{" "}
          {B.shapeMatches} of {B.matches.length}).{" "}
          {search.mode === "in"
            ? "In possession: average location of each starter's passes, carries, receptions, shots and dribbles until the first substitution or tactical change."
            : "Out of possession: average location of each starter's pressures, tackles, interceptions, recoveries, blocks and clearances. These show where a player defends, which runs higher than where they stand."}
        </p>

        <div className="card">
          <h3>Style numbers</h3>
          <div className="grid gap-3">
            {METRICS.map((m) => (
              <div
                className="grid items-center gap-1.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-4"
                key={m.key}
              >
                <div className="grid">
                  <strong>{m.label}</strong>
                  <small className="text-muted text-xs">{m.help}</small>
                </div>
                <div className="grid gap-1">
                  {[A, B].map((s, i) => (
                    <div
                      className="grid grid-cols-[1fr_64px] items-center gap-2"
                      key={shapeKey(s) + m.key}
                    >
                      <i
                        className={cn(
                          "block h-2.5 rounded-sm transition-[width] duration-700",
                          i === 0 ? "bg-accent" : "bg-team-b"
                        )}
                        style={{
                          width: `${metricScale(s.stats[m.key], m.range) * 100}%`,
                        }}
                      />
                      <span className="font-mono text-xs tabular-nums">
                        {m.format(s.stats[m.key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
