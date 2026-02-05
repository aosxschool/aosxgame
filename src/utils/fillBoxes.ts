import type { FillBoxesPuzzle, CellStatus } from "../types";

function keyOf(r: number, c: number) {
  return `${r},${c}`;
}

function norm(v: string, puzzle: FillBoxesPuzzle) {
  let x = v ?? "";
  if (puzzle.trim) x = x.trim();
  if (puzzle.caseInsensitive) x = x.toLowerCase();
  return x;
}

export type FillBoxesState = {
  values: Record<string, string>;       // "r,c" -> user value (and preset values too)
  locked: Record<string, boolean>;      // "r,c" -> locked?
  status: Record<string, CellStatus>;   // only meaningful after submit
  submitted: boolean;
};

export function buildFillBoxesInitial(puzzle: FillBoxesPuzzle): FillBoxesState {
  const values: Record<string, string> = {};
  const locked: Record<string, boolean> = {};
  const status: Record<string, CellStatus> = {};

  // preset cells
  for (const cell of puzzle.presetCells) {
    const k = keyOf(cell.r, cell.c);
    values[k] = cell.value;
    locked[k] = !!cell.locked;
    status[k] = "neutral";
  }

  // ensure all answer cells exist in map as empty (not locked)
  for (const k of Object.keys(puzzle.answerKey)) {
    if (values[k] === undefined) values[k] = "";
    if (locked[k] === undefined) locked[k] = false;
    status[k] = "neutral";
  }

  return { values, locked, status, submitted: false };
}

export function evaluateFillBoxes(puzzle: FillBoxesPuzzle, state: FillBoxesState) {
  const nextStatus: Record<string, CellStatus> = { ...state.status };

  let wrongCount = 0;
  let correctCount = 0;

  for (const [k, correct] of Object.entries(puzzle.answerKey)) {
    const user = state.values[k] ?? "";
    const ok = norm(user, puzzle) === norm(correct, puzzle);

    nextStatus[k] = ok ? "correct" : "wrong";
    if (ok) correctCount += 1;
    else wrongCount += 1;
  }

  const allCorrect = wrongCount === 0 && correctCount === Object.keys(puzzle.answerKey).length;

  return { allCorrect, wrongCount, correctCount, nextStatus };
}

export function clearAllUserInputs(puzzle: FillBoxesPuzzle, prev: FillBoxesState): FillBoxesState {
  const values = { ...prev.values };
  const status = { ...prev.status };

  for (const k of Object.keys(puzzle.answerKey)) {
    // don't touch locked preset cells (if you ever overlap)
    if (prev.locked[k]) continue;
    values[k] = "";
    status[k] = "neutral";
  }

  return { ...prev, values, status, submitted: false };
}

export function retryWrongOnly(puzzle: FillBoxesPuzzle, prev: FillBoxesState): FillBoxesState {
  const values = { ...prev.values };
  const status = { ...prev.status };

  for (const k of Object.keys(puzzle.answerKey)) {
    if (prev.locked[k]) continue;
    if (prev.status[k] === "wrong") {
      values[k] = "";
      status[k] = "neutral";
    }
  }

  return { ...prev, values, status, submitted: false };
}
