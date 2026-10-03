import type { NextRequest } from "next/server";

import { activitiesQuerySchema } from "@/lib/api/contracts";
import { handle, malformed, ok, searchParamsToObject } from "@/lib/server/http";
import { getActivities } from "@/lib/server/queries";

/** GET /api/activities?limit=8 */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const query = activitiesQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (query.simulate === "malformed") return malformed();
    return ok(await getActivities(query.limit, query.simulate));
  });
}
