import { useEffect, useMemo, useState } from "react";
import type { Team } from "../../../types";
import type { CategoryOptionKey, CategoryPhase, CategoryTile } from "./categoryTypes";

export type RevealState = {
  correct: CategoryOptionKey;
  chosen: CategoryOptionKey | null;
  wasCorrect: boolean;
  pointsAwarded: number;
  winnerTeamId: string | null;
  message: string;
};

export function useCategoryGame(opts: {
  initialTeams: Team[];
  tiles: CategoryTile[];
}) {
  const [teams, setTeams] = useState<Team[]>(opts.initialTeams);
  const [tiles, setTiles] = useState<CategoryTile[]>(opts.tiles);

  useEffect(() => {
    setTiles(opts.tiles);
  }, [opts.tiles]);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(opts.initialTeams[0]?.id ?? "");
  const [phase, setPhase] = useState<CategoryPhase>("board");
  const [activeTileId, setActiveTileId] = useState<number | null>(null);
  const [armedTeamId, setArmedTeamId] = useState<string | null>(null);
  const [attemptedTeamIds, setAttemptedTeamIds] = useState<Set<string>>(new Set());
  const [revealState, setRevealState] = useState<RevealState | null>(null);

  const activeTile = useMemo(() => {
    if (activeTileId === null) return null;
    return tiles.find((t) => t.id === activeTileId) ?? null;
  }, [tiles, activeTileId]);

  const selectableTeams = useMemo(() => {
    if (phase !== "steal") return teams;
    return teams.filter((t) => !attemptedTeamIds.has(t.id));
  }, [teams, phase, attemptedTeamIds]);

  function award(teamId: string, points: number) {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, score: t.score + points } : t)));
  }

  function lockTileSolved(tileId: number, solvedByTeamId: string) {
    setTiles((prev) =>
      prev.map((t) =>
        t.id === tileId
          ? {
              ...t,
              claimedByTeamId: solvedByTeamId,
            }
          : t
      )
    );
  }

  function pickTile(tileId: number, teamId: string) {
    const tile = tiles.find((t) => t.id === tileId);

    if (!tile || tile.claimedByTeamId) return;

    setSelectedTeamId(teamId);
    setActiveTileId(tileId);

    setAttemptedTeamIds(new Set([teamId]));
    setArmedTeamId(null);
    setRevealState(null);

    setPhase("question");
  }

  function armTeam(teamId: string) {
    if (phase !== "steal") return;
    if (attemptedTeamIds.has(teamId)) return;
    setArmedTeamId(teamId);
  }

  function submitAnswer(chosen: CategoryOptionKey) {
    if (!activeTile) return;

    if (activeTile.claimedByTeamId) return;

    const correct = activeTile.question.correct;
    const isCorrect = chosen === correct;

    const answeringTeamId = phase === "steal" ? armedTeamId : selectedTeamId;
    if (!answeringTeamId) return;

    if (isCorrect) {
      award(answeringTeamId, activeTile.points);
      lockTileSolved(activeTile.id, answeringTeamId);

      const teamName = teams.find((t) => t.id === answeringTeamId)?.name ?? "Team";

      setRevealState({
        correct,
        chosen,
        wasCorrect: true,
        pointsAwarded: activeTile.points,
        winnerTeamId: answeringTeamId,
        message: `${teamName} +${activeTile.points}`,
      });

      setPhase("reveal");
      return;
    }

    // wrong answer flow (steal logic stays the same)
    setAttemptedTeamIds((prev) => {
      const next = new Set(prev);
      next.add(answeringTeamId);

      if (phase === "question") {
        setArmedTeamId(null);
        setPhase("steal");
        return next;
      }

      setArmedTeamId(null);

      if (next.size >= teams.length) {
        setRevealState({
          correct,
          chosen,
          wasCorrect: false,
          pointsAwarded: 0,
          winnerTeamId: null,
          message: `No one got it. Correct answer: ${correct}`,
        });
        setPhase("reveal");
      } else {
        setPhase("steal");
      }

      return next;
    });
  }

  function acknowledgeReveal() {
    setRevealState(null);
    setActiveTileId(null);
    setAttemptedTeamIds(new Set());
    setArmedTeamId(null);
    setPhase("board");
  }

  function closeModal() {
    setRevealState(null);
    setActiveTileId(null);
    setAttemptedTeamIds(new Set());
    setArmedTeamId(null);
    setPhase("board");
  }

  return {
    teams,
    tiles,
    phase,
    activeTile,

    selectedTeamId,
    setSelectedTeamId,

    armedTeamId,
    armTeam,
    selectableTeams,

    pickTile,
    submitAnswer,

    revealState,
    acknowledgeReveal,

    closeModal,
  };
}
