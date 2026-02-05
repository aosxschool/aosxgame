import { AnimatePresence, motion } from "framer-motion";

export default function PassageOverlay(props: {
  open: boolean;
  title: string;
  text: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className="modalBackdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={props.onClose}
          
        >
          <motion.div
            className="modal"
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader" style={{fontWeight:"bold"}}>
              <div className="modalTitle">{props.title}</div>
              <button className="btn ghost" onClick={props.onClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="modalBody" style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
              {props.text}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
