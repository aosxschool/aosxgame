// src/data/leaderboard.api.ts
import { supabase } from "../lib/supabase";

export type Course = "aos" | "aosx";
export type Topic = "avm" | "bvm" | "mod_1" | "mod_2a" | "mod_2b";

export type LeaderboardRow = {
  course: Course;
  team_name: string;
  avm: number;
  bvm: number;
  mod_1: number;
  mod_2a: number;
  mod_2b: number;
  total_score: number;
};

type ScorePayload = {
  course: Course;
  teamName: string;
  topic: Topic;
  score: number;
};

/* =====================================================
   INTERNAL HELPERS
   ===================================================== */

function computeTotal(course: Course, base: Omit<LeaderboardRow, "course" | "team_name" | "total_score">) {
  if (course === "aos") {
    // only AVM + BVM count
    return base.avm + base.bvm
  }
  // aosx: only mod_1 + mod_2a + mod_2b count
  return base.mod_1 + base.mod_2a + base.mod_2b
}

function blankBase() {
  return {
    avm: 0,
    bvm: 0,
    mod_1: 0,
    mod_2a: 0,
    mod_2b: 0,
  };
}

/* =====================================================
   SAVE / UPDATE ONE TEAM SCORE (PATCH ONLY ONE COLUMN)
   - Does NOT overwrite the entire row.
   - Preserves all other topic scores already saved.
   ===================================================== */

export async function saveTeamScore({
  course,
  teamName,
  topic,
  score,
}: ScorePayload) {
  // 1) Read existing row (if any)
  const { data: existing, error: readErr } = await supabase
    .from("leaderboard")
    .select("course, team_name, avm, bvm, mod_1, mod_2a, mod_2b, total_score")
    .eq("course", course)
    .eq("team_name", teamName)
    .maybeSingle();

  if (readErr) throw readErr;

  // 2) Build base using existing values (or blank)
  const base = existing
    ? {
        avm: existing.avm ?? 0,
        bvm: existing.bvm ?? 0,
        mod_1: existing.mod_1 ?? 0,
        mod_2a: existing.mod_2a ?? 0,
        mod_2b: existing.mod_2b ?? 0,
      }
    : blankBase();

  // 3) Patch ONLY the topic column that belongs to this game/topic
  base[topic] = score;

  // 4) Compute total_score (weighted by course)
  const total_score = computeTotal(course, base);

  // 5) Update existing row or insert new row
  if (existing) {
    const { error: updErr } = await supabase
      .from("leaderboard")
      .update({
        ...base,
        total_score,
      })
      .eq("course", course)
      .eq("team_name", teamName);

    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await supabase.from("leaderboard").insert({
      course,
      team_name: teamName,
      ...base,
      total_score,
    });

    if (insErr) throw insErr;
  }
}

/* =====================================================
   SAVE / UPDATE MANY TEAMS (CALL AFTER GAME ENDS)
   - Calls saveTeamScore for each team.
   - Preserves other columns.
   ===================================================== */

export async function saveAllTeams(
  course: Course,
  topic: Topic,
  teams: { name: string; score: number }[]
) {
  // sequential is simplest and safe (few teams)
  for (const t of teams) {
    await saveTeamScore({
      course,
      teamName: t.name,
      topic,
      score: t.score,
    });
  }
}

/* =====================================================
   LOAD LEADERBOARD
   ===================================================== */

export async function loadLeaderboard(course: Course): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("course, team_name, avm, bvm, mod_1, mod_2a, mod_2b, total_score")
    .eq("course", course)
    .order("total_score", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

/* =====================================================
   CLEAR ALL (by course)
   ===================================================== */

export async function clearLeaderboard(course: Course) {
  const { error } = await supabase.from("leaderboard").delete().eq("course", course);
  if (error) throw error;
}
