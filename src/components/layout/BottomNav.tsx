"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/add", icon: Plus, label: "Add" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 py-6 max-w-md mx-auto pointer-events-none">
      <div className="flex justify-around items-center bg-card/90 backdrop-blur-xl border border-border/40 rounded-[2.5rem] native-shadow-lg px-4 py-3 pointer-events-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 px-6 py-2 rounded-3xl",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <span className="text-[9px] font-bold font-headline tracking-[0.15em] uppercase">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}