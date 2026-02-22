import CategoryTile from "./CategoryTile";
import type { Team } from "../../types";
import type { CategoryTile as CategoryTileType } from "../../pages/Team/Category/categoryTypes";

export default function CategoryCard(props: {
  title: string;
  open: boolean;
  onToggleOpen: () => void;

  tiles: CategoryTileType[];
  teamsById: Record<string, Team>; 

  onDropTeamOnTile: (tileId: number, teamId: string) => void;
}) {
  const { title, open, onToggleOpen, tiles, teamsById, onDropTeamOnTile } = props;

  const sorted = [...tiles].sort((a, b) => a.points - b.points);

  return (
    <div className={`catCard ${open ? "catCardOpen" : ""}`}>
      <button className="catHeader" onClick={onToggleOpen} type="button">
        <div className="catHeaderTitle">{title}</div>
        <div className="catHeaderChevron">{open ? "▴" : "▾"}</div>
      </button>

      {open && (
        <div className="catBody">
          <div className="catValueGrid">
            {sorted.map((t) => (
              <CategoryTile
                key={t.id}
                tile={t}
                teamsById={teamsById} 
                onDropTeam={(teamId) => onDropTeamOnTile(t.id, teamId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
