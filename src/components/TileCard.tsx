import { useDrop } from 'react-dnd'
import type { Team, Tile } from '../types'
import { motion } from 'framer-motion'
import { DND_TYPES, type TeamDragItem } from '../utils/dnd'
import { sfx } from '../utils/sfx'

export default function TileCard(props: {
  tile: Tile
  idx: number
  teams: Team[]
  onDropTeam: (teamId: string) => void
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: DND_TYPES.TEAM,
      drop: (item: TeamDragItem) => {
        props.onDropTeam(item.teamId)
        sfx.tap()
        return { tileId: props.tile.id }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [props.tile.id, props.onDropTeam],
  )

  const claimedTeam = props.tile.claimedByTeamId
    ? props.teams.find((t) => t.id === props.tile.claimedByTeamId)
    : undefined

  const isClaimed = !!props.tile.claimedByTeamId

  return (
    <motion.div
      ref={dropRef}
      className={`tile tileNoClick ${isClaimed ? 'tileClaimed' : ''} ${isOver && canDrop ? 'tileOver' : ''}`}
      layout
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      style={{ perspective: 1000 }}
      role="button"
      aria-label={isClaimed ? 'Tile already claimed' : 'Drop a team here to answer'}
      tabIndex={0}
    >
      <motion.div
        key={`${props.tile.claimedByTeamId ?? 'none'}`}
      >
        <div className="tileTop">
          <div className="tilePoints">{props.tile.question.points}</div>
          <div className="tilePtsLabel">PTS</div>
        </div>

        <div className="tileQ">{props.tile.question.question}</div>

        {claimedTeam && (
          <>
            <motion.div
              className="tileOverlay"
              style={{ background: claimedTeam.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
            />
            <motion.div
              className="tileBadge"
              style={{ borderColor: claimedTeam.color }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            >
              <span className="tileBadgeDot" style={{ background: claimedTeam.color }} />
              {claimedTeam.name}
            </motion.div>
          </>
        )}
      </motion.div>

      <div className="tileHint" aria-hidden={isClaimed ? true : undefined}>
        Drag a team here
      </div>
    </motion.div>
  )
}
