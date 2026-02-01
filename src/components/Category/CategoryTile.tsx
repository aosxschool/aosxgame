import { useDrop } from "react-dnd";
import type { CategoryTile as CatTile } from "../../pages/Team/Category/categoryTypes";

export default function CategoryTile(props: {
  tile: CatTile;
  onDropTeam: (teamId: string) => void;
  onClickPick?: () => void; // optional fallback
}) {
  const disabled = props.tile.used;

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: "TEAM",
      canDrop: () => !disabled,
      drop: (item: { teamId: string }) => {
        if (disabled) return;
        props.onDropTeam(item.teamId);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [disabled, props.onDropTeam]
  );

  return (
    <button
      ref={dropRef as any}
      type="button"
      className={[
        "catTile",
        disabled ? "catTileUsed" : "",
        canDrop ? "catTileCanDrop" : "",
        isOver && canDrop ? "catTileOver" : "",
      ].join(" ")}
      onClick={props.onClickPick}
      disabled={disabled && !props.onClickPick}
      title={disabled ? "Already used" : "Drop a team here"}
    >
      <div className="catTilePts">{props.tile.points} PTS</div>
    </button>
  );
}
