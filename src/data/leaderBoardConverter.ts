// src/data/leaderBoardConverter.ts
export type Course = "aos" | "aosx";
export type Topic = "bvm" | "mod_1" | "mod_2a_1" | "mod_2a_2" | "mod_2b";

/**
 * Converts router params → leaderboard fields
 *
 * examples:
 * ("aos", "bvm")     -> { course:"aos", topic:"bvm" }
 * ("aosx","mod2a")   -> { course:"aosx", topic:"mod_2a" }
 * ("aosx","mod 1")   -> { course:"aosx", topic:"mod_1" }
 */
export function toLeaderboardFields(
  mode: string,
  topicCode: string
): { course: Course; topic: Topic } {
  const m = mode.trim().toLowerCase();
  const t = topicCode.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "");

  let course: Course;
  if (m === "aos") course = "aos";
  else if (m === "aosx") course = "aosx";
  else throw new Error(`Unknown mode: ${mode}`);

  // ✅ topic mapping
  if (t === "bvm") return { course, topic: "bvm" };
  if (t === "mod1") return { course, topic: "mod_1" };
  if (t === "mod2a1") return { course, topic: "mod_2a_1" };
  if (t === "mod2a2") return { course, topic: "mod_2a_2" };
  if (t === "mod2b") return { course, topic: "mod_2b" };


  throw new Error(`Unknown topicCode: ${topicCode}`);
}
