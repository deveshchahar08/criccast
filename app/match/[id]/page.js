import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById } from "@/lib/queries";
import { DTH_OPERATORS, teamColor } from "@/lib/dth";
import { formatDayTimeIST, timeAgo } from "@/lib/format";
import VerifiedBadge from "@/components/VerifiedBadge";
import Countdown from "@/components/Countdown";

export const revalidate = 60;

// SEO: one page per match — this is the Google-traffic play.
export async function generateMetadata({ params }) {
  const { id } = await params; // Next.js 16: params is a Promise
  const { match } = await getMatchById(id);
  if (!match) return { title: "Match not found — CricCast" };
  // Title targets the exact query fans type: "<team> vs <team> where to watch"
  const title = `${match.teams[0]} vs ${match.teams[1]} — Where to Watch on TV & OTT | CricCast`;
  return {
    title,
    description: `Where to watch ${match.teams[0]} vs ${match.teams[1]} (${match.seriesName}) in India: TV channels, OTT apps and DTH channel numbers. Verified by us.`,
  };
}

function StatusLine({ match }) {
  if (match.status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-600 dark:bg-red-950 dark:text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
      </span>
    );
  if (match.status === "finished")
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {match.resultText || "Finished"}
      </span>
    );
  return (
    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
      {formatDayTimeIST(match.startTime)} · <Countdown startTime={match.startTime} />
    </span>
  );
}

