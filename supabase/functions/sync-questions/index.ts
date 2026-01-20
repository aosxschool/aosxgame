import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type Q = {
  slot: number
  question: string
  answer: string
  points: number
  time_limit_sec: number
  category: string
}

const REQUIRED_KEYS = ["slot", "question", "answer", "points", "time_limit_sec", "category"] as const

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return bad("Only POST allowed", 405)

    // token auth
    const token = req.headers.get("x-sync-token")
    const expected = Deno.env.get("SYNC_TOKEN")
    if (!expected || !token || token !== expected) return bad("Unauthorized", 401)

    const body = await req.json().catch(() => null)
    if (!body) return bad("Invalid JSON body")

    const game_code = String(body.game_code ?? "").trim()
    const questions = body.questions as unknown

    if (!game_code) return bad("Missing game_code")
    if (!Array.isArray(questions)) return bad("questions must be an array")
    if (questions.length !== 16) return bad("Must provide exactly 16 questions")

    const slots = new Set<number>()

    const cleaned: Q[] = questions.map((raw: any, idx: number) => {
      for (const k of REQUIRED_KEYS) {
        if (raw?.[k] === undefined || raw?.[k] === null) {
          throw new Error(`Row ${idx + 1}: missing "${k}"`)
        }
      }

      const slot = Number(raw.slot)
      const points = Number(raw.points)
      const time_limit_sec = Number(raw.time_limit_sec)
      const question = String(raw.question ?? "").trim()
      const answer = String(raw.answer ?? "").trim()
      const category = String(raw.category ?? "").trim()

      if (!Number.isInteger(slot) || slot < 1 || slot > 16) throw new Error(`Row ${idx + 1}: slot must be 1–16`)
      if (slots.has(slot)) throw new Error(`Duplicate slot: ${slot}`)
      slots.add(slot)

      if (!question) throw new Error(`Row ${idx + 1} (slot ${slot}): question is blank`)
      if (!answer) throw new Error(`Row ${idx + 1} (slot ${slot}): answer is blank`)
      if (!category) throw new Error(`Row ${idx + 1} (slot ${slot}): category is blank`)
      if (!Number.isFinite(points)) throw new Error(`Row ${idx + 1} (slot ${slot}): points must be number`)
      if (!Number.isFinite(time_limit_sec)) throw new Error(`Row ${idx + 1} (slot ${slot}): time_limit_sec must be number`)

      return { slot, question, answer, points, time_limit_sec, category }
    })

    for (let s = 1; s <= 16; s++) {
      if (!slots.has(s)) return bad(`Missing slot ${s}. Must have slots 1–16.`)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
    )

    // replace-all for this game
    const { error: delErr } = await supabase.from("questions").delete().eq("game_code", game_code)
    if (delErr) return bad(`Delete failed: ${delErr.message}`, 500)

    cleaned.sort((a, b) => a.slot - b.slot)

    const { error: insErr } = await supabase.from("questions").insert(
      cleaned.map((q) => ({
        game_code,
        slot: q.slot,
        question: q.question,
        answer: q.answer,
        points: q.points,
        time_limit_sec: q.time_limit_sec,
        category: q.category, // ✅ NEW
      })),
    )
    if (insErr) return bad(`Insert failed: ${insErr.message}`, 500)

    return new Response(JSON.stringify({ ok: true, game_code, count: 16 }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return bad(String(e?.message ?? e), 400)
  }
})
