"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";

export default function OrdersError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" />
      <ErrorState
        title="We couldn't load the orders page"
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