export default async function MatchPage({ params }) {
  const { id } = await params;
  const { match } = await getMatchById(id);
  if (!match) notFound();

  const b = match.broadcast || { tvChannels: [], ottPlatforms: [] };
  const [t1, t2] = match.teams;
  const [s1, s2] = match.shortNames?.length === 2 ? match.shortNames : ["", ""];

  // SportsEvent JSON-LD — helps Google show this page for match queries.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${t1} vs ${t2} — ${match.seriesName}`,
    startDate: match.startTime,
    location: { "@type": "Place", name: match.venue || match.city || "India" },
    competitor: [
      { "@type": "SportsTeam", name: t1 },
      { "@type": "SportsTeam", name: t2 },
    ],
  };

  // FAQ — targets "where to watch" queries; visible content + FAQPage schema
  // can win Google's rich results for new sites.
  const tvNames = (b.tvChannels || []).map((c) => c.name);
  const ottNames = (b.ottPlatforms || []).map((o) => o.name);
  const firstTv = (b.tvChannels || [])[0];
  const faqs = [
    {
      q: `Where can I watch ${t1} vs ${t2} live in India?`,
      a:
        tvNames.length || ottNames.length
          ? `${t1} vs ${t2} (${match.seriesName}) will be telecast live in India` +
            (tvNames.length ? ` on ${tvNames.join(", ")}` : "") +
            (ottNames.length ? ` and streamed on ${ottNames.join(", ")}` : "") +
            `. Channel numbers for Tata Play, Airtel DTH, Dish TV and DD FreeDish are listed above.`
          : `Broadcast details for ${t1} vs ${t2} (${match.seriesName}) are being verified and will appear here soon.`,
    },
    firstTv && {
      q: `What channel number is ${t1} vs ${t2} on DTH?`,
      a:
        `${firstTv.name} — showing ${t1} vs ${t2} — is on ` +
        DTH_OPERATORS.map((o) =>
          firstTv.numbers?.[o.id] ? `${o.label} channel ${firstTv.numbers[o.id]}` : null
        )
          .filter(Boolean)
          .join(", ") +
        `.`,
    },
    {
      q: `Is ${t1} vs ${t2} free to watch?`,
      a: (b.ottPlatforms || []).some((o) => o.free)
        ? `Yes — ${(b.ottPlatforms || [])
            .filter((o) => o.free)
            .map((o) => o.name)
            .join(", ")} streams it free in India.`
        : `There is no confirmed free stream for ${t1} vs ${t2} yet. A paid subscription to the streaming app or a DTH sports pack is required.`,
    },
  ].filter(Boolean);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 md:max-w-4xl lg:max-w-5xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <Link href="/" className="text-sm font-bold text-sky-600 hover:underline">
        ← Back to matches
      </Link>

      {/* H1 targets the "where to watch" query */}
      <h1 className="mt-3 text-xl font-extrabold tracking-tight text-navy dark:text-white">
        Where to Watch {t1} vs {t2}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        {match.seriesName}
        {match.matchNumber ? ` • ${match.matchNumber}` : ""} — TV channels, OTT apps &amp; DTH numbers
      </p>

      {/* Header */}
      <section className="mt-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-col items-center gap-1.5">
          <StatusLine match={match} />
          <p className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
            {match.seriesName} {match.matchNumber ? `• ${match.matchNumber}` : ""}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          {[[t1, s1], [t2, s2]].map(([name, short], i) => (
            <div key={name} className={`flex flex-1 items-center gap-3 ${i === 1 ? "flex-row-reverse text-right" : ""}`}>
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ backgroundColor: teamColor(short) }}
              >
                {short}
              </span>
              <div>
                <p className="text-lg font-extrabold text-navy dark:text-white">{name}</p>
                {match.venue && i === 1 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{match.venue}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {match.city && (
          <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
            {match.city}
          </p>
        )}
        <div className="mt-2 flex items-center justify-center gap-3">
          <VerifiedBadge verifiedAt={match.verifiedAt} />
          {match.sourceUrl && (
            <a
              href={match.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Source ↗
            </a>
          )}
        </div>
      </section>

      {/* OTT */}
      {(b.ottPlatforms || []).length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-base font-extrabold text-navy dark:text-white">Where to Stream (OTT)</h2>
          <div className="space-y-2.5">
            {b.ottPlatforms.map((ott) => (
              <div key={ott.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy dark:bg-sky-600">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-navy dark:text-white">
                    {ott.name}
                    {ott.freeNote && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${ott.free ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"}`}>
                        {ott.freeNote}
                      </span>
                    )}
                  </p>
                  {(ott.languages?.length > 0) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Languages: {ott.languages.join(", ")}</p>
                  )}
                  {ott.notes && <p className="text-xs text-slate-500 dark:text-slate-400">{ott.notes}</p>}
                </div>
                {ott.url && (
                  <a href={ott.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700">
                    Watch ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TV with per-operator channel numbers */}
      {(b.tvChannels || []).length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 text-base font-extrabold text-navy dark:text-white">Watch on TV</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">Channel</th>
                {DTH_OPERATORS.map((o) => (
                  <th key={o.id} className="px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{o.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.tvChannels.map((ch) => (
                <tr key={ch.name} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-navy dark:text-white">{ch.name}</p>
                    {(ch.languages?.length > 0) && <p className="text-[11px] text-slate-500 dark:text-slate-400">{ch.languages.join(", ")}</p>}
                  </td>
                  {DTH_OPERATORS.map((o) => (
                    <td key={o.id} className="px-2 py-3 text-center tabular-nums text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      {ch.numbers?.[o.id] || <span className="font-medium text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            Numbers vary by region — confirm on your set-top box guide.
          </p>
        </section>
      )}

      {/* Digital only notice */}
      {match.digitalOnly && (
        <p className="mt-4 rounded-xl bg-sky-100/70 p-3 text-[13px] leading-snug text-slate-700 dark:bg-sky-950 dark:text-slate-300">
          <strong>Digital Only:</strong> {match.digitalOnlyNote || "No linear TV telecast in India for this match."}
        </p>
      )}

      {/* Live score — zero data cost outbound link */}
      <a
        href="https://www.cricbuzz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sky-200 bg-white p-4 text-sm font-bold text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
      >
        Live score →
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">(opens Cricbuzz)</span>
      </a>

      {match.verifiedAt && (
        <p className="mt-3 pb-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Last verified {timeAgo(match.verifiedAt)}
        </p>
      )}

      {/* FAQ — visible answers matching the FAQPage schema above */}
      <section className="mt-4 pb-6" aria-label="Frequently asked questions">
        <h2 className="mb-2 text-base font-extrabold text-navy dark:text-white">FAQs</h2>
        <div className="space-y-2.5">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="cursor-pointer list-none text-sm font-bold text-navy dark:text-white">
                {f.q}
              </summary>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
