import type { FillBoxesPuzzle } from "../../types";
import type { FillBoxesState } from "../../utils/fillBoxes";

export default function FillBoxesGrid(props: {
  puzzle: FillBoxesPuzzle;
  state: FillBoxesState;
  onChangeCell: (r: number, c: number, value: string) => void;
}) {
  const { rows, cols } = props.puzzle;

  return (
    <div
      className="fillGrid"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: 15,
      }}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const k = `${r},${c}`;
          const v = props.state.values[k] ?? "";
          const locked = !!props.state.locked[k];
          const status = props.state.status[k] ?? "neutral";

          const baseCls =
            status === "correct"
              ? "fillCell fillCellCorrect"
              : status === "wrong"
              ? "fillCell fillCellWrong"
              : "fillCell";

          const posCls = [
            r === 0 || c === 0 ? "fillCellFirst" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const cls = `${baseCls}${posCls ? " " + posCls : ""}`;

          return (
            <input
              key={k}
              className={cls}
              value={v}
              disabled={locked || status === "correct"}
              onChange={(e) => props.onChangeCell(r, c, e.target.value)}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
            />
          );
        })
      )}
    </div>
  );
}
