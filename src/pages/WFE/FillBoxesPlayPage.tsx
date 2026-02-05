// src/pages/Team/FillBoxes/FillBoxesPlayPage.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { DEMO_FILLBOXES } from "../../data/fillBoxesPuzzle";
import { useMixMatchTimer } from "../../pages/MixMatch/useMixMatchTimer";
import FillBoxesTopBar from "../../components/FillBoxes/FillBoxesTopBar";
import FillBoxesGrid from "../../components/FillBoxes/FillBoxesGrid";
import PassageOverlay from "../../components/FillBoxes/PassageOverlay";

import { buildFillBoxesInitial, clearAllUserInputs } from "../../utils/fillBoxes";

import { AnimatePresence, motion } from "framer-motion";
import { burstConfetti } from "../../utils/Confetti";

export default function FillBoxesPlayPage(props: {
  navigate: (to: string) => void;
  gameId: "fillblank";
}) {
  const puzzle = DEMO_FILLBOXES;
  const timer = useMixMatchTimer();

  const [state, setState] = useState(() => buildFillBoxesInitial(puzzle));
  const [passageOpen, setPassageOpen] = useState(false);

  const [showComplete, setShowComplete] = useState(false);

  const confettiFiredRef = useRef(false);
  const prevAllCorrectRef = useRef(false);

  // -------- helpers: normalize input + key --------
  function norm(s: string) {
    let x = s ?? "";
    if (puzzle.trim) x = x.trim();
    if (puzzle.caseInsensitive) x = x.toLowerCase();
    return x;
  }

  // ✅ allCorrect when EVERY answerKey cell is correct
  const allCorrect = useMemo(() => {
    for (const k of Object.keys(puzzle.answerKey)) {
      if (state.status[k] !== "correct") return false;
    }
    return Object.keys(puzzle.answerKey).length > 0;
  }, [state.status, puzzle.answerKey]);

  // ✅ stop timer + popup once on completion
  useEffect(() => {
    const prev = prevAllCorrectRef.current;

    if (!prev && allCorrect) {
      timer.stop();
      setShowComplete(true);

      if (!confettiFiredRef.current) {
        confettiFiredRef.current = true;
        burstConfetti();
      }
    }

    prevAllCorrectRef.current = allCorrect;
  }, [allCorrect, timer]);

  function onChangeCell(r: number, c: number, value: string) {
    timer.startIfNeeded();

    const k = `${r},${c}`;
    if (state.locked[k]) return;

    const correct = puzzle.answerKey[k];
    const isAnswerCell = correct !== undefined;

    const upper = value.toUpperCase();

    const nextStatus = { ...state.status };

    if (isAnswerCell) {
      nextStatus[k] = norm(value) === norm(correct) ? "correct" : "neutral";
    } else {
      // if you have non-answer editable cells, keep neutral
      nextStatus[k] = "neutral";
    }

    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [k]: upper },
      status: nextStatus,
      // submitted is irrelevant now; keep false so other code doesn't depend on it
      submitted: false,
    }));
  }

  function onClear() {
    setState((prev) => clearAllUserInputs(puzzle, prev));

    timer.reset();

    setShowComplete(false);
    confettiFiredRef.current = false;
    prevAllCorrectRef.current = false;
  }

  function onAutoFill() {
    timer.startIfNeeded();

    setState((prev) => {
      const nextValues = { ...prev.values, ...puzzle.answerKey };

      // after autofill, mark all answer cells correct
      const nextStatus = { ...prev.status };
      for (const k of Object.keys(puzzle.answerKey)) nextStatus[k] = "correct";

      return {
        ...prev,
        values: nextValues,
        status: nextStatus,
        submitted: false,
      };
    });
  }

  return (
    <div className="page" style={{ maxWidth: "95vw" }}>
      <FillBoxesTopBar
        title="Fill in the Boxes"
        timeLabel={timer.formatted}
        onOpenPassage={() => setPassageOpen(true)}
        onClear={onClear}
        onAutoFill={onAutoFill}
      />

      <div style={{ marginTop: 14 }}>
        <FillBoxesGrid puzzle={puzzle} state={state} onChangeCell={onChangeCell} />
      </div>

      <PassageOverlay
        open={passageOpen}
        title={puzzle.passageTitle}
        text={puzzle.passageText}
        onClose={() => setPassageOpen(false)}
      />

      <AnimatePresence>
        {showComplete && (
          <motion.div
            className="fillCompleteOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowComplete(false)}
          >
            <motion.div
              className="fillCompleteCard"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fillCompleteTitle">🎉 Game Complete</div>

              <div className="fillCompleteTime">{timer.formatted}</div>

              <div className="fillCompleteHint">Time taken</div>

              <button
                className="btn"
                style={{ marginTop: 18 }}
                onClick={() => setShowComplete(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
