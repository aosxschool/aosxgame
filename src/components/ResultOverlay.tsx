import { AnimatePresence, motion } from 'framer-motion'

export default function ResultOverlay(props: {
  open: boolean
  kind: 'correct' | 'wrong'
  points?: number
  onDone: () => void
}) {
  const isCorrect = props.kind === 'correct'
  const title = isCorrect ? 'CORRECT!' : 'WRONG!'
  const sub = isCorrect ? (props.points ? `+${props.points} pts` : '+points') : 'No points'

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className={`resultWrap ${isCorrect ? 'resultCorrect' : 'resultWrong'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            // hold briefly then close
            setTimeout(() => props.onDone(), 550)
          }}
        >
          <motion.div
            className="resultCard"
            initial={{ scale: 0.8, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
          >
            <div className="resultTitle">{title}</div>
            <div className="resultSub">{sub}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
