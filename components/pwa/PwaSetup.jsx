"use client";

// PwaSetup — invisible PWA plumbing, mounted once from the root layout.
//  1. Registers /sw.js (production only).
//  2. Captures the browser's `beforeinstallprompt` event so the install
//     pill, the nav download button and the /install guide can fire the
//     real installer on demand. The event is stashed on
//     window.__ccInstallPrompt and announced with a "cc-install-ready"
//     window event.
//  3. On `appinstalled`, clears the stash and broadcasts "cc-installed".
//  4. Install counting (see /api/app-event): `appinstalled` fires ONLY
//     when an install actually completes, so that moment — and only
//     that moment — is reported as an install. Button clicks are never
//     counted (many people click and back out). For iPhone, which has
//     no such event, the truthful signal is a first launch from the
//     home-screen icon: reported once per device as "first-launch".
//  5. Dismisses the static launch splash (#cc-splash, rendered by
//     SplashStatic at the top of <body>) once the app is ready AND
//     the splash has truly been on screen for at least 1.8s, timed
//     from first paint: the splash is the page's first content, so
//     the "first-contentful-paint" paint entry marks the moment it
//     actually reached the screen. A clock stamped at <head> parse
//     time (window.__ccSplashAt) would lie on a slow phone — first
//     paint can lag it by seconds, making "visible for 1.8s" true
//     the instant the splash appears — so the stamp is only the
//     fallback for browsers that report no paint entries. A hard
//     cap hides the splash 5s after first paint however slow the
//     load, and SplashStatic's own gate script carries a 10s
//     failsafe on top of that.
// Everything is guarded and failures are swallowed: this component must
// never throw into the app.

import { useEffect } from "react";

const FIRST_LAUNCH_KEY = "cc-first-launch-counted";

// Fire-and-forget event report. Never awaited, never throws.
function reportAppEvent(type) {
  try {
    const body = JSON.stringify({ type });
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/app-event", blob)) return;
    }
    fetch("/api/app-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* counting must never break the app */
  }
}

