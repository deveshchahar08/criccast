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
        <GoogleAnalytics />
        <VercelAnalytics />
        <MicrosoftClarity />
        <DthProvider>
          <TopBar />
          {/* pb leaves room for the fixed mobile bottom nav */}
          <main className="pb-28 md:pb-10">{children}</main>
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
