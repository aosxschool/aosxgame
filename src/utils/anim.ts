export function countUp(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (v: number) => void,
  onDone?: () => void,
) {
  const start = performance.now()
  const diff = to - from

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs)
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3)
    onUpdate(Math.round(from + diff * eased))
    if (t < 1) requestAnimationFrame(tick)
    else onDone?.()
  }

  requestAnimationFrame(tick)
}
