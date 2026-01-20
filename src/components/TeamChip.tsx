import { useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import type { Team } from '../types'
import { DND_TYPES, type TeamDragItem } from '../utils/dnd'
import TeamAvatar from './TeamMascot'

export default function TeamChip(props: {
  team: Team
  selected?: boolean
  onClick?: () => void
}) {
  const [{ isDragging }, dragRef, preview] = useDrag(() => ({
    type: DND_TYPES.TEAM,
    item: { type: DND_TYPES.TEAM, teamId: props.team.id } satisfies TeamDragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [props.team.id])

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  

  return (
    <button
      ref={dragRef}
      className={`chip ${props.selected ? 'chipSelected' : ''}`}
      style={{
        borderColor: props.team.color,
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={props.onClick}
    >
      <TeamAvatar team={props.team}/>
      <span className="chipName">{props.team.name}</span>
      <span className="chipScore">{props.team.score}</span>
    </button>
  )
}
