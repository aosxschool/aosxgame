import { useEffect, useMemo, useRef } from "react";
import type { Cell, Dir } from "../../../types";
import { findFirstPlayable, findWordStart, idx, isLetter, wordCells } from "../../../utils/crossword";

export default function CrosswordGrid(props: {
  size: number;
  cells: Cell[];
  dir: Dir;
  active: { r: number; c: number };
  setActive: (v: { r: number; c: number }) => void;
  setDir: (fn: (d: Dir) => Dir) => void;
  setEntryAt: (r: number, c: number, ch: string) => void;

  reviewMode: "edit" | "review" | "solutions";
  correctCells: Set<number>;
  wrongCells: Set<number>;
}) {
  const { size, cells, dir, active } = props;

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const activeIndex = idx(size, active.r, active.c);
  const activeCell = cells[activeIndex];

  // focus management
  useEffect(() => {
    if (activeCell?.isBlock) {
      const first = findFirstPlayable(cells);
      if (first) props.setActive({ r: first.r, c: first.c });
      return;
    }
    refs.current[activeIndex]?.focus();
  }, [activeIndex, activeCell?.isBlock, cells]);

  const highlightSet = useMemo(() => {
    if (!activeCell || activeCell.isBlock) return new Set<number>();
    const start = findWordStart(size, cells, active.r, active.c, dir);
    const word = wordCells(size, cells, start.r, start.c, dir);
    return new Set(word.map((x) => idx(size, x.r, x.c)));
  }, [cells, active.r, active.c, dir, activeCell, size]);

  function move(dr: number, dc: number) {
    let r = active.r + dr;
    let c = active.c + dc;

    while (r >= 0 && c >= 0 && r < size && c < size) {
      const cell = cells[idx(size, r, c)];
      if (cell && !cell.isBlock) {
        props.setActive({ r, c });
        return;
      }
      r += dr;
      c += dc;
    }
  }

  function onCellClick(r: number, c: number) {
    const cell = cells[idx(size, r, c)];
    if (cell.isBlock) return;

    // clicking the same cell toggles direction
    if (active.r === r && active.c === c) {
      props.setDir((d) => (d === "across" ? "down" : "across"));
    } else {
      props.setActive({ r, c });
    }
  }

  function onKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    const key = e.key;

    if (key === "Tab") {
      e.preventDefault();
      props.setDir((d) => (d === "across" ? "down" : "across"));
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();
      const cur = cells[idx(size, r, c)];
      if (cur.entry) {
        props.setEntryAt(r, c, "");
      } else {
        if (dir === "across") move(0, -1);
        else move(-1, 0);
      }
      return;
    }

    if (key === "ArrowRight") { e.preventDefault(); props.setDir(() => "across"); move(0, 1); return; }
    if (key === "ArrowLeft")  { e.preventDefault(); props.setDir(() => "across"); move(0, -1); return; }
    if (key === "ArrowDown")  { e.preventDefault(); props.setDir(() => "down");   move(1, 0); return; }
    if (key === "ArrowUp")    { e.preventDefault(); props.setDir(() => "down");   move(-1, 0); return; }

    const up = key.toUpperCase();
    if (isLetter(up)) {
      e.preventDefault();
      props.setEntryAt(r, c, up);
      if (dir === "across") move(0, 1);
      else move(1, 0);
    }
  }

  return (
    <div className="cwCard">
      <div className="cardTitle">Grid</div>

      <div className="cwGrid" role="grid" aria-label="Crossword grid">
        {cells.map((cell, i) => {
            const isActive = i === activeIndex;
            const isHL = highlightSet.has(i);

            // NEW: clue-result highlights
            const mark =
                props.correctCells.has(i)
                ? "cwGood"
                : props.wrongCells.has(i)
                    ? (props.reviewMode === "solutions" ? "cwWarn" : "cwBad")
                    : "";

            // NEW: show correct solution when in "solutions" mode for wrong-clue cells
            const displayValue =
                props.reviewMode === "solutions" && props.wrongCells.has(i)
                ? (cell.solution ?? "")
                : cell.entry;

            if (cell.isBlock) {
                return (
                <div key={i} className="cwCell cwBlock">
                    {cell.number && <div className="cwNum cwNumBlock">{cell.number}</div>}
                </div>
                );
            }

            return (
                <div
                key={i}
                className={[
                    "cwCell",
                    mark,                 // NEW
                    isHL ? "cwHL" : "",
                    isActive ? "cwActive" : "",
                ].join(" ")}
                onMouseDown={() => onCellClick(cell.r, cell.c)}
                >
                {cell.number && <div className="cwNum">{cell.number}</div>}
                <input
                    ref={(el) => (refs.current[i] = el)}
                    className="cwInput"
                    value={displayValue}  // NEW
                    readOnly={props.reviewMode !== "edit"} // NEW: lock edits after submit
                    onChange={() => {}}
                    onKeyDown={(e) => props.reviewMode === "edit" && onKeyDown(e, cell.r, cell.c)} // NEW
                    onFocus={() => props.setActive({ r: cell.r, c: cell.c })}
                    inputMode="text"
                    maxLength={1}
                />
                </div>
            );
            })}

      </div>
    </div>
  );
}
