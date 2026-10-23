"use client";
// WHY context (not prop drilling): the selected DTH operator is needed deep
// inside MatchCard / CompactMatchRow for channel numbers. Context + localStorage
// means: pick once, every card on every page shows YOUR operator's numbers.
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_DTH, DTH_STORAGE_KEY } from "@/lib/dth";

const DthContext = createContext({ dth: DEFAULT_DTH, setDth: () => {} });

export function DthProvider({ children }) {
  const [dth, setDthState] = useState(DEFAULT_DTH);

  // localStorage only exists in the browser — read it after mount so the
  // server render and the first client render match (no hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DTH_STORAGE_KEY);
      if (saved) setDthState(saved);
    } catch {}
  }, []);

  const setDth = (id) => {
    setDthState(id);
    try {
      localStorage.setItem(DTH_STORAGE_KEY, id);
    } catch {}
  };

  return <DthContext.Provider value={{ dth, setDth }}>{children}</DthContext.Provider>;
}

export const useDth = () => useContext(DthContext);
