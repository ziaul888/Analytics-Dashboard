import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The page you are looking for doesn't exist or has moved."
      action={
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      }
      className="min-h-[50vh]"
    />
  );
}
