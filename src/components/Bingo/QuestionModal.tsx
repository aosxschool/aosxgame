import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Team, Tile } from "../../types";
import TimerRing from "../Common/TimerRing";
import { sfx } from "../../utils/sfx";

export default function QuestionModal(props: {
  open: boolean;
  tile: Tile | null;
  team: Team | null;

  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  attemptedTeamIds: Set<string>;

  onTimeout: () => void;
  onClose: () => void;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const total = 30;
  const [sec, setSec] = useState<number>(total);
  const [revealed, setRevealed] = useState(false);

  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamPickerRef = useRef<HTMLDivElement | null>(null);
  const prevTileIdRef = useRef<string | null>(null);
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    if (!props.open || !props.tile) return;

    const tileId = props.tile.id;
    const isNewTile = prevTileIdRef.current !== tileId;

    if (isNewTile) {
      prevTileIdRef.current = tileId;
      setSec(total);
      setTeamMenuOpen(false);
      setRevealed(false);
      timeoutFiredRef.current = false;
    }
  }, [props.open, props.tile?.id]);

  useEffect(() => {
    if (!props.open) return;
    if (revealed) return;
    if (!props.team) return;
    if (sec <= 0) return;

    const t = setInterval(() => {
      setSec((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(t);
  }, [props.open, revealed, props.team, sec]);

  useEffect(() => {
    if (!props.open) return;
    if (revealed) return;
    if (!props.team) return;
    if (sec !== 0) return;
    if (timeoutFiredRef.current) return;

    timeoutFiredRef.current = true;
    props.onTimeout();
  }, [props.open, revealed, props.team, sec, props.onTimeout]);

  useEffect(() => {
    if (props.open) return;

    setSec(total);
    setRevealed(false);
    setTeamMenuOpen(false);
    timeoutFiredRef.current = false;
  }, [props.open]);

  useEffect(() => {
    if (!props.team) {
      setSec(total);
      timeoutFiredRef.current = false;
    }
  }, [props.team?.id]);

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
      if (e.key === "Escape" && teamMenuOpen) {
        setTeamMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, teamMenuOpen]);

  const canAnswer = !!props.team;

  const selectedTeam = useMemo(
    () => props.teams.find((t) => t.id === props.selectedTeamId) ?? null,
    [props.teams, props.selectedTeamId]
  );

  const header = useMemo(() => {
    if (!props.tile) return null;

    return (
      <div className="modalHeader">
        <div className="modalPts">
          <div className="modalPtsNum">{props.tile.question.points}</div>
          <div className="modalPtsLab">points</div>
        </div>

        {!revealed && (
          <TimerRing
            secondsLeft={sec}
            secondsTotal={props.tile.question.timeLimitSec ?? total}
          />
        )}
      </div>
    );
  }, [props.tile, sec, revealed]);

  const answerText = (props.tile?.question as any)?.answer ?? "Answer not provided.";

  return (
    <AnimatePresence>
      {props.open && props.tile && (
        <motion.div
          className="modalBackdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {}}
        >
          <motion.div
            className="modal"
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {header}

            {!revealed && (
              <div className="modalTeamRow">
                <div className="modalTeamLabel">
                  {props.attemptedTeamIds.size === 0
                    ? "Current team"
                    : selectedTeam
                      ? "Stealing team"
                      : "Choose team to steal"}
                </div>

                <div className="teamPicker" ref={teamPickerRef}>
                  <button
                    type="button"
                    className="teamSelectPro"
                    onClick={() => {
                      if (props.attemptedTeamIds.size === 0) return;

                      sfx.tap();
                      setTeamMenuOpen((o) => !o);
                    }}
                    aria-expanded={teamMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span
                      className="teamDot"
                      style={{ background: selectedTeam?.color ?? "transparent" }}
                      aria-hidden="true"
                    />
                    <span className="teamName">
                      {selectedTeam?.name ??
                        (props.attemptedTeamIds.size === 0
                          ? "Waiting..."
                          : "Select team")}
                    </span>
                    <span className="teamScore">
                      {selectedTeam ? `${selectedTeam.score} pts` : ""}
                    </span>
                    {props.attemptedTeamIds.size > 0 && (
                      <span className="teamArrow" aria-hidden="true">
                        ▾
                      </span>
                    )}
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
                          const active = t.id === props.selectedTeamId;
                          const alreadyTried = props.attemptedTeamIds.has(t.id);

                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`teamOption ${active ? "active" : ""}`}
                              disabled={alreadyTried}
                              onClick={() => {
                                if (alreadyTried) return;

                                sfx.tap();
                                props.onSelectTeam(t.id);
                                setSec(total);
                                timeoutFiredRef.current = false;
                                setTeamMenuOpen(false);
                              }}
                              role="option"
                              aria-selected={active}
                              title={alreadyTried ? "This team already tried" : ""}
                            >
                              <span
                                className="teamDot"
                                style={{
                                  background: alreadyTried ? "#888" : t.color,
                                  opacity: alreadyTried ? 0.35 : 1,
                                }}
                                aria-hidden="true"
                              />
                              <span
                                className="teamName"
                                style={{ opacity: alreadyTried ? 0.45 : 1 }}
                              >
                                {t.name}
                              </span>
                              <span
                                className="teamScore"
                                style={{ opacity: alreadyTried ? 0.45 : 1 }}
                              >
                                {t.score} 
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {!revealed && <div className="modalQuestion">{props.tile.question.question}</div>}

            <AnimatePresence>
              {revealed && (
                <motion.div
                  className="modalAnswerBlock"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="modalAnswerLabel">Question</div>
                  <div className="modalAnswerText" style={{ marginBottom: 35 }}>
                    {props.tile.question.question}
                  </div>

                  <div className="modalAnswerLabel" style={{ marginTop: 10 }}>
                    Answer
                  </div>
                  <div className="modalAnswerText" style={{ fontWeight: 500, fontSize: 18 }}>
                    {answerText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="questionFooter">
              <div className="modalHint" style={{ visibility: revealed ? "hidden" : "visible" }}>
                {!props.team
                  ? "Select another team to steal."
                  : "If wrong or time runs out, other teams can steal."}
              </div>

              <div className="modalActions">
                {!revealed ? (
                  <>
                    <button
                      className="btn danger"
                      onClick={() => {
                        sfx.tap();
                        setSec(total);
                        timeoutFiredRef.current = false;
                        props.onWrong();
                      }}
                      disabled={!canAnswer}
                    >
                      Wrong
                    </button>

                    <button
                      className="btn success"
                      onClick={() => {
                        sfx.tap();
                        props.onCorrect();
                        setTeamMenuOpen(false);
                        setRevealed(true);
                      }}
                      disabled={!canAnswer}
                    >
                      Correct
                    </button>
                  </>
                ) : (
                  <button
                    className="btn"
                    onClick={() => {
                      sfx.tap();
                      props.onClose();
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}