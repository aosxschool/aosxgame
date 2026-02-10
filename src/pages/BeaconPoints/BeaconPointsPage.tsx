// src/pages/Team/BeaconPoints/BeaconPointsPage.tsx
import { useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

import OptionsPanel from "../../components/DragDrop/OptionsPanel";
import MapCanvas from "../../components/DragDrop/MapCanvas";
import ResultModal from "../../components/DragDrop/ResultModal";
import ReviewCanvas from "../../components/DragDrop/ReviewCanvas";

import { ANSWERS } from "../../data/dragDropData";
import { useGameTimer } from "../../hooks/useGameTimer";

import { saveAllTeams } from "../../data/leaderboard.api";
import { toLeaderboardFields } from "../../data/leaderBoardConverter";

type LocationState = {
  teams: { id: string; name: string }[];
  topicCode: string;
};

const BASE_SECONDS = 600; // same as MixMatch

function timeToScore(totalSeconds: number) {
  return Math.max(0, BASE_SECONDS - Math.floor(totalSeconds));
}

// accepts "MM:SS" or "HH:MM:SS"
function parseTimeToSeconds(time: string): number {
  const s = String(time ?? "").trim();
  if (!s) return 0;

  const parts = s.split(":").map((x) => Number(x));
  if (parts.some((n) => Number.isNaN(n))) return 0;

  if (parts.length === 2) {
    const [mm, ss] = parts;
    return mm * 60 + ss;
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return hh * 3600 + mm * 60 + ss;
  }
  return 0;
}

export default function BeaconPointsPage(props: {
  navigate: (to: string) => void;
  gameId: "beaconpoints";
}) {
  const loc = useLocation();
  const nav = loc.state as LocationState | null;

  const { mode } = useParams<{ mode: string }>();

  // ✅ hooks must run regardless of nav state
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const [penalty, setPenalty] = useState(0);
  const [incorrectZones, setIncorrectZones] = useState<string[]>([]);
  const [correctZones, setCorrectZones] = useState<string[]>([]);

  const [timerKey, setTimerKey] = useState(0);

  // review flow
  const [reviewMode, setReviewMode] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);

  // prevent double save
  const savedRef = useRef(false);

  const usedLabels = useMemo(() => Object.values(placements), [placements]);

  // ✅ your hook apparently returns NUMBER (seconds) in your app
  // (but we still guard if it ever returns a string)
  const rawTime = useGameTimer(running, timerKey) as unknown;

  const elapsedSeconds =
    typeof rawTime === "number"
      ? rawTime
      : parseTimeToSeconds(String(rawTime ?? "00:00"));

  // ✅ after hooks, do redirect
  if (!nav?.teams?.length || !nav.topicCode) {
    return <Navigate to="/home" replace />;
  }

  // ✅ only allow ONE team
  const team = nav.teams[0];
  const topicCode = nav.topicCode;

  const handleDrop = (targetZoneId: string, label: string, fromZoneId?: string) => {
    setPlacements((prev) => {
      const next = { ...prev };

      // move: remove from old zone
      if (fromZoneId && fromZoneId !== targetZoneId) {
        if (next[fromZoneId] === label) delete next[fromZoneId];
      }

      // place into target (replace allowed)
      next[targetZoneId] = label;
      return next;
    });

    // start timer on first drop
    setRunning((prev) => (prev ? prev : true));

    // clear highlights if user changes that zone
    setIncorrectZones((prev) => prev.filter((z) => z !== targetZoneId));
    setCorrectZones((prev) => prev.filter((z) => z !== targetZoneId));
  };

  const persistLeaderboard = async (finalSeconds: number) => {
    if (mode !== "aosx") return;

    const { course, topic } = toLeaderboardFields(mode, topicCode);
    const score = timeToScore(finalSeconds);

    console.log("[BeaconPoints] Saving:", { course, topic, team: team.name, score });

    await saveAllTeams(course, topic, [{ name: team.name, score }]);
    console.log("[BeaconPoints] Saved OK");
  };

  const handleFinish = async () => {
    const wrong: string[] = [];
    const correct: string[] = [];

    Object.entries(ANSWERS).forEach(([zone, ans]) => {
      if (placements[zone] === ans) correct.push(zone);
      else wrong.push(zone);
    });

    const penaltySeconds = wrong.length * 10; // your rule
    setPenalty(penaltySeconds);

    setIncorrectZones(wrong);
    setCorrectZones(correct);

    setRunning(false);
    setFinished(true);

    // ✅ save once
    if (!savedRef.current) {
      savedRef.current = true;

      const finalSeconds = Math.floor(elapsedSeconds) + penaltySeconds;

      try {
        await persistLeaderboard(finalSeconds);
      } catch (e) {
        console.error("Failed to save BeaconPoints leaderboard:", e);
        savedRef.current = false; // allow retry if needed
      }
    }
  };

  const handleClear = () => {
    setPlacements({});
    setIncorrectZones([]);
    setCorrectZones([]);
  };

  const handleViewCorrect = () => {
    setReviewMode(true);
    setShowCorrect(false);
  };

  const handleRetry = () => {
    setPlacements({});
    setIncorrectZones([]);
    setCorrectZones([]);
    setFinished(false);
    setReviewMode(false);
    setShowCorrect(false);
    setPenalty(0);
    setRunning(false);
    setTimerKey((prev) => prev + 1);
    savedRef.current = false;
  };

  const handleToggleCorrect = () => setShowCorrect((prev) => !prev);

  if (reviewMode) {
    return (
      <ReviewCanvas
        placements={placements}
        showCorrect={showCorrect}
        onToggleCorrect={handleToggleCorrect}
        onRetry={handleRetry}
        time={Math.floor(elapsedSeconds)} // ✅ number
        penalty={penalty}
      />
    );
  }

  return (
    <div className="game-root">
      <OptionsPanel usedLabels={usedLabels} />

      <MapCanvas
        placements={placements}
        incorrectZones={incorrectZones}
        correctZones={correctZones}
        onDrop={handleDrop}
        time={Math.floor(elapsedSeconds)} // ✅ number
        onFinish={handleFinish}
        onClear={handleClear}
      />

      {finished && (
        <ResultModal
          time={Math.floor(elapsedSeconds)} // ✅ number
          penalty={penalty}
          title="Exercise Completed"
          actionLabel="View Correct Answers"
          onAction={handleViewCorrect}
        />
      )}
    </div>
  );
}
