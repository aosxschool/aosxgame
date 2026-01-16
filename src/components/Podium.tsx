import { motion } from 'framer-motion'
import type { Team } from '../types'

export default function Podium(props: { teams: Team[] }) {
  const top = props.teams.slice(0, 3)
  const [first, second, third] = [top[0], top[1], top[2]]

  return (
    <div className="podiumWrap">
      {second && (
        <motion.div
          className="podiumCard podiumSecond"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 26 }}
        >
          <div className="podiumRank">2</div>
          <div className="podiumName">
            <span className="podiumDot" style={{ background: second.color }} />
            {second.name}
          </div>
          <div className="podiumScore">{second.score}</div>
        </motion.div>
      )}

      {first && (
        <motion.div
          className="podiumCard podiumFirst"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.0, type: 'spring', stiffness: 420, damping: 22 }}
        >
          <div className="podiumCrown">👑</div>
          <div className="podiumRank">1</div>
          <div className="podiumName">
            <span className="podiumDot" style={{ background: first.color }} />
            {first.name}
          </div>
          <div className="podiumScore">{first.score}</div>
        </motion.div>
      )}

      {third && (
        <motion.div
          className="podiumCard podiumThird"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 360, damping: 26 }}
        >
          <div className="podiumRank">3</div>
          <div className="podiumName">
            <span className="podiumDot" style={{ background: third.color }} />
            {third.name}
          </div>
          <div className="podiumScore">{third.score}</div>
        </motion.div>
      )}
    </div>
  )
}
