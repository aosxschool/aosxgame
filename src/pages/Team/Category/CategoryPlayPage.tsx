import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import type { Team } from "../../../types";

import { loadCategoryQuestions } from "../../../data/category_questions.api";

import TeamChipsBar from "../../../components/Team/TeamChipsBar";
import CustomDragLayer from "../../../components/Bingo/CustomDragLayer";
import CategoryBoard from "../../../components/Category/CategoryBoard";
import CategoryQuestionModel from "../../../components/Category/CategoryQuestionModel";

import QuestionRevealOverlay from "../../../components/Bingo/QuestionRevealOverlay";
import CountdownOverlay from "../../../components/Bingo/CountdownOverlay";

import type { CategoryTile } from "./categoryTypes";
import { useCategoryGame } from "./useCategoryGame";

import EndPage from "../../EndPage";

import { saveAllTeams } from "../../../data/leaderboard.api";
import { toLeaderboardFields } from "../../../data/leaderBoardConverter";

type LocationState = {
  teams: Team[];
  topicCode: string;
};

export default function CategoryPlaypage(props: {
  navigate: (to: string) => void;
  gameId: "category";
}) {
  const loc = useLocation();
  const nav = loc.state as LocationState | null;
  const { mode } = useParams<{ mode: "aos" | "aosx" }>();

  // ✅ hooks must run regardless of nav
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [builtTiles, setBuiltTiles] = useState<CategoryTile[]>([]);

  const [ended, setEnded] = useState(false);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);

  const endingRef = useRef(false);

  const [pendingPick, setPendingPick] = useState<{ tileId: number; teamId: string } | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [countdownOpen, setCountdownOpen] = useState(false);

  // ✅ derive safe values even when nav is null
  const topicCode = nav?.topicCode ?? "";
  const initialTeams = nav?.teams ?? [];

  // ✅ create game hook ALWAYS (even if initialTeams empty)
  const game = useCategoryGame({
    initialTeams,
    tiles: builtTiles,
  });

  const persistLeaderboard = useCallback(
    async (finalTeamsToSave: Team[]) => {
      if (!mode || !topicCode) return;

      const { course, topic } = toLeaderboardFields(mode, topicCode);

      await saveAllTeams(
        course,
        topic,
        finalTeamsToSave.map((t) => ({ name: t.name, score: t.score }))
      );
    },
    [mode, topicCode]
  );

  // ✅ load questions only if topicCode exists
  useEffect(() => {
    if (!topicCode) {
      setLoading(false);
      setBuiltTiles([]);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);

      try {
        const rows = await loadCategoryQuestions(topicCode);

        const tiles: CategoryTile[] = rows.map((q, i) => ({
          id: i + 1,
          category: q.category,
          points: q.points,

          // keep your type satisfied
          used: false,
          solvedByTeamId: undefined,
          claimedByTeamId: undefined,

          question: {
            id: q.id,
            game_code: q.game_code,
            category: q.category,
            points: q.points,
            question: q.question,
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d,
            correct: q.correct_option,
          },
        }));

        if (!cancelled) setBuiltTiles(tiles);
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [topicCode]);

  const endGame = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;

    const sorted = [...game.teams].sort((a, b) => b.score - a.score);

    try {
      await persistLeaderboard(sorted);
    } catch (e) {
      console.error("Failed to save leaderboard:", e);
    }

    setFinalTeams(sorted);
    setEnded(true);
  }, [game.teams, persistLeaderboard]);

  // ✅ end when all used
  useEffect(() => {
    if (ended) return;
    if (game.tiles.length === 0) return;

    const allUsed = game.tiles.every((t) => t.used);
    if (allUsed) void endGame();
  }, [game.tiles, ended, endGame]);

  const teamsById = useMemo(() => {
    const m: Record<string, Team> = {};
    for (const t of game.teams) m[t.id] = t;
    return m;
  }, [game.teams]);

  const pendingTile = pendingPick ? game.tiles.find((t) => t.id === pendingPick.tileId) : null;

  // ✅ NOW do early returns (after hooks)
  if (!nav?.teams?.length || !nav.topicCode) {
    return <Navigate to="/home" replace />;
  }

  if (ended) {
    return (
      <EndPage
        teams={finalTeams}
        onRestart={() => props.navigate("/home")}
        onLeaderboard={() => props.navigate("/home")}
      />
    );
  }

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="loader">Loading category questions…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="hint">Failed: {err}</div>
      </div>
    );
  }

  if (!builtTiles.length) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="hint">
          No category questions found for <b>{nav.topicCode}</b>.
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "80%" }}>
      <div className="topbar">
        <div className="topLeft">
          <div className="topTitle">Category</div>
          <div className="topSub">
            Module: <b>{nav.topicCode.toUpperCase()}</b> • Drag a team onto a points tile to answer
          </div>
        </div>

        <div className="topRight">
          <button className="btn danger" onClick={() => void endGame()}>
            End Game
          </button>
        </div>
      </div>

      <TeamChipsBar teams={game.teams} selectedTeamId={game.selectedTeamId} onSelect={game.setSelectedTeamId} />

      <CategoryBoard
        tiles={game.tiles}
        teamsById={teamsById}
        onDropTeamOnTile={(tileId, teamId) => {
          const tile = game.tiles.find((t) => t.id === tileId);
          if (!tile || tile.used) return;

          setPendingPick({ tileId, teamId });
          setRevealOpen(true);
        }}
      />

      <CustomDragLayer teams={game.teams} />

      <QuestionRevealOverlay
        open={revealOpen}
        tile={
          pendingTile
            ? ({
                id: `cat-${pendingTile.id}`,
                claimedByTeamId: undefined,
                question: {
                  category: pendingTile.category,
                  points: pendingTile.points,
                  question: "",
                },
              } as any)
            : null
        }
        teams={game.teams}
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
          if (!pendingPick) return;

          game.pickTile(pendingPick.tileId, pendingPick.teamId);
          setPendingPick(null);
        }}
      />

      <CategoryQuestionModel
        open={game.phase !== "board" && !!game.activeTile}
        phase={game.phase === "board" ? "question" : game.phase}
        teams={game.selectableTeams}
        selectedTeamId={game.selectedTeamId}
        onSelectTeam={game.setSelectedTeamId}
        armedTeamId={game.armedTeamId}
        onArmTeam={game.armTeam}
        category={game.activeTile?.category ?? ""}
        value={game.activeTile?.points ?? 0}
        question={game.activeTile?.question.question ?? ""}
        answers={{
          A: game.activeTile?.question.a ?? "",
          B: game.activeTile?.question.b ?? "",
          C: game.activeTile?.question.c ?? "",
          D: game.activeTile?.question.d ?? "",
        }}
        onAnswer={game.submitAnswer}
        revealState={game.revealState}
        onAcknowledgeReveal={game.acknowledgeReveal}
        onClose={game.closeModal}
      />
    </div>
  );
}
