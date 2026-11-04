"use client";

// InstallPill — floating "Download App" pill.
// Shown only when the app can actually be installed from here:
//   - a captured beforeinstallprompt exists (Android / desktop Chrome), or
//   - the visitor is on iOS Safari (no prompt exists there — the pill
//     takes them to the /install guide instead).
// Hidden when already running standalone, on the /install page itself,
// and for 14 days after the visitor dismisses it.

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const DISMISS_KEY = "cc-install-dismissed";
const DISMISS_DAYS = 14;

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

function isDismissedRecently() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const when = parseInt(raw, 10);
    if (Number.isNaN(when)) return false;
    return Date.now() - when < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isIos() {
  try {
    return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || "");
  } catch {
    return false;
  }
}

export default function InstallPill() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const evaluate = useCallback(() => {
    try {
      if (isStandalone() || isDismissedRecently()) {
        setVisible(false);
        return;
      }
      const hasPrompt = typeof window !== "undefined" && !!window.__ccInstallPrompt;
      setVisible(hasPrompt || isIos());
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    evaluate();
    const onReady = () => evaluate();
    const onInstalled = () => setVisible(false);
    try {
      window.addEventListener("cc-install-ready", onReady);
      window.addEventListener("cc-installed", onInstalled);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        window.removeEventListener("cc-install-ready", onReady);
        window.removeEventListener("cc-installed", onInstalled);
      } catch {
        /* ignore */
      }
    };
  }, [evaluate]);

  const handleClick = useCallback(async () => {
    try {
      const promptEvent = window.__ccInstallPrompt;
      if (promptEvent && typeof promptEvent.prompt === "function") {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        window.__ccInstallPrompt = null;
        if (choice && choice.outcome === "accepted") {
          setVisible(false);
        }
        return;
      }
    } catch {
      /* fall through to the guide */
    }
    router.push("/install");
  }, [router]);

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  if (!visible || pathname === "/install") return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:inset-x-auto md:right-6 md:bottom-6 md:justify-end md:px-0">
      <div className="flex items-center gap-1 rounded-full bg-navy py-1.5 pr-1.5 pl-4 shadow-lg shadow-navy/30 dark:bg-white">
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-2 text-sm font-bold text-white dark:text-navy"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install suggestion"
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white dark:text-navy/60 dark:hover:bg-navy/10 dark:hover:text-navy"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
