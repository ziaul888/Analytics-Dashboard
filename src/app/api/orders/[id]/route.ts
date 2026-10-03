import type { NextRequest } from "next/server";

import { orderDetailQuerySchema } from "@/lib/api/contracts";
import { handle, malformed, ok, searchParamsToObject } from "@/lib/server/http";
import { getOrder } from "@/lib/server/queries";

/** GET /api/orders/:id */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  return handle(async () => {
    const { id } = await ctx.params;
    const query = orderDetailQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (query.simulate === "malformed") return malformed();
    return ok(await getOrder(id, query.simulate));
  });
}
