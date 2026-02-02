import { useEffect, useState } from "react";
import { loadLeaderboard, clearLeaderboard, Course } from "../data/leaderboard.api";

type Row = {
  team_name: string;
  course: Course;
  avm: number;
  bvm: number;
  mod_1: number;
  mod_2a: number;
  mod_2b: number;
  total_score: number;
};

const COURSE_TOPICS: Record<Course, string[]> = {
  aos: ["avm", "bvm"],
  aosx: ["mod_1", "mod_2a", "mod_2b"],
};

const TOPIC_LABEL: Record<string, string> = {
  avm: "AVM",
  bvm: "BVM",
  mod_1: "Mod 1",
  mod_2a: "Mod 2A",
  mod_2b: "Mod 2B",
};

function labelConvert(key: string) {
  return TOPIC_LABEL[key] ?? key;
}

export default function LeaderboardPage() {
  const [course, setCourse] = useState<Course>("aos");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);


  async function refresh() {
    setLoading(true);
    const data = await loadLeaderboard(course);
    setRows(data as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [course]);

  async function onClear() {
    const ok = confirm(
      "⚠️ Clear ALL leaderboard data for this course?\nThis cannot be undone."
    );
    if (!ok) return;

    await clearLeaderboard(course);
    refresh();
  }

  const topics = COURSE_TOPICS[course];

  return (
    <div className="page leaderboardPage">
      <div className="leaderHeader">
        <div className="leaderTitle">🏆 Team Leaderboard</div>

        <div className="leaderTabs">
          <button
            className={`btn-pill ${course === "aos" ? "active" : ""}`}
            onClick={() => setCourse("aos")}
          >
            AOS
          </button>

          <button
            className={`btn-pill ${course === "aosx" ? "active" : ""}`}
            onClick={() => setCourse("aosx")}
          >
            AOSX
          </button>
          <button className="btn clear" onClick={onClear}>
            Clear All
          </button>
        </div>

      </div>

      {loading ? (
        <div className="loader">Loading leaderboard…</div>
      ) : (
        <div className="leaderCard">
          <table className="leaderTable">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Team</th>

                {topics.map((t) => (
                  <th key={t}>{labelConvert(t)} </th>
                ))}

                <th className="totalCol">Total</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={r.team_name}>
                  <td className="rank">{i + 1}</td>

                  <td className="teamCell">
                    {r.team_name}
                  </td>

                  {topics.map((t) => (
                    <td key={t}>{(r as any)[t]}</td>
                  ))}

                  <td className="totalScore">{r.total_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
