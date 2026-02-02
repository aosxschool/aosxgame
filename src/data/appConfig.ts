// src/data/appConfig.ts

/* =========================
   MODES (router param)
   ========================= */

export type TeamMode = "aos" | "aosx";
export type SingleMode = "aosx" | "wfe"; // aosx has single-player too, wfe is single-player

export type AppMode = TeamMode | "wfe"; // "aos" | "aosx" | "wfe"

/* =========================
   TOPICS (Supabase questions.game_code)
   ========================= */

/**
 * IMPORTANT:
 * Normalize Supabase codes to these IDs.
 * - "MOD 2A" -> "mod2a"
 * - "mod_2a" -> "mod2a"
 * - "mod2a"  -> "mod2a"
 */
export type TopicId = "avm" | "bvm" | "mod2a" | "mod2b" | "mod1" ;

export function normTopic(code: string) {
  return code
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")   // remove spaces
    .replace(/_/g, "");    // remove underscores
}

export const TOPIC_LABELS: Record<TopicId, string> = {
  avm: "AVM",
  bvm: "BVM",
  mod2a: "MOD 2A",
  mod2b: "MOD 2B",
  mod1: "MOD 1",
};

/* =========================
   TEAM GAMES
   ========================= */

export type TeamGameId = "bingo" | "category" | "mixmatch";

export type TeamGameMeta = {
  id: TeamGameId;
  title: string;

  topicsSource: { table: string; column: string };

  /**
   * ✅ REQUIRED:
   * Allowed topic list depends on BOTH mode and team-game.
   */
  allowedTopicsByMode: Record<TeamMode, TopicId[]>;

  startLabel?: string;
};

export const teamGames: Record<TeamGameId, TeamGameMeta> = {
  bingo: {
    id: "bingo",
    title: "Bingo",
    topicsSource: { table: "bingo_questions", column: "game_code" },
    allowedTopicsByMode: {
      aos: ["avm"],
      aosx: ["mod2a"],
    },
    startLabel: "Start",
  },

  category: {
    id: "category",
    title: "Category",
    topicsSource: { table: "category_questions", column: "game_code" },
    allowedTopicsByMode: {
      aos: ["bvm"],
      aosx: ["mod1"],
    },
    startLabel: "Start",
  },

  mixmatch: {
    id: "mixmatch",
    title: "Mix Match",
    topicsSource: { table: "mixmatch_tiles", column: "game_code" },
    allowedTopicsByMode: {
      aos: [],
      aosx: ["mod2b"],
    },
    startLabel: "Start",
  },
};

/** ✅ Team-game route helpers */
export function tgLobbyPath(mode: TeamMode, gameId: TeamGameId) {
  return `/${mode}/${gameId}/lobby`;
}
export function tgPlayPath(mode: TeamMode, gameId: TeamGameId) {
  return `/${mode}/${gameId}/play`;
}

/* =========================
   SINGLE-PLAYER GAMES
   ========================= */

export type SinglePlayerGameId = "beaconpoints" | "crossword";

export type SinglePlayerGameMeta = {
  id: SinglePlayerGameId;
  mode: SingleMode; // "aosx" or "wfe"

  title: string;
  subtitle?: string;
  bullets: string[];
  tip?: string;
  startLabel?: string;
};

export const singlePlayerGames: Record<SinglePlayerGameId, SinglePlayerGameMeta> = {
  beaconpoints: {
    id: "beaconpoints",
    mode: "aosx",
    title: "Beacon Points",
    subtitle: "Instructions",
    bullets: [
      "Drag and drop the repective locations into their respective blanks",
      "Replace tiles when necessary",
      "Submit only when all required inputs are filled.",
    ],
    tip: "Tip: Take your time to review before submitting.",
    startLabel: "Begin",
  },

  crossword: {
    id: "crossword",
    mode: "wfe",
    title: "Crossword",
    subtitle: "Instructions",
    bullets: [
      "Fill the crossword by typing letters into white squares.",
      "Black squares are blocked and cannot be typed into.",
      "Use Arrow Keys to move around the grid.",
      "Press Tab to toggle direction (Across / Down).",
      "Backspace clears a letter (press again to move back).",
      "Fill all blanks before you can submit.",
    ],
    tip: "Tip: Click a square to focus it. Clicking the same square toggles direction.",
    startLabel: "Begin",
  },
};

export function spStartPath(mode: SingleMode, gameId: SinglePlayerGameId) {
  return `/${mode}/${gameId}/start`;
}
export function spPlayPath(mode: SingleMode, gameId: SinglePlayerGameId) {
  return `/${mode}/${gameId}/play`;
}

/* =========================
   TYPE GUARDS (very useful in dispatchers)
   ========================= */

export function isTeamMode(m: any): m is TeamMode {
  return m === "aos" || m === "aosx";
}
export function isSingleMode(m: any): m is SingleMode {
  return m === "aosx" || m === "wfe";
}
export function isSinglePlayerGameId(x: string): x is SinglePlayerGameId {
  return Object.prototype.hasOwnProperty.call(singlePlayerGames, x);
}

export function isTeamGameId(x: string): x is TeamGameId {
  return Object.prototype.hasOwnProperty.call(teamGames, x);
}

/* =========================
   NAV (dynamic, matches your spec)
   ========================= */

/*NAV SETTINGS

AOS:
- AOS BVM (Category)
- AOS AVM (Bingo)

AOSX: 
- AOSX Mod 1 (Category)
- AOSX Mod 2A.1 (Bingo)
- AOSX Mod 2A.2 (Beacon Points)
- AOSX Mod 2B (Physical Bingo Board)

WFE:
- WFE 1
- WFE 2*/

export type NavItem =
  | { type: "link"; label: string; to: string }
  | { type: "group"; label: string; items: { label: string; to: string }[] };

export const APP_NAV: NavItem[] = [
  { type: "link", label: "Home", to: "/home" },

  {
    type: "group",
    label: "AOS",
    items: [
      { label: "AVM", to: tgLobbyPath("aos", "bingo") },
      { label: "BVM", to: tgLobbyPath("aos", "category") },
    ],
  },

  {
    type: "group",
    label: "AOSX",
    items: [
      { label: "Mod 1", to: tgLobbyPath("aosx", "category") },
      { label: "Mod 2A.1", to: tgLobbyPath("aosx", "bingo") },
      { label: "Mod 2A.2", to: spStartPath("aosx", "beaconpoints") },
      
    ],
  },

  {
    type: "group",
    label: "WFE",
    items: [
      { label: "WFE 1", to: spStartPath("wfe", "crossword") },
      { label: "WFE 2", to: tgLobbyPath("aosx", "mixmatch") },
    ],
  },
];

