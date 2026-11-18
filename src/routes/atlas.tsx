import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "#/components/app-shell";
import { formationIds } from "#/lib/formations";
import { type Count, stats } from "#/lib/stats";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/atlas")({
  component: AtlasPage,
  head: () => ({ meta: [{ title: "Atlas · Formations Lab" }] }),
});

const total = (rows: Count[]) => rows.reduce((a, r) => a + r[1], 0);

function Bars({ max = 12, rows }: { max?: number; rows: Count[] }) {
  const sum = total(rows);
  const top = rows.slice(0, max);
  const peak = top[0]?.[1] ?? 1;
  return (
    <div className="grid gap-1.5">
      {top.map(([k, n]) => (
        <div
          className="grid grid-cols-[74px_1fr_48px] items-center gap-2.5 text-[13px]"
          key={k}
        >
          <span className="font-mono text-xs">{k}</span>
          <span className="bg-line h-2.5 overflow-hidden rounded-sm">
            <i
              className={cn(
                "block h-full rounded-sm",
                formationIds.includes(k) ? "bg-accent" : "bg-muted"
              )}
              style={{ width: `${(n / peak) * 100}%` }}
            />
          </span>
          <span className="text-right font-mono text-xs tabular-nums">
            {((n / sum) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function AtlasPage() {
  const { meta } = stats;
  const eras = ["2000-2014", "2015-2019", "2020+"];
  const flex = stats.coaches
    .filter((c) => c.matches >= 20)
    .map((c) => ({ ...c, top: (c.formations[0]?.[1] ?? 0) / c.matches }))
    .sort((a, b) => a.top - b.top);
  return (
    <AppShell>
      <div className="grid gap-4 pt-5">
        <div>
          <h1 className="font-display text-[clamp(40px,5vw,60px)] leading-[0.95] font-bold">
            Formation atlas
          </h1>
          <p className="text-muted max-w-[80ch]">
            Starting formations from every match in the StatsBomb open data:{" "}
            {meta.matches.toLocaleString("en")} matches,{" "}
            {meta.starts.toLocaleString("en")} line-ups, {meta.coaches} coaches,{" "}
            {meta.seasons} competition seasons. Coverage is uneven: complete
            seasons exist for the 2015/16 top five leagues and several women's
            leagues, while Barcelona dominates the older La Liga and Champions
            League matches. Blue bars are formations with an animated page.
          </p>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3>All starts</h3>
            <Bars rows={stats.formations} />
          </div>
          <div className="card">
            <h3>Men's competitions</h3>
            <Bars max={8} rows={stats.byGender.men} />
            <h3 className="mt-4">Women's competitions</h3>
            <Bars max={8} rows={stats.byGender.women} />
          </div>
          <div className="card">
            {eras.map((e) => {
              const rows = stats.byEra[e];
              return rows ? (
                <div className="mb-3" key={e}>
                  <h3>
                    {e} · {total(rows).toLocaleString("en")} starts
                  </h3>
                  <Bars max={5} rows={rows} />
                </div>
              ) : null;
            })}
          </div>
          <div className="card md:col-span-2 lg:col-span-3">
            <h3>Most and least flexible coaches</h3>
            <p className="text-muted">
              Share of matches in each coach's most used formation (coaches with
              20+ matches in the data).
            </p>
            <div className="grid gap-7 md:grid-cols-2">
              {(
                [
                  ["Most flexible", flex.slice(0, 8)],
                  ["Most loyal", flex.slice(-8).reverse()],
                ] as const
              ).map(([title, list]) => (
                <div key={title}>
                  <div className="eyebrow">{title}</div>
                  <ol className="mt-2 grid list-none gap-2 p-0">
                    {list.map((c) => (
                      <li
                        className="flex items-center justify-between gap-3"
                        key={c.name}
                      >
                        <span className="flex min-w-0 flex-col leading-tight">
                          {c.display}
                          <small className="text-muted text-xs">
                            {c.teams[0]}
                          </small>
                        </span>
                        <span className="flex flex-wrap justify-end gap-1">
                          {c.formations.slice(0, 3).map(([fm, n]) => {
                            const label = `${fm} ${Math.round((n / c.matches) * 100)}%`;
                            const chip =
                              "rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[11px]";
                            return formationIds.includes(fm) ? (
                              <Link
                                className={cn(
                                  chip,
                                  "hover:border-accent hover:text-accent"
                                )}
                                key={fm}
                                params={{ formationId: fm }}
                                search={{ phase: 0 }}
                                to="/formations/$formationId"
                              >
                                {label}
                              </Link>
                            ) : (
                              <span className={cn(chip, "opacity-60")} key={fm}>
                                {label}
                              </span>
                            );
                          })}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
          <div className="card md:col-span-2 lg:col-span-3">
            <h3>Competitions in the data</h3>
            <p className="flex flex-wrap gap-1">
              {meta.compList.map(([c, n]) => (
                <span
                  className="border-line bg-bg rounded-full border px-2 py-0.5 font-mono text-[11px]"
                  key={c}
                >
                  {c} · {n}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
