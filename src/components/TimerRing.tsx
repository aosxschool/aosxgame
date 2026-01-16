import { useMemo } from 'react'

export default function TimerRing(props: {
  secondsLeft: number
  secondsTotal: number
}) {
  const size = 84
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  const pct = props.secondsTotal <= 0 ? 0 : props.secondsLeft / props.secondsTotal
  const dash = useMemo(() => `${c * pct} ${c}`, [c, pct])

  const urgency = props.secondsLeft <= 5

  return (
    <div className={`ring ${urgency ? 'ringUrgent' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ringBg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ringFg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={dash}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ringText">
        <div className="ringNum">{props.secondsLeft}</div>
        <div className="ringLab">sec</div>
      </div>
    </div>
  )
}
