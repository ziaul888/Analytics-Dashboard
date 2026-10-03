import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center px-5">
        <Brand />
      </div>
      <div className="flex-1 px-3 py-2">
        <NavLinks />
      </div>
      <div className="flex items-center gap-3 border-t p-4">
        <Avatar>
          <AvatarFallback>DA</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium">Demo Admin</p>
          <p className="truncate text-xs text-muted-foreground">admin@pulse.app</p>
        </div>
      </div>
    </aside>
  );
}
