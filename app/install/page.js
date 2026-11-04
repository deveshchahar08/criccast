// Download the CricCast App — the install instruction screen.
// The server page only carries metadata; all of the interactive guide
// (device detection, the real one-tap installer, the visual iPhone
// steps) lives in the InstallGuide client component.
import InstallGuide from "@/components/pwa/InstallGuide";

export const metadata = {
  title: "Download the CricCast App — CricCast",
  description:
    "Install CricCast on your phone or computer — no Play Store or App Store needed. Step-by-step guide for Android, iPhone and desktop.",
};

export default function InstallPage() {
  return <InstallGuide />;
}
