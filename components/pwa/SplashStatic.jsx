"use client";

// SplashStatic — the installed app's launch screen, present in the
// server-rendered HTML from the very first byte, so the user's first
// window IS the branded splash (no waiting for React to mount an
// overlay, which is what made the old SplashScreen flash late).
//
// How it works:
//  1. A tiny gate script is injected into <head> via
//     useServerInsertedHTML — the same mechanism ThemeInitScript uses,
//     because in Next 16 + React 19 any <script> rendered as a React
//     element triggers the "Encountered a script tag while rendering"
//     error. The script runs before the body is parsed: if this page
//     is running as an installed app (standalone display mode, or
//     iOS's navigator.standalone) it adds `cc-app` to <html>, and only
//     then can the splash below become visible. It also arms a 4s
//     failsafe that force-hides the splash, so a broken page can never
//     trap anyone behind it.
//  2. The splash markup returned here is plain SSR HTML at the top of
//     <body>. Its <style> (same injection route) hides it by default;
//     `html.cc-app` turns it into a fixed navy overlay whose CSS
//     animations run on their own: badge settles in, wordmark rises,
//     tagline follows — matching the iOS launch image, so the two read
//     as one continuous screen.
//  3. PwaSetup dismisses the splash once the app has loaded (bounded
//     1s–2.6s) by adding `cc-splash-hide` and removing the node.
// A normal browser visit never gets `cc-app`, so the splash is
// display:none and costs nothing. Fully defensive throughout.

import { useServerInsertedHTML } from "next/navigation";

const GATE_JS = `(function(){try{var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}catch(e){}if(standalone){document.documentElement.classList.add('cc-app');}setTimeout(function(){try{var s=document.getElementById('cc-splash');if(s){s.classList.add('cc-splash-hide');setTimeout(function(){try{s.style.display='none';}catch(e){}},350);}}catch(e){}},4000);}catch(e){}})()`;

const SPLASH_CSS = `
#cc-splash{display:none;}
html.cc-app #cc-splash{
  display:flex;position:fixed;inset:0;z-index:100;
  background:#0B2545;flex-direction:column;align-items:center;justify-content:center;
  transition:opacity .3s ease;
}
html.cc-app #cc-splash.cc-splash-hide{opacity:0;pointer-events:none;}
#cc-splash .cc-splash-badge{
  display:block;width:112px;height:112px;
  animation:ccSplashIn .5s ease-out both;
}
#cc-splash .cc-splash-name{
  margin-top:20px;color:#ffffff;font-size:30px;font-weight:800;
  letter-spacing:-0.02em;line-height:1.1;
  animation:ccSplashUp .5s ease-out .25s both;
}
#cc-splash .cc-splash-tag{
  margin-top:4px;color:#bae6fd;font-size:14px;line-height:1.3;
  animation:ccSplashUp .5s ease-out .5s both;
}
@keyframes ccSplashIn{
  from{opacity:0;transform:scale(.85);}
  to{opacity:1;transform:scale(1);}
}
@keyframes ccSplashUp{
  from{opacity:0;transform:translateY(6px);}
  to{opacity:1;transform:translateY(0);}
}
@media (prefers-reduced-motion: reduce){
  #cc-splash .cc-splash-badge,
  #cc-splash .cc-splash-name,
  #cc-splash .cc-splash-tag{animation:none;}
}
`;

export default function SplashStatic() {
  useServerInsertedHTML(() => (
    <>
      <script dangerouslySetInnerHTML={{ __html: GATE_JS }} />
      <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
    </>
  ));

  return (
    <div id="cc-splash" aria-hidden="true">
      <img className="cc-splash-badge" src="/icons/icon-512.png" alt="" />
      <div className="cc-splash-name">CricCast</div>
      <div className="cc-splash-tag">Where to Watch Cricket in India</div>
    </div>
  );
}