function isStandalone() {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

export default function PwaSetup() {
  useEffect(() => {
    try {
      if (
        process.env.NODE_ENV === "production" &&
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator
      ) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    } catch {
      /* never break the app for PWA plumbing */
    }

    // First standalone launch on this device → the iPhone install
    // signal (and a harmless extra confirmation on Android). Once.
    try {
      if (isStandalone() && !window.localStorage.getItem(FIRST_LAUNCH_KEY)) {
        reportAppEvent("first-launch");
        window.localStorage.setItem(FIRST_LAUNCH_KEY, "1");
      }
    } catch {
      /* ignore */
    }

    const onBeforeInstallPrompt = (event) => {
      try {
        event.preventDefault();
        window.__ccInstallPrompt = event;
        window.dispatchEvent(new Event("cc-install-ready"));
      } catch {
        /* ignore */
      }
    };

    const onAppInstalled = () => {
      // A completed install — the only moment worth counting.
      reportAppEvent("install");
      try {
        window.__ccInstallPrompt = null;
        window.dispatchEvent(new CustomEvent("cc-installed"));
      } catch {
        /* ignore */
      }
    };

    try {
      window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.addEventListener("appinstalled", onAppInstalled);
    } catch {
      /* ignore */
    }

    // Splash dismissal (installed-app launches only). The clock is
    // REAL visible time, and visible time starts at first paint —
    // not when the gate script ran. SplashStatic stamps
    // window.__ccSplashAt while <head> is still parsing, but on a
    // slow phone the splash (SSR'd at the top of <body>) does not
    // reach the screen until first paint, which can trail the stamp
    // by 2–3s; timing "visible for 1.8s" from the stamp therefore
    // let the splash vanish ~0.5s after it appeared. The splash is
    // the page's first content, so the "first-contentful-paint"
    // entry's startTime IS the moment it became visible (same
    // performance.now() timebase as the stamp). Rule: hide once the
    // app is ready (the existing 'load' mechanism) AND first paint
    // is at least 1.8s behind us; a hard cap hides it 5s after
    // first paint even if 'load' is still pending. If no paint
    // entry ever appears (older browsers report none), fall back to
    // the gate script's stamp — the previous behaviour exactly.
    const SPLASH_MIN_VISIBLE_MS = 1800;
    const SPLASH_CAP_VISIBLE_MS = 5000;
    const SPLASH_PAINT_POLL_MS = 100;
    const SPLASH_PAINT_WAIT_MS = 1500;
    let splashHidden = false;
    let splashMinTimer;
    let splashCapTimer;
    let splashRemoveTimer;
    let splashPollTimer;
    let splashReady = false; // window 'load' fired / readyState complete
    let splashAnchorAt = null; // first-paint moment (or fallback stamp)

    const hideSplash = () => {
      if (splashHidden) return;
      splashHidden = true;
      try {
        const el = document.getElementById("cc-splash");
        if (!el) return;
        el.classList.add("cc-splash-hide");
        splashRemoveTimer = setTimeout(() => {
          try {
            el.remove();
          } catch {
            /* ignore */
          }
        }, 350);
      } catch {
        /* ignore */
      }
    };

    // Hide only when BOTH preconditions hold; called whenever either
    // one may newly hold (app became ready, anchor became known).
    const maybeHideSplash = () => {
      if (splashHidden || !splashReady || splashAnchorAt === null) return;
      try {
        const wait =
          splashAnchorAt + SPLASH_MIN_VISIBLE_MS - performance.now();
        if (wait <= 0) hideSplash();
        else {
          clearTimeout(splashMinTimer);
          splashMinTimer = setTimeout(hideSplash, wait);
        }
      } catch {
        hideSplash();
      }
    };

    // The cap is defined relative to first paint, so it can only be
    // armed once the anchor is known. It ignores app readiness —
    // a stuck load must never trap anyone behind the splash.
    const armSplashCap = () => {
      try {
        const wait =
          splashAnchorAt + SPLASH_CAP_VISIBLE_MS - performance.now();
        splashCapTimer = setTimeout(hideSplash, wait > 0 ? wait : 0);
      } catch {
        /* the gate script's failsafe still covers this */
      }
    };

    const firstPaintAt = () => {
      try {
        if (
          typeof performance === "undefined" ||
          typeof performance.getEntriesByType !== "function"
        ) {
          return null;
        }
        const entries = performance.getEntriesByType("paint") || [];
        for (let i = 0; i < entries.length; i++) {
          if (entries[i] && entries[i].name === "first-contentful-paint") {
            return entries[i].startTime;
          }
        }
      } catch {
        /* ignore */
      }
      return null;
    };

    // The pre-paint-fix clock: SplashStatic's gate-script stamp, or
    // now if even that is missing.
    const fallbackStamp = () => {
      try {
        if (typeof window.__ccSplashAt === "number") return window.__ccSplashAt;
      } catch {
        /* ignore */
      }
      try {
        return performance.now();
      } catch {
        return 0;
      }
    };

    const resolveSplashAnchor = () => {
      if (splashAnchorAt !== null) return;
      const paint = firstPaintAt();
      splashAnchorAt = paint !== null ? paint : fallbackStamp();
      armSplashCap();
      maybeHideSplash();
    };

    const onSplashLoad = () => {
      splashReady = true;
      maybeHideSplash();
    };

    try {
      if (isStandalone()) {
        if (document.readyState === "complete") splashReady = true;
        else window.addEventListener("load", onSplashLoad, { once: true });
        // First paint almost always precedes hydration, so its entry
        // is normally already there; poll briefly in case it lands a
        // tick later, then settle for the gate script's stamp.
        if (firstPaintAt() !== null) {
          resolveSplashAnchor();
        } else {
          const pollStart = Date.now();
          splashPollTimer = setInterval(() => {
            try {
              if (
                firstPaintAt() !== null ||
                Date.now() - pollStart >= SPLASH_PAINT_WAIT_MS
              ) {
                clearInterval(splashPollTimer);
                resolveSplashAnchor();
              }
            } catch {
              clearInterval(splashPollTimer);
              resolveSplashAnchor();
            }
          }, SPLASH_PAINT_POLL_MS);
        }
        maybeHideSplash();
      }
    } catch {
      /* the gate script's 10s failsafe still covers this */
    }

    return () => {
      try {
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
        window.removeEventListener("load", onSplashLoad);
        clearTimeout(splashMinTimer);
        clearTimeout(splashCapTimer);
        clearTimeout(splashRemoveTimer);
        clearInterval(splashPollTimer);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
