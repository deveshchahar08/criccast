"use client";

// InstallGuide — the full "Download App" instruction screen.
// The visitor's platform is auto-detected and its section is shown
// first; Android/Chrome visitors with a captured install prompt get the
// real one-tap installer from the big button. The iPhone flow is shown
// as three visual step cards (pure CSS/SVG mocks — no screenshots).

import { useCallback, useEffect, useMemo, useState } from "react";

/* ---------------------------------- bits ---------------------------------- */

function StepNumber({ n }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
      {n}
    </span>
  );
}

function NumberedSteps({ steps }) {
  return (
    <ol className="space-y-3.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <StepNumber n={i + 1} />
          <p className="pt-0.5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

function SectionCard({ id, title, subtitle, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-5 shadow-card md:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-lg font-extrabold tracking-tight text-navy dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* --------------------------- iPhone visual mocks --------------------------- */

function ShareIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 15V4" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />
    </svg>
  );
}

// Step 1 mock: a mini Safari window — page area on top, browser chrome
// bar at the bottom with the Share icon highlighted by a glowing ring.
function SafariMock() {
  return (
    <div className="mx-auto w-full max-w-[210px] overflow-hidden rounded-[1.4rem] border-[5px] border-navy bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
      {/* page area */}
      <div className="space-y-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-4 w-4 rounded" />
          <div className="h-2 w-16 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-2 w-5/6 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 rounded-lg bg-canvas dark:bg-slate-800" />
        <div className="h-2 w-4/6 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      {/* Safari chrome bar */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm text-slate-400">‹</span>
        <span className="text-sm text-slate-300 dark:text-slate-600">›</span>
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-primary/30" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white ring-4 ring-primary/25">
            <ShareIcon className="h-4.5 w-4.5" />
          </span>
        </span>
        <span className="flex gap-0.5" aria-hidden="true">
          <span className="h-3.5 w-3 rounded-[3px] border-2 border-slate-300 dark:border-slate-600" />
          <span className="h-3.5 w-3 rounded-[3px] border-2 border-slate-300 dark:border-slate-600" />
        </span>
        <span className="text-base leading-none text-slate-400">•••</span>
      </div>
    </div>
  );
}

// Step 2 mock: a share sheet whose "Add to Home Screen" row is lit up.
function ShareSheetMock() {
  const rows = [
    { label: "Copy", icon: "▣" },
    { label: "Add to Reading List", icon: "◉" },
    { label: "Add Bookmark", icon: "▸" },
  ];
  return (
    <div className="mx-auto w-full max-w-[230px] rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 px-2 pt-1.5 pb-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-navy dark:text-white">
            CricCast
          </p>
          <p className="truncate text-[10px] text-slate-400">criccast.co.in</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between bg-primary px-3 py-2.5 text-white shadow-sm">
          <span className="text-xs font-bold">Add to Home Screen</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-white/90 text-sm leading-none font-bold">
            +
          </span>
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 dark:border-slate-800"
          >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {row.label}
            </span>
            <span className="text-[11px] text-slate-300 dark:text-slate-600" aria-hidden="true">
              {row.icon}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-xl bg-white py-2.5 text-center text-xs font-semibold text-slate-400 dark:bg-slate-900">
        Cancel
      </div>
    </div>
  );
}

// Step 3 mock: a home-screen grid with the CricCast tile in place.
function HomeScreenMock() {
  const tiles = [
    "bg-emerald-200 dark:bg-emerald-900",
    "bg-amber-200 dark:bg-amber-900",
    "bg-rose-200 dark:bg-rose-900",
    "bg-violet-200 dark:bg-violet-900",
    "bg-teal-200 dark:bg-teal-900",
    "bg-orange-200 dark:bg-orange-900",
    "bg-indigo-200 dark:bg-indigo-900",
    "bg-lime-200 dark:bg-lime-900",
    "bg-cyan-200 dark:bg-cyan-900",
    "bg-fuchsia-200 dark:bg-fuchsia-900",
    "bg-slate-300 dark:bg-slate-700",
  ];
  return (
    <div className="mx-auto w-full max-w-[210px] rounded-[1.4rem] border-[5px] border-navy bg-canvas px-3.5 pt-4 pb-3 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="grid grid-cols-4 gap-2.5">
        <div className="flex flex-col items-center gap-1">
          <span className="relative block">
            <span className="absolute -inset-1 rounded-2xl bg-primary/25 animate-pulse" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="CricCast app icon"
              className="relative h-10 w-10 rounded-[11px] ring-2 ring-primary"
            />
          </span>
          <span className="text-[8px] font-bold text-navy dark:text-white">
            CricCast
          </span>
        </div>
        {tiles.slice(0, 3).map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={`h-10 w-10 rounded-[11px] ${c}`} />
            <span className="h-1.5 w-7 rounded-full bg-navy/15 dark:bg-white/20" />
          </div>
        ))}
        {tiles.slice(3).map((c, i) => (
          <div key={i + 3} className="flex flex-col items-center gap-1">
            <span className={`h-10 w-10 rounded-[11px] ${c}`} />
            <span className="h-1.5 w-7 rounded-full bg-navy/15 dark:bg-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function IphoneVisualSteps() {
  const cards = [
    {
      mock: <SafariMock />,
      caption: "Tap the Share button",
      text: "Open CricCast in Safari and tap the Share button in the bar at the bottom of the screen.",
    },
    {
      mock: <ShareSheetMock />,
      caption: "Tap “Add to Home Screen”",
      text: "Scroll the menu that appears and tap “Add to Home Screen”.",
    },
    {
      mock: <HomeScreenMock />,
      caption: "CricCast is now on your Home Screen",
      text: "Tap “Add” to confirm. The CricCast icon appears on your Home Screen — tap it any time to open the app.",
    },
  ];
  return (
    <div>
      <div className="flex flex-col md:grid md:grid-cols-3 md:gap-4">
        {cards.map((card, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-canvas/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <StepNumber n={i + 1} />
                <h3 className="text-sm font-extrabold tracking-tight text-navy dark:text-white">
                  {card.caption}
                </h3>
              </div>
              <div className="flex flex-1 items-center py-4">{card.mock}</div>
              <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                {card.text}
              </p>
            </div>
            {i < cards.length - 1 && (
              <div
                className="flex justify-center py-1.5 text-primary md:hidden"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 animate-bounce"
                >
                  <path d="M12 4v16" />
                  <path d="m6 14 6 6 6-6" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-[13px] leading-relaxed font-medium text-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
        Please note: on iPhone, installing works only in the{" "}
        <strong>Safari</strong> browser. If you opened this page inside
        another app or in Chrome, open criccast.co.in in Safari first, then
        follow the steps above.
      </p>
    </div>
  );
}

/* --------------------------------- guide ---------------------------------- */

const ANDROID_STEPS = [
  <>
    Tap the <strong>Download App</strong> button at the top of this page —
    Chrome will ask you to confirm.
  </>,
  <>
    Tap <strong>Install</strong>. CricCast is added to your home screen and
    app drawer in a few seconds.
  </>,
  <>
    No button? Open the Chrome menu (<strong>⋮</strong>, top-right) and tap{" "}
    <strong>“Install app”</strong> or <strong>“Add to Home screen”</strong>,
    then confirm.
  </>,
];

const DESKTOP_STEPS = [
  <>
    Look for the <strong>install icon</strong> at the right end of the
    address bar in Chrome or Edge, and click it.
  </>,
  <>
    Or open the browser menu (<strong>⋮</strong>) and choose{" "}
    <strong>“Install CricCast”</strong>.
  </>,
  <>
    Click <strong>Install</strong> — CricCast opens in its own window and is
    added to your apps, just like a regular program.
  </>,
];

export default function InstallGuide() {
  const [platform, setPlatform] = useState("android");
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    try {
      const ua = window.navigator.userAgent || "";
      if (/iPhone|iPad|iPod/i.test(ua)) setPlatform("ios");
      else if (/Android/i.test(ua)) setPlatform("android");
      else setPlatform("desktop");
      if (/FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(ua)) setInAppBrowser(true);
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      ) {
        setInstalled(true);
      }
      setHasPrompt(!!window.__ccInstallPrompt);
    } catch {
      /* detection is best-effort */
    }
    const onReady = () => setHasPrompt(true);
    const onInstalled = () => {
      setInstalled(true);
      setHasPrompt(false);
    };
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
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      const promptEvent = window.__ccInstallPrompt;
      if (promptEvent && typeof promptEvent.prompt === "function") {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        window.__ccInstallPrompt = null;
        setHasPrompt(false);
        if (choice && choice.outcome === "accepted") setInstalled(true);
        return;
      }
    } catch {
      /* fall through to scrolling to the guide */
    }
    try {
      const el = document.getElementById(`install-${platform}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* ignore */
    }
  }, [platform]);

  const order = useMemo(() => {
    const all = ["android", "ios", "desktop"];
    return [platform, ...all.filter((p) => p !== platform)];
  }, [platform]);

  const sections = {
    android: (
      <SectionCard
        key="android"
        id="install-android"
        title="Android (Chrome)"
        subtitle={
          platform === "android"
            ? "This looks like your device — start here."
            : "For Android phones and tablets using Chrome."
        }
      >
        <NumberedSteps steps={ANDROID_STEPS} />
      </SectionCard>
    ),
    ios: (
      <SectionCard
        key="ios"
        id="install-ios"
        title="iPhone & iPad (Safari)"
        subtitle={
          platform === "ios"
            ? "This looks like your device — start here. Three quick taps and CricCast sits on your Home Screen."
            : "For iPhone and iPad. Apple does not offer a one-tap install, so follow these three steps in Safari."
        }
      >
        <IphoneVisualSteps />
      </SectionCard>
    ),
    desktop: (
      <SectionCard
        key="desktop"
        id="install-desktop"
        title="Computer (Chrome / Edge)"
        subtitle={
          platform === "desktop"
            ? "This looks like your device — start here."
            : "For Windows, Mac and Chromebook using Chrome or Edge."
        }
      >
        <NumberedSteps steps={DESKTOP_STEPS} />
      </SectionCard>
    ),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-3xl">
      {/* Header + the big button */}
      <div className="rounded-2xl bg-navy p-6 text-center shadow-card md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt="CricCast app icon"
          className="mx-auto h-20 w-20 rounded-[1.3rem] shadow-lg"
        />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          Get the CricCast App
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-slate-300">
          Add CricCast to your home screen — the same verified broadcast
          info, one tap away. No Play Store or App Store needed, and nothing
          to pay.
        </p>
        {installed ? (
          <p className="mx-auto mt-6 max-w-md rounded-full bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-300">
            CricCast is installed — open it from your home screen.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-primary-dark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download App
            </button>
            <p className="mt-3 text-xs font-medium text-slate-400">
              {hasPrompt
                ? "One tap — your browser will ask you to confirm the install."
                : "Your browser does not offer one-tap install here — follow the steps for your device below."}
            </p>
          </>
        )}
      </div>

      {/* In-app browser warning */}
      {inAppBrowser && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/40">
          <h2 className="text-base font-extrabold tracking-tight text-amber-900 dark:text-amber-200">
            You are inside another app&apos;s browser
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            This page was opened inside an app such as WhatsApp, Instagram or
            Facebook, and apps cannot be installed from here. Tap the{" "}
            <strong>⋮</strong> menu and choose{" "}
            <strong>“Open in Chrome”</strong> (Android) or{" "}
            <strong>“Open in Safari”</strong> (iPhone) first, then install
            from there.
          </p>
        </div>
      )}

      {/* Why install */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "One tap to every match",
            text: "The CricCast icon sits on your home screen — no searching, no typing the address.",
          },
          {
            title: "A real app feel",
            text: "Opens full-screen in its own window, without browser bars in the way.",
          },
          {
            title: "Always the latest info",
            text: "Channel numbers and streaming details load live and verified, exactly like the website.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-sm font-extrabold tracking-tight text-navy dark:text-white">
              {item.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Platform sections, visitor's own platform first */}
      <div className="mt-5 space-y-5">
        {order.map((key) => sections[key])}
      </div>

      <p className="mt-6 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
        Already installed? Open CricCast from your home screen — you are all
        set.
      </p>
    </div>
  );
}
