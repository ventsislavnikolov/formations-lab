import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Pause,
  Play,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { phasePlayers } from "#/components/formation-bits";
import { Legend, Pitch } from "#/components/pitch";
import { formationIds, formations, getFormation } from "#/lib/formations";
import { useAutoplay } from "#/lib/use-autoplay";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/present/$formationId")({
  component: PresentPage,
  head: ({ params }) => ({
    meta: [{ title: `Presenting ${params.formationId} · Formations Lab` }],
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

interface KeyHandlers {
  exit: () => void;
  next: () => void;
  prev: () => void;
  stepFormation: (d: number) => void;
  toggle: () => void;
}

function keyAction(key: string, h: KeyHandlers): (() => void) | null {
  switch (key) {
    case " ":
      return h.toggle;
    case "ArrowRight":
    case "PageDown":
      return h.next;
    case "ArrowLeft":
    case "PageUp":
      return h.prev;
    case "ArrowDown":
      return () => h.stepFormation(1);
    case "ArrowUp":
      return () => h.stepFormation(-1);
    case "Escape":
      return h.exit;
    default:
      return null;
  }
}

function PresentPage() {
  const { formationId } = Route.useParams();
  const { phase: rawIndex } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const root = useRef<HTMLDivElement>(null);
  const f = getFormation(formationId) ?? formations[0];
  const count = f?.phases.length ?? 1;
  const index = Math.min(rawIndex, count - 1);

  const show = useCallback(
    (id: string, step: number) =>
      navigate({
        params: { formationId: id },
        replace: true,
        search: { phase: step },
        to: "/present/$formationId",
      }),
    [navigate]
  );
  const go = useCallback(
    (i: number) => show(formationId, i),
    [show, formationId]
  );
  const stepFormation = useCallback(
    (d: number, toEnd = false) => {
      const i =
        (formationIds.indexOf(formationId) + d + formationIds.length) %
        formationIds.length;
      const target = formations[i];
      if (target) {
        show(target.id, toEnd ? target.phases.length - 1 : 0);
      }
    },
    [formationId, show]
  );
  const next = useCallback(
    () => (index < count - 1 ? go(index + 1) : stepFormation(1)),
    [index, count, go, stepFormation]
  );
  const prev = useCallback(
    () => (index > 0 ? go(index - 1) : stepFormation(-1, true)),
    [index, go, stepFormation]
  );
  const auto = useAutoplay(count, index, go, 5200);
  const exit = useCallback(
    () =>
      navigate({
        params: { formationId },
        search: { phase: index },
        to: "/formations/$formationId",
      }),
    [navigate, formationId, index]
  );

  useEffect(() => {
    root.current?.focus();
  }, []);
  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      root.current?.requestFullscreen().catch(() => undefined);
    }
  }, []);
  const onFormation = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => show(e.target.value, 0),
    [show]
  );
  const onDot = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) =>
      go(Number(e.currentTarget.value)),
    [go]
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = keyAction(e.key, {
        exit,
        next,
        prev,
        stepFormation,
        toggle: auto.toggle,
      });
      if (action && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auto.toggle, next, prev, stepFormation, exit]);

  if (!f) {
    return null;
  }
  const phase = f.phases[index] ?? f.phases[0];
  if (!phase) {
    return null;
  }
  const ghost = "btn border-white/25 bg-transparent text-inherit";

  return (
    <div
      aria-label="Presentation"
      className="dark fixed inset-0 grid grid-rows-[auto_1fr_auto] gap-3 bg-[#0a1119] p-5 text-[#eef3f8] outline-none"
      ref={root}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="font-display text-[44px] leading-none font-bold">
            {f.id}
          </span>
          <span className="text-[#9fb0c2]">{f.tagline}</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <select
            aria-label="Formation"
            className="rounded-lg border border-[#2b3a4b] bg-[#15202c] px-2.5 py-2"
            id="present-formation"
            onChange={onFormation}
            value={f.id}
          >
            {formationIds.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button className={ghost} onClick={auto.toggle} type="button">
            {auto.on ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
            {auto.on ? "Pause" : "Autoplay"}
          </button>
          <button className={ghost} onClick={fullscreen} type="button">
            <Maximize className="size-4" />
            Full screen
          </button>
          <Link
            className={ghost}
            params={{ formationId: f.id }}
            search={{ phase: index }}
            to="/formations/$formationId"
          >
            <X className="size-4" />
            Exit
          </Link>
        </div>
      </div>

      <div className="grid min-h-0 content-start items-center gap-7 overflow-y-auto md:grid-cols-[minmax(0,1fr)_340px] md:content-center md:overflow-visible">
        <Pitch
          arrows={phase.arrows}
          ball={phase.ball}
          className="md:[&_svg]:mx-auto md:[&_svg]:max-h-[calc(100dvh-190px)] md:[&_svg]:w-auto md:[&_svg]:max-w-full"
          opp={phase.opp}
          phaseKey={`${f.id}-${phase.id}`}
          players={phasePlayers(f, phase)}
        />
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 10 }}
            key={`${f.id}-${phase.id}`}
            transition={{ duration: 0.35 }}
          >
            <div className="eyebrow text-[#9fb0c2]">
              {phase.group}
              {phase.block ? ` · ${phase.block} block` : ""}
            </div>
            <h2 className="font-display mt-1.5 mb-2.5 text-[clamp(30px,3vw,44px)] leading-[1.02] font-bold">
              {phase.title}
            </h2>
            <p className="text-base leading-relaxed text-[#cfd8e2] md:text-lg">
              {phase.text}
            </p>
            <Legend oppLabel={phase.oppLabel} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          aria-label="Previous"
          className={ghost}
          onClick={prev}
          type="button"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex gap-2">
          {f.phases.map((p, i) => (
            <button
              aria-label={p.title}
              className={cn(
                "size-2.5 rounded-full bg-[#34465a] transition",
                i === index && "bg-ball scale-125"
              )}
              key={p.id}
              onClick={onDot}
              type="button"
              value={i}
            />
          ))}
        </div>
        <button
          aria-label="Next"
          className={ghost}
          onClick={next}
          type="button"
        >
          <ChevronRight className="size-4" />
        </button>
        <span className="ml-4 hidden text-xs text-[#6f8195] md:inline">
          ← → phases · ↑ ↓ formations · space autoplay · esc exit
        </span>
      </div>
    </div>
  );
}
