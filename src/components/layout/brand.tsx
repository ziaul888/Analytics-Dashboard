import { Activity } from "lucide-react";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-heading font-semibold", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Activity className="size-4" aria-hidden="true" />
      </span>
      <span>{APP_NAME}</span>
    </Link>
  );
}
