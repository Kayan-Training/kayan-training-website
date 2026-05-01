"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  duration = 800,
  value,
}: {
  duration?: number;
  value: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    const delta = value - from;

    function tick(now: number) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - elapsed) ** 4;
      ref.current = from + delta * eased;
      setDisplay(Math.round(ref.current));
      if (elapsed < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [duration, value]);

  return <>{display}</>;
}
