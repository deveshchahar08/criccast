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
//     then can the splash below become visible. It also records when
//     the splash became visible (window.__ccSplashAt) so PwaSetup can
//     time the dismissal by visible time, and arms a 6s failsafe that
//     force-hides the splash, so a broken page can never trap anyone
//     behind it.
//  2. The splash markup returned here is plain SSR HTML at the top of
//     <body>. Its <style> (same injection route) hides it by default;
//     `html.cc-app` turns it into a fixed navy overlay whose CSS
//     animations run on their own: badge settles in, wordmark rises,
//     tagline follows — and then the screen stays alive the whole
//     time it is up: a soft pulse ring around the badge, a subtle
//     breathing scale, and a sliding loading bar. (Static under
//     prefers-reduced-motion.) This matches the iOS launch image, so
//     the two read as one continuous screen.
//  3. PwaSetup dismisses the splash once the app has loaded AND the
//     splash has been visible for at least 1.8s (hard cap 5s), by
//     adding `cc-splash-hide` and removing the node.
// A normal browser visit never gets `cc-app`, so the splash is
// display:none and costs nothing. Fully defensive throughout.

import { useServerInsertedHTML } from "next/navigation";

const GATE_JS = `(function(){try{var standalone=false;try{standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}catch(e){}if(standalone){document.documentElement.classList.add('cc-app');try{window.__ccSplashAt=performance.now();}catch(e){}}setTimeout(function(){try{var s=document.getElementById('cc-splash');if(s){s.classList.add('cc-splash-hide');setTimeout(function(){try{s.style.display='none';}catch(e){}},350);}}catch(e){}},6000);}catch(e){}})()`;

const SPLASH_CSS = `
#cc-splash{display:none;}
html.cc-app #cc-splash{
  display:flex;position:fixed;inset:0;z-index:100;
  background:#0B2545;flex-direction:column;align-items:center;justify-content:center;
  transition:opacity .3s ease;
}
html.cc-app #cc-splash.cc-splash-hide{opacity:0;pointer-events:none;}
#cc-splash .cc-splash-badgewrap{
  position:relative;display:block;width:112px;height:112px;
  animation:ccSplashIn .5s ease-out both;
}
#cc-splash .cc-splash-badgewrap::after{
  content:"";position:absolute;inset:0;border-radius:50%;
  border:2px solid rgba(56,189,248,.55);opacity:0;pointer-events:none;
  animation:ccSplashRing 1.6s ease-out .5s infinite;
}
#cc-splash .cc-splash-badge{
  display:block;width:112px;height:112px;
  animation:ccSplashBreath 2.4s ease-in-out 1s infinite;
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
#cc-splash .cc-splash-bar{
  margin-top:26px;width:120px;height:3px;border-radius:9999px;
  background:rgba(255,255,255,.15);overflow:hidden;
  animation:ccSplashUp .5s ease-out .7s both;
}
#cc-splash .cc-splash-bar span{
  display:block;height:100%;width:40%;border-radius:9999px;
  background:#38bdf8;
  animation:ccSplashBar 1.2s ease-in-out infinite alternate;
}
@keyframes ccSplashIn{
  from{opacity:0;transform:scale(.85);}
  to{opacity:1;transform:scale(1);}
}
@keyframes ccSplashUp{
  from{opacity:0;transform:translateY(6px);}
  to{opacity:1;transform:translateY(0);}
}
@keyframes ccSplashRing{
  0%{transform:scale(1);opacity:0;}
  15%{opacity:.65;}
  100%{transform:scale(1.3);opacity:0;}
}
@keyframes ccSplashBreath{
  0%,100%{transform:scale(1);}
  50%{transform:scale(1.03);}
}
@keyframes ccSplashBar{
  from{transform:translateX(0);}
  to{transform:translateX(150%);}
}
@media (prefers-reduced-motion: reduce){
  #cc-splash .cc-splash-badgewrap,
  #cc-splash .cc-splash-badgewrap::after,
  #cc-splash .cc-splash-badge,
  #cc-splash .cc-splash-name,
  #cc-splash .cc-splash-tag,
  #cc-splash .cc-splash-bar,
  #cc-splash .cc-splash-bar span{animation:none;}
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
      <span className="cc-splash-badgewrap">
        <img className="cc-splash-badge" src="/icons/icon-512.png" alt="" />
      </span>
      <div className="cc-splash-name">CricCast</div>
      <div className="cc-splash-tag">Where to Watch Cricket in India</div>
      <div className="cc-splash-bar">
        <span />
      </div>
    </div>
  );
}
