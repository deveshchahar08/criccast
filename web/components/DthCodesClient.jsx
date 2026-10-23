"use client";
// DTH CODES — static directory of main sports channels with the number on
// YOUR selected operator. This + DD FreeDish info is the moat.
import { useDth } from "@/components/DthProvider";
import { DTH_OPERATORS, SPORTS_CHANNEL_DIRECTORY } from "@/lib/dth";
import DthSelector from "@/components/DthSelector";

export function DthCodesClient() {
  const { dth } = useDth();
  const operator = DTH_OPERATORS.find((o) => o.id === dth);

  return (
    <div>
      <DthSelector className="mb-3" />
      <div className="grid gap-3 md:grid-cols-2">
        {SPORTS_CHANNEL_DIRECTORY.map((channel) => {
          const num = channel.numbers?.[dth];
          return (
            <div key={channel.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-navy dark:text-white">{channel.name}</p>
                {num ? (
                  <span className="tabular-nums rounded-lg bg-sky-600 px-3 py-1 text-sm font-extrabold text-white">
                    Ch {num}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                )}
              </div>
              {(channel.languages?.length > 0) && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{channel.languages.join(", ")}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Numbers vary by region — confirm on your set-top box guide.
      </p>
    </div>
  );
}
