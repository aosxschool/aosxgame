import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { sfx } from '../utils/sfx'

export default function CountdownOverlay(props: {
  open: boolean
  seconds?: number
  label?: string
  onDone: () => void
}) {
  const total = props.seconds ?? 3
  const [n, setN] = useState(total)

  useEffect(() => {
    if (!props.open) return
    setN(total)
  }, [props.open, total])

  useEffect(() => {
    if (!props.open) return
    if (n <= 0) return

    sfx.tick()

    const t = setTimeout(() => {
      setN((v) => v - 1)
    }, 1000)

    return () => clearTimeout(t)
  }, [props.open, n])

  useEffect(() => {
    if (!props.open) return
    if (n === 0) {
      sfx.start()
      const t = setTimeout(() => props.onDone(), 250)
      return () => clearTimeout(t)
    }
  }, [props.open, n, props])

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className="countdownWrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="countdownCard"
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="countdownLabel">{props.label ?? 'Get Ready'}</div>
            <motion.div
              key={n}
              className="countdownNum"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
            >
              {n === 0 ? 'GO!' : n}
            </motion.div>
            <div className="countdownHint">Answer fast — timer starts now.</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
