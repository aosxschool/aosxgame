import { motion } from 'framer-motion'
import GlowCard from '../components/GlowCard'
import type { Team } from '../types'
import { useMemo, useState } from 'react'

type Tab = '2a' | '2b' | 'total'

export default function LeaderboardPage(props: {
  teams: Team[]
  onBack: () => void
}) {
  const [tab, setTab] = useState<Tab>('total')

  const rows = useMemo(() => [...props.teams].sort((a, b) => b.score - a.score), [props.teams, tab])

  return (
    <div className="page">
      <div className="hero compact">
        <div className="brand">Bingo Host</div>
        <h1 className="title">Leaderboard</h1>
        <div className="subtitle">Placeholder tabs for 2A / 2B / Total</div>
      </div>

      <div className="grid1">
        <GlowCard>
          <div className="tabs">
            {(['2a','2b','total'] as Tab[]).map((t) => (
              <button key={t} className={`tabBtn ${tab === t ? 'tabActive' : ''}`} onClick={() => setTab(t)}>
                {t.toUpperCase()}
              </button>
            ))}
            <motion.div
              className="tabUnderline"
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{
                left: tab === '2a' ? '0%' : tab === '2b' ? '33.33%' : '66.66%',
              }}
            />
          </div>

          <div className="rankList">
            {rows.map((t, i) => (
              <motion.div
                className="rankRow"
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <div className="rankLeft">
                  <div className="rankNum">#{i + 1}</div>
                  <div className="rankDot" style={{ background: t.color }} />
                  <div className="rankName">{t.name}</div>
                </div>
                <div className="rankScore">{t.score}</div>
              </motion.div>
            ))}
          </div>

          <div className="endActions">
            <button className="btn ghost" onClick={props.onBack}>Back</button>
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
