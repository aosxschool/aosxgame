import { useState } from "react";

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
  onClear,
}: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

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
      <div
        className="map-canvas"
        onWheel={(e) => {
          e.preventDefault();

          const delta = e.deltaY > 0 ? -0.1 : 0.1;

          setScale((prev) => {
            const next = prev + delta;
            return Math.min(3, Math.max(0.5, next));
          });
        }}
        onMouseDown={(e) => {
          setDragging(true);
          setLastPos({
            x: e.clientX,
            y: e.clientY,
          });
        }}
        onMouseMove={(e) => {
          if (!dragging) return;

          const dx = e.clientX - lastPos.x;
          const dy = e.clientY - lastPos.y;

          setOffset((prev) => ({
            x: prev.x + dx,
            y: prev.y + dy,
          }));

          setLastPos({
            x: e.clientX,
            y: e.clientY,
          });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        style={{
          overflow: "hidden",
          cursor: dragging ? "grabbing" : "grab",
        }}
      >
        <div
          className="map-frame"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.05s linear",
          }}
        >
          <img
            src={mapImage}
            className="map-image"
            draggable={false}
          />

          {MAP_ZONES.map((zone) => (
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