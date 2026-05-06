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

function cleanTeamName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}
function cleanTeamName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export async function saveTeamScore({
  course,
  teamName,
  topic,
  score,
}: ScorePayload) {
  const { error } = await supabase.rpc("save_leaderboard_score", {
    p_course: course,
    p_team_name: cleanTeamName(teamName),
    p_topic: topic,
    p_score: score,
  });

  if (error) {
    console.error("Leaderboard save failed:", {
      error,
      course,
      teamName,
      topic,
      score,
    });
    throw error;
  }
}

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

export async function loadLeaderboard(course: Course): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select(
      "course, team_name, bvm, mod_1, mod_2a_1, mod_2a_2, mod_2b, total_score"
    )
    .eq("course", course)
    .order("total_score", { ascending: false });

  if (error) throw error;

  return (data ?? []) as LeaderboardRow[];
}

export async function clearLeaderboard(course: Course) {
  const { error } = await supabase
    .from("leaderboard")
    .delete()
    .eq("course", course);

  if (error) throw error;
}