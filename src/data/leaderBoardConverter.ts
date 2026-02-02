export type Course = "aos" | "aosx";
export type Topic = "avm" | "bvm" | "mod_1" | "mod_2a" | "mod_2b";

/**
 * Converts router params → leaderboard fields
 *
 * examples:
 * ("aos", "avm")     -> { course:"aos", topic:"avm" }
 * ("aosx","mod2a")   -> { course:"aosx", topic:"mod_2a" }
 * ("aosx","mod 1")   -> { course:"aosx", topic:"mod_1" }
 */
export function toLeaderboardFields(
  mode: string,
  topicCode: string
): { course: Course; topic: Topic } {
  const m = mode.trim().toLowerCase();
  const t = topicCode.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "");

  // ---------- course ----------
  let course: Course;
  if (m === "aos") course = "aos";
  else if (m === "aosx") course = "aosx";
  else throw new Error(`Unknown mode: ${mode}`);

  // ---------- topic ----------
  if (t === "avm") return { course, topic: "avm" };
  if (t === "bvm") return { course, topic: "bvm" };
  if (t === "mod1") return { course, topic: "mod_1" };
  if (t === "mod2a") return { course, topic: "mod_2a" };
  if (t === "mod2b") return { course, topic: "mod_2b" };

  throw new Error(`Unknown topicCode: ${topicCode}`);
}
