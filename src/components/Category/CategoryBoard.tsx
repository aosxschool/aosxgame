import { useMemo } from "react";
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
  onDropTeamOnTile: (tileId: number, teamId: string) => void;

  // optional click-to-pick
  selectedTeamId?: string;
  onClickPick?: (tileId: number, teamId: string) => void;
}) {
  // ✅ categories = unique categories found (no slice(0,5))
  const categories = useMemo(() => {
    return uniqPreserveOrder(props.tiles.map((t) => t.category));
  }, [props.tiles]);

  // ✅ point rows = unique points found (sorted ascending)
  const pointRows = useMemo(() => {
    const pts = Array.from(
      new Set(props.tiles.map((t) => t.points).filter((p) => Number.isFinite(p)))
    ) as number[];

    pts.sort((a, b) => a - b);
    return pts;
  }, [props.tiles]);

  // ✅ lookup tile by (category, points)
  const tileByCatPoints = useMemo(() => {
    const m = new Map<string, CatTile>();
    for (const t of props.tiles) {
      m.set(`${t.category}__${t.points}`, t);
    }
    return m;
  }, [props.tiles]);

  // ✅ dynamic column count
  const colCount = Math.max(1, categories.length);

  return (
    <div className="catGridBoard" role="grid" aria-label="Category board">
      {/* HEADER ROW (dynamic columns) */}
      <div
        className="catHeaderRow"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        }}
      >
        {categories.map((cat) => (
          <div key={cat} className="catHeaderCell">
            {cat}
          </div>
        ))}
      </div>

      {/* BODY GRID (dynamic columns + dynamic rows) */}
      <div
        className="catBodyGrid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
        }}
      >
        {pointRows.map((pts) =>
          categories.map((cat) => {
            const tile = tileByCatPoints.get(`${cat}__${pts}`) ?? null;

            // If missing tile in DB, render a disabled placeholder
            if (!tile) {
              return (
                <div
                  key={`${cat}-${pts}-missing`}
                  className="catTile catTileMissing"
                  aria-disabled="true"
                >
                  <div className="catTilePts">{pts}</div>
                  <div className="catTileSub">{cat}</div>
                </div>
              );
            }

            return (
              <CategoryTile
                key={`${cat}-${pts}-${tile.id}`}
                tile={tile}
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
