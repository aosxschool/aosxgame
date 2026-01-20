import type { MascotId } from '../types'

import eaglePng from '../assets/mascot/eagle.png'
import lionPng from '../assets/mascot/lion.png'
import sharkPng from '../assets/mascot/shark.png'
import wolfPng from '../assets/mascot/wolf.png'


export const MASCOTS: { id: MascotId; label: string; src: string }[] = [
  { id: 'eagle', label: 'Eagle', src: eaglePng },
  { id: 'lion', label: 'Lion', src: lionPng },
  { id: 'shark', label: 'Shark', src: sharkPng },
  { id: 'wolf', label: 'Wolf', src: wolfPng },
]

export function mascotById(id: MascotId | null | undefined) {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0]
}
