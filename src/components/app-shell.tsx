import { Link, useRouterState } from "@tanstack/react-router";
import { MonitorPlay, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "#/lib/utils";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(document.documentElement.classList.contains("dark")),
    []
  );
  const flip = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("formations-lab:theme", next ? "dark" : "light");
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    setDark(next);
  }, []);
  return (
    <button
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      className="border-line bg-surface hover:border-accent grid size-9 place-items-center rounded-lg border"
      onClick={flip}
      type="button"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

const tab = "rounded-md px-3 py-1.5 font-semibold text-muted hover:text-ink";
const tabOn = "bg-surface text-ink shadow-[inset_0_-2px_0_var(--accent)]";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = path.startsWith("/formations/")
    ? decodeURIComponent(path.split("/")[2] ?? "4-3-3")
    : "4-3-3";
  return (
    <div className="mx-auto min-h-dvh max-w-[1480px] px-4 pb-6">
      <header className="border-line bg-bg sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b py-3">
        <Link
          className="flex items-center gap-2"
          params={{ formationId: "4-3-3" }}
          to="/formations/$formationId"
        >
          <svg
            aria-hidden="true"
            className="stroke-accent size-6 fill-none stroke-[1.8]"
            viewBox="0 0 24 24"
          >
            <rect height={16} rx={2} width={20} x={2} y={4} />
            <line x1={12} x2={12} y1={4} y2={20} />
            <circle cx={12} cy={12} r={3} />
          </svg>
          <span className="font-display text-2xl font-bold uppercase">
            Formations Lab
          </span>
        </Link>
        <nav className="order-3 flex w-full gap-1 sm:order-none sm:ml-2 sm:w-auto">
          <Link
            activeOptions={{ includeSearch: false }}
            activeProps={{ className: tabOn }}
            className={tab}
            params={{ formationId: current }}
            to="/formations/$formationId"
          >
            Formations
          </Link>
          <Link
            activeProps={{ className: tabOn }}
            className={tab}
            to="/coaches"
          >
            Coaches
          </Link>
          <Link activeProps={{ className: tabOn }} className={tab} to="/atlas">
            Atlas
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            className={cn(
              "bg-accent text-accent-ink inline-flex items-center gap-2 rounded-lg px-3.5 py-2 font-semibold"
            )}
            params={{ formationId: current }}
            search={{ phase: 0 }}
            to="/present/$formationId"
          >
            <MonitorPlay className="size-4" />
            Present
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-line text-muted mt-8 max-w-[110ch] border-t pt-4 text-xs">
        Data: StatsBomb open data (starting formations from every released
        match; average shapes from up to 6 recent matches per coach and
        formation). Tactical content for 3-5-2, 4-1-4-1, 3-4-3 and 4-4-2 comes
        from Álvaro Tato Estepa's SISTEMAS (@AlvaroTato2), shown against the
        same opponents as the document. Positions on the pitch are our reading
        of his descriptions. The 4-3-3, 4-2-3-1, 3-4-2-1 and diamond follow the
        same structure but are not from the document.
      </footer>
    </div>
  );
}
