"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isNavItemActive, NAV_ITEMS } from "./nav";

interface NavLinksProps {
  /** Called after a link is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

/** The only client piece of the navigation: it needs the current pathname. */
export function NavLinks({ onNavigate, className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
