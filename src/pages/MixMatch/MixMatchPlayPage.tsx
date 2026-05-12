import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import type { Team, MixMatchPuzzle, OptionMark } from "../../types";

import MixMatchBoard from "../../components/MixMatch/MixMatchBoard";
import MixMatchOptionBank from "../../components/MixMatch/MixMatchOptionBank";
import MixMatchTopBar from "../../components/MixMatch/MixMatchTopBar";

import { buildInitialState, evaluateSubmission } from "../../utils/mixMatch";
import { useMixMatchTimer } from "./useMixMatchTimer";
import { loadMixMatchPuzzle } from "../../data/mixmatch.api";

import ResultModal from "../../components/DragDrop/ResultModal";

import { saveAllTeams } from "../../data/leaderboard.api";
import { toLeaderboardFields } from "../../data/leaderBoardConverter";

type LocationState = {
  teams: Team[];
  topicCode: string;
};

const BASE_SECONDS = 600;

function timeToScore(timeSeconds: number) {
  return Math.max(0, BASE_SECONDS - timeSeconds);
}

export default function MixMatchPlayPage(props: {
  navigate: (to: string) => void;
  gameId: "mixmatch";
}) {
  const loc = useLocation();
  const navState = loc.state as LocationState | null;
  const { mode } = useParams<{ mode: "aos" | "aosx" }>();

  const [activeTeamId, setActiveTeamId] = useState<string>(
    () => navState?.teams?.[0]?.id ?? ""
  );

  const [puzzle, setPuzzle] = useState<MixMatchPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const timer = useMixMatchTimer();

  const [state, setState] = useState<{ placements: Record<string, string[]> } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [optionStatus, setOptionStatus] = useState<Record<string, OptionMark>>({});
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showCorrectBoard, setShowCorrectBoard] = useState(false);
  const [finalFormattedTime, setFinalFormattedTime] = useState<string>("");
  const [penaltySeconds, setPenaltySeconds] = useState(0);

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

    for (const o of puzzle.options) {
      m[o.id] = o.label;
    }

    return m;
  }, [puzzle]);

  const placedOptionIds = useMemo(() => {
    const s = new Set<string>();
    if (!state) return s;

    Object.values(state.placements).forEach((ids) => {
      ids.forEach((id) => s.add(id));
    });

    return s;
  }, [state]);

  const canSubmit = useMemo(() => {
    if (!puzzle || !state) return false;

    return puzzle.tiles.every(
      (t) => (state.placements[t.id]?.length ?? 0) === 1
    );
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
        nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter(
          (x) => x !== optionId
        );
      }

      nextPlacements[toTileId] = [optionId];

      return {
        ...prev,
        placements: nextPlacements,
      };
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

      nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter(
        (x) => x !== optionId
      );

      nextPlacements[toTileId] = [optionId];

      return {
        ...prev,
        placements: nextPlacements,
      };
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
    setShowResult(false);
    setReviewMode(false);
    setShowCorrectBoard(false);
    setFinalFormattedTime("");
    savedRef.current = false;
  }

  function onSubmit() {
    if (!puzzle || !state) return;
    if (!canSubmit) return;

    timer.startIfNeeded();

    let wrongCount = 0;

    for (const tile of puzzle.tiles) {
      const placed = state.placements[tile.id] ?? [];
      const correctId = tile.requiredOptionIds[0];

      if (placed.length !== 1 || placed[0] !== correctId) {
        wrongCount += 1;
      }
    }

    if (wrongCount > 0) {
      timer.addPenaltySeconds(wrongCount * 5);
    }

    const penalty = wrongCount * 5;

    if (penalty > 0) {
      timer.addPenaltySeconds(penalty);
    }

    setPenaltySeconds(penalty);

    const next: Record<string, OptionMark> = {};

    for (const tile of puzzle.tiles) {
      const placed = state.placements[tile.id] ?? [];
      const correctId = tile.requiredOptionIds[0];

      if (placed.length === 1) {
        next[placed[0]] = placed[0] === correctId ? "correct" : "wrong";
      }
    }

    setOptionStatus(next);

    timer.stop();
    setFinalFormattedTime(timer.formatted);
    setSubmitted(true);
    setShowResult(true);
  }

  function autoFillAllCorrect() {
    if (!puzzle) return;

    timer.startIfNeeded();

    const placements: Record<string, string[]> = {};

    for (const t of puzzle.tiles) {
      placements[t.id] = [t.requiredOptionIds[0]];
    }

    setState({ placements });
    keepGreenClearRed();
    setSubmitted(false);
    setOptionStatus({});
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

  const timeSeconds = Math.floor((timer.elapsedMs ?? 0) / 1000);
  const scorePreview = timeToScore(timeSeconds);

  const resultModal = showResult ? (
    <ResultModal
      time={timeSeconds}
      penalty={penaltySeconds}
      title="Mix & Match Completed"
      actionLabel="Back To Review"
      onAction={() => {
        setShowResult(false);
        setReviewMode(true);
      }}
    />
  ) : null;

  if (reviewMode && puzzle) {
    const reviewPlacements = showCorrectBoard
      ? Object.fromEntries(
          puzzle.tiles.map((t) => [t.id, [t.requiredOptionIds[0]]])
        )
      : state.placements;

    const reviewStatus: Record<string, OptionMark> = showCorrectBoard
      ? (() => {
          const next: Record<string, OptionMark> = {};

          for (const tile of puzzle.tiles) {
            const correctId = tile.requiredOptionIds[0];
            const placed = state.placements[tile.id]?.[0];

            if (placed === correctId) {
              next[correctId] = "correct";
            } else {
              next[correctId] = "revealed";
            }
          }

          return next;
        })()
      : optionStatus;

    return (
      <div className="game-root">
        <MixMatchOptionBank
          options={puzzle.options}
          started={true}
          placedOptionIds={new Set()}
          optionStatus={reviewStatus}
        />

        <div className="mixMatchRight">
          <MixMatchTopBar
            title={showCorrectBoard ? "Correct Answers" : "Review Answers"}
            subtitle={`${team.name} finished in ${timer.formatted}`}
            timeLabel={finalFormattedTime || timer.formatted}
            submitted={true}
            allCorrect={showCorrectBoard}
            canSubmit={false}
            onSubmit={() => {}}
            onReset={() => {}}
            teams={teams}
            selectedTeamId={activeTeamId}
            onSelectTeam={setActiveTeamId}
            showCorrectBoard={showCorrectBoard}
            onToggleCorrectBoard={() => setShowCorrectBoard((p) => !p)}
            onReturnHome={() => props.navigate("/home")}
            onViewScore={() => setShowResult(true)}
            onAutoFill={autoFillAllCorrect}
          />

          <MixMatchBoard
            puzzle={puzzle}
            placements={reviewPlacements}
            submitted={true}
            optionStatus={reviewStatus}
            optionLabelById={optionLabelById}
            onDropOption={() => {}}
            onMoveOption={() => {}}
            onRemoveOption={() => {}}
          />

          {resultModal}
        </div>
      </div>
    );
  }

  return (
    <div className="game-root">
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
              ? `${team.name} finished in ${timer.formatted}`
              : "Drag options onto tiles. Submit to check."
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
          showCorrectBoard={showCorrectBoard}
          onToggleCorrectBoard={() => setShowCorrectBoard((p) => !p)}
          onReturnHome={() => props.navigate("/home")}
          onViewScore={() => setShowResult(true)}
          onAutoFill={autoFillAllCorrect}

        />

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

        {resultModal}
      </div>
    </div>
  );
}