import { useMemo, useState } from 'react'
import BingoBoard from '../components/BingoBoard'
import QuestionModal from '../components/QuestionModal'
import TeamChipsBar from '../components/TeamChipsBar'
import CustomDragLayer from '../components/CustomDragLayer'
import CountdownOverlay from '../components/CountdownOverlay'
import QuestionRevealOverlay from '../components/QuestionRevealOverlay'
import type { GameCode, Team, Tile } from '../types'
import { QUESTIONS } from '../data/mockQuestions'
import { BONUS_POINTS, lineKeysCompleted } from '../utils/scoring'
import { burstConfetti } from '../components/Confetti'
import { sfx } from '../utils/sfx'

function buildBoardDeterministic(game: GameCode): Tile[] {
  const pool = QUESTIONS.filter((q) => q.game === game)
  const pick = pool.slice(0, 16)
  return pick.map((q, idx) => ({ id: `tile-${idx}`, question: q }))
}

function recomputeTeams(teams: Team[], tiles: Tile[]): Team[] {
  const baseByTeam = new Map<string, number>()
  for (const t of teams) baseByTeam.set(t.id, 0)

  for (const tile of tiles) {
    if (!tile.claimedByTeamId) continue
    baseByTeam.set(tile.claimedByTeamId, (baseByTeam.get(tile.claimedByTeamId) ?? 0) + tile.question.points)
  }

  const bonusByTeam = new Map<string, number>()
  for (const t of teams) {
    const lines = lineKeysCompleted(tiles, t.id)
    bonusByTeam.set(t.id, lines.length * BONUS_POINTS)
  }

  return teams.map((t) => ({
    ...t,
    score: (baseByTeam.get(t.id) ?? 0) + (bonusByTeam.get(t.id) ?? 0),
  }))
}

export default function GamePage(props: {
  game: GameCode
  teams: Team[]
  onEnd: (finalTeams: Team[]) => void
}) {
  const [teams, setTeams] = useState<Team[]>(props.teams)
  const [tiles, setTiles] = useState<Tile[]>(() => buildBoardDeterministic(props.game))

  const [selectedTeamId, setSelectedTeamId] = useState<string>(props.teams[0]?.id ?? '')
  const selectedTeam = useMemo(() => teams.find((t) => t.id === selectedTeamId) ?? null, [teams, selectedTeamId])

  // Flow states (drop-only)
  const [activeTileIndex, setActiveTileIndex] = useState<number | null>(null)
  const [pendingTileIndex, setPendingTileIndex] = useState<number | null>(null)
  const [revealOpen, setRevealOpen] = useState(false)
  const [countdownOpen, setCountdownOpen] = useState(false)

  const startQuestionFlow = (idx: number) => {
    setPendingTileIndex(idx)
    setRevealOpen(true)
  }

  const lockClaim = (tileIndex: number, teamId: string, playFx = false) => {
    const nextTiles = tiles.map((t, i) => (i === tileIndex ? { ...t, claimedByTeamId: teamId } : t))

    if (playFx) {
      const beforeLines = lineKeysCompleted(tiles, teamId).length
      const afterLines = lineKeysCompleted(nextTiles, teamId).length
      if (afterLines > beforeLines) {
        burstConfetti()
        sfx.bonus()
      }
    }

    setTiles(nextTiles)
    setTeams((prev) => recomputeTeams(prev, nextTiles))
  }

    const markWrong = () => {
    if (activeTileIndex === null || !selectedTeam) return

    const tile = tiles[activeTileIndex]
    if (!tile) return

    sfx.wrong()
    setActiveTileIndex(null) // ❗ wrong closes immediately
  }

  const markCorrect = () => {
    if (activeTileIndex === null || !selectedTeam) return

    const tile = tiles[activeTileIndex]
    if (!tile) return

    if (tile.claimedByTeamId) {
      sfx.wrong()
      setActiveTileIndex(null) 
      return
    }

    sfx.correct()
    lockClaim(activeTileIndex, selectedTeam.id, true)

  }


  const resetClaimsOnly = () => {
    const cleared = tiles.map((t) => ({ ...t, claimedByTeamId: undefined }))
    setTiles(cleared)
    setTeams((prev) => recomputeTeams(prev, cleared))
  }

  const endGame = () => {
    const sorted = [...teams].sort((a, b) => b.score - a.score)
    props.onEnd(sorted)
  }

  const onTileDropTeam = (idx: number, teamId: string) => {
    const tile = tiles[idx]
    if (!tile) return

    if (tile.claimedByTeamId) {
      sfx.wrong()
      return
    }

    const dropped = teams.find((t) => t.id === teamId)
    if (!dropped) return

    setSelectedTeamId(teamId)
    startQuestionFlow(idx)
  }

  const usedTiles = tiles.filter((t) => !!t.claimedByTeamId).length

  return (
    <div className="page">
      <div className="topbar">
        <div className="topLeft">
          <div className="badge">LIVE</div>
          <div className="topTitle">Game {props.game.toUpperCase()}</div>
          <div className="topSub">
            {usedTiles}/16 tiles claimed • Drag a team onto an empty tile to answer (locked after correct)
          </div>
        </div>
        <div className="topRight">
          <button className="btn ghost" onClick={resetClaimsOnly}>Reset Board</button>
          <button className="btn danger" onClick={endGame}>End Game</button>
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
          setRevealOpen(false)
          setCountdownOpen(true)
        }}
      />

      <CountdownOverlay
        open={countdownOpen}
        seconds={3}
        label="Question starting"
        onDone={() => {
          setCountdownOpen(false)
          if (pendingTileIndex !== null) {
            setActiveTileIndex(pendingTileIndex)
            setPendingTileIndex(null)
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
  )
}
