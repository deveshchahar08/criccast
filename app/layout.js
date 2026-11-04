import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DthProvider } from "@/components/DthProvider";
import ThemeInitScript from "@/components/ThemeInitScript";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import VercelAnalytics from "@/components/VercelAnalytics";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import PwaSetup from "@/components/pwa/PwaSetup";
import InstallPill from "@/components/pwa/InstallPill";
import SplashStatic from "@/components/pwa/SplashStatic";

// Stitch theme font (from Hy's DESIGN.md screenshot)
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  title: "CricCast — Which Channel is the Cricket Match On?",
  description:
    "Find which TV channel and OTT app is showing today's cricket match in India. Verified broadcast guide with DTH channel numbers for Tata Play, Airtel, Dish TV & DD FreeDish.",
  // PWA: lets iOS treat the installed site as a standalone web app.
  appleWebApp: {
    capable: true,
    title: "CricCast",
    statusBarStyle: "default",
    // iOS launch images (navy splash: badge + wordmark + tagline,
    // mirroring the in-page splash) — without these, an installed app
    // opens on a plain white screen. One entry per iPhone size; media
    // uses CSS pixels + pixel ratio.
    startupImage: [
      { url: "/splash/apple-splash-750-1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-828-1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-1080-2340.png", media: "(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1125-2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1170-2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1179-2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1206-2622.png", media: "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1242-2688.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1260-2736.png", media: "(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1284-2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1290-2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1320-2868.png", media: "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" },
    ],
  },
};

// PWA: browser chrome colour for the installed app / mobile tab.
export const viewport = {
  themeColor: "#0B2545",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans text-navy dark:bg-slate-950 dark:text-slate-100">
        {/* Sets the theme class before first paint (no light/dark flash).
            Injected via useServerInsertedHTML so the script never enters
            the React tree — React 19 would otherwise throw the
            "Encountered a script tag while rendering" console error. */}
        <ThemeInitScript />
        {/* Installed-app launch splash (PWA): static SSR markup at the
            top of <body>; its own gate script (in <head>) shows it only
            for standalone launches, before first paint. PwaSetup
            dismisses it once the app has loaded. */}
        <SplashStatic />
        <GoogleAnalytics />
        <VercelAnalytics />
        <MicrosoftClarity />
        <DthProvider>
          <TopBar />
          {/* pb leaves room for the fixed mobile bottom nav — the
              safe-area term grows it in step with the nav's own
              home-indicator padding (iPhone) */}
          <main className="pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-10">{children}</main>
          <Footer />
          <BottomNav />
        </DthProvider>
        {/* PWA plumbing + install pill (self-contained, see components/pwa) */}
        <PwaSetup />
        <InstallPill />
      </body>
    </html>
  );
}
