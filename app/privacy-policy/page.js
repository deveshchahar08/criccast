// Privacy Policy — static legal page (required for Google AdSense approval).
export const metadata = { title: "Privacy Policy — CricCast" };

const CONTACT_EMAIL = "contact@criccast.in";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
        Last updated: October 1, 2026
      </p>

      <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          CricCast (&ldquo;we&rdquo;, &ldquo;our&rdquo;) is a free cricket
          broadcast guide for India. This policy explains what information we
          collect when you use criccast (the &ldquo;Site&rdquo;) and how we use
          it. By using the Site, you agree to this policy.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            1. Information we collect
          </h2>
          <p>
            CricCast does <strong>not</strong> require you to create an
            account, sign in, or share your name, email address, or phone
            number. We do not collect personal information through forms,
            registrations, or newsletters at this time.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Preferences stored on your device:</strong> your chosen
              DTH operator (Tata Play, Airtel DTH, Dish TV, or DD FreeDish)
              and your light/dark theme choice are saved in your
              browser&rsquo;s local storage. This data never leaves your
              device and is never sent to our servers.
            </li>
            <li>
              <strong>Basic server logs:</strong> our hosting provider may
              automatically log standard technical data such as your IP
              address, browser type, and pages visited, used only for
              security, debugging, and keeping the Site running.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            2. Cookies and advertising
          </h2>
          <p>
            We plan to display ads on CricCast through{" "}
            <strong>Google AdSense</strong>. Google and its partners use
            cookies — including the DoubleClick cookie — to serve ads based
            on your visits to this Site and other sites across the internet.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              These third-party cookies enable Google to show you
              personalised ads that may be more relevant to you.
            </li>
            <li>
              You may opt out of personalised advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-600 underline dark:text-sky-400"
              >
                Google&rsquo;s Ads Settings
              </a>
              . Alternatively, you can opt out of some third-party
              vendors&rsquo; use of cookies for personalised advertising at{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-600 underline dark:text-sky-400"
              >
                aboutads.info/choices
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            3. Analytics
          </h2>
          <p>
            We do not currently use Google Analytics or any other
            third-party analytics service. If we introduce analytics in the
            future, this policy will be updated to describe it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            4. Third-party links
          </h2>
          <p>
            CricCast links out to official broadcaster websites, OTT apps
            (such as Disney+ Hotstar, JioHotstar, Sony LIV, and FanCode),
            and live-score providers. These external sites have their own
            privacy policies, and we are not responsible for their practices.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            5. Children&rsquo;s privacy
          </h2>
          <p>
            The Site is a general-audience utility and is not directed at
            children under 13. We do not knowingly collect personal
            information from children.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            6. Changes to this policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time (for
            example, when we add user accounts, alerts, or analytics). The
            &ldquo;Last updated&rdquo; date at the top will always reflect
            the latest version.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-navy dark:text-white">
            7. Contact us about your data
          </h2>
          <p>
            If you have any questions about this policy or your data, write
            to us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-sky-600 underline dark:text-sky-400"
            >
              {CONTACT_EMAIL}
            </a>
            . We will respond as soon as we can.
          </p>
        </section>
      </div>
    </div>
  );
}
