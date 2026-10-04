"use client";
// Ticking countdown ("Starts in 2h 45m"). Server renders the first value,
// then this refreshes every 30s on the client — no page reload needed.
import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export default function Countdown({ startTime, className = "" }) {
  const [label, setLabel] = useState(() => formatCountdown(startTime));

  useEffect(() => {
    const t = setInterval(() => setLabel(formatCountdown(startTime)), 30000);
    return () => clearInterval(t);
  }, [startTime]);

  return <span className={className}>{label}</span>;
}
