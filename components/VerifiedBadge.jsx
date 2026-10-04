import { timeAgo } from "@/lib/format";

// THE trust badge. Prominent on cards; quiet on detail pages.
// verifiedAt = null -> subtle "not verified yet" (never faked).
export default function VerifiedBadge({ verifiedAt, size = "sm" }) {
  if (!verifiedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" strokeLinecap="round" />
        </svg>
        Not verified yet
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 ${
        size === "sm" ? "text-[11px]" : "text-xs"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-500" aria-hidden>
        <path d="M12 2l2.4 2.4 3.4-.5 1 3.3 3.2 1.2-1.4 3.1 1.4 3.1-3.2 1.2-1 3.3-3.4-.5L12 22l-2.4-2.4-3.4.5-1-3.3-3.2-1.2L3.4 12 2 8.9l3.2-1.2 1-3.3 3.4.5L12 2z" />
        <path d="M10.6 14.6l-2.1-2.1-1.4 1.4 3.5 3.5 7-7-1.4-1.4z" fill="#fff" />
      </svg>
      Verified by us · {timeAgo(verifiedAt)}
    </span>
  );
}
