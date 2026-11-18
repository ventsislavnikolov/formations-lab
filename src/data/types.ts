/** Pitch point: x 0..100 from own goal line to the opponent's, y 0..100 from our left touchline to our right. */
export type Pt = readonly [number, number];
export type ArrowType = "pass" | "run" | "press";
/** A player key ("RCB"), an opponent key ("o:CBb") or a raw point. */
export type Ref = string | Pt;
export type Block = "high" | "mid" | "low";
export type Opponent = "4-1-4-1" | "3-5-2";

export interface PhaseSpec {
  arrows?: [Ref, Ref, ArrowType][];
  ball?: Ref;
  block?: Block;
  group: string;
  id: string;
  pos?: Record<string, Pt>;
  text: string;
  title: string;
}

export interface TrainingGame {
  aim: string;
  name: string;
  setup: string;
}

export interface FormationSpec {
  attack?: { items: [string, string][]; title: string };
  family: string;
  id: string;
  phases: PhaseSpec[];
  roles: Record<string, string>;
  source?: "sistemas";
  strengths: string[];
  summary: string;
  tagline: string;
  training: TrainingGame[];
  vs?: Opponent;
  weakSpots: string[];
}

export interface Arrow {
  from: Pt;
  to: Pt;
  type: ArrowType;
}

export interface Phase {
  arrows: Arrow[];
  ball: Pt | null;
  block?: Block;
  group: string;
  id: string;
  opp: Pt[] | null;
  oppLabel: string | null;
  positions: Pt[];
  text: string;
  title: string;
}

export interface Formation extends Omit<FormationSpec, "phases"> {
  keys: string[];
  phases: Phase[];
}
