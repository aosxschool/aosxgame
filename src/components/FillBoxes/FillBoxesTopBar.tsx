export default function FillBoxesTopBar(props: {
  title: string;
  timeLabel: string;

  onOpenPassage: () => void;
  onClear: () => void;
  onAutoFill: () => void; 

}) {
  return (
    <div className="topbar">
      <div className="topLeft">
        <div className="topTitle">{props.title}</div>
        <div className="topSub">Fill the blanks using the passage.</div>
      </div>

      <div className="topRight" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div className="timerPill">{props.timeLabel}</div>

        <button className="btn-pill" onClick={props.onOpenPassage}>
          PASSAGE
        </button>

        {/* <button className="btn-pill" onClick={props.onAutoFill}>
          AUTO FILL
        </button> */}

        <button className="btn-pill" onClick={props.onClear}>
          CLEAR
        </button>
      </div>
    </div>
  );
}
