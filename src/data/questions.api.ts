import { supabase } from '../lib/supabase'
import type { Question } from '../types'

export async function loadQuestions(gameCode: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('game_code', gameCode)
    .order('slot', { ascending: true })

  if (error) throw error

  return data.map((q) => ({
    id: q.id,
    game: q.game_code,
    question: q.question,
    answer: q.answer,
    points: q.points,
    timeLimitSec: q.time_limit_sec,
    category: q.category
  }))
}
