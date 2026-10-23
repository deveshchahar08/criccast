"use client";

import { useState } from "react";

// Contact form — no backend mail service yet, so submitting opens the
// visitor's own email app with the message pre-filled, addressed to us.
export default function ContactForm({ to }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`CricCast contact from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="cf-name"
          className="mb-1.5 block text-sm font-bold text-navy dark:text-white"
        >
          Your name
        </label>
        <input
          id="cf-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rahul Sharma"
          className={input}
        />
      </div>
      <div>
        <label
          htmlFor="cf-email"
          className="mb-1.5 block text-sm font-bold text-navy dark:text-white"
        >
          Your email
        </label>
        <input
          id="cf-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={input}
        />
      </div>
      <div>
        <label
          htmlFor="cf-message"
          className="mb-1.5 block text-sm font-bold text-navy dark:text-white"
        >
          Message
        </label>
        <textarea
          id="cf-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Spotted a wrong channel number? Tell us which match and what the correct info is…"
          className={`${input} resize-y`}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-sky-600 px-4 py-3 text-[15px] font-extrabold text-white shadow-card transition hover:bg-sky-700 sm:w-auto sm:px-8"
      >
        Send message
      </button>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Sending opens your email app with the message addressed to us —
        just press send there.
      </p>
    </form>
  );
}
