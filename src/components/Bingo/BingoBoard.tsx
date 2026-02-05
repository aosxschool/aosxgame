import type { Team, Tile } from '../../types'
import TileCard from '../Bingo/TileCard'

export default function BingoBoard(props: {
  tiles: Tile[]
  teams: Team[]
  onTileDropTeam: (idx: number, teamId: string) => void
}) {
  return (
      <div className="board">
        {props.tiles.map((tile, idx) => (
          <TileCard
            key={tile.id}
            tile={tile}
            idx={idx}
            teams={props.teams}
            onDropTeam={(teamId) => props.onTileDropTeam(idx, teamId)}
          />
        ))}
      </div>
  )
}
