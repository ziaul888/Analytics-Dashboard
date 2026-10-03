/**
 * Server-side React Query helpers for Server Components.
 *
 * `getServerQueryClient` is wrapped in `React.cache` so every Server Component
 * rendered for the same request shares one client; `dehydrate()` then ships
 * everything that was prefetched to the browser in a single HydrationBoundary.
 */

import "server-only";

import { cache } from "react";

import { makeQueryClient } from "./query-client";

export const getServerQueryClient = cache(makeQueryClient);
