// src/components/MixMatch/MixMatchBoard.tsx
import type { MixMatchPuzzle, PlacementMap } from "../../types";
import MixMatchTile from "./MixMatchTile";

type OptionMark = "correct" | "wrong";

export default function MixMatchBoard(props: {
  puzzle: MixMatchPuzzle;
  placements: PlacementMap;
  submitted: boolean;

  optionStatus?: Record<string, OptionMark>;
  optionLabelById: Record<string, string>;

  onDropOption: (tileId: string, optionId: string) => void;
  onMoveOption: (fromTileId: string, toTileId: string, optionId: string) => void;
  onRemoveOption: (tileId: string, optionId: string) => void;
}) {
  return (
    <div className="mixMatchBoardWrap">
      <div className="mixMatchBoard">
        {props.puzzle.tiles.map((tile) => (
          <MixMatchTile
            key={tile.id}
            tile={tile}
            placedOptionIds={props.placements[tile.id] ?? []}
            submitted={props.submitted}
            optionStatus={props.optionStatus}
            optionLabelById={props.optionLabelById}
            onDropOption={props.onDropOption}
            onMoveOption={props.onMoveOption} 
            onRemoveOption={props.onRemoveOption}
          />
        ))}
      </div>
    </div>
  );
}
