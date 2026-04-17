"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenLine,
  CheckCircle,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Compose",
    href: "/compose",
    icon: PenLine,
  },
  {
    label: "Queue",
    href: "/queue",
    icon: CheckCircle,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg pl-[10px] pr-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "border-l-2 border-blue-500 bg-blue-600/10 text-white"
                : "border-l-2 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                isActive ? "text-white" : "text-slate-500"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-900/95">
            <Logo size={32} />
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <NavLinks pathname={pathname} onClose={() => setMobileOpen(false)} />
          </div>
          <div className="border-t border-slate-800 px-4 py-4">
            <p className="text-xs text-slate-500">InPoster v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800">
        <div className="flex h-full flex-col">
          <div className="px-4 py-5 border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-900/95">
            <Logo size={32} />
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <NavLinks pathname={pathname} />
          </div>
          <div className="border-t border-slate-800 px-4 py-4">
            <p className="text-xs text-slate-500">InPoster v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
