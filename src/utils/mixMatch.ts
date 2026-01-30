import type { MixMatchEval, MixMatchPuzzle, PlacementMap } from "../types";

export function buildInitialState(puzzle: MixMatchPuzzle): { placements: PlacementMap } {
  const placements: PlacementMap = {};
  puzzle.tiles.forEach((t) => (placements[t.id] = []));
  return { placements };
}

function setEq(a: string[], b: string[]) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

/**
 * Rules:
 * - An option is correct if it's placed in a tile that requires it.
 * - An option is wrong if it's placed in a tile that DOES NOT require it.
 * - A tile is “correct” only if placed ids exactly match required ids (order irrelevant).
 */
export function evaluateSubmission(puzzle: MixMatchPuzzle, placements: PlacementMap): MixMatchEval {
  const tileOptionStatus: MixMatchEval["tileOptionStatus"] = {};
  const tileSummary: MixMatchEval["tileSummary"] = {};

  const correctOptionIds: string[] = [];
  const wrongOptionIds: string[] = [];

  let allCorrect = true;

  for (const tile of puzzle.tiles) {
    const required = tile.requiredOptionIds;
    const placed = placements[tile.id] ?? [];
    const requiredSet = new Set(required);

    const status: Record<string, "correct" | "wrong"> = {};

    for (const optId of placed) {
      const ok = requiredSet.has(optId);
      status[optId] = ok ? "correct" : "wrong";
      if (ok) correctOptionIds.push(optId);
      else wrongOptionIds.push(optId);
    }

    const tileCorrect = setEq(required, placed);
    if (!tileCorrect) allCorrect = false;

    const correctCount = placed.filter((id) => requiredSet.has(id)).length;
    const wrongCount = placed.filter((id) => !requiredSet.has(id)).length;

    tileOptionStatus[tile.id] = status;
    tileSummary[tile.id] = {
      correctCount,
      wrongCount,
      requiredCount: required.length,
    };
  }

  // IMPORTANT: remove duplicates (same option shouldn't appear twice, but safety)
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  return {
    allCorrect,
    tileOptionStatus,
    tileSummary,
    correctOptionIds: uniq(correctOptionIds),
    wrongOptionIds: uniq(wrongOptionIds),
  };
}
