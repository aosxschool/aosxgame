import { motion } from 'framer-motion'
import GlowCard from '../components/GlowCard'
import type { GameCode, Team } from '../types'
import { TEAM_COLORS, clamp, uid } from '../utils/colors'
import { useMemo, useState } from 'react'

export default function LobbyPage(props: {
  onStart: (game: GameCode, teams: Team[]) => void
}) {
  const [game, setGame] = useState<GameCode>('2a')
  const [teamCount, setTeamCount] = useState<number>(4)

  const [names, setNames] = useState<Record<number, string>>({})

  const teams: Team[] = useMemo(() => {
    return Array.from({ length: teamCount }).map((_, i) => ({
      id: uid('team'),
      name: names[i] ?? `Team ${i + 1}`,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      score: 0,
    }))
   
  }, [teamCount, JSON.stringify(names)])

  const GAME_OPTIONS: { code: GameCode; label: string }[] = [
    { code: '2a', label: '2A' },
    { code: '2b', label: '2B' }
  ]

  function BouncyText({ text }: { text: string }) {
    return (
      <span className="letterBounce">
        {text.split('').map((char, i) => (
          <span
            key={i}
            className="bounceChar"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    )
  }


  return (
    <div className="page">
      <div className="hero">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <div className="brand">AOSX School Game</div>
          <h1 className="title"><BouncyText text="Select Your Game"/></h1>
          <div className="subtitle">Database can will be implemented soon.</div>
        </motion.div>
      </div>

      <div className="grid2">
        <GlowCard>
          <div className="cardTitle">Game Type</div>
          <div className="segmented">
            {GAME_OPTIONS.map((g) => (
              <button
                key={g.code}
                className={`segBtn ${game === g.code ? 'segActive' : ''}`}
                onClick={() => setGame(g.code)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="spacer" />

          <div className="cardTitle">Number of Teams</div>
          <div className="row">
            <div className="teamCounter">
              <button
                className="teamBtn"
                onClick={() => setTeamCount(c => clamp(c - 1, 2, 8))}
              >
                –
              </button>

              <div className="teamCount">{teamCount}</div>

              <button
                className="teamBtn"
                onClick={() => setTeamCount(c => clamp(c + 1, 2, 8))}
              >
                +
              </button>
            </div>

            <div className="hint">2 to 8 teams</div>
          </div>

          <div className="spacer" />

          <button className="btn primary big" onClick={() => props.onStart(game, teams)}>
            Start Game
          </button>
        </GlowCard>

        <GlowCard>
          <div className="cardTitle">Teams</div>
          <div className="teamList">
            {teams.map((t, i) => (
              <div key={`${t.id}-${i}`} className="teamRow">
                <div className="teamSwatch" style={{ background: t.color }} />
                <input
                  className="teamInput"
                  value={names[i] ?? t.name}
                  onChange={(e) => setNames((p) => ({ ...p, [i]: e.target.value }))}
                />
                <div className="teamMini">Score: 0</div>
              </div>
            ))}
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Tip: You can drag team chips onto tiles during the game.
          </div>
        </GlowCard>
      </div>

      <div className="footerNote">
        Bonus points: +100 points for every completed row/column of the same team color.
      </div>
    </div>
  )
}
