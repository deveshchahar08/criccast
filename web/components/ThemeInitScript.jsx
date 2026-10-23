// ThemeInitScript — injects the dark-mode anti-flash script directly into the
// server-rendered <head> via useServerInsertedHTML.
//
// Why this way: in Next.js 16 + React 19, ANY <script> rendered as a React
// element (raw <script> tag OR next/script with beforeInteractive) triggers
// the dev console error "Encountered a script tag while rendering React
// component". useServerInsertedHTML inserts the HTML into the streamed
// response without ever entering the React tree, so React never warns —
// and the script still runs before first paint (it's in <head>).
"use client";

import { useServerInsertedHTML } from "next/navigation";

const THEME_JS = `(function(){try{var t=localStorage.getItem('criccast-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
  ));
  return null;
}
