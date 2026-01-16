export const TEAM_COLORS = [
  '#FF4D4D', // red
  '#4DA6FF', // blue
  '#4DFF88', // green
  '#FFD24D', // yellow
  '#B84DFF', // purple
  '#FF4DCF', // pink
  '#4DFFF6', // cyan
  '#FF8A4D', // orange
]

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(16).slice(2)}`
}
