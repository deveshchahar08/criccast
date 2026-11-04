// Offline fallback — shown by the service worker when a page navigation
// fails because the device has no connection. Static on purpose: it is
// precached at service-worker install time and must work with zero data.
export const metadata = { title: "Offline — CricCast" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:max-w-3xl">
      <div className="rounded-2xl bg-white p-6 text-center shadow-card md:p-10 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-canvas dark:bg-slate-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-primary"
            aria-hidden="true"
          >
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
            <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
            <path d="M5 13a10 10 0 0 1 5.24-2.76" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-navy dark:text-white">
          You are offline
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          CricCast needs an internet connection to show the latest verified
          broadcast information — channel numbers and streaming details are
          checked live, so nothing is stored offline.
        </p>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          Please check your connection and try again.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
        >
          Reload CricCast
        </a>
      </div>
    </div>
  );
}
