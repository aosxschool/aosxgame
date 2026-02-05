// src/pages/Team/FillBoxes/FillBoxesPlayPage.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { DEMO_FILLBOXES } from "../../data/fillBoxesPuzzle";
import { useMixMatchTimer } from "../../pages/MixMatch/useMixMatchTimer";
import FillBoxesTopBar from "../../components/FillBoxes/FillBoxesTopBar";
import FillBoxesGrid from "../../components/FillBoxes/FillBoxesGrid";
import PassageOverlay from "../../components/FillBoxes/PassageOverlay";

import {
  buildFillBoxesInitial,
  clearAllUserInputs,
  evaluateFillBoxes,
  retryWrongOnly,
} from "../../utils/fillBoxes";

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

  /* ===============================
     REFS (important fixes)
  =============================== */
  const confettiFiredRef = useRef(false);
  const prevAllCorrectRef = useRef(false); // ⭐ prevents popup reopening

  /* ===============================
     COMPUTED
  =============================== */

  const canSubmit = useMemo(() => {
    for (const k of Object.keys(puzzle.answerKey)) {
      if (!(state.values[k] ?? "").trim()) return false;
    }
    return true;
  }, [state.values, puzzle.answerKey]);

  const allCorrect = useMemo(() => {
    if (!state.submitted) return false;
    for (const k of Object.keys(puzzle.answerKey)) {
      if (state.status[k] !== "correct") return false;
    }
    return true;
  }, [state.submitted, state.status, puzzle.answerKey]);

  const hasWrong = useMemo(() => {
    if (!state.submitted) return false;
    return Object.values(state.status).includes("wrong");
  }, [state.submitted, state.status]);

  /* ===============================
     ⭐ EDGE-TRIGGER COMPLETION
     only fires once when becoming true
  =============================== */
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

  /* ===============================
     HANDLERS
  =============================== */

  function onChangeCell(r: number, c: number, value: string) {
    timer.startIfNeeded();

    const k = `${r},${c}`;
    if (state.locked[k]) return;

    setState((prev) => {
      const nextStatus = { ...prev.status };

      if (prev.submitted) {
        for (const kk of Object.keys(puzzle.answerKey)) {
          if (nextStatus[kk] === "wrong") nextStatus[kk] = "neutral";
        }
      }

      return {
        ...prev,
        submitted: false,
        values: { ...prev.values, [k]: value },
        status: nextStatus,
      };
    });
  }

  function onClear() {
    setState((prev) => clearAllUserInputs(puzzle, prev));

    timer.reset();

    /* ⭐ reset completion state */
    setShowComplete(false);
    confettiFiredRef.current = false;
    prevAllCorrectRef.current = false;
  }

  function onRetryWrong() {
    if (!hasWrong) return;
    setState((prev) => retryWrongOnly(puzzle, prev));
  }

  function onSubmit() {
    timer.startIfNeeded();

    setState((prev) => {
      const res = evaluateFillBoxes(puzzle, prev);
      return {
        ...prev,
        status: res.nextStatus,
        submitted: true,
      };
    });
  }

  function onAutoFill() {
    timer.startIfNeeded();

    setState((prev) => ({
      ...prev,
      submitted: false,
      values: {
        ...prev.values,
        ...puzzle.answerKey,
      },
    }));
  }

  /* ===============================
     UI
  =============================== */

  return (
    <div className="page" style={{ maxWidth: "95vw" }}>
      <FillBoxesTopBar
        title="Fill in the Boxes"
        timeLabel={timer.formatted}
        canSubmit={canSubmit}
        onOpenPassage={() => setPassageOpen(true)}
        onClear={onClear}
        onRetryWrong={onRetryWrong}
        onSubmit={onSubmit}
        onAutoFill={onAutoFill}
        submitted={state.submitted}
        canRetryWrong={hasWrong}
      />

      <div style={{ marginTop: 14 }}>
        <FillBoxesGrid
          puzzle={puzzle}
          state={state}
          onChangeCell={onChangeCell}
        />
      </div>

      <PassageOverlay
        open={passageOpen}
        title={puzzle.passageTitle}
        text={puzzle.passageText}
        onClose={() => setPassageOpen(false)}
      />

      {/* ===============================
         COMPLETION POPUP
      =============================== */}
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
