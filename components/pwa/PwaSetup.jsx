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
//     SplashStatic at the top of <body>) once the app has loaded —
//     never before 1s from navigation start (the animation gets its
//     moment) and never later than 2.6s, however slow the load.
//     SplashStatic's own gate script carries a 4s failsafe on top.
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

    // Splash dismissal (installed-app launches only). performance.now()
    // is milliseconds since navigation start, which is exactly the
    // clock the 1s floor / 2.6s cap are measured on.
    let splashHidden = false;
    let splashMinTimer;
    let splashCapTimer;
    let splashRemoveTimer;
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
    const hideWhenReady = () => {
      try {
        const wait = 1000 - performance.now();
        if (wait <= 0) hideSplash();
        else splashMinTimer = setTimeout(hideSplash, wait);
      } catch {
        hideSplash();
      }
    };
    try {
      if (isStandalone()) {
        if (document.readyState === "complete") hideWhenReady();
        else window.addEventListener("load", hideWhenReady, { once: true });
        const capWait = 2600 - performance.now();
        splashCapTimer = setTimeout(hideSplash, capWait > 0 ? capWait : 0);
      }
    } catch {
      /* the gate script's 4s failsafe still covers this */
    }

    return () => {
      try {
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
        window.removeEventListener("load", hideWhenReady);
        clearTimeout(splashMinTimer);
        clearTimeout(splashCapTimer);
        clearTimeout(splashRemoveTimer);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
