"use client";

// SplashScreen — animated launch overlay for the INSTALLED app.
// The system splash (Android manifest splash / iOS launch image) is
// static by platform design, so the "animated screen" the owner asked
// for lives here: when the app is opened from the home screen, this
// navy overlay greets the user — badge scales in, wordmark and tagline
// fade up — then the whole overlay fades away (~1.5s) and unmounts.
// It renders ONLY in standalone display mode; a normal browser visit
// never sees it, and SSR renders nothing (the decision happens in an
// effect after mount). Rendered by PwaSetup. Defensive throughout:
// any failure simply means no splash, never a broken page.

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState("hidden"); // hidden | show | fade

  useEffect(() => {
    let fadeTimer;
    let hideTimer;
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      if (!standalone) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      setPhase("show");
      if (reduced) {
        // No motion for users who asked for less of it — brief static
        // brand screen, then gone.
        hideTimer = setTimeout(() => setPhase("hidden"), 600);
      } else {
        fadeTimer = setTimeout(() => setPhase("fade"), 1150);
        hideTimer = setTimeout(() => setPhase("hidden"), 1550);
      }
    } catch {
      /* no splash is always an acceptable outcome */
    }
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  const fading = phase === "fade";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B2545] transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <style>{`
        @keyframes ccSplashIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ccSplashPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.045); }
        }
        @keyframes ccSplashFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <img
        src="/icons/icon-512.png"
        alt=""
        className="h-28 w-28"
        style={{
          animation:
            "ccSplashIn 0.45s ease-out both, ccSplashPulse 1.1s ease-in-out 0.45s infinite",
        }}
      />
      <div
        className="mt-5 text-[28px] font-extrabold tracking-tight text-white"
        style={{ animation: "ccSplashFadeUp 0.5s ease-out 0.15s both" }}
      >
        CricCast
      </div>
      <div
        className="mt-1 text-sm text-sky-200"
        style={{ animation: "ccSplashFadeUp 0.5s ease-out 0.35s both" }}
      >
        Where to Watch Cricket in India
      </div>
    </div>
  );
}
