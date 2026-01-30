import TeamChipsBar from "../Team/TeamChipsBar";
import type {Team} from "../../types"

export default function MixMatchTopBar(props: {
  title: string;
  subtitle: string;
  timeLabel: string;

  submitted: boolean;
  allCorrect: boolean;
  canSubmit: boolean;

  onSubmit: () => void;
  onReset: () => void;

  teams?: Team[];
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}) {

  const showTeams =
  props.teams &&
  props.teams.length > 0 &&
  props.selectedTeamId &&
  props.onSelectTeam;
  return (
    <div className="map-header" style={{background: "none", border:"none"}}>
      {showTeams && (
        <div className="mixMatchTopTeams">
          <TeamChipsBar
            teams={props.teams!}
            selectedTeamId={props.selectedTeamId!}
            onSelect={props.onSelectTeam!}
          />
        </div>
      )}
      <div className="timer-group">
        <div className="map-timer">
            <div className="mixMatchTimerValue">⏱ {props.timeLabel}</div>
        </div>
        <div className="topLeft">
          <div className="topTitle">{props.title}</div>
          <div className="topSub">{props.subtitle}</div>
        </div>
      </div>
        <div className="topRight">
      
        

        <button className="btn ghost" onClick={props.onReset}>
          Reset
        </button>

        {!props.allCorrect && (
          <button className="btn primary" onClick={props.onSubmit} disabled={!props.canSubmit}>
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
