import TeamChipsBar from "../Team/TeamChipsBar";
import type {Team} from "../../types"

export default function MixMatchTopBar(props: {
  title: string;
  subtitle: string;
  timeLabel: string;

  submitted: boolean;
  allCorrect: boolean;
  canSubmit: boolean;
  showCorrectBoard?: boolean;
  onToggleCorrectBoard?: () => void;
  onReturnHome?: () => void;

  onSubmit: () => void;
  onReset: () => void;
  onViewScore?: () => void;
  onAutoFill?: () => void;
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
        {!props.submitted && (
          <button
            type="button"
            className="btn-pill"
            onClick={props.onReset}
          >
            Reset
          </button>
        )}

        {props.submitted && (
          <>
            <button
              type="button"
              className="btn-pill"
              onClick={props.onToggleCorrectBoard}
            >
              {props.showCorrectBoard
                ? "Back"
                : "View Correct Answers"}
            </button>
            
            <button
              type="button"
              className="btn-pill"
              onClick={props.onViewScore}
            >
              View Score
            </button>

            <button
              type="button"
              className="btn-pill"
              onClick={props.onReturnHome}
            >
              Return Home
            </button>
          </>
        )}

        {props.onAutoFill && !props.submitted && (
          <button
            type="button"
            className="btn ghost"
            onClick={props.onAutoFill}
          >
            Auto Fill
          </button>
        )}

        {!props.submitted && (
          <button
            type="button"
            className={
              props.canSubmit && !props.allCorrect
                ? "btn-pill"
                : "btn primary"
            }
            onClick={props.onSubmit}
            disabled={!props.canSubmit || props.allCorrect}
            style={{
              opacity:
                !props.canSubmit || props.allCorrect
                  ? 0.5
                  : 1,
              cursor:
                !props.canSubmit || props.allCorrect
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
