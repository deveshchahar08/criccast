// About Us — static page: what CricCast is, who built it, and why.
export const metadata = { title: "About Us — CricCast" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy dark:text-white">
        About CricCast
      </h1>

      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            What is CricCast?
          </h2>
          <p>
            CricCast is a simple broadcast guide for cricket fans in India.
            For every upcoming match, it tells you exactly{" "}
            <strong>where to watch</strong> — which TV channel is
            telecasting it, the channel number on your DTH set-top box
            (Tata Play, Airtel DTH, Dish TV, or DD FreeDish), and which OTT
            app is streaming it, including whether it is free or needs a
            subscription.
          </p>
          <p className="mt-2">
            No scores, no noise, no endless scrolling through TV guides —
            just one clear answer to &ldquo;match kahan dekhun?&rdquo;
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Who built this, and why?
          </h2>
          <p>
            CricCast is an independent project started in 2026 by a
            developer and lifelong cricket fan. It began with a familiar
            frustration: a big match is about to start, and nobody in the
            house can figure out which channel number it is on — the TV
            guide is confusing, the OTT app homepages all look the same,
            and a Google search gives five different answers.
          </p>
          <p className="mt-2">
            So the goal was deliberately narrow: do one thing well. Every
            match card on CricCast is checked against broadcaster
            information and marked{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              &ldquo;Verified by us&rdquo;
            </span>{" "}
            with a timestamp, so you know the information was actually
            reviewed by a human — not scraped blindly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            Our mission
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Save cricket fans time</strong> — the answer should
              take three seconds, not three searches.
            </li>
            <li>
              <strong>Remove confusion</strong> — one page per match with
              every viewing option: TV, DTH channel numbers, and OTT.
            </li>
            <li>
              <strong>Stay honest about scope</strong> — we don&rsquo;t
              pretend to be a live-score app. We point you to the official
              telecast and get out of the way.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            What&rsquo;s next?
          </h2>
          <p>
            We are steadily adding more series and tournaments, keeping
            DTH channel numbers up to date, and working on match alerts so
            you never miss the start of a game. If you spot an error in
            any broadcast listing, please{" "}
            <a
              href="/contact"
              className="font-semibold text-sky-600 underline dark:text-sky-400"
            >
              tell us
            </a>{" "}
            — corrections from fans keep CricCast accurate.
          </p>
        </section>
      </div>
    </div>
  );
}
