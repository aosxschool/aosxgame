import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Team } from "../../../types";

import { loadCategoryQuestions } from "../../../data/category_questions.api";

import TeamChipsBar from "../../../components/Team/TeamChipsBar";
import CustomDragLayer from "../../../components/Bingo/CustomDragLayer";
import CategoryBoard from "../../../components/Category/CategoryBoard";
import CategoryQuestionModel from "../../../components/Category/CategoryQuestionModel";

import type { CategoryTile } from "./categoryTypes";
import { useCategoryGame } from "./useCategoryGame";

import EndPage from "../../EndPage"

type LocationState = {
  teams: Team[];
  topicCode: string; // "bvm" or "mod1"
};



export default function CategoryPlaypage(props: { navigate: (to: string) => void; gameId: "category" }) {
  const loc = useLocation()
  const nav = loc.state as LocationState | null

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [builtTiles, setBuiltTiles] = useState<CategoryTile[]>([])

  const [ended, setEnded] = useState(false)
  const [finalTeams, setFinalTeams] = useState<Team[]>([])

  const topicCode = nav?.topicCode ?? ""
  const initialTeams = nav?.teams ?? []

  useEffect(() => {
    if (!topicCode) return

    let cancelled = false
    async function run() {
      setLoading(true)
      setErr(null)
      try {
        const rows = await loadCategoryQuestions(topicCode)

        const tiles: CategoryTile[] = rows.map((q, i) => ({
          id: i + 1,
          category: q.category,
          points: q.points,
          used: false,
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
        }))

        if (!cancelled) setBuiltTiles(tiles)
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message ?? e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [topicCode])

  const game = useCategoryGame({
    initialTeams,
    tiles: builtTiles,
  })

  function endGame() {
    const sorted = [...game.teams].sort((a, b) => b.score - a.score)
    setFinalTeams(sorted)
    setEnded(true)
  }

  useEffect(() => {
    if (ended) return
    if (game.tiles.length === 0) return

    const allUsed = game.tiles.every((t) => t.used)
    if (allUsed) endGame()
  }, [game.tiles, ended])

  // ✅ now you can safely do early returns
  if (!nav?.teams?.length || !nav.topicCode) {
    return <Navigate to="/home" replace />
  }

  if (ended) {
    return (
      <EndPage
        teams={finalTeams}
        onRestart={() => props.navigate("/home")}
        onLeaderboard={() => props.navigate("/home")}
      />
    )
  }

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="loader">Loading category questions…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="hint">Failed: {err}</div>
      </div>
    )
  }

  if (!builtTiles.length) {
    return (
      <div className="page" style={{ maxWidth: "80%" }}>
        <div className="hint">
          No category questions found for <b>{nav.topicCode}</b>.
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{maxWidth: "80%"}}>
        <div className="topbar">
        <div className="topLeft">
          <div className="topTitle">Category</div>
          <div className="topSub">
            Module: <b>{nav.topicCode.toUpperCase()}</b> • Drag a team onto a points tile to answer
          </div>
        </div>

        <div className="topRight">
          <button className="btn danger" onClick={endGame}>
            End Game
          </button>
        </div>
      </div>

      {/* draggable chips reused from bingo */}
      <TeamChipsBar
        teams={game.teams}
        selectedTeamId={game.selectedTeamId}
        onSelect={game.setSelectedTeamId} // selection still ok even if you drag
      />

      {/* 5×5 board: headers + point tiles */}
      <CategoryBoard
        tiles={game.tiles}
        onDropTeamOnTile={(tileId, teamId) => game.pickTile(tileId, teamId)}
        // optional click fallback:
        // selectedTeamId={game.selectedTeamId}
        // onClickPick={(tileId, teamId) => game.pickTile(tileId, teamId)}
      />

      <CustomDragLayer teams={game.teams} />

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
