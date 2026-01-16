export type GameCode = '2a' | '2b' | '3a'

export type Team = {
  id: string
  name: string
  color: string
  score: number
}

export type Question = {
  id: string
  game: GameCode
  points: number
  question: string
  answer: string
  timeLimitSec: number
}

export type Tile = {
  id: string
  question: Question
  claimedByTeamId?: string
}

export type Screen = 'lobby' | 'game' | 'end' | 'leaderboard'
