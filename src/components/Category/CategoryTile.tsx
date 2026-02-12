// src/components/Category/CategoryTile.tsx
import { useDrop } from "react-dnd";
import type { Team } from "../../types";
import type { CategoryTile as CatTile } from "../../pages/Team/Category/categoryTypes";

/**
 * Bingo-like color treatment:
 * - Tile background = a lighter translucent tint of team color
 * - Pill background = solid team color
 */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function CategoryTile(props: {
  tile: CatTile;
  teamsById: Record<string, Team>;
  onDropTeam: (teamId: string) => void;
  onClickPick?: () => void;
}) {
  const claimedTeam = props.tile.claimedByTeamId
    ? props.teamsById[props.tile.claimedByTeamId] ?? null
    : null;

  const disabled = !!props.tile.claimedByTeamId;

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

  // Bingo-like: tile tint is lighter, pill is darker/solid
  const tileStyle = claimedTeam
    ? ({
        background: rgba(claimedTeam.color, 0.45), 
      } as const)
    : undefined;

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
      title={disabled ? "Already claimed" : "Drop a team here"}
      style={tileStyle}
    >
      <div className="catTilePts">{props.tile.points} PTS</div>

      {claimedTeam && (
        <div className="catClaimPillWrap">
          <span className="catClaimPill" style={{ borderColor:  claimedTeam.color }}>
            <span className="catTeamDot" style={{backgroundColor: claimedTeam.color}}></span>
            {claimedTeam.name}
          </span>
        </div>
      )}
    </button>
  );
}
