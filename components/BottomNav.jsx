"use client";
// Mobile bottom nav (Pic 2 design). Desktop uses the top bar links instead.
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (
      <path d="M3 10.5L12 3l9 7.5V21H3z M9 21v-6h6v6" strokeLinejoin="round" />
    ),
  },
  {
    href: "/fixtures",
    label: "Fixtures",
    icon: (
      <path d="M8 3v4M16 3v4M4 8h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" strokeLinejoin="round" />
    ),
  },
  {
    href: "/dth-codes",
    label: "DTH Codes",
    icon: (
      <path d="M4 4h4v4H4zM12 4h4v4h-4zM20 4h0M4 12h4v4H4zM12 12h4v4h-4zM20 12h0M4 20h4v0M12 20h4v0M20 20h0" strokeLinecap="round" />
    ),
  },
  {
    href: "/series",
    label: "Series",
    icon: (
      <path d="M8 21h8M12 17v4M17 4H7v5a5 5 0 0010 0V4z M17 6h3a1 1 0 011 1c0 2.5-2 4-4 4M7 6H4a1 1 0 00-1 1c0 2.5 2 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ${
                active ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.8}
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
