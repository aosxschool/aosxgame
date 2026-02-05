import { motion, AnimatePresence } from "framer-motion";
import GlowCard from "../components/GlowCard";
import type { Team, MascotId } from "../types";
import { TEAM_COLORS, clamp, uid } from "../utils/colors";
import { useEffect, useMemo, useRef, useState } from "react";
import { MASCOTS, mascotById } from "../data/mascots";
import { supabase } from "../lib/supabase";
import { Navigate, useParams } from "react-router-dom";

import {
  teamGames,
  normTopic,
  TOPIC_LABELS,
  isTeamMode,
  isTeamGameId,
  type TeamMode,
  type TeamGameId,
  type TopicId,
} from "../data/appConfig";

type GameOption = { code: string; label: string };

export default function LobbyPage(props: {
  onStart: (topicCode: string, teams: Team[]) => void;
}) {
  const { mode, gameId } = useParams<{ mode: string; gameId: string }>();

  if (!mode || !gameId || !isTeamMode(mode) || !isTeamGameId(gameId)) {
    return <Navigate to="/home" replace />;
  }

  const tm = mode as TeamMode;
  const tg = teamGames[gameId as TeamGameId];

  const [topicCode, setTopicCode] = useState<string>(""); // selected topic from DB
  const [teamCount, setTeamCount] = useState<number>(1);

  const [names, setNames] = useState<Record<number, string>>({});
  const [topicOptions, setTopicOptions] = useState<GameOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [mascots, setMascots] = useState<Record<number, MascotId>>({});

  const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // ✅ stable team IDs so inputs don't remount on every keystroke
  const teamIdsRef = useRef<string[]>(
    Array.from({ length: 4 }).map(() => uid("team"))
  );

  const allowedTopicIds = tg.allowedTopicsByMode[tm]; // TopicId[]
  const allowedSet = useMemo(() => new Set<TopicId>(allowedTopicIds), [allowedTopicIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadTopics() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from(tg.topicsSource.table)
        .select(tg.topicsSource.column);

      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setTopicOptions([]);
        setTopicCode("");
        setLoading(false);
        return;
      }

      // unique raw values from DB (ex: "MOD 2A")
      const rawUnique = Array.from(
        new Set(
          (data ?? [])
            .map((r: any) => String(r?.[tg.topicsSource.column] ?? "").trim())
            .filter(Boolean)
        )
      );

      // normalize -> TopicId and filter by allowed
      const filtered = rawUnique
        .map((raw) => ({ raw, norm: normTopic(raw) }))
        .filter((x) => allowedSet.has(x.norm as TopicId));

      // de-dupe by normalized id (so MOD_2A and MOD 2A don't double show)
      const byNorm = new Map<string, string>();
      for (const x of filtered) {
        if (!byNorm.has(x.norm)) byNorm.set(x.norm, x.raw);
      }

      // build options in a stable order by label
      const norms = Array.from(byNorm.keys()).sort((a, b) => a.localeCompare(b));

      const opts: GameOption[] = norms.map((n) => ({
        code: byNorm.get(n)!, // keep original DB code (what your game expects)
        label: TOPIC_LABELS[n as TopicId] ?? n.toUpperCase(),
      }));

      setTopicOptions(opts);
      setTopicCode((prev) => (prev && opts.some((o) => o.code === prev) ? prev : opts[0]?.code ?? ""));
      setLoading(false);
    }

    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [tm, tg, allowedSet]);

  // close mascot picker when clicking outside
  useEffect(() => {
    if (openPickerIndex === null) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!pickerRef.current?.contains(el)) setOpenPickerIndex(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openPickerIndex]);

  const teams: Team[] = useMemo(() => {
    return Array.from({ length: teamCount }).map((_, i) => {
      const fallbackMascot = MASCOTS[i % MASCOTS.length].id;
      return {
        id: teamIdsRef.current[i],
        name: names[i] ?? `Team ${i + 1}`,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        score: 0,
        mascotId: mascots[i] ?? fallbackMascot,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamCount, JSON.stringify(names), JSON.stringify(mascots)]);

  function BouncyText({ text }: { text: string }) {
    return (
      <span className="letterBounce">
        {text.split("").map((char, i) => (
          <span key={i} className="bounceChar" style={{ animationDelay: `${i * 0.07}s` }}>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    );
  }

  const canStart = !loading && !err && !!topicCode && topicOptions.length > 0;

  return (
    <div className="page" style={{maxWidth: "80vw"}}>
      <div className="hero">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          <div className="brand">
            {tm.toUpperCase()} • {tg.title}
          </div>
          <h1 className="title">
            <BouncyText text="Select Topic & Teams" />
          </h1>
        </motion.div>
      </div>

      <div className="grid2">
        <GlowCard style={{ padding: "40px" }}>
          <div className="cardTitle">Topic</div>

          <div className="segmented">
            {loading ? (
              <button className="segBtn" disabled>
                Loading…
              </button>
            ) : topicOptions.length === 0 ? (
              <button className="segBtn" disabled>
                No topics found
              </button>
            ) : (
              topicOptions.map((opt) => (
                <button
                  key={opt.code}
                  className={`segBtn ${topicCode === opt.code ? "segActive" : ""}`}
                  onClick={() => setTopicCode(opt.code)}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>

          {err && (
            <div className="hint" style={{ marginTop: 10 }}>
              Failed to load topics: {err}
            </div>
          )}

          <div className="spacer" />

          <div className="cardTitle">Number of Teams</div>
          <div className="row">
            <div className="teamCounter">
              <button className="teamBtn" onClick={() => setTeamCount((c) => clamp(c - 1, 1, 4))}>
                –
              </button>
              <div className="teamCount">{teamCount}</div>
              <button className="teamBtn" onClick={() => setTeamCount((c) => clamp(c + 1, 1, 4))}>
                +
              </button>
            </div>
            <div className="hint">1 to 4 teams</div>
          </div>

          <div className="spacer" />

          <button
            className="btn primary big"
            disabled={!canStart}
            onClick={() => props.onStart(topicCode, teams)}
          >
            Start Game
          </button>
        </GlowCard>

        <GlowCard style={{ padding: "40px" }}>
          <div className="cardTitle">Teams</div>

          <div className="teamList">
            {teams.map((t, i) => {
              const m = mascotById(t.mascotId);
              const open = openPickerIndex === i;

              return (
                <div key={t.id} className="teamRow">
                  <div className="teamSwatch" style={{ background: t.color }} />

                  <div className="teamInputWrap" ref={open ? pickerRef : null}>
                    <input
                      className="teamInput teamInputHasMascot"
                      value={names[i] ?? t.name}
                      onChange={(e) => setNames((p) => ({ ...p, [i]: e.target.value }))}
                    />

                    <button
                      type="button"
                      className="mascotBtn"
                      onClick={() => setOpenPickerIndex((cur) => (cur === i ? null : i))}
                      aria-label="Choose mascot"
                      title="Choose mascot"
                    >
                      <img className="mascotImg" src={m.src} alt={m.label} />
                    </button>

                    <AnimatePresence>
                      {open && (
                        <motion.div
                          className="mascotMenu"
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.16 }}
                        >
                          <div className="mascotGrid">
                            {MASCOTS.map((opt) => {
                              const active = opt.id === (mascots[i] ?? t.mascotId);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={`mascotCell ${active ? "active" : ""}`}
                                  onClick={() => {
                                    setMascots((p) => ({ ...p, [i]: opt.id }));
                                    setOpenPickerIndex(null);
                                  }}
                                >
                                  <img className="mascotGridImg" src={opt.src} alt={opt.label} />
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="teamMini">Score: 0</div>
                </div>
              );
            })}
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            Tip: You can drag team chips onto tiles during the game.
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
