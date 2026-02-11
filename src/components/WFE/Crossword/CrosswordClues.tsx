import type { Clue } from "../../../types";

export default function CrosswordClues(props: {
  clues: Clue[];
  clueStatus: Record<string, "good" | "bad">;
  reviewMode: "edit" | "review" | "solutions";
}) {
  const across = props.clues.filter((c) => c.dir === "across");
  const down = props.clues.filter((c) => c.dir === "down");

  function clueRowClass(c: Clue) {
    // No clue highlighting while editing
    if (props.reviewMode === "edit") return "cwQuestions cwClueRow";

    const k = `${c.dir}:${c.number}`;
    const status = props.clueStatus[k];

    if (status === "good") return "cwQuestions cwClueRow cwClueGood";

    if (status === "bad") {
      return props.reviewMode === "solutions"
        ? "cwQuestions cwClueRow cwClueWarn"
        : "cwQuestions cwClueRow cwClueBad";
    }

    return "cwQuestions cwClueRow";
  }

  return (
    <div className="cwQuestionsContainer">
      <div className="cardTitle">Clues</div>
        <div>
          <div className="hint" style={{ marginBottom: 8 }}>
            <b>Across</b>
          </div>
          {across.map((c) => (
            <div key={`a-${c.number}`} className={clueRowClass(c)}>
              <div className="rankNum">{c.number}</div>
              <div>{c.text}</div>
            </div>
          ))}

          <div className="hint" style={{ marginBottom: 8, marginTop: 12 }}>
            <b>Down</b>
          </div>
          {down.map((c) => (
            <div key={`d-${c.number}`} className={clueRowClass(c)}>
              <div className="rankNum">{c.number}</div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
  );
}
