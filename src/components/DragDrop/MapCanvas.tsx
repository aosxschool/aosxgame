import DropZone from "./DropZone";
import { MAP_ZONES } from "../../data/dragDropData";
import mapImage from "../../assets/map/map.png";

type Props = {
  placements: Record<string, string>;
  incorrectZones: string[];
  correctZones: string[]; 
  onDrop: (zoneId: string, itemId: string, fromZoneId?: string) => void;
  time: number;
  onFinish: () => void;
  onClear: () => void;
};

export default function MapCanvas({
  placements,
  incorrectZones,
  correctZones, 
  onDrop,
  time,
  onFinish,
  onClear
}: Props) {
  return (
    <section className="map-section">
      {/* TOP BAR */}
      <div className="map-header">
        <div className="map-timer">⏱ {time}s</div>

        <div style={{ display: "flex", gap: "20px" }}>
          <button className="btn-pill" onClick={onClear}>
            CLEAR
          </button>

          <button className="btn-pill" onClick={onFinish}>
            FINISH
          </button>
        </div>
      </div>

      {/* MAP */}
      <div className="map-canvas">
        <div className="map-frame">
          <img src={mapImage} className="map-image" draggable={false} />

          {MAP_ZONES.map(zone => (
            <DropZone
              key={zone.id}
              zone={zone}
              placedItem={placements[zone.id]}
              incorrect={incorrectZones.includes(zone.id)}
              correct={correctZones.includes(zone.id)}
              onDrop={onDrop}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
