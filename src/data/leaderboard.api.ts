// src/data/leaderboard.api.ts
import { supabase } from "../lib/supabase";

export type Course = "aos" | "aosx";
export type Topic = "bvm" | "mod_1" | "mod_2a_1" | "mod_2a_2" | "mod_2b";

export type LeaderboardRow = {
  course: Course;
  team_name: string;
  bvm: number;
  mod_1: number;
  mod_2a_1: number;
  mod_2a_2: number;
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

function computeTotal(
  course: Course,
  base: Omit<LeaderboardRow, "course" | "team_name" | "total_score">
) {
  if (course === "aos") {
    // AOS 
    return base.bvm;
  }
  // AOSX 
  return base.mod_1 + base.mod_2a_1 + base.mod_2a_2 + base.mod_2b;
}

function blankBase() {
  return {
    bvm: 0,
    mod_1: 0,
    mod_2a_1: 0,
    mod_2a_2: 0,
    mod_2b: 0,
  };
}

/* =====================================================
   SAVE / UPDATE ONE TEAM SCORE (PATCH ONLY ONE COLUMN)
   - Does NOT overwrite the entire row.
   - Preserves all other topic scores already saved.
   ===================================================== */

export async function saveTeamScore({ course, teamName, topic, score }: ScorePayload) {

  // 1) Read existing row (if any)
  const { data: existing, error: readErr } = await supabase
    .from("leaderboard")
    .select("course, team_name, bvm, mod_1, mod_2a_1, mod_2a_2, mod_2b, total_score")
    .eq("course", course)
    .eq("team_name", teamName)
    .maybeSingle();

  if (readErr) throw readErr;

  // 2) Build base using existing values (or blank)
  const base = existing
    ? {
        bvm: existing.bvm ?? 0,
        mod_1: existing.mod_1 ?? 0,
        mod_2a_1: existing.mod_2a_1 ?? 0,
        mod_2a_2: existing.mod_2a_2 ?? 0,
        mod_2b: existing.mod_2b ?? 0,
      }
    : blankBase();

  // 3) Patch ONLY the topic column that belongs to this game/topic
  base[topic] = score;

  // enforce "course rules": zero out topics not belonging to that course
  if (course === "aos") {
    base.mod_1 = 0;
    base.mod_2a_1 = 0;
    base.mod_2a_2 = 0;
    base.mod_2b = 0;
  } else {
    base.bvm = 0;
  }

  // 4) Compute total_score
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
   ===================================================== */

export async function saveAllTeams(
  course: Course,
  topic: Topic,
  teams: { name: string; score: number }[]
) {
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
    .select("course, team_name, bvm, mod_1, mod_2a_1, mod_2a_2, mod_2b, total_score")
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
