import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OptionRow = {
  id: string;          // "o1".."o35"
  position: number;    // 1..35
  answer: string;
};

type TileRow = {
  id: string;               // "t1".."t25"
  position: number;         // 1..25
  question: string;
  correct_option_id: string; // must be one of option ids
};

function json(ok: boolean, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ ok, ...body }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bad(msg: string, status = 400) {
  return json(false, { error: msg }, status);
}

function normGameCode(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return bad("Only POST allowed", 405);

    // Token auth
    const token = req.headers.get("x-sync-token");
    const expected = Deno.env.get("SYNC_TOKEN");
    if (!expected || !token || token !== expected) return bad("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    if (!body) return bad("Invalid JSON body");

    const game_code = normGameCode(body.game_code);
    const options = body.options as unknown;
    const tiles = body.tiles as unknown;

    if (!game_code) return bad("Missing game_code");
    if (!Array.isArray(options)) return bad("options must be an array");
    if (!Array.isArray(tiles)) return bad("tiles must be an array");

    if (options.length !== 35) return bad("Must provide exactly 35 options");
    if (tiles.length !== 25) return bad("Must provide exactly 25 tiles");

    // ---- validate + clean options ----
    const optionIds = new Set<string>();
    const posSetOpt = new Set<number>();

    const cleanedOptions: OptionRow[] = options.map((raw: any, idx: number) => {
      const id = String(raw?.id ?? "").trim();
      const position = Number(raw?.position);
      const answer = String(raw?.answer ?? "").trim();

      if (!id) throw new Error(`Option row ${idx + 1}: missing id`);
      if (!Number.isInteger(position) || position < 1 || position > 35) {
        throw new Error(`Option ${id}: position must be 1..35`);
      }
      if (!answer) throw new Error(`Option ${id}: answer is blank`);

      if (optionIds.has(id)) throw new Error(`Duplicate option id: ${id}`);
      if (posSetOpt.has(position)) throw new Error(`Duplicate option position: ${position}`);

      optionIds.add(id);
      posSetOpt.add(position);

      return { id, position, answer };
    });

    // Ensure positions 1..35 all exist (optional but recommended)
    for (let p = 1; p <= 35; p++) {
      if (!posSetOpt.has(p)) return bad(`Missing option position ${p} (need 1..35)`);
    }

    // ---- validate + clean tiles ----
    const tileIds = new Set<string>();
    const posSetTile = new Set<number>();

    const cleanedTiles: TileRow[] = tiles.map((raw: any, idx: number) => {
      const id = String(raw?.id ?? "").trim();
      const position = Number(raw?.position);
      const question = String(raw?.question ?? "").trim();
      const correct_option_id = String(raw?.correct_option_id ?? "").trim();

      if (!id) throw new Error(`Tile row ${idx + 1}: missing id`);
      if (!Number.isInteger(position) || position < 1 || position > 25) {
        throw new Error(`Tile ${id}: position must be 1..25`);
      }
      if (!question) throw new Error(`Tile ${id}: question is blank`);
      if (!correct_option_id) throw new Error(`Tile ${id}: correct_option_id is blank`);
      if (!optionIds.has(correct_option_id)) {
        throw new Error(`Tile ${id}: correct_option_id "${correct_option_id}" not found in options`);
      }

      if (tileIds.has(id)) throw new Error(`Duplicate tile id: ${id}`);
      if (posSetTile.has(position)) throw new Error(`Duplicate tile position: ${position}`);

      tileIds.add(id);
      posSetTile.add(position);

      return { id, position, question, correct_option_id };
    });

    for (let p = 1; p <= 25; p++) {
      if (!posSetTile.has(p)) return bad(`Missing tile position ${p} (need 1..25)`);
    }

    // ---- Supabase client (SERVICE ROLE) ----
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
    );

    // Replace-all for this game_code (options + tiles)
    // Delete tiles first (in case you later enforce FK)
    const { error: delTilesErr } = await supabase
      .from("mixmatch_tiles")
      .delete()
      .eq("game_code", game_code);

    if (delTilesErr) return bad(`Delete tiles failed: ${delTilesErr.message}`, 500);

    const { error: delOptErr } = await supabase
      .from("mixmatch_options")
      .delete()
      .eq("game_code", game_code);

    if (delOptErr) return bad(`Delete options failed: ${delOptErr.message}`, 500);

    cleanedOptions.sort((a, b) => a.position - b.position);
    cleanedTiles.sort((a, b) => a.position - b.position);

    const { error: insOptErr } = await supabase
      .from("mixmatch_options")
      .insert(cleanedOptions.map((o) => ({
        id: o.id,
        game_code,
        position: o.position,
        answer: o.answer,
      })));

    if (insOptErr) return bad(`Insert options failed: ${insOptErr.message}`, 500);

    const { error: insTilesErr } = await supabase
      .from("mixmatch_tiles")
      .insert(cleanedTiles.map((t) => ({
        id: t.id,
        game_code,
        position: t.position,
        question: t.question,
        correct_option_id: t.correct_option_id,
      })));

    if (insTilesErr) return bad(`Insert tiles failed: ${insTilesErr.message}`, 500);

    return json(true, {
      game_code,
      options: 35,
      tiles: 25,
    });
  } catch (e: any) {
    return bad(String(e?.message ?? e), 400);
  }
});
