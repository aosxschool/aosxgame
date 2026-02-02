import { useState } from "react";
import { MAP_ZONES, ANSWERS } from "../../data/dragDropData";
``
import mapImage from "../../assets/map/map.png";
import ResultModal from "./ResultModal"; 
type Props = {
  placements: Record<string, string>;
  showCorrect: boolean;              
  onToggleCorrect: () => void;       
  onRetry: () => void;
  time: number;                     
  penalty: number;                   
};

export default function ReviewCanvas({
  placements,
  showCorrect,
  onToggleCorrect,
  onRetry,
  time,
  penalty
}: Props) {
  const [showScore, setShowScore] = useState(false); 

  return (
    <section className="map-section">
      {/* TOP BAR */}
      <div className="map-header">
        <div className="review-title">
          {showCorrect ? "Correct Answers" : "Your Answers"}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-pill" onClick={onRetry}>
            RETRY
          </button>

          <button className="btn-pill" onClick={onToggleCorrect}>
            {showCorrect ? "BACK" : "VIEW CORRECT ANSWERS"}
          </button>

          <button className="btn-pill" onClick={() => setShowScore(true)}>
            VIEW SCORE
          </button>
        </div>
      </div>

      {/* MAP */}
      <div className="map-canvas">
        <div className="map-frame">
          <img src={mapImage} className="map-image" draggable={false} />

          {MAP_ZONES.map(zone => {
            const userLabel = placements[zone.id];
            const correctLabel = (ANSWERS as Record<string, string>)[zone.id];
            const isCorrect = userLabel === correctLabel;

            const shownLabel = showCorrect
              ? isCorrect
                ? userLabel
                : correctLabel
              : userLabel;

            const pillClass = showCorrect
              ? isCorrect
                ? "zone-result zone-correct"
                : "zone-result zone-correct-orange"
              : isCorrect
              ? "zone-result zone-correct"
              : "zone-result zone-wrong";

            return (
              <div
                key={zone.id}
                className="zone-hitbox"
                style={{
                  position: "absolute",
                  left: `${zone.leftPct * 100}%`,
                  top: `${zone.topPct * 100}%`,
                  width: `${zone.widthPct * 100}%`,
                  height: `${zone.heightPct * 100}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {shownLabel && (
                  <div key={shownLabel} className={`zone-pill ${pillClass}`}>
                    {shownLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SCORE MODAL */}
      {showScore && (
        <ResultModal
          time={time}
          penalty={penalty}
          title="Score Summary"
          actionLabel="CLOSE"
          onAction={() => setShowScore(false)}
        />
      )}
    </section>
  );
}
