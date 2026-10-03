"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<FilterOption<T>>;
  /** Accessible name; the trigger shows the selected option's label. */
  label: string;
  className?: string;
  size?: "sm" | "default";
}

/** Thin, typed wrapper around the shadcn Select for single-value filters. */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "default",
}: FilterSelectProps<T>) {
  return (
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (typeof next === "string" && next !== value) onChange(next as T);
      }}
    >
      <SelectTrigger aria-label={label} size={size} className={cn("w-full", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
