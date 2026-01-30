// src/pages/MixMatch/useMixMatchTimer.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function useMixMatchTimer() {
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // refs to avoid stale closures
  const runningRef = useRef(false);
  const startedRef = useRef(false);

  const startAtRef = useRef<number | null>(null); // baseline = now - elapsed
  const elapsedRef = useRef(0);

  const rafRef = useRef<number | null>(null);

  // keep refs synced with state
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);

  const tick = useCallback(() => {
    if (!runningRef.current || startAtRef.current === null) return;

    const now = performance.now();
    const nextElapsed = now - startAtRef.current;

    // update both ref + state
    elapsedRef.current = nextElapsed;
    setElapsedMs(nextElapsed);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!running) return;

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, tick]);

  const start = useCallback(() => {
    if (runningRef.current) return;

    if (!startedRef.current) {
      setStarted(true);
      startedRef.current = true;
    }

    // IMPORTANT: preserve continuity
    startAtRef.current = performance.now() - elapsedRef.current;

    setRunning(true);
    runningRef.current = true;
  }, []);

  const startIfNeeded = useCallback(() => {
    // only start if not running (never resets elapsed)
    if (!runningRef.current) start();
  }, [start]);

  const stop = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setStarted(false);
    setElapsedMs(0);

    runningRef.current = false;
    startedRef.current = false;
    elapsedRef.current = 0;
    startAtRef.current = null;
  }, []);

  const addPenaltySeconds = useCallback((sec: number) => {
    const add = sec * 1000;

    // increase elapsed and shift baseline backward so timer continues smoothly
    elapsedRef.current = elapsedRef.current + add;
    setElapsedMs(elapsedRef.current);

    if (startAtRef.current !== null) {
      startAtRef.current = startAtRef.current - add;
    }
  }, []);

  const formatted = useMemo(() => {
    const totalSec = Math.floor(elapsedMs / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${pad2(mm)}:${pad2(ss)}`;
  }, [elapsedMs]);

  return {
    started,
    running,
    formatted,
    startIfNeeded,
    stop,
    reset,
    addPenaltySeconds,
  };
}
