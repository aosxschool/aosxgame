import { useEffect, useState } from "react";
import TimerRing from "./TimerRing";

type Props = {
  active: boolean;
  durationSeconds?: number;
  onTimeout?: () => void;
};

export default function CountdownTimer({
  active,
  durationSeconds = 30,
  onTimeout,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  // reset when activated
  useEffect(() => {
    if (!active) return;
    setSecondsLeft(durationSeconds);
  }, [active, durationSeconds]);

  // ticking
  useEffect(() => {
    if (!active) return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [active, secondsLeft]);

  // timeout callback
  useEffect(() => {
    if (!active) return;
    if (secondsLeft !== 0) return;

    onTimeout?.();
  }, [active, secondsLeft, onTimeout]);

  return (
    <TimerRing
      secondsLeft={secondsLeft}
      secondsTotal={durationSeconds}
    />
  );
}