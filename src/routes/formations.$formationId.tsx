import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import { MonitorPlay, Pause, Play } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { AppShell } from "#/components/app-shell";
import {
  FormationPicker,
  JERSEY,
  PhaseList,
  phasePlayers,
} from "#/components/formation-bits";
import { Legend, Pitch } from "#/components/pitch";
import { formations, getFormation } from "#/lib/formations";
import { shapeKey, stats } from "#/lib/stats";
import { useAutoplay } from "#/lib/use-autoplay";

export const Route = createFileRoute("/formations/$formationId")({
  component: FormationPage,
  head: ({ params }) => ({
    meta: [{ title: `${params.formationId} · Formations Lab` }],
  }),
  loader: ({ params }) => {
    if (!getFormation(params.formationId)) {
      throw notFound();
    }
  },
  validateSearch: z.object({
    phase: z.number().int().min(0).catch(0).default(0),
  }),
});

function FormationPage() {
  const { formationId } = Route.useParams();
  const { phase: rawIndex } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const f = getFormation(formationId);
  const go = useCallback(
    (i: number) =>
      navigate({ replace: true, resetScroll: false, search: { phase: i } }),
    [navigate]
  );
  const count = f?.phases.length ?? 1;
  const index = Math.min(rawIndex, count - 1);
  const auto = useAutoplay(count, index, go);
  if (!f) {
    return null;
  }
  const phase = f.phases[index] ?? f.phases[0];
  if (!phase) {
    return null;
  }
  const starts = stats.formations.find(([k]) => k === f.id)?.[1] ?? 0;
  const users = stats.topCoaches[f.id] ?? [];
  const shapes = new Map(
    stats.shapes
      .filter((s) => s.formation === f.id)
      .map((s) => [s.display, shapeKey(s)])
  );

  return (
    <AppShell>
      <div className="grid items-start gap-5 pt-5 md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[170px_minmax(0,1fr)_270px]">
        <aside
          aria-label="Formations"
          className="grid gap-2 md:col-span-2 lg:sticky lg:top-[72px] lg:col-span-1"
        >
          <div className="eyebrow">Formations</div>
          <FormationPicker current={f.id} formations={formations} />
        </aside>

        <section className="grid min-w-0 gap-3">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-[clamp(44px,6vw,72px)] leading-[0.9] font-bold">
                {f.id}
              </h1>
              <p className="text-muted mt-1 text-base">
                {f.tagline}
                {f.source === "sistemas" ? (
                  <span className="border-accent text-accent ml-2.5 inline-block rounded-full border px-2 py-0.5 align-[2px] font-mono text-[11px]">
                    SISTEMAS · vs {f.vs}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={auto.toggle} type="button">
                {auto.on ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {auto.on ? "Pause" : "Play phases"}
              </button>
              <Link
                className="btn btn-primary"
                params={{ formationId: f.id }}
                search={{ phase: index }}
                to="/present/$formationId"
              >
                <MonitorPlay className="size-4" />
                Present
              </Link>
            </div>
          </header>
          <Pitch
            arrows={phase.arrows}
            ball={phase.ball}
            opp={phase.opp}
            phaseKey={`${f.id}-${phase.id}`}
            players={phasePlayers(f, phase)}
          />
          <div className="card">
            <div className="flex justify-between">
              <span className="eyebrow">
                {phase.group}
                {phase.block ? ` · ${phase.block} block` : ""}
              </span>
              <span className="text-muted font-mono text-xs">
                {index + 1} / {count}
              </span>
            </div>
            <h2 className="font-display mt-0.5 mb-1 text-[28px] font-bold">
              {phase.title}
            </h2>
            <p className="max-w-[72ch]">{phase.text}</p>
            <Legend oppLabel={phase.oppLabel} />
          </div>
        </section>

        <aside className="md:sticky md:top-[72px]">
          <PhaseList f={f} index={index} />
        </aside>

        <section className="mt-2 grid items-start gap-4 md:col-span-2 md:grid-cols-2 lg:col-span-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="card md:col-span-2 lg:col-span-1">
            <h3>Each position's job</h3>
            <dl className="m-0 grid gap-2">
              {f.keys.map((k, i) => (
                <div className="grid grid-cols-[74px_1fr] gap-2.5" key={k}>
                  <dt className="flex items-center gap-1.5 text-[13px] font-bold">
                    <span className="bg-accent grid size-5 flex-none place-items-center rounded-full text-[11px] text-white">
                      {JERSEY[i]}
                    </span>
                    {k}
                  </dt>
                  <dd className="text-muted m-0 text-sm">{f.roles[k]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid min-w-0 gap-4">
            <BulletCard items={f.strengths} title="Strengths" tone="good" />
            <BulletCard
              items={f.weakSpots}
              title={
                f.source === "sistemas"
                  ? "Situations to avoid"
                  : "Weak spots to attack"
              }
              tone="bad"
            />
          </div>
          <div className="grid min-w-0 gap-4">
            {f.attack ? (
              <div className="card">
                <h3>{f.attack.title}</h3>
                {f.attack.items.map(([k, v]) => (
                  <Drill key={k} lines={[v]} title={k} />
                ))}
              </div>
            ) : null}
            <div className="card">
              <h3>
                {f.source === "sistemas"
                  ? "Training games for the four moments"
                  : "Training games"}
              </h3>
              {f.training.map((t) => (
                <Drill
                  key={t.name}
                  lines={[t.setup, `Aim: ${t.aim}`]}
                  title={t.name}
                />
              ))}
            </div>
          </div>
          <div className="card md:col-span-2 lg:col-span-3">
            <h3>Who starts in it</h3>
            <p className="text-muted">
              {starts.toLocaleString("en")} of{" "}
              {stats.meta.starts.toLocaleString("en")} starting line-ups in the
              StatsBomb open data. Top coaches by matches started in a {f.id}:
            </p>
            {users.length === 0 ? (
              <p className="text-muted">
                No coach in the data used it in 8 or more of their matches.
              </p>
            ) : (
              <ol className="mt-2 grid list-none [grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-x-7 gap-y-1.5 p-0">
                {users.slice(0, 10).map(([name, team, n, share]) => {
                  const key = shapes.get(name);
                  return (
                    <li
                      className="grid grid-cols-[minmax(0,1fr)_80px_40px_48px] items-center gap-2.5 text-sm"
                      key={`${name}-${team}`}
                    >
                      <span className="flex min-w-0 flex-col leading-tight">
                        {name}
                        <small className="text-muted text-xs">{team}</small>
                      </span>
                      <span className="bg-line h-1.5 overflow-hidden rounded">
                        <i
                          className="bg-accent block h-full"
                          style={{ width: `${Math.round(share * 100)}%` }}
                        />
                      </span>
                      <span className="text-right font-mono text-xs tabular-nums">
                        {n}×
                      </span>
                      {key ? (
                        <Link
                          className="text-accent text-xs font-semibold"
                          search={{ a: key }}
                          to="/coaches"
                        >
                          Shape
                        </Link>
                      ) : (
                        <span />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function BulletCard({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "good" | "bad";
}) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {items.map((s) => (
          <li className="relative pl-[18px] text-sm" key={s}>
            <span
              className={`absolute top-[0.55em] left-0 size-2 rounded-sm ${tone === "good" ? "bg-good" : "bg-bad"}`}
            />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Drill({ lines, title }: { lines: string[]; title: string }) {
  return (
    <div className="border-line grid gap-0.5 border-t py-2 text-sm first-of-type:border-t-0 first-of-type:pt-0">
      <strong>{title}</strong>
      {lines.map((l) => (
        <span className="text-muted [&:last-child]:text-ink" key={l}>
          {l}
        </span>
      ))}
    </div>
  );
}
