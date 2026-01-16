import { AnimatePresence, motion } from 'framer-motion'
import type { Tile, Team } from '../types'

export default function QuestionRevealOverlay(props: {
  open: boolean
  tile: Tile | null
  teams: Team[]
  onDone: () => void
}) {
  if (!props.tile) return null
  const tile = props.tile

  const claimedTeam = props.tile.claimedByTeamId
    ? props.teams.find((t) => t.id === tile.claimedByTeamId)
    : null

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className="revealWrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="revealCard"
            initial={{ scale: 0.6, opacity: 0, rotateX: 18 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            onAnimationComplete={() => {
              // hold briefly then continue
              setTimeout(() => props.onDone(), 420)
            }}
          >
            <div className="revealPts">{props.tile.question.points} pts</div>
            <div className="revealQ">{props.tile.question.question}</div>

            {claimedTeam && (
              <div className="revealOwner" style={{ borderColor: claimedTeam.color }}>
                <span className="revealDot" style={{ background: claimedTeam.color }} />
                {claimedTeam.name}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
