import { RotateCw, SearchX, TriangleAlert, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** Any thrown value; ApiErrors get code-specific copy. */
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  /** Tighter layout for use inside cards/panels. */
  compact?: boolean;
}

/** Map an error to user-facing copy and an icon. */
export function describeError(error: unknown): {
  title: string;
  message: string;
  icon: typeof TriangleAlert;
  retryable: boolean;
} {
  if (isApiError(error)) {
    switch (error.code) {
      case "NETWORK":
        return {
          title: "You appear to be offline",
          message: error.message,
          icon: WifiOff,
          retryable: true,
        };
      case "TIMEOUT":
        return {
          title: "This is taking longer than expected",
          message: error.message,
          icon: TriangleAlert,
          retryable: true,
        };
      case "NOT_FOUND":
        return {
          title: "Not found",
          message: error.message,
          icon: SearchX,
          retryable: false,
        };
      case "INVALID_RESPONSE":
        return {
          title: "Unexpected response",
          message:
            "The data returned by the server did not match what the app expected, so it was not displayed.",
          icon: TriangleAlert,
          retryable: true,
        };
      default:
        return {
          title: "Request failed",
          message: error.message,
          icon: TriangleAlert,
          retryable: error.isRetryable,
        };
    }
  }
  return {
    title: "Something went wrong",
    message:
      error instanceof Error && error.message
        ? error.message
        : "An unexpected error occurred.",
    icon: TriangleAlert,
    retryable: true,
  };
}

export function ErrorState({
  error,
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  compact = false,
}: ErrorStateProps) {
  const described = describeError(error);
  const Icon = described.icon;
  const showRetry = onRetry && (described.retryable || !error);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 text-center",
        compact ? "py-8" : "py-12",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title ?? described.title}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {message ?? described.message}
        </p>
      </div>
      {showRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw data-icon="inline-start" aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
