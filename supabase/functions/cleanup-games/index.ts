import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ✅ Only allow these tables to be cleaned up
const ALLOWED_TABLES = new Set([
  "bingo_questions",
  "category_questions",
  "mixmatch_tiles",
  "mixmatch_options",
]);

function toSqlInList(values: string[]) {
  // PostgREST expects: ('a','b','c')  — use single quotes
  // Escape single quotes by doubling them for SQL string literal safety.
  const inner = values.map((v) => `'${v.replace(/'/g, "''")}'`).join(",");
  return `(${inner})`;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "Only POST allowed" });

    // ✅ token auth (from Apps Script)
    const token = req.headers.get("x-sync-token");
    const expected = Deno.env.get("SYNC_TOKEN");
    if (!expected || !token || token !== expected) return json(401, { ok: false, error: "Unauthorized" });

    const body = (await req.json().catch(() => null)) as any;
    if (!body) return json(400, { ok: false, error: "Invalid JSON body" });

    const active = body.active_game_codes;
    if (!Array.isArray(active)) return json(400, { ok: false, error: "active_game_codes must be an array" });

    const rawTables = body.tables;
    if (!Array.isArray(rawTables) || rawTables.length === 0) {
      return json(400, { ok: false, error: "tables must be a non-empty array" });
    }

    const codes = Array.from(
      new Set(
        active
          .map((x: any) => String(x ?? "").trim().toLowerCase())
          .filter((x: string) => x.length > 0),
      ),
    );

    if (codes.length === 0) {
      return json(400, {
        ok: false,
        error: "active_game_codes is empty. Refusing to delete everything.",
      });
    }

    const tables = Array.from(
      new Set(
        rawTables
          .map((t: any) => String(t ?? "").trim())
          .filter((t: string) => t.length > 0),
      ),
    );

    for (const t of tables) {
      if (!ALLOWED_TABLES.has(t)) {
        return json(400, { ok: false, error: `Invalid table "${t}"` });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SERVICE_ROLE_KEY"); // your secret
    if (!supabaseUrl || !serviceRole) {
      return json(500, { ok: false, error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    const inList = toSqlInList(codes);

    const results: Record<string, { ok: boolean; deleted?: number; error?: string }> = {};

    // ✅ cleanup each requested table
    for (const table of tables) {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .not("game_code", "in", inList);

      if (error) {
        results[table] = { ok: false, error: error.message };
      } else {
        results[table] = { ok: true, deleted: count ?? 0 };
      }
    }

    return json(200, { ok: true, kept: codes, results });
  } catch (e: any) {
    return json(400, { ok: false, error: String(e?.message ?? e) });
  }
});
