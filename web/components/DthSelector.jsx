"use client";
// The DTH selector: pick your operator once, every card shows YOUR channel numbers.
// A short toast confirms the switch so users see the effect immediately.
import { useEffect, useRef, useState } from "react";
import { DTH_OPERATORS } from "@/lib/dth";
import { useDth } from "./DthProvider";

export default function DthSelector({ className = "px-4 pt-4" }) {
  const { dth, setDth } = useDth();
  const [toast, setToast] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const select = (op) => {
    if (op.id === dth) return;
    setDth(op.id);
    setToast(`Showing channel numbers for ${op.label}`);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  };

  return (
    <section aria-label="Select your DTH operator" className={className}>
      <div className="mb-2">
        <h2 className="text-xs font-extrabold tracking-wide text-slate-700 dark:text-slate-200">
          SELECT YOUR DTH OPERATOR
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
          Channel numbers on match cards will update for your set-top box
        </p>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {DTH_OPERATORS.map((op) => {
          const active = dth === op.id;
          return (
            <button
              key={op.id}
              onClick={() => select(op)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-sky-600 text-white shadow-card"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              {op.id === "ddFreeDish" && !active && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
              {op.label}
            </button>
          );
        })}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg dark:bg-sky-600"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
