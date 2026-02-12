import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import type { Team, MixMatchPuzzle } from "../../types";

import MixMatchBoard from "../../components/MixMatch/MixMatchBoard";
import MixMatchOptionBank from "../../components/MixMatch/MixMatchOptionBank";
import MixMatchTopBar from "../../components/MixMatch/MixMatchTopBar";

import { buildInitialState, evaluateSubmission } from "../../utils/mixMatch";
import { useMixMatchTimer } from "./useMixMatchTimer";
import { loadMixMatchPuzzle } from "../../data/mixmatch.api";

import { AnimatePresence, motion } from "framer-motion";

import { saveAllTeams } from "../../data/leaderboard.api";
import { toLeaderboardFields } from "../../data/leaderBoardConverter";

type OptionMark = "correct" | "wrong";

type LocationState = {
  teams: Team[];
  topicCode: string;
};

const BASE_SECONDS = 600;

function timeToScore(timeSeconds: number) {
  return Math.max(0, BASE_SECONDS - timeSeconds);
}

export default function MixMatchPlayPage(props: { navigate: (to: string) => void; gameId: "mixmatch" }) {
  const loc = useLocation();
  const navState = loc.state as LocationState | null;
  const { mode } = useParams<{ mode: "aos" | "aosx" }>();

  const [activeTeamId, setActiveTeamId] = useState<string>(() => navState?.teams?.[0]?.id ?? "");
  const [puzzle, setPuzzle] = useState<MixMatchPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const timer = useMixMatchTimer();

  const [state, setState] = useState<{ placements: Record<string, string[]> } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [optionStatus, setOptionStatus] = useState<Record<string, OptionMark>>({});
  const [showResult, setShowResult] = useState(false);

  const savedRef = useRef(false);

  if (!navState?.teams?.length || !navState.topicCode) {
    return <Navigate to="/home" replace />;
  }

  const { teams, topicCode } = navState;
  const team = teams[0];

  useEffect(() => {
    setActiveTeamId(teams[0]?.id ?? "");
  }, [teams]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const p = await loadMixMatchPuzzle(topicCode);
        if (cancelled) return;
        setPuzzle(p);
        setState(buildInitialState(p));
      } catch (e: any) {
        if (cancelled) return;
        setErr(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [topicCode]);

  const optionLabelById = useMemo(() => {
    const m: Record<string, string> = {};
    if (!puzzle) return m;
    for (const o of puzzle.options) m[o.id] = o.label;
    return m;
  }, [puzzle]);

  const placedOptionIds = useMemo(() => {
    const s = new Set<string>();
    if (!state) return s;
    Object.values(state.placements).forEach((ids) => ids.forEach((id) => s.add(id)));
    return s;
  }, [state]);

  const canSubmit = useMemo(() => {
    if (!puzzle || !state) return false;
    return puzzle.tiles.every((t) => (state.placements[t.id]?.length ?? 0) === 1);
  }, [puzzle, state]);

  const evalResult = useMemo(() => {
    if (!submitted || !puzzle || !state) return null;
    return evaluateSubmission(puzzle, state.placements);
  }, [submitted, puzzle, state]);

  const allCorrect = !!evalResult?.allCorrect;

  useEffect(() => {
    if (allCorrect) timer.stop();
  }, [allCorrect, timer]);

  useEffect(() => {
    if (!allCorrect) return;
    if (!mode) return;
    if (savedRef.current) return;

    if (mode !== "aosx") return; 

    savedRef.current = true;

    const { course, topic } = toLeaderboardFields(mode, topicCode);

    const timeSeconds = Math.floor((timer.elapsedMs ?? 0) / 1000);
    const score = timeToScore(timeSeconds);

    saveAllTeams(course, topic, [{ name: team.name, score }]).catch((e) => {
      console.error("Failed saving MixMatch leaderboard:", e);
      savedRef.current = false;
    });
  }, [allCorrect, mode, topicCode, team.name, timer.elapsedMs]);

  const keepGreenClearRed = useCallback(() => {
    setOptionStatus((prev) => {
      const next: Record<string, OptionMark> = {};
      for (const [id, mark] of Object.entries(prev)) {
        if (mark === "correct") next[id] = "correct";
      }
      return next;
    });
  }, []);

  const isLockedGreen = useCallback(
    (optionId: string) => optionStatus[optionId] === "correct",
    [optionStatus]
  );

  const findTileContaining = useCallback(
    (optionId: string): string | null => {
      if (!state) return null;
      for (const [tileId, ids] of Object.entries(state.placements)) {
        if (ids.includes(optionId)) return tileId;
      }
      return null;
    },
    [state]
  );

  function onDropOption(toTileId: string, optionId: string) {
    if (!puzzle || !state) return;
    timer.startIfNeeded();

    if (isLockedGreen(optionId)) return;

    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;

      const fromTileId = findTileContaining(optionId);
      const nextPlacements = { ...prev.placements };

      if (fromTileId) {
        nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter((x) => x !== optionId);
      }

      nextPlacements[toTileId] = [optionId];
      return { ...prev, placements: nextPlacements };
    });
  }

  function onMoveOption(fromTileId: string, toTileId: string, optionId: string) {
    if (!puzzle || !state) return;
    if (isLockedGreen(optionId)) return;

    timer.startIfNeeded();
    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;

      const nextPlacements = { ...prev.placements };
      nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter((x) => x !== optionId);
      nextPlacements[toTileId] = [optionId];

      return { ...prev, placements: nextPlacements };
    });
  }

  function onRemoveOption(tileId: string, optionId: string) {
    if (!state) return;
    timer.startIfNeeded();

    if (isLockedGreen(optionId)) return;

    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;
      const cur = prev.placements[tileId] ?? [];
      return {
        ...prev,
        placements: {
          ...prev.placements,
          [tileId]: cur.filter((x) => x !== optionId),
        },
      };
    });
  }

  function resetAll() {
    if (!puzzle) return;
    setSubmitted(false);
    setOptionStatus({});
    setState(buildInitialState(puzzle));
    savedRef.current = false;
  }

  function onSubmit() {
    if (!puzzle || !state) return;
    timer.startIfNeeded();

    let wrongCount = 0;

    for (const tile of puzzle.tiles) {
      const placed = state.placements[tile.id] ?? [];
      const correctId = tile.requiredOptionIds[0];
      if (placed.length !== 1 || placed[0] !== correctId) wrongCount += 1;
    }

    if (wrongCount > 0) timer.addPenaltySeconds(wrongCount * 5);

    const next: Record<string, OptionMark> = {};
    for (const tile of puzzle.tiles) {
      const placed = state.placements[tile.id] ?? [];
      const correctId = tile.requiredOptionIds[0];
      if (placed.length === 1) next[placed[0]] = placed[0] === correctId ? "correct" : "wrong";
    }

    setOptionStatus(next);
    setSubmitted(true);
    setShowResult(true);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loader">Loading Mix & Match…</div>
      </div>
    );
  }

  if (err || !puzzle || !state) {
    return (
      <div className="page">
        <div className="hint">Failed: {err ?? "No puzzle loaded"}</div>
      </div>
    );
  }

  function autoFillAllCorrect() { if (!puzzle) return;
   timer.startIfNeeded(); const placements: Record<string, string[]> = {}; for (const t of puzzle.tiles) { placements[t.id] = [t.requiredOptionIds[0]]; } setState({ placements }); keepGreenClearRed(); setSubmitted(false); setOptionStatus({}); }

  const timeSeconds = Math.floor((timer.elapsedMs ?? 0) / 1000);
  const scorePreview = timeToScore(timeSeconds);

  return (
    <div className="game-root" style={{overflow: "hidden"}}>
      
      <MixMatchOptionBank
        options={puzzle.options}
        started={timer.started}
        placedOptionIds={placedOptionIds}
        optionStatus={submitted ? optionStatus : undefined}
      />

      <div className="mixMatchRight">
        <MixMatchTopBar
          title="Mix & Match"
          subtitle={
            allCorrect
              ? `✅ ${team.name} finished in ${timer.formatted}`
              : `Drag options onto tiles. Submit to check.`
          }
          timeLabel={timer.formatted}
          submitted={submitted}
          allCorrect={allCorrect}
          canSubmit={!allCorrect && canSubmit}
          onSubmit={onSubmit}
          onReset={resetAll}
          teams={teams}
          selectedTeamId={activeTeamId}
          onSelectTeam={setActiveTeamId}
        />

        {/* <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}> 
          <button 
            type="button" 
            className="btn ghost" 
            onClick={autoFillAllCorrect} 
            title="Test helper: fills every tile with the correct answer" > 
            Auto Fill (Test) 
          </button> 
        </div>  */}

        <MixMatchBoard
          puzzle={puzzle}
          placements={state.placements}
          submitted={submitted}
          optionStatus={submitted ? optionStatus : undefined}
          optionLabelById={optionLabelById}
          onDropOption={onDropOption}
          onMoveOption={onMoveOption}
          onRemoveOption={onRemoveOption}
        />

        <AnimatePresence>
          {showResult && (
            <motion.div
              className="mixMatchResultOverlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowResult(false)}
            >
              <motion.div
                className="mixMatchResultCard"
                initial={{ y: 18, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 18, scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="mixMatchResultClose"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowResult(false);
                  }}
                  aria-label="Close results"
                >
                  ✕
                </button>

                <div className="mixMatchResultLabel">Result</div>
                <div className="mixMatchResultTime">{timer.formatted}</div>
                <div className="mixMatchResultHint">Penalties included</div>

                <div className="mixMatchResultHint" style={{ marginTop: 8 }}>
                  Score: <b>{scorePreview}</b> (BASE {BASE_SECONDS}s)
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
