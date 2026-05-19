
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/add", icon: Plus, label: "Add" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center bg-card/80 backdrop-blur-xl border-t border-border px-6 py-4 max-w-md mx-auto">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-full transition-all duration-300",
              isActive && "bg-primary/10"
            )}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className={cn(
                isActive && "indigo-glow"
              )} />
            </div>
            {isActive && (
              <span className="text-[10px] font-medium font-headline tracking-wider uppercase">
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
