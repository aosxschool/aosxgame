export const DND_TYPES = {
  TEAM: 'TEAM',
} as const

export type TeamDragItem = {
  type: typeof DND_TYPES.TEAM
  teamId: string
}
