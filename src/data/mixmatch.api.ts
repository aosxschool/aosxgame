import { supabase } from "../lib/supabase";
import type { MixMatchPuzzle } from "../types";

/** Match whatever you store in DB. I strongly recommend storing normalized codes: "bvm", "mod1" */
function normGameCode(x: string) {
  return x.trim().toLowerCase().replace(/\s+/g, "");
}

export async function loadMixMatchPuzzle(rawGameCode: string): Promise<MixMatchPuzzle> {
  const gameCode = normGameCode(rawGameCode);

  console.log("loadMixMatchPuzzle gameCode:", gameCode);



  // 1) Fetch tiles (expect 25)
  const { data: tiles, error: tileErr } = await supabase
    .from("mixmatch_tiles")
    .select("id, position, question, correct_option_id, game_code")
    .eq("game_code", gameCode)
    .order("position", { ascending: true });

  if (tileErr) {
    // This is where RLS errors show up too
    throw new Error(`mixmatch_tiles query failed: ${tileErr.message}`);
  }

  if (!tiles || tiles.length === 0) {
    throw new Error(
      `No topic found: mixmatch_tiles has 0 rows for game_code="${gameCode}". ` +
        `Check DB game_code values + RLS.`
    );
  }

  if (tiles.length !== 25) {
    throw new Error(
      `Expected 25 tiles for game_code="${gameCode}", got ${tiles.length}. ` +
        `Fix your data (must be exactly 25).`
    );
  }

  // 2) Fetch options (expect 35, but allow >=25)
  const { data: options, error: optErr } = await supabase
    .from("mixmatch_options")
    .select("id, position, answer, game_code")
    .eq("game_code", gameCode)
    .order("position", { ascending: true });

  if (optErr) {
    throw new Error(`mixmatch_options query failed: ${optErr.message}`);
  }

  if (!options || options.length === 0) {
    throw new Error(
      `mixmatch_options has 0 rows for game_code="${gameCode}". ` +
        `You need at least 25, usually 35 (25 answers + 10 decoys).`
    );
  }

  if (options.length < 25) {
    throw new Error(
      `Expected at least 25 options for game_code="${gameCode}", got ${options.length}.`
    );
  }

  // 3) Validate: each tile's correct_option_id must exist in options list
  const optionIdSet = new Set(options.map((o) => String(o.id)));
  const missing = tiles
    .map((t) => String(t.correct_option_id))
    .filter((id) => !optionIdSet.has(id));

  if (missing.length) {
    throw new Error(
      `Data invalid for game_code="${gameCode}": ` +
        `Some tiles.correct_option_id not found in mixmatch_options: ${missing.slice(0, 6).join(", ")}${
          missing.length > 6 ? "..." : ""
        }`
    );
  }

  // 4) Build puzzle
  const puzzle: MixMatchPuzzle = {
    id: gameCode,
    size: 5,
    options: options.map((o) => ({
      id: String(o.id),
      label: String(o.answer ?? ""),
    })),
    tiles: tiles.map((t) => ({
      id: String(t.id),
      title: String(t.question ?? ""),
      requiredOptionIds: [String(t.correct_option_id)], // ✅ one answer per tile
    })),
  };

  return puzzle;
}
