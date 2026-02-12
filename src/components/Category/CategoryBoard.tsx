// src/components/Category/CategoryBoard.tsx
import { useMemo } from "react";
import type { Team } from "../../types";
import CategoryTile from "./CategoryTile";
import type { CategoryTile as CatTile } from "../../pages/Team/Category/categoryTypes";

function uniqPreserveOrder(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    if (!x) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

export default function CategoryBoard(props: {
  tiles: CatTile[];
  teamsById: Record<string, Team>; // ✅ required now
  onDropTeamOnTile: (tileId: number, teamId: string) => void;

  selectedTeamId?: string;
  onClickPick?: (tileId: number, teamId: string) => void;
}) {
  const categories = useMemo(() => uniqPreserveOrder(props.tiles.map((t) => t.category)), [props.tiles]);

  const pointRows = useMemo(() => {
    const pts = Array.from(
      new Set(props.tiles.map((t) => t.points).filter((p) => Number.isFinite(p)))
    ) as number[];
    pts.sort((a, b) => a - b);
    return pts;
  }, [props.tiles]);

  const tileByCatPoints = useMemo(() => {
    const m = new Map<string, CatTile>();
    for (const t of props.tiles) m.set(`${t.category}__${t.points}`, t);
    return m;
  }, [props.tiles]);

  const colCount = Math.max(1, categories.length);

  return (
    <div className="catGridBoard" role="grid" aria-label="Category board">
      <div
        className="catHeaderRow"
        style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {categories.map((cat) => (
          <div key={cat} className="catHeaderCell">
            {cat}
          </div>
        ))}
      </div>

      <div
        className="catBodyGrid"
        style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {pointRows.map((pts) =>
          categories.map((cat) => {
            const tile = tileByCatPoints.get(`${cat}__${pts}`) ?? null;

            if (!tile) {
              return (
                <div key={`${cat}-${pts}-missing`} className="catTile catTileMissing" aria-disabled="true">
                  <div className="catTilePts">{pts}</div>
                </div>
              );
            }

            return (
              <CategoryTile
                key={`${cat}-${pts}-${tile.id}`}
                tile={tile}
                teamsById={props.teamsById} // ✅ pass map
                onDropTeam={(teamId) => props.onDropTeamOnTile(tile.id, teamId)}
                onClickPick={
                  props.onClickPick && props.selectedTeamId
                    ? () => props.onClickPick!(tile.id, props.selectedTeamId!)
                    : undefined
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}
