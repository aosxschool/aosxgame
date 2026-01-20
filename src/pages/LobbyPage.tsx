import { motion, AnimatePresence } from 'framer-motion'
import GlowCard from '../components/GlowCard'
import type { Team, MascotId } from '../types'
import { TEAM_COLORS, clamp, uid } from '../utils/colors'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MASCOTS, mascotById } from '../data/mascots'
import { supabase } from '../lib/supabase'

type GameOption = { code: string; label: string }

export default function LobbyPage(props: {
  onStart: (game: string, teams: Team[]) => void
}) {
  const [game, setGame] = useState<string>('')
  const [teamCount, setTeamCount] = useState<number>(2)

  const [names, setNames] = useState<Record<number, string>>({})

  const [gameOptions, setGameOptions] = useState<GameOption[]>([])

  const [gamesLoading, setGamesLoading] = useState(true)
  const [gamesError, setGamesError] = useState<string | null>(null)

  const [mascots, setMascots] = useState<Record<number, MascotId>>({})

  // dropdown open state (which team row is picking)
  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    let cancelled = false

    async function loadGames() {
      setGamesLoading(true)
      setGamesError(null)

      const { data, error } = await supabase
        .from('questions')
        .select('game_code')

      if (cancelled) return

      if (error) {
        setGamesError(error.message)
        setGameOptions([])
        setGame('')
        setGamesLoading(false)
        return
      }

      const unique = Array.from(
        new Set((data ?? []).map((r: any) => String(r.game_code ?? '').trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b))

      const opts: GameOption[] = unique.map((code) => ({
        code,
        // label: make it look nice in UI (you can change this)
        label: code.toUpperCase().replace(/_/g, ' '),
      }))

      setGameOptions(opts)
      setGame((prev) => (prev && unique.includes(prev) ? prev : (opts[0]?.code ?? '')))
      setGamesLoading(false)
    }

    loadGames()

    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (openPickerIndex === null) return
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!pickerRef.current?.contains(el)) setOpenPickerIndex(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openPickerIndex])

  const teams: Team[] = useMemo(() => {
    return Array.from({ length: teamCount }).map((_, i) => {
      const fallbackMascot = MASCOTS[i % MASCOTS.length].id
      return {
        id: uid('team'),
        name: names[i] ?? `Team ${i + 1}`,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        score: 0,
        mascotId: mascots[i] ?? fallbackMascot,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamCount, JSON.stringify(names), JSON.stringify(mascots)])


  function BouncyText({ text }: { text: string }) {
    return (
      <span className="letterBounce">
        {text.split('').map((char, i) => (
          <span key={i} className="bounceChar" style={{ animationDelay: `${i * 0.07}s` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    )
  }

  const canStart = !gamesLoading && !gamesError && !!game && gameOptions.length > 0

  return (
    <div className="page">
      <div className="hero">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <div className="brand">AOSX School Game</div>
          <h1 className="title">
            <BouncyText text="Select Your Game" />
          </h1>
          <div className="subtitle">Database can will be implemented soon.</div>
        </motion.div>
      </div>

      <div className="grid2">
        <GlowCard>
          <div className="cardTitle">Game Type</div>
          <div className="segmented">
            {gamesLoading ? (
              <button className="segBtn" disabled>
                Loading…
              </button>
            ) : gameOptions.length === 0 ? (
              <button className="segBtn" disabled>
                No games found
              </button>
            ) : (
              gameOptions.map((g) => (
              <button
                key={g.code}
                className={`segBtn ${game === g.code ? 'segActive' : ''}`}
                onClick={() => setGame(g.code)}
              >
                {g.label}
              </button>
            ))
          )}
          </div>

          {gamesError && (
            <div className="hint" style={{ marginTop: 10 }}>
              Failed to load games: {gamesError}
            </div>
          )}

          <div className="spacer" />

          <div className="cardTitle">Number of Teams</div>
          <div className="row">
            <div className="teamCounter">
              <button className="teamBtn" onClick={() => setTeamCount((c) => clamp(c - 1, 2, 4))}>
                –
              </button>
              <div className="teamCount">{teamCount}</div>
              <button className="teamBtn" onClick={() => setTeamCount((c) => clamp(c + 1, 2, 4))}>
                +
              </button>
            </div>

            <div className="hint">2 to 4 teams</div>
          </div>

          <div className="spacer" />

          <button
            className="btn primary big"
            disabled={!canStart}
            onClick={() => props.onStart(game, teams)}
          >
            Start Game
          </button>
        </GlowCard>

        <GlowCard>
          <div className="cardTitle">Teams</div>

          <div className="teamList">
            {teams.map((t, i) => {
              const m = mascotById(t.mascotId)
              const open = openPickerIndex === i

              return (
                <div key={`${t.id}-${i}`} className="teamRow">
                  <div className="teamSwatch" style={{ background: t.color }} />

                  <div className="teamInputWrap" ref={open ? pickerRef : null}>
                    <input
                      className="teamInput teamInputHasMascot"
                      value={names[i] ?? t.name}
                      onChange={(e) => setNames((p) => ({ ...p, [i]: e.target.value }))}
                    />

                    <button
                      type="button"
                      className="mascotBtn"
                      onClick={() => setOpenPickerIndex((cur) => (cur === i ? null : i))}
                      aria-label="Choose mascot"
                      title="Choose mascot"
                    >
                      <img className="mascotImg" src={m.src} alt={m.label} />
                    </button>

                    <AnimatePresence>
                      {open && (
                                        
                          <motion.div
                            className="mascotMenu"
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.16 }}
                          >
                            <div className="mascotGrid">
                              {MASCOTS.map((opt) => {
                                const active = opt.id === (mascots[i] ?? t.mascotId)

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`mascotCell ${active ? 'active' : ''}`}
                                    onClick={() => {
                                      setMascots((p) => ({ ...p, [i]: opt.id }))
                                      setOpenPickerIndex(null)
                                    }}
                                  >
                                    <img
                                      className="mascotGridImg"
                                      src={opt.src}
                                      alt={opt.label}
                                      aria-hidden={active ? 'true' : undefined}
                                    />
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>

                      )}
                        
                    </AnimatePresence>
                  </div>

                  <div className="teamMini">Score: 0</div>
                </div>
              )
            })}
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Tip: You can drag team chips onto tiles during the game.
          </div>
        </GlowCard>
      </div>

      <div className="footerNote">Bonus points: +100 points for every completed row/column of the same team color.</div>
    </div>
  )
}
