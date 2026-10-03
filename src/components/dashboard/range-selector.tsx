"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DATE_RANGES, DEFAULT_RANGE, type DateRangeKey } from "@/lib/constants";

/**
 * Dashboard date-range control. The range lives in the URL (`?range=`) and the
 * dashboard's Server Components read it, so changing it is a navigation:
 * `router.replace` inside a transition re-renders the server tree while the
 * current content stays on screen (no skeleton flash) and we show a spinner.
 */
export function RangeSelector({ value }: { value: DateRangeKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: unknown) => {
    if (typeof next !== "string" || next === value) return;
    const params = new URLSearchParams(searchParams);
    if (next === DEFAULT_RANGE) params.delete("range");
    else params.set("range", next);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <LoaderCircle
          className="size-4 animate-spin text-muted-foreground"
          role="status"
          aria-label="Updating dashboard"
        />
      ) : null}
      <Tabs value={value} onValueChange={handleChange}>
        <TabsList aria-label="Date range">
          {DATE_RANGES.map((range) => (
            <TabsTrigger key={range.key} value={range.key} className="px-2.5">
              {range.short}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
