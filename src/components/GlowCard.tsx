import { PropsWithChildren } from 'react'

export default function GlowCard(
  props: PropsWithChildren<{ className?: string; style?: React.CSSProperties }>
) {
  return (
    <div className={`card ${props.className ?? ''}`} style={props.style}>
      {props.children}
    </div>
  )
}
