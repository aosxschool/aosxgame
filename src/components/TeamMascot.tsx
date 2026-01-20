import type { Team } from '../types'
import { mascotById } from '../data/mascots'

export default function TeamAvatar(props: {
  team: Team
  size?: number
}) {
  const size = props.size
  const m = mascotById(props.team.mascotId)

  return (
    <img
      src={m.src}
      alt={m.label}
      className={'mascotImg'}
      style={{height: size}}
    />
  )
}
