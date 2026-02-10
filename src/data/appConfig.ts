// src/data/appConfig.ts

/* =========================
   MODES (router param)
   ========================= */

export type TeamMode = "aos" | "aosx" | "summary";
export type SingleMode = "aosx" | "summary" | "fillblank"; 

export type AppMode = TeamMode

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
export type TopicId = "avm" | "bvm" | "mod2a1" | "mod2b" | "mod1" | "mod2a2";

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
  mod2a1: "MOD 2A",
  mod2b: "MOD 2B",
  mod1: "MOD 1",
  mod2a2: "BEACON POINTS"
};

/* =========================
   TEAM GAMES
   ========================= */

export type TeamGameId = "bingo" | "category" | "mixmatch" | "beaconpoints";

export type TeamGameMeta = {
  id: TeamGameId;
  title: string;

  topicsSource: { table: string; column: string };

  allowedTopicsByMode: Record<TeamMode, TopicId[]>;

  startLabel?: string;

  maxTeams?: number;
};

export const teamGames: Record<TeamGameId, TeamGameMeta> = {
  bingo: {
    id: "bingo",
    title: "Bingo",
    topicsSource: { table: "bingo_questions", column: "game_code" },
    allowedTopicsByMode: {
      aos: ["avm"],
      aosx: ["mod2a1"],
      summary: []
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
      summary: []
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
      summary: ["mod2b"]
    },
    startLabel: "Start",
    maxTeams: 1
  },

  beaconpoints: {
    id: "beaconpoints",
    title: "Beacon Points",
    topicsSource: { table: "beaconpoints", column: "game_code" },
    allowedTopicsByMode: {
      aos: [],
      aosx: ["mod2a2"],
      summary: []
    },
    startLabel: "Start",
    maxTeams: 1
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

export type SinglePlayerGameId = "crossword" | "fillblank";

export type SinglePlayerGameMeta = {
  id: SinglePlayerGameId;
  mode: SingleMode; // "aosx" or "summary"

  title: string;
  subtitle?: string;
  bullets: string[];
  tip?: string;
  startLabel?: string;
};

export const singlePlayerGames: Record<SinglePlayerGameId, SinglePlayerGameMeta> = {
  crossword: {
    id: "crossword",
    mode: "summary",
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

  fillblank: {
    id: "fillblank",
    mode: "summary",
    title: "Fill in the Blanks",
    subtitle: "Instructions",
    bullets: [
      "Fill the blanks by typing keywords into highlighted squares.",
      "Black squares are blocked and cannot be typed into.",
      "Keywords can be found in the passage provided",
      "Fill in all blanks before submitting",
      "After submitting, click on retry wrong to edit wrong answers.",
      "May the fastest traineee win!",
    ],
    tip: "Tip: Fill in all blanks before submitting.",
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
  return m === "aos" || m === "aosx" || m === "summary";
}
export function isSingleMode(m: any): m is SingleMode {
  return m === "aosx" || m === "summary";
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

summary:
- ACVITIY 1
- ACVITIY 2
- ACVITIY 3*/

export type NavItem =
  | { type: "link"; label: string; to: string }
  | { type: "group"; label: string; items: { label: string; to: string }[] };

export const APP_NAV: NavItem[] = [
  { type: "link", label: "Home", to: "/home" },

  {
    type: "group",
    label: "AOS",
    items: [
      { label: "BVM", to: tgLobbyPath("aos", "category") },
      { label: "AVM", to: tgLobbyPath("aos", "bingo") },
    ],
  },

  {
    type: "group",
    label: "AOSX",
    items: [
      { label: "Mod 1", to: tgLobbyPath("aosx", "category") },
      { label: "Mod 2A.1", to: tgLobbyPath("aosx", "bingo") },
      { label: "Mod 2A.2", to: tgLobbyPath("aosx", "beaconpoints") },
      { label: "Mod 2B", to: tgLobbyPath("aosx", "mixmatch") },
    ],
  },

  {
    type: "group",
    label: "Summary",
    items: [
      { label: "Activity 1", to: spStartPath("summary", "crossword") },
      { label: "Activity 2", to: tgLobbyPath("summary", "mixmatch") },
      { label: "Activity 3", to: spStartPath("summary", "fillblank") },
    ],
  },
];

