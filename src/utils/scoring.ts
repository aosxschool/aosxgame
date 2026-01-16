import type { Tile } from '../types'

export const BONUS_POINTS = 100

type LineKey = `r${0|1|2|3}` | `c${0|1|2|3}`

export function lineKeysCompleted(tiles: Tile[], teamId: string): LineKey[] {
  const keys: LineKey[] = []

  // rows
  for (let r = 0 as 0|1|2|3; r < 4; r = ((r + 1) as any)) {
    const base = r * 4
    const ok =
      tiles[base].claimedByTeamId === teamId &&
      tiles[base + 1].claimedByTeamId === teamId &&
      tiles[base + 2].claimedByTeamId === teamId &&
      tiles[base + 3].claimedByTeamId === teamId
    if (ok) keys.push(`r${r}`)
  }

  // cols
  for (let c = 0 as 0|1|2|3; c < 4; c = ((c + 1) as any)) {
    const ok =
      tiles[c].claimedByTeamId === teamId &&
      tiles[c + 4].claimedByTeamId === teamId &&
      tiles[c + 8].claimedByTeamId === teamId &&
      tiles[c + 12].claimedByTeamId === teamId
    if (ok) keys.push(`c${c}`)
  }

  return keys
}
