import { useDragLayer } from 'react-dnd'
import type { Team } from '../types'
import { DND_TYPES, type TeamDragItem } from '../utils/dnd'

function getItemStyles(currentOffset: { x: number; y: number } | null) {
  if (!currentOffset) {
    return { display: 'none' as const }
  }
  const { x, y } = currentOffset
  const transform = `translate3d(${x}px, ${y}px, 0)`
  return { transform }
}

export default function CustomDragLayer(props: { teams: Team[] }) {
  const { itemType, item, isDragging, currentOffset } = useDragLayer((monitor) => ({
    itemType: monitor.getItemType(),
    item: monitor.getItem() as TeamDragItem | null,
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }))

  if (!isDragging || itemType !== DND_TYPES.TEAM || !item) return null

  const team = props.teams.find((t) => t.id === item.teamId)
  if (!team) return null

  return (
    <div className="dragLayer">
      <div className="dragLayerItem" style={getItemStyles(currentOffset)}>
        <div className="chip chipDragPreview" style={{ borderColor: team.color }}>
          <span className="chipDot" style={{ background: team.color }} />
          <span className="chipName">{team.name}</span>
          <span className="chipScore">{team.score}</span>
        </div>
      </div>
    </div>
  )
}
