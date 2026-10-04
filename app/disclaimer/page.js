// Disclaimer — the most legally important static page.
export const metadata = { title: "Disclaimer — CricCast" };

const CONTACT_EMAIL = "contact@criccast.in";

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy dark:text-white">
        Disclaimer
      </h1>
      <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
        Last updated: October 1, 2026
      </p>

      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            CricCast does not stream, host, or broadcast any live cricket
            matches. We are purely an information guide — we tell you{" "}
            <em>where</em> a match is officially being telecast or
            streamed, and we always direct you to the official broadcaster
            or OTT platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Accuracy of broadcast information
          </h2>
          <p>
            Broadcast schedules, TV channel numbers, and OTT streaming
            rights are collected from third-party sources (official
            broadcaster announcements, press releases, and listings) and
            are organised and updated with AI assistance, followed by a
            human verification step. Despite our best efforts, this
            information may occasionally be{" "}
            <strong>inaccurate, incomplete, or outdated</strong> —
            broadcasters can and do change schedules, and channel numbers
            vary by DTH operator and region.
          </p>
          <p className="mt-2">
            <strong>
              Please always verify with the official broadcaster or OTT
              platform
            </strong>{" "}
            before match time for final confirmation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            No official affiliation
          </h2>
          <p>
            CricCast is an independent project and is{" "}
            <strong>
              not affiliated with, endorsed by, or officially connected to
            </strong>{" "}
            any broadcaster (such as Star Sports, Sony Sports, or DD
            Sports), any OTT platform (such as JioHotstar, Sony LIV, or
            FanCode), any cricket board (such as the BCCI or ICC), or any
            DTH operator. All team names, tournament names, channel names,
            and logos referenced on this Site belong to their respective
            owners and are used only to identify where matches can be
            watched.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Watch on official platforms only
          </h2>
          <p>
            We strongly encourage watching cricket only through official,
            licensed broadcasters and streaming services. CricCast does
            not link to, endorse, or support pirated or unauthorised
            streams in any form.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Copyright and takedown requests
          </h2>
          <p>
            If you are a rights holder and believe any content on CricCast
            infringes your copyright or should be corrected or removed,
            please contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-sky-600 underline dark:text-sky-400"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            with details of the content in question. We review every
            request promptly and will act on valid requests without delay.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Limitation of liability
          </h2>
          <p>
            The information on this Site is provided &ldquo;as is&rdquo;
            for general guidance only. CricCast is not liable for any loss
            or inconvenience arising from reliance on the broadcast
            information published here, including missed matches due to
            schedule changes.
          </p>
        </section>
      </div>
    </div>
  );
}
