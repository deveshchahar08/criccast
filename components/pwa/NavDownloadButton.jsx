"use client";

// NavDownloadButton — the permanent "Download App" entry in the top
// bar, beside the theme toggle and search. Unlike the floating pill
// (which can be dismissed), this one is always there for anyone who
// hasn't installed the app yet. Same behaviour contract as the pill:
//   - hidden when already running as the installed app (standalone)
//     or once the browser reports the app as installed;
//   - click fires the captured beforeinstallprompt when one exists
//     (Android / desktop Chrome — the real installer);
//   - otherwise it goes to /install, where the visual steps live
//     (the only route Apple allows on iPhone).
// Mounted once from TopBar. Defensive throughout, like all PWA parts.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function NavDownloadButton() {
  // Start hidden: inside the installed app there must never be even a
  // flash of a "download" button — the effect below turns it on for
  // ordinary browser visits only.
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const evaluate = () => {
      try {
        setVisible(!isStandalone());
      } catch {
        setVisible(false);
      }
    };
    evaluate();
    const onInstalled = () => setVisible(false);
    try {
      window.addEventListener("cc-install-ready", evaluate);
      window.addEventListener("cc-installed", onInstalled);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        window.removeEventListener("cc-install-ready", evaluate);
        window.removeEventListener("cc-installed", onInstalled);
      } catch {
        /* ignore */
      }
    };
  }, []);

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

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Download the CricCast app"
      className="ml-1 flex items-center gap-1.5 rounded-full bg-sky-600 p-2 text-white transition hover:bg-sky-700 sm:px-3.5 sm:py-1.5 sm:text-sm sm:font-bold"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-4 sm:w-4"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="hidden sm:inline">Download App</span>
    </button>
  );
}
