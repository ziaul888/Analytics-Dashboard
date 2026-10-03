"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";

/**
 * Route-level error boundary for the dashboard. Catches anything thrown while
 * rendering the Server Components below it (e.g. `?simulate=error`).
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Hook up an error-reporting service here.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />
      <ErrorState
        title="We couldn't load the dashboard"
        message={
          error.digest
            ? `The server reported an error (reference ${error.digest}). Please try again.`
            : error.message || "Please try again."
        }
        onRetry={retry}
      />
    </div>
  );
}
