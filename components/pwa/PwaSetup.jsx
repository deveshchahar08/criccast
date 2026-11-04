"use client";

// PwaSetup — invisible PWA plumbing, mounted once from the root layout.
//  1. Registers /sw.js (production only).
//  2. Captures the browser's `beforeinstallprompt` event so the install
//     pill and the /install guide can fire the real installer on demand.
//     The event is stashed on window.__ccInstallPrompt and announced with
//     a "cc-install-ready" window event.
//  3. On `appinstalled`, clears the stash and broadcasts "cc-installed".
// Everything is guarded and failures are swallowed: this component must
// never throw into the app.

import { useEffect } from "react";

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

    return () => {
      try {
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", onAppInstalled);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
