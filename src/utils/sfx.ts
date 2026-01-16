/**
 * Lightweight SFX using Web Audio (no asset files needed).
 * Browsers require a user gesture before audio can play. Clicking anywhere in the app first is enough.
 */
let ctx: AudioContext | null = null

function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

function tone(freq: number, ms: number, type: OscillatorType = 'sine', gain = 0.06) {
  const c = ac()
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.value = gain
  o.connect(g)
  g.connect(c.destination)
  const t0 = c.currentTime
  o.start(t0)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000)
  o.stop(t0 + ms / 1000)
}

export const sfx = {
  tap() {
    tone(520, 40, 'triangle', 0.03)
  },
  tick() {
    tone(720, 65, 'square', 0.025)
  },
  start() {
    tone(880, 120, 'sine', 0.05)
    setTimeout(() => tone(1320, 100, 'sine', 0.04), 120)
  },
  correct() {
    tone(660, 90, 'sine', 0.05)
    setTimeout(() => tone(990, 120, 'sine', 0.06), 90)
    setTimeout(() => tone(1320, 140, 'sine', 0.05), 220)
  },
  wrong() {
    tone(220, 160, 'sawtooth', 0.05)
    setTimeout(() => tone(180, 220, 'sawtooth', 0.045), 160)
  },
  bonus() {
    tone(740, 80, 'triangle', 0.05)
    setTimeout(() => tone(1040, 90, 'triangle', 0.05), 90)
    setTimeout(() => tone(1480, 120, 'triangle', 0.05), 190)
  },
}
