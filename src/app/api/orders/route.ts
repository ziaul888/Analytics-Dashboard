import type { NextRequest } from "next/server";

import { ordersQuerySchema } from "@/lib/api/contracts";
import { handle, malformed, ok, searchParamsToObject } from "@/lib/server/http";
import { listOrders } from "@/lib/server/queries";

/** GET /api/orders?search=&status=&range=&page=&pageSize= */
export async function GET(request: NextRequest) {
  return handle(async () => {
    const query = ordersQuerySchema.parse(
      searchParamsToObject(request.nextUrl.searchParams),
    );
    if (query.simulate === "malformed") return malformed();
    return ok(await listOrders(query));
  });
}
