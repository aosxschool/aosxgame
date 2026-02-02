import { useEffect, useState } from "react";
import { clearLeaderboard, loadLeaderboard } from "../data/leaderboard.api";

export default function HomePage() {
  const [course, setCourse] = useState<"aos" | "aosx">("aos");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [course]);

  async function load() {
    setLoading(true);
    const r = await loadLeaderboard(course);
    setRows(r);
    setLoading(false);
  }

  async function clearAll() {
    if (!confirm("Clear ALL leaderboard data for this course?")) return;
    await clearLeaderboard(course);
    load();
  }

  const columns =
    course === "aos"
      ? ["avm", "bvm"]
      : ["mod_1", "mod_2a", "mod_2b"];

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="topbar">
        <div className="topTitle">Leaderboard</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setCourse("aos")}>AOS</button>
          <button className="btn" onClick={() => setCourse("aosx")}>AOSX</button>
          <button className="btn danger" onClick={clearAll}>Clear All</button>
        </div>
      </div>

      {loading && <div className="loader">Loading…</div>}

      {!loading && (
        <table style={{ width: "100%", marginTop: 20 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              {columns.map((c) => <th key={c}>{c.toUpperCase()}</th>)}
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.team_name}</td>

                {columns.map((c) => (
                  <td key={c}>{r[c]}</td>
                ))}

                <td><b>{Number(r.total_score).toFixed(1)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
