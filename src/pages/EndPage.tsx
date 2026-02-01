import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Team } from '../types'
import { burstConfetti } from '../utils/Confetti'
import { sfx } from '../utils/sfx'
import TeamAvatar from '../components/Team/TeamMascot'

export default function EndPage(props: {
  teams: Team[]
  onRestart: () => void
  onLeaderboard: () => void
}) {
  const podium = [...props.teams].slice(0, 3)
  const rest = [...props.teams].slice(3)

  useEffect(() => {
    burstConfetti()
    sfx.bonus()
  }, [])


  return (
    <div className="page endPage">
      <div className="endHeader">
        <div className="endTitle">Final Results</div>
        <div className="endSub">Great job teams!</div>
      </div>

      {/* Podium */}
      <div className="podiumWrap">
        {/* 2nd */}
        {podium[1] && (
          <motion.div
            className="podiumCol podiumSecond"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.2 }}
          >
            <div className="podiumRank">2</div>
            <TeamAvatar team={props.teams[1]} size={100}/>

            <div className="podiumTeam" style={{ borderColor: podium[1].color }}>
              <span className="podiumDot" style={{ background: podium[1].color }} />
              {podium[1].name}
            </div>
            <div className="podiumScore">{podium[1].score}</div>
          </motion.div>
        )}

        {/* 1st */}
        {podium[0] && (
          <motion.div
            className="podiumCol podiumFirst"
            initial={{ y: 260, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.4 }}
            onAnimationComplete={() => burstConfetti()}
          >
            <div className="podiumCrown">👑</div>
            <TeamAvatar team={props.teams[0]} size={100}/>
            <div className="podiumRank">1</div>
            <div className="podiumTeam" style={{ borderColor: podium[0].color }}>
              <span className="podiumDot" style={{ background: podium[0].color }} />
              {podium[0].name}
            </div>
            <div className="podiumScore big">{podium[0].score}</div>
          </motion.div>
        )}

        {/* 3rd */}
        {podium[2] && (
          <motion.div
            className="podiumCol podiumThird"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.6 }}
          >
            <div className="podiumRank">3</div>
            <TeamAvatar team={props.teams[2]} size={100}/>
            <div className="podiumTeam" style={{ borderColor: podium[2].color }}>
              <span className="podiumDot" style={{ background: podium[2].color }} />
              {podium[2].name}
            </div>
            <div className="podiumScore">{podium[2].score}</div>
          </motion.div>
        )}
      </div>

      {/* Others */}
      {rest.length > 0 && (
        <div className="endOthers card">
          <div className="othersTitle">Other Teams</div>
          <div className="othersList">
            {rest.map((t, i) => (
              <div key={t.id} className="otherRow">
                <div className="otherLeft">
                  <span className="otherRank">{i + 4}
                  </span>
                  <span className="otherDot" style={{ background: t.color }} />
                  <span className="otherName">{t.name}
                    <TeamAvatar team={props.teams[i]}/>
                  </span>
                </div>
                <div className="otherScore">{t.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="endActions">
        <button className="btn" onClick={props.onRestart}>Back to home</button>
      </div>
    </div>
  )
}
