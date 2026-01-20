export type MascotId = 'eagle' | 'lion' | 'shark' | 'wolf'

export type Team = {
  id: string
  name: string
  color: string
  score: number
  mascotId: MascotId
}

export type Question = {
  id: string
  game: string
  question: string
  answer: string
  points: number
  timeLimitSec: number
  category: string
}

export type Tile = {
  id: string
  question: Question
  claimedByTeamId?: string
}

export type Screen = 'lobby' | 'game' | 'end' | 'leaderboard'
