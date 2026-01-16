import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Team, Tile } from '../types'
import TimerRing from './TimerRing'
import { sfx } from '../utils/sfx'

export default function QuestionModal(props: {
  open: boolean
  tile: Tile | null
  team: Team | null

  teams: Team[]
  selectedTeamId: string
  onSelectTeam: (teamId: string) => void

  onClose: () => void
  onCorrect: () => void
  onWrong: () => void
}) {
  const total = props.tile?.question.timeLimitSec ?? 0
  const [sec, setSec] = useState<number>(total)

  // show answer only after Correct is clicked
  const [revealed, setRevealed] = useState(false)

  // Custom dropdown open state
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)
  const teamPickerRef = useRef<HTMLDivElement | null>(null)

  // ✅ NEW: track which tile is currently shown, so we don't reset state on tile object updates
  const prevTileIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!props.open || !props.tile) return

    const tileId = props.tile.id
    const isNewTile = prevTileIdRef.current !== tileId

    if (isNewTile) {
      prevTileIdRef.current = tileId
      setSec(props.tile.question.timeLimitSec)
      setTeamMenuOpen(false)
      setRevealed(false)
    }
  }, [props.open, props.tile?.id])

  useEffect(() => {
    if (!props.open || revealed) return // stop timer after Correct
    const t = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [props.open, revealed])

  // Close only the dropdown (NOT the modal) when clicking outside
  useEffect(() => {
    if (!teamMenuOpen) return
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!teamPickerRef.current?.contains(el)) setTeamMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [teamMenuOpen])

  // Esc closes dropdown only (NOT modal)
  useEffect(() => {
    if (!props.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (teamMenuOpen) setTeamMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props.open, teamMenuOpen])

  const canAnswer = !!props.team

  const selectedTeam = useMemo(
    () => props.teams.find((t) => t.id === props.selectedTeamId) ?? null,
    [props.teams, props.selectedTeamId],
  )

  const header = useMemo(() => {
    if (!props.tile) return null
    return (
      <div className="modalHeader">
        <div className="modalPts">
          <div className="modalPtsNum">{props.tile.question.points}</div>
          <div className="modalPtsLab">points</div>
        </div>

        <TimerRing secondsLeft={sec} secondsTotal={props.tile.question.timeLimitSec} />
      </div>
    )
  }, [props.tile, sec])

  const answerText = (props.tile?.question as any)?.answer ?? 'Answer not provided.'

  return (
    <AnimatePresence>
      {props.open && props.tile && (
        <motion.div
          className="modalBackdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {}}
        >
          <motion.div
            className="modal"
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {header}

            {/* Team selection ONLY before Correct */}
            {!revealed && (
              <div className="modalTeamRow">
                <div className="modalTeamLabel">Answering team</div>

                <div className="teamPicker" ref={teamPickerRef}>
                  <button
                    type="button"
                    className="teamSelectPro"
                    onClick={() => {
                      sfx.tap()
                      setTeamMenuOpen((o) => !o)
                    }}
                    aria-expanded={teamMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span
                      className="teamDot"
                      style={{ background: selectedTeam?.color ?? 'transparent' }}
                      aria-hidden="true"
                    />
                    <span className="teamName">{selectedTeam?.name ?? 'Select team'}</span>
                    <span className="teamScore">{selectedTeam ? `${selectedTeam.score} pts` : ''}</span>
                    <span className="teamArrow" aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  <AnimatePresence>
                    {teamMenuOpen && (
                      <motion.div
                        className="teamMenu"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        role="listbox"
                      >
                        {props.teams.map((t) => {
                          const active = t.id === props.selectedTeamId
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`teamOption ${active ? 'active' : ''}`}
                              onClick={() => {
                                sfx.tap()
                                props.onSelectTeam(t.id)
                                setTeamMenuOpen(false)
                              }}
                              role="option"
                              aria-selected={active}
                            >
                              <span className="teamDot" style={{ background: t.color }} aria-hidden="true" />
                              <span className="teamName">{t.name}</span>
                              <span className="teamScore">{t.score} pts</span>
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Question stays in original spot BEFORE Correct */}
            {!revealed && <div className="modalQuestion">{props.tile.question.question}</div>}

            {/* After Correct: show question + answer */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  className="modalAnswerBlock"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="modalAnswerLabel">Question</div>
                  <div className="modalAnswerText" style={{marginBottom: 35}}>{props.tile.question.question}</div>

                  <div className="modalAnswerLabel" style={{ marginTop: 10 }}>
                    Answer
                  </div>
                  <div className="modalAnswerText" style={{fontWeight: 100, fontSize: 18}}>{answerText}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="questionFooter">
              <div
                className="modalHint"
                style={{ visibility: revealed ? 'hidden' : 'visible' }}
              >
                After a tile is marked correct, it is <b>locked</b> and cannot be replaced.
              </div>

              <div className="modalActions">
                {!revealed ? (
                  <>
                    <button
                      className="btn danger"
                      onClick={() => {
                        sfx.tap()
                        props.onWrong()
                      }}
                      disabled={!canAnswer}
                    >
                      Wrong
                    </button>

                    <button
                      className="btn success"
                      onClick={() => {
                        sfx.tap()
                        props.onCorrect()
                        setTeamMenuOpen(false)
                        setRevealed(true)
                      }}
                      disabled={!canAnswer}
                    >
                      Correct
                    </button>
                  </>
                ) : (
                  <button
                    className="btn"
                    onClick={() => {
                      sfx.tap()
                      props.onClose()
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
