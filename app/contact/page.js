// Contact Us — static page with a contact form + direct email address.
// CONTACT_EMAIL is a placeholder: Hy will replace it with the real address.
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact Us — CricCast" };

const CONTACT_EMAIL = "contact@criccast.in";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy dark:text-white">
        Contact Us
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        Spotted a wrong channel number, a missing match, or a broadcast
        change we haven&rsquo;t caught yet? Tell us — corrections from
        fans are the fastest way CricCast stays accurate.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-bold text-navy dark:text-white">
          Prefer email directly?
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-1 inline-block text-[15px] font-semibold text-sky-600 underline dark:text-sky-400"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          We read every message and usually reply within a couple of days.
        </p>
      </div>

      <h2 className="mt-8 text-lg font-extrabold text-navy dark:text-white">
        Send us a message
      </h2>
      <ContactForm to={CONTACT_EMAIL} />
    </div>
  );
}
