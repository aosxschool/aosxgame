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

  const [state, setState] = useState<{
    placements: Record<string, string[]>;
  } | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [optionStatus, setOptionStatus] = useState<Record<string, OptionMark>>({});
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [showCorrectBoard, setShowCorrectBoard] = useState(false);

  const [rawTimeSeconds, setRawTimeSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);

  const savedRef = useRef(false);

  if (!navState?.teams?.length || !navState.topicCode) {
    return <Navigate to="/home" replace />;
  }

  const { teams, topicCode } = navState;
  const team = teams.find((t) => t.id === activeTeamId) ?? teams[0];

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
    const labels: Record<string, string> = {};

    if (!puzzle) return labels;

    for (const option of puzzle.options) {
      labels[option.id] = option.label;
    }

    return labels;
  }, [puzzle]);

  const placedOptionIds = useMemo(() => {
    const ids = new Set<string>();

    if (!state) return ids;

    for (const placedIds of Object.values(state.placements)) {
      for (const id of placedIds) {
        ids.add(id);
      }
    }

    return ids;
  }, [state]);

  const canSubmit = useMemo(() => {
    if (!puzzle || !state) return false;

    return puzzle.tiles.every(
      (tile) => (state.placements[tile.id]?.length ?? 0) === 1
    );
  }, [puzzle, state]);

  const evalResult = useMemo(() => {
    if (!submitted || !puzzle || !state) return null;

    return evaluateSubmission(puzzle, state.placements);
  }, [submitted, puzzle, state]);

  const allCorrect = !!evalResult?.allCorrect;

  const displayTimeLabel =
    rawTimeSeconds > 0 ? `${rawTimeSeconds}s` : timer.formatted;

  const keepGreenClearRed = useCallback(() => {
    setOptionStatus((prev) => {
      const next: Record<string, OptionMark> = {};

      for (const [id, mark] of Object.entries(prev)) {
        if (mark === "correct") {
          next[id] = "correct";
        }
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
        if (ids.includes(optionId)) {
          return tileId;
        }
      }

      return null;
    },
    [state]
  );

  function resetAll() {
    if (!puzzle) return;

    setState(buildInitialState(puzzle));
    setSubmitted(false);
    setOptionStatus({});
    setShowResult(false);
    setReviewMode(false);
    setShowCorrectBoard(false);
    setRawTimeSeconds(0);
    setPenaltySeconds(0);

    savedRef.current = false;
    timer.reset?.();
  }

  function onDropOption(toTileId: string, optionId: string) {
    if (!puzzle || !state) return;
    if (submitted) return;
    if (isLockedGreen(optionId)) return;

    timer.startIfNeeded();
    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;

      const fromTileId = findTileContaining(optionId);
      const nextPlacements = { ...prev.placements };

      if (fromTileId) {
        nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter(
          (id) => id !== optionId
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
    if (submitted) return;
    if (isLockedGreen(optionId)) return;

    timer.startIfNeeded();
    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;

      const nextPlacements = { ...prev.placements };

      nextPlacements[fromTileId] = (nextPlacements[fromTileId] ?? []).filter(
        (id) => id !== optionId
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
    if (submitted) return;
    if (isLockedGreen(optionId)) return;

    timer.startIfNeeded();
    keepGreenClearRed();

    setState((prev) => {
      if (!prev) return prev;

      const current = prev.placements[tileId] ?? [];

      return {
        ...prev,
        placements: {
          ...prev.placements,
          [tileId]: current.filter((id) => id !== optionId),
        },
      };
    });
  }

  function onSubmit() {
    if (!puzzle || !state) return;
    if (!canSubmit) return;
    if (submitted) return;

    const rawSeconds = Math.max(
      1,
      Math.floor((timer.elapsedMs ?? 0) / 1000)
    );

    let wrongCount = 0;
    const nextStatus: Record<string, OptionMark> = {};

    for (const tile of puzzle.tiles) {
      const placed = state.placements[tile.id] ?? [];
      const placedId = placed[0];
      const correctId = tile.requiredOptionIds[0];

      if (placed.length !== 1 || placedId !== correctId) {
        wrongCount += 1;
      }

      if (placedId) {
        nextStatus[placedId] = placedId === correctId ? "correct" : "wrong";
      }
    }

    const penalty = wrongCount * 5;
    const finalSeconds = rawSeconds + penalty;
    const score = timeToScore(finalSeconds);

    setRawTimeSeconds(rawSeconds);
    setPenaltySeconds(penalty);
    setOptionStatus(nextStatus);
    setSubmitted(true);
    setShowResult(true);

    timer.stop();

    if (mode === "aosx" && !savedRef.current) {
      savedRef.current = true;

      const { course, topic } = toLeaderboardFields(mode, topicCode);

      console.log("[MixMatch] saving score", {
        course,
        topic,
        team: team.name,
        rawSeconds,
        penalty,
        finalSeconds,
        score,
      });

      saveAllTeams(course, topic, [
        {
          name: team.name,
          score,
        },
      ]).catch((e) => {
        console.error("Failed saving MixMatch leaderboard:", e);
        savedRef.current = false;
      });
    }
  }

  function autoFillAllCorrect() {
    if (!puzzle || submitted) return;

    timer.startIfNeeded();

    const placements: Record<string, string[]> = {};

    for (const tile of puzzle.tiles) {
      placements[tile.id] = [tile.requiredOptionIds[0]];
    }

    setState({ placements });
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

  const resultModal = showResult ? (
    <ResultModal
      time={rawTimeSeconds}
      penalty={penaltySeconds}
      title="Mix & Match Completed"
      actionLabel="Back To Review"
      onAction={() => {
        setShowResult(false);
        setReviewMode(true);
      }}
    />
  ) : null;

  if (reviewMode) {
    const reviewPlacements = showCorrectBoard
      ? Object.fromEntries(
          puzzle.tiles.map((tile) => [
            tile.id,
            [tile.requiredOptionIds[0]],
          ])
        )
      : state.placements;

    const reviewStatus: Record<string, OptionMark> = showCorrectBoard
      ? (() => {
          const next: Record<string, OptionMark> = {};

          for (const tile of puzzle.tiles) {
            const correctId = tile.requiredOptionIds[0];
            const placedId = state.placements[tile.id]?.[0];

            next[correctId] =
              placedId === correctId ? "correct" : "revealed";
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
            subtitle={`${team.name} finished in ${displayTimeLabel}`}
            timeLabel={displayTimeLabel}
            submitted={true}
            allCorrect={showCorrectBoard}
            canSubmit={false}
            onSubmit={onSubmit}
            onReset={resetAll}
            teams={teams}
            selectedTeamId={activeTeamId}
            onSelectTeam={setActiveTeamId}
            showCorrectBoard={showCorrectBoard}
            onToggleCorrectBoard={() => setShowCorrectBoard((prev) => !prev)}
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
          subtitle="Drag options onto tiles. Submit to check."
          timeLabel={timer.formatted}
          submitted={submitted}
          allCorrect={allCorrect}
          canSubmit={canSubmit}
          onSubmit={onSubmit}
          onReset={resetAll}
          teams={teams}
          selectedTeamId={activeTeamId}
          onSelectTeam={setActiveTeamId}
          showCorrectBoard={showCorrectBoard}
          onToggleCorrectBoard={() => setShowCorrectBoard((prev) => !prev)}
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