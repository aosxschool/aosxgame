import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Team } from "../../types";
import { sfx } from "../../utils/sfx";
import type {
  CategoryOptionKey,
  CategoryPhase,
} from "../../pages/Team/Category/categoryTypes";

type RevealState = {
  correct: CategoryOptionKey;
  chosen: CategoryOptionKey | null;
  wasCorrect: boolean;
  pointsAwarded: number;
  winnerTeamId: string | null;
  message: string;
};

export default function CategoryQuestionModel(props: {
  open: boolean;
  phase: Exclude<CategoryPhase, "board">;
  teams: Team[];

  // answering team (question phase)
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void; 

  // steal phase team
  armedTeamId: string | null;
  onArmTeam: (teamId: string) => void;

  // content
  category: string;
  value: number;
  question: string;
  answers: Record<CategoryOptionKey, string>;

  // actions
  onAnswer: (opt: CategoryOptionKey) => void;

  revealState: RevealState | null;
  onAcknowledgeReveal: () => void;

  onClose: () => void;
}) {
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!teamMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!teamPickerRef.current?.contains(el)) setTeamMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [teamMenuOpen]);

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (teamMenuOpen) setTeamMenuOpen(false);
        else props.onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, teamMenuOpen, props.onClose]);

  useEffect(() => {
    if (!props.open) setTeamMenuOpen(false);
  }, [props.open]);

  const answeringTeam = useMemo(
    () => props.teams.find((t) => t.id === props.selectedTeamId) ?? null,
    [props.teams, props.selectedTeamId]
  );

  const stealingTeam = useMemo(
    () => props.teams.find((t) => t.id === (props.armedTeamId ?? "")) ?? null,
    [props.teams, props.armedTeamId]
  );

  const showStealPicker = props.phase === "steal";
  const inReveal = props.phase === "reveal";

  function pickStealTeam(id: string) {
    props.onArmTeam(id);
    setTeamMenuOpen(false);
  }

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className="modalBackdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sfx.tap();
            props.onClose();
          }}
        >
          <motion.div
            className="modal"
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <div className="modalPts">
                <div className="modalPtsNum">{props.value}</div>
                <div className="modalPtsLab">points</div>
              </div>

              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  sfx.tap();
                  props.onClose();
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="hint" style={{ marginTop: 8 }}>
              <b>{props.category}</b>
            </div>

            {props.phase === "question" && (
              <div className="modalTeamRow" style={{ marginTop: 14 }}>
                <div className="modalTeamLabel">Answering team</div>

                <div className="teamPicker">
                  <div className="teamSelectPro" style={{ cursor: "default" }}>
                    <span
                      className="teamDot"
                      style={{ background: answeringTeam?.color ?? "transparent" }}
                      aria-hidden="true"
                    />
                    <span className="teamName">
                      {answeringTeam?.name ?? "—"}
                    </span>
                    <span className="teamScore">
                      {answeringTeam ? `${answeringTeam.score} pts` : ""}
                    </span>
                    <span className="teamArrow" style={{ visibility: "hidden" }}>
                      ▾
                    </span>
                  </div>
                </div>
              </div>
            )}

            {showStealPicker && (
              <div className="modalTeamRow" style={{ marginTop: 14 }}>
                <div className="modalTeamLabel">Stealing team</div>

                <div className="teamPicker" ref={teamPickerRef}>
                  <button
                    type="button"
                    className="teamSelectPro"
                    onClick={() => {
                      sfx.tap();
                      setTeamMenuOpen((o) => !o);
                    }}
                    aria-expanded={teamMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span
                      className="teamDot"
                      style={{ background: stealingTeam?.color ?? "transparent" }}
                      aria-hidden="true"
                    />
                    <span className="teamName">
                      {stealingTeam?.name ?? "Select team"}
                    </span>
                    <span className="teamScore">
                      {stealingTeam ? `${stealingTeam.score} pts` : ""}
                    </span>
                    <span className="teamArrow" aria-hidden="true">
                      ▾
                    </span>
                  </button>

                  <AnimatePresence>
                    {teamMenuOpen && (
                      <motion.div
                        className="teamMenu"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        role="listbox"
                      >
                        {props.teams.map((t) => {
                          const active = t.id === props.armedTeamId;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`teamOption ${active ? "active" : ""}`}
                              onClick={() => {
                                sfx.tap();
                                pickStealTeam(t.id);
                              }}
                              role="option"
                              aria-selected={active}
                            >
                              <span
                                className="teamDot"
                                style={{ background: t.color }}
                                aria-hidden="true"
                              />
                              <span className="teamName">{t.name}</span>
                              <span className="teamScore">{t.score} pts</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div className="modalQuestion" style={{ marginTop: 14 }}>
              {props.question}
            </div>

            {!inReveal ? (
              <div className="catOptions" style={{ marginTop: 14 }}>
                {(["A", "B", "C", "D"] as CategoryOptionKey[]).map((k) => (
                  <button
                    key={k}
                    className="btn"
                    onClick={() => {
                      sfx.tap();
                      props.onAnswer(k);
                    }}
                    disabled={props.phase === "steal" && !props.armedTeamId}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "flex-start",
                      marginTop: 10,
                    }}
                  >
                    <b style={{ width: 28 }}>{k}.</b> {props.answers[k]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="modalAnswerBlock" style={{ marginTop: 14 }}>
                <div className="modalAnswerLabel">Result</div>
                <div className="modalAnswerText">
                  {props.revealState?.message ?? ""}
                </div>

                <div className="spacer" />

                <button
                  className="btn primary"
                  onClick={() => {
                    sfx.tap();
                    props.onAcknowledgeReveal();
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
