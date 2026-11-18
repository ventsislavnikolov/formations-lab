// Typed access to the StatsBomb open-data aggregate built by scripts/data.
import raw from "#/data/statsbomb.json";

export type Count = [string, number];
/** StatsBomb position id → [x 0..120, y 0..80, events]. */
export type ShapeMap = Record<string, [number, number, number]>;

export interface CoachShape {
  display: string;
  formation: string;
  inPossession: ShapeMap;
  manager: string;
  matches: {
    comp: string;
    date: string;
    ga: number;
    gf: number;
    id: number;
    season: string;
  }[];
  outOfPossession: ShapeMap;
  shapeMatches: number;
  stats: Record<MetricKey, number>;
  team: string;
}

export interface Coach {
  competitions: string[];
  country: string | null;
  display: string;
  formations: Count[];
  matches: number;
  name: string;
  nCompetitions: number;
  record: [number, number, number];
  teams: string[];
}

export type MetricKey =
  | "poss"
  | "ppda"
  | "press_x"
  | "press_hi"
  | "def_x"
  | "plen"
  | "fwd";

interface StatsData {
  byEra: Record<string, Count[]>;
  byGender: Record<"men" | "women", Count[]>;
  coaches: Coach[];
  formations: Count[];
  meta: {
    coaches: number;
    compList: Count[];
    competitions: number;
    matches: number;
    seasons: number;
    shapeMatches: number;
    starts: number;
  };
  shapes: CoachShape[];
  /** formation → [coach, team, matches, share of that coach's matches] */
  topCoaches: Record<string, [string, string, number, number][]>;
}

export const stats = raw as unknown as StatsData;

export const SB_POSITION: Record<string, string> = {
  "1": "GK",
  "2": "RB",
  "3": "RCB",
  "4": "CB",
  "5": "LCB",
  "6": "LB",
  "7": "RWB",
  "8": "LWB",
  "9": "RDM",
  "10": "DM",
  "11": "LDM",
  "12": "RM",
  "13": "RCM",
  "14": "CM",
  "15": "LCM",
  "16": "LM",
  "17": "RW",
  "18": "RAM",
  "19": "CAM",
  "20": "LAM",
  "21": "LW",
  "22": "RCF",
  "23": "ST",
  "24": "LCF",
  "25": "SS",
};

export const METRICS: {
  help: string;
  key: MetricKey;
  label: string;
  range: [number, number];
  format: (v: number) => string;
}[] = [
  {
    format: (v) => `${Math.round(v * 100)}%`,
    help: "Share of time on the ball.",
    key: "poss",
    label: "Possession",
    range: [0.3, 0.8],
  },
  {
    format: (v) => v.toFixed(1),
    help: "Opponent passes per defensive action in their 60%. Lower means a more intense press.",
    key: "ppda",
    label: "PPDA",
    range: [20, 5],
  },
  {
    format: (v) => `${Math.round((v / 120) * 105)} m`,
    help: "Average distance from own goal of pressures.",
    key: "press_x",
    label: "Press height",
    range: [40, 70],
  },
  {
    format: (v) => `${Math.round(v * 100)}%`,
    help: "Share of pressures in the attacking third.",
    key: "press_hi",
    label: "Pressures in final third",
    range: [0.05, 0.4],
  },
  {
    format: (v) => `${Math.round((v / 120) * 105)} m`,
    help: "Average distance from own goal of all defensive actions.",
    key: "def_x",
    label: "Defensive action height",
    range: [35, 65],
  },
  {
    format: (v) => `${Math.round(v * 0.9144)} m`,
    help: "Shorter means more combination play.",
    key: "plen",
    label: "Average pass length",
    range: [16, 26],
  },
  {
    format: (v) => `${Math.round(v * 100)}%`,
    help: "Share of passes that gain 10+ yards.",
    key: "fwd",
    label: "Forward passes",
    range: [0.2, 0.4],
  },
];

export function metricScale(v: number, [a, b]: [number, number]): number {
  return Math.max(0.03, Math.min(1, (v - a) / (b - a)));
}

export function shapeKey(s: CoachShape): string {
  return `${s.display.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}-${s.formation}`;
}
