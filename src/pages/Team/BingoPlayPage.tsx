import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";

import BingoBoard from "../../components/Bingo/BingoBoard";
import QuestionModal from "../../components/Bingo/QuestionModal";
import TeamChipsBar from "../../components/Team/TeamChipsBar";
import CustomDragLayer from "../../components/Bingo/CustomDragLayer";
import CountdownOverlay from "../../components/Bingo/CountdownOverlay";
import QuestionRevealOverlay from "../../components/Bingo/QuestionRevealOverlay";

import type { Team, Tile } from "../../types";
import { BONUS_POINTS, lineKeysCompleted } from "../../utils/scoring";
import { burstConfetti } from "../../utils/Confetti";
import { sfx } from "../../utils/sfx";
import { loadQuestions } from "../../data/bingo_questions.api";

import EndPage from "../EndPage";
import { saveAllTeams } from "../../data/leaderboard.api";
import { toLeaderboardFields } from "../../data/leaderBoardConverter";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buildBoardFromDB(game: string): Promise<Tile[]> {
  const qs = await loadQuestions(game);
  if (qs.length !== 16) throw new Error("This game does not have exactly 16 questions");
  const shuffled = shuffle(qs);
  return shuffled.map((q, idx) => ({ id: `tile-${idx}`, question: q }));
}

function recomputeTeams(teams: Team[], tiles: Tile[]): Team[] {
  const baseByTeam = new Map<string, number>();
  for (const t of teams) baseByTeam.set(t.id, 0);

  for (const tile of tiles) {
    if (!tile.claimedByTeamId) continue;
    baseByTeam.set(
      tile.claimedByTeamId,
      (baseByTeam.get(tile.claimedByTeamId) ?? 0) + tile.question.points
    );
  }

  const bonusByTeam = new Map<string, number>();
  for (const t of teams) {
    const lines = lineKeysCompleted(tiles, t.id);
    bonusByTeam.set(t.id, lines.length * BONUS_POINTS);
  }

  return teams.map((t) => ({
    ...t,
    score: (baseByTeam.get(t.id) ?? 0) + (bonusByTeam.get(t.id) ?? 0),
  }));
}

type LobbyState = {
  teams: Team[];
  topicCode: string; // comes from lobby
};

