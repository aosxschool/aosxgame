import type { Team } from '../types'
import TeamChip from './TeamChip'

export default function TeamChipsBar(props: {
  teams: Team[]
  selectedTeamId: string
  onSelect: (teamId: string) => void
}) {
  return (
    <div className="chipsBar">
      <div className="chipsRow">
        {props.teams.map((t) => (
          <TeamChip
            key={t.id}
            team={t}
            selected={props.selectedTeamId === t.id}
            onClick={() => props.onSelect(t.id)}
          />
        ))}
      </div>
    </div>
  )
}
