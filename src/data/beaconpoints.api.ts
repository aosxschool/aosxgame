// src/data/beaconpoints.api.ts
import { supabase } from "../lib/supabase";

export type BeaconPoint = {
  id: string;
  left_pct: number;
  top_pct: number;
  width_pct: number;
  height_pct: number;
  answer: string;
};

export async function loadBeaconPoints(game_code: string): Promise<BeaconPoint[]> {
  const { data, error } = await supabase
    .from("beaconpoints")
    .select("id,left_pct,top_pct,width_pct,height_pct,answer")
    .eq("game_code", game_code);

  if (error) throw error;
  return data ?? [];
}