export default function BingoPlayPage(props: {
  teams: Team[];
  game: string;
  navigate: (to: string) => void;
  gameId: "bingo";
}) {
  const { mode } = useParams<{ mode: "aos" | "aosx" }>();
  const loc = useLocation();
  const nav = loc.state as LobbyState | null;

  // ✅ if someone opens play page directly, redirect
  if (!nav?.teams?.length || !nav.topicCode || !mode) {
    return <Navigate to="/home" replace />;
  }

  // ✅ use teams from lobby (single source of truth)
  const [teams, setTeams] = useState<Team[]>(nav.teams);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(nav.teams[0]?.id ?? "");
  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const [ended, setEnded] = useState(false);

  // Flow states
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null);
  const [pendingTileIndex, setPendingTileIndex] = useState<number | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [countdownOpen, setCountdownOpen] = useState(false);

  // ✅ prevent duplicate leaderboard writes
  const endingRef = useRef(false);

  // load tiles
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    buildBoardFromDB(props.game)
      .then((t) => {
        if (!cancelled) setTiles(t);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [props.game]);

  const startQuestionFlow = (idx: number) => {
    setPendingTileIndex(idx);
    setRevealOpen(true);
  };

  const lockClaim = (tileIndex: number, teamId: string, playFx = false) => {
    const nextTiles = tiles.map((t, i) => (i === tileIndex ? { ...t, claimedByTeamId: teamId } : t));

    if (playFx) {
      const beforeLines = lineKeysCompleted(tiles, teamId).length;
      const afterLines = lineKeysCompleted(nextTiles, teamId).length;
      if (afterLines > beforeLines) {
        burstConfetti();
        sfx.bonus();
      }
    }

    setTiles(nextTiles);
    setTeams((prev) => recomputeTeams(prev, nextTiles));
  };

  const markWrong = () => {
    if (activeTileIndex === null || !selectedTeam) return;
    const tile = tiles[activeTileIndex];
    if (!tile) return;

    sfx.wrong();
    setActiveTileIndex(null);
  };

  const markCorrect = () => {
    if (activeTileIndex === null || !selectedTeam) return;
    const tile = tiles[activeTileIndex];
    if (!tile) return;

    if (tile.claimedByTeamId) {
      sfx.wrong();
      setActiveTileIndex(null);
      return;
    }

    sfx.correct();
    lockClaim(activeTileIndex, selectedTeam.id, true);
    // leave modal open; user closes or you can close:
    // setActiveTileIndex(null);
  };

  const resetClaimsOnly = () => {
    const cleared = tiles.map((t) => ({ ...t, claimedByTeamId: undefined }));
    setTiles(cleared);
    setTeams((prev) => recomputeTeams(prev, cleared));
  };

  const persistLeaderboard = useCallback(
    async (finalTeamsSorted: Team[]) => {
      if (mode === "aos" && nav.topicCode.trim().toLowerCase() === "avm") return;

      const { course, topic } = toLeaderboardFields(mode, nav.topicCode);

      await saveAllTeams(
        course,
        topic,
        finalTeamsSorted.map((t) => ({ name: t.name, score: t.score }))
      );
    },
    [mode, nav.topicCode]
  );

  const endGame = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;

    const sorted = [...teams].sort((a, b) => b.score - a.score);

    try {
      await persistLeaderboard(sorted);
    } catch (e) {
      console.error("Failed to save leaderboard:", e);
      // If you want retry when save fails:
      // endingRef.current = false;
    }

    setFinalTeams(sorted);
    setEnded(true);
  }, [teams, persistLeaderboard]);

  useEffect(() => {
    if (ended) return;
    if (tiles.length !== 16) return;

    const allClaimed = tiles.every((t) => !!t.claimedByTeamId);
    if (allClaimed) void endGame();
  }, [tiles, ended, endGame]);

  if (ended) {
    return (
      <EndPage
        teams={finalTeams}
        onRestart={() => props.navigate("/home")}
        onLeaderboard={() => props.navigate("/home")}
      />
    );
  }

  const onTileDropTeam = (idx: number, teamId: string) => {
    const tile = tiles[idx];
    if (!tile) return;

    if (tile.claimedByTeamId) {
      sfx.wrong();
      return;
    }

    const dropped = teams.find((t) => t.id === teamId);
    if (!dropped) return;

    setSelectedTeamId(teamId);
    startQuestionFlow(idx);
  };

  const usedTiles = tiles.filter((t) => !!t.claimedByTeamId).length;

  if (loading) {
    return (
      <div className="page">
        <div className="loader">Loading questions…</div>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth: "70vw"}}>
      <div className="topbar">
        <div className="topLeft">
          <div className="topTitle">Game {props.game.toUpperCase().replace(/_/g, " ")}</div>
          <div className="topSub">
            {usedTiles}/16 tiles claimed • Drag a team onto an empty tile to answer (locked after correct)
          </div>
        </div>
        <div className="topRight">
          <button className="btn ghost" onClick={resetClaimsOnly}>
            Reset Board
          </button>
          <button className="btn danger" onClick={() => void endGame()}>
            End Game
          </button>
        </div>
      </div>

      <TeamChipsBar teams={teams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />

      <BingoBoard tiles={tiles} teams={teams} onTileDropTeam={onTileDropTeam} />

      <CustomDragLayer teams={teams} />

      <QuestionRevealOverlay
        open={revealOpen}
        tile={pendingTileIndex !== null ? tiles[pendingTileIndex] : null}
        teams={teams}
        onDone={() => {
          setRevealOpen(false);
          setCountdownOpen(true);
        }}
      />

      <CountdownOverlay
        open={countdownOpen}
        seconds={3}
        label="Question starting"
        onDone={() => {
          setCountdownOpen(false);
          if (pendingTileIndex !== null) {
            setActiveTileIndex(pendingTileIndex);
            setPendingTileIndex(null);
          }
        }}
      />

      <QuestionModal
        open={activeTileIndex !== null}
        tile={activeTileIndex !== null ? tiles[activeTileIndex] : null}
        team={selectedTeam}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        onClose={() => setActiveTileIndex(null)}
        onCorrect={markCorrect}
        onWrong={markWrong}
      />
    </div>
  );
}
