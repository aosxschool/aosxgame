import { useMemo, useState } from "react";
import type { Dir } from "../../types";
import { WFE_CROSSWORD } from "../../data/crossword";
import { buildGrid, computeNumbersAll } from "../../utils/crossword";
import CrosswordGrid from "../../components/WFE/Crossword/CrosswordGrid";
import CrosswordClues from "../../components/WFE/Crossword/CrosswordClues";
import ScrollContainer from "../../components/ui/ScrollContainer";


type ReviewMode = "edit" | "review" | "solutions";

export default function CrosswordPage(props: { navigate: (to: string) => void; gameId: "crossword" }) {
  const puzzle = WFE_CROSSWORD;

  const [cells, setCells] = useState(() => computeNumbersAll(buildGrid(puzzle)));
  const [dir, setDir] = useState<Dir>("across");
  const [active, setActive] = useState({ r: 0, c: 0 });

  const [result, setResult] = useState<null | {
    totalClues: number;
    correctClues: number;
    wrongClues: number;
    score: number;
  }>(null);

  const [showModal, setShowModal] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("edit");

  // Which cells belong to correct / wrong clues
  const [correctCells, setCorrectCells] = useState<Set<number>>(new Set());
  const [wrongCells, setWrongCells] = useState<Set<number>>(new Set());

  // Clue row status: "across:10" -> good/bad
  const [clueStatus, setClueStatus] = useState<Record<string, "good" | "bad">>({});

  // Keep the user’s answers at time of submit so “Back” restores them
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string[] | null>(null);

  function setEntryAt(r: number, c: number, ch: string) {
    setCells((prev) => {
      const next = prev.slice();
      const i = r * puzzle.size + c;
      const cell = next[i];
      if (!cell || cell.isBlock) return prev;
      next[i] = { ...cell, entry: ch };
      return next;
    });
  }

  function checkAnswers() {
    const allFilledNow = cells.every(
      (cell) => cell.isBlock || (cell.entry && cell.entry.trim().length === 1)
    );
    if (!allFilledNow) return;

    // snapshot user entries (by index)
    setSubmittedSnapshot(cells.map((c) => c.entry));

    const correctSet = new Set<number>();
    const wrongSet = new Set<number>();
    const status: Record<string, "good" | "bad"> = {};

    let correctClues = 0;
    const totalClues = puzzle.clues.length;

    for (const clue of puzzle.clues) {
      const start = cells.find((c) => c.number === clue.number);

      // key for clue row highlight
      const k = `${clue.dir}:${clue.number}`;

      if (!start || start.isBlock) {
        status[k] = "bad";
        continue;
      }

      // collect cells for this clue (until block)
      const wordIdxs: number[] = [];
      let r = start.r;
      let c = start.c;

      while (r >= 0 && c >= 0 && r < puzzle.size && c < puzzle.size) {
        const i = r * puzzle.size + c;
        const cell = cells[i];
        if (!cell || cell.isBlock) break;
        wordIdxs.push(i);
        if (clue.dir === "across") c++;
        else r++;
      }

      const ok =
        wordIdxs.length > 0 &&
        wordIdxs.every((i) => {
          const cell = cells[i];
          return (cell.entry || "").toUpperCase() === (cell.solution || "").toUpperCase();
        });

      status[k] = ok ? "good" : "bad";

      if (ok) {
        correctClues++;
        wordIdxs.forEach((i) => correctSet.add(i));
      } else {
        wordIdxs.forEach((i) => wrongSet.add(i));
      }
    }

    const wrongClues = totalClues - correctClues;
    const score = correctClues * 10;

    setCorrectCells(correctSet);
    setWrongCells(wrongSet);
    setClueStatus(status);

    setResult({ totalClues, correctClues, wrongClues, score });
    setShowModal(true);
  }

  function onOkFromModal() {
    setShowModal(false);
    setReviewMode("review"); // show green/red + change buttons
  }

  function viewCorrectAnswers() {
    setReviewMode("solutions"); // red -> orange + show solutions on wrong cells (in grid component)
  }

  function backToYourAnswers() {
    if (submittedSnapshot) {
      setCells((prev) =>
        prev.map((cell, i) => (cell.isBlock ? cell : { ...cell, entry: submittedSnapshot[i] ?? "" }))
      );
    }
    setReviewMode("review");
  }

  function clearEntries() {
    setCells((prev) => prev.map((cell) => (cell.isBlock ? cell : { ...cell, entry: "" })));
    setReviewMode("edit");
    setResult(null);
    setShowModal(false);
    setCorrectCells(new Set());
    setWrongCells(new Set());
    setClueStatus({});
    setSubmittedSnapshot(null);
  }

  function retryPuzzle() {
  // reset everything to fresh puzzle
  setCells(computeNumbersAll(buildGrid(puzzle)));
  setDir("across");
  setActive({ r: 0, c: 0 });

  setReviewMode("edit");
  setResult(null);
  setShowModal(false);

  setCorrectCells(new Set());
  setWrongCells(new Set());
  setClueStatus({});
  setSubmittedSnapshot(null);
}


  const allFilled = useMemo(() => {
    return cells.every((cell) => cell.isBlock || (cell.entry && cell.entry.trim().length === 1));
  }, [cells]);

  return (
    <ScrollContainer>
      <div className="cwPage">
        <div className="topbar">
          <div className="topLeft">
            <div className="topTitle">WFE Crossword</div>
            <div className="topSub">Tab to change direction • Arrow keys to move</div>
          </div>

          <div className="topRight">
            {reviewMode === "edit" && (
              <>
                <button className="btn-pill" onClick={clearEntries}>Clear</button>
                <button
                  className="btn primary"
                  onClick={checkAnswers}
                  disabled={!allFilled}
                  title={!allFilled ? "Fill all blanks to submit." : "Submit"}
                >
                  Submit
                </button>
              </>
            )}

            {reviewMode === "review" && (
              <button className="btn-pill" onClick={viewCorrectAnswers}>
                View Correct Answers
              </button>
            )}

            {reviewMode === "solutions" && (
              <>
              <button className="btn-pill" onClick={retryPuzzle}>
                Retry
              </button>
              <button className="btn-pill" onClick={backToYourAnswers}>
                Back
              </button>
              </>
              
            )}
          </div>
        </div>

        <div className="cwContainer">
          <CrosswordGrid
            size={puzzle.size}
            cells={cells}
            dir={dir}
            active={active}
            setActive={setActive}
            setDir={setDir}
            setEntryAt={setEntryAt}
            reviewMode={reviewMode}
            correctCells={correctCells}
            wrongCells={wrongCells}
          />

          <CrosswordClues
            clues={puzzle.clues}
            clueStatus={clueStatus}
            reviewMode={reviewMode}
          />
        </div>

        {showModal && result && (
          <div className="modalBackdrop">
            <div className="modal">
              <div className="modalHeader">
                <div className="modalPts">
                  <div className="modalPtsNum">{result.score}</div>
                  <div className="modalPtsLab">SCORE</div>
                </div>

                <button className="btn primary" onClick={onOkFromModal}>
                  OK
                </button>
              </div>

              <div className="spacer" />

              <div className="grid2">
                <div className="rankRow">
                  <div className="rankLeft">
                    <div className="rankName">Correct Clues</div>
                  </div>
                  <div className="rankScore">{result.correctClues}</div>
                </div>

                <div className="rankRow">
                  <div className="rankLeft">
                    <div className="rankName">Wrong Clues</div>
                  </div>
                  <div className="rankScore">{result.wrongClues}</div>
                </div>
              </div>

              <div className="spacer" />

              <div className="hint">
                {result.correctClues} correct × 10 points = <b>{result.score}</b>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollContainer>
  );
}
