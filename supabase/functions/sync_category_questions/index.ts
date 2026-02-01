import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "Only POST allowed" });

    const token = req.headers.get("x-sync-token");
    const expected = Deno.env.get("SYNC_TOKEN");
    if (!expected || !token || token !== expected) return json(401, { ok: false, error: "Unauthorized" });

    const body = await req.json();
    const game_code = String(body?.game_code ?? "").trim();
    if (!game_code) return json(400, { ok: false, error: "game_code is required" });

    const questions = body?.questions;
    if (!Array.isArray(questions)) return json(400, { ok: false, error: "questions must be an array" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return json(500, { ok: false, error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY env" });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // wipe current game_code rows
    const { error: delErr } = await supabase
      .from("category_questions")
      .delete()
      .eq("game_code", game_code);

    if (delErr) return json(500, { ok: false, error: `DELETE failed: ${delErr.message}` });

    // insert rows
    const payload = questions.map((q: any) => ({
      game_code,
      category: String(q.category ?? "").trim(),
      points: Number(q.points),
      question: String(q.question ?? "").trim(),
      option_a: String(q.option_a ?? "").trim(),
      option_b: String(q.option_b ?? "").trim(),
      option_c: String(q.option_c ?? "").trim(),
      option_d: String(q.option_d ?? "").trim(),
      correct_option: String(q.correct_option ?? "").trim(),
      time_limit_sec: Number(q.time_limit_sec),
    }));

    const { error: insErr } = await supabase.from("category_questions").insert(payload);
    if (insErr) return json(500, { ok: false, error: `INSERT failed: ${insErr.message}` });

    return json(200, { ok: true, game_code, inserted: payload.length });
  } catch (e) {
    return json(500, { ok: false, error: String(e) });
  }
});
