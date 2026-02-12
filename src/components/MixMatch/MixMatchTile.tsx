import { useDrag, useDrop } from "react-dnd";
import type { MixMatchTile as Tile } from "../../types";
import { DND_OPTION, type DragOptionItem } from "../../utils/dnd";

type OptionMark = "correct" | "wrong";

function PlacedChip(props: {
  tileId: string;
  optionId: string;
  label: string;
  mark?: OptionMark;
  locked: boolean;

  onRemove: (tileId: string, optionId: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DND_OPTION,
    canDrag: !props.locked,
    item: {
      type: DND_OPTION,
      optionId: props.optionId,
      fromTileId: props.tileId, 
    } satisfies DragOptionItem,
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [props.locked, props.optionId, props.tileId]);

  const cls =
    props.mark === "correct"
      ? "mixMatchPlacedChipGood"
      : props.mark === "wrong"
      ? "mixMatchPlacedChipBad"
      : "mixMatchPlacedChip";

  return (
    <button
      ref={drag}
      type="button"
      className={`${cls} ${isDragging ? "mixMatchOptDragging" : ""}`}
      onClick={() => {
        if (!props.locked) props.onRemove(props.tileId, props.optionId);
      }}
      title={props.locked ? "Correct (locked)" : "Click to remove"}
      style={{ cursor: props.locked ? "not-allowed" : "grab" }}
    >
      {props.label}
    </button>
  );
}

export default function MixMatchTile(props: {
  tile: Tile;
  placedOptionIds: string[];

  submitted: boolean;
  optionStatus?: Record<string, OptionMark>;
  optionLabelById: Record<string, string>;

  onDropOption: (tileId: string, optionId: string) => void;
  onMoveOption: (fromTileId: string, toTileId: string, optionId: string) => void; 
  onRemoveOption: (tileId: string, optionId: string) => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DND_OPTION,
    drop: (item: DragOptionItem) => {
      if (item.fromTileId && item.fromTileId !== props.tile.id) {
        props.onMoveOption(item.fromTileId, props.tile.id, item.optionId);
      } else {
        props.onDropOption(props.tile.id, item.optionId);
      }
    },
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }), [props.tile.id, props.onDropOption, props.onMoveOption]);

  return (
    <div
      ref={drop}
      className={[
        "mixMatchTile",
        isOver && canDrop ? "mixMatchTileHover" : "",
      ].join(" ")}
    >
      <div className="mixMatchTileHead">
        <div className="mixMatchTileTitle">{props.tile.title}</div>
      </div>

      <div>
        {props.placedOptionIds.length === 0 ? (
          <div className="mixMatchPlaceholder">Drop here</div>
        ) : (
          props.placedOptionIds.map((optId) => {
            const mark = props.optionStatus?.[optId];
            const locked = mark === "correct"; 

            return (
              <PlacedChip
                key={optId}
                tileId={props.tile.id}
                optionId={optId}
                label={props.optionLabelById[optId] ?? optId} 
                mark={props.submitted ? mark : undefined}
                locked={locked}
                onRemove={props.onRemoveOption}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
