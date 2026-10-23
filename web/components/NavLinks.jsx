"use client";
// Desktop top-bar nav with active-page highlight (blue + underline).
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/dth-codes", label: "DTH Codes" },
  { href: "/series", label: "Series" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-6 md:flex">
      {NAV.map((n) => {
        const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`text-sm font-semibold transition-colors ${
              active
                ? "text-sky-600 underline decoration-2 underline-offset-8 dark:text-sky-400"
                : "text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
