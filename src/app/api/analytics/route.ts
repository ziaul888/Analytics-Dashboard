import type { NextRequest } from "next/server";

import { analyticsQuerySchema } from "@/lib/api/contracts";
import { handle, malformed, ok, searchParamsToObject } from "@/lib/server/http";
import { getAnalytics } from "@/lib/server/queries";

/** GET /api/analytics?range=7d|30d|90d|all */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const query = analyticsQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (query.simulate === "malformed") return malformed();
    return ok(await getAnalytics(query.range, query.simulate));
  });
}
