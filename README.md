# Pulse — Production Analytics Dashboard

A SaaS analytics dashboard for an application that manages **customers, orders and
system activity**, built with the Next.js App Router, TypeScript, React 19 and
Tailwind CSS v4.

- **Dashboard**: total revenue, orders, active customers and conversion rate with
  period-over-period deltas, revenue + orders charts, recent orders and a system
  activity feed, all scoped by a date-range selector.
- **Orders**: search, status filter, date filter, pagination, page size and a
  deep-linkable order-details panel.
- **Every data state handled**: streaming skeletons, empty states, typed error
  states with retry, and schema validation that rejects unexpected data.
- **Responsive** from phone to desktop, with light and dark themes.

> **Live demo:** https://analytics-dashboard-psi-dun.vercel.app  
> Source: https://github.com/ziaul888/Analytics-Dashboard

---

## Contents

1. [Getting started](#getting-started)
2. [Project structure](#project-structure)
3. [Architecture](#architecture)
4. [API and data fetching](#api-and-data-fetching)
5. [Server vs Client Components](#server-vs-client-components)
6. [State management](#state-management)
7. [Loading, empty and error handling](#loading-empty-and-error-handling)
8. [Performance decisions](#performance-decisions)
9. [Responsive design and accessibility](#responsive-design-and-accessibility)
10. [Quality checks](#quality-checks)
11. [Deployment](#deployment)
12. [Trade-offs and next steps](#trade-offs-and-next-steps)
13. [AI-assisted development](#ai-assisted-development)

---

## Getting started

**Prerequisites:** Node.js 20+ and [pnpm](https://pnpm.io) (the repo pins
`pnpm@11` via `packageManager`; `corepack enable` will pick it up).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Other scripts:

| Script               | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `pnpm build`         | Production build (also type-checks)                                 |
| `pnpm start`         | Serve the production build                                          |
| `pnpm lint`          | ESLint (Next.js core-web-vitals + TypeScript + React Hooks rules)   |
| `pnpm typecheck`     | Generate route types and run `tsc --noEmit`                         |
| `pnpm generate:data` | Regenerate the seeded JSON dataset in `src/data/`                   |

**Environment variables** (all optional, see `.env.example`):

| Variable          | Default                        | Purpose                                                               |
| ----------------- | ------------------------------ | --------------------------------------------------------------------- |
| `MOCK_LATENCY_MS` | `400` in dev, `0` in prod      | Artificial delay on every data request so loading states are visible |

**Simulating states** — append `?simulate=<mode>` to any page or API URL:

| Mode        | Effect                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------- |
| `error`     | The data layer throws → route error boundary / API 503 → error state with retry             |
| `empty`     | Every list comes back empty → empty states everywhere                                       |
| `malformed` | API returns a wrong-shaped payload → client schema validation fails → "Unexpected response"  |

Examples: `/?simulate=error`, `/?simulate=empty`, `/orders?simulate=malformed`,
`/api/orders?page=abc` (400 with a descriptive message).

---

## Project structure

```
src/
├── app/                          # Routes (App Router)
│   ├── layout.tsx                #   Root layout: fonts, theme provider, AppShell
│   ├── page.tsx                  #   Dashboard — Server Component, streams 4 sections
│   ├── loading.tsx               #   Instant skeleton for the dashboard route
│   ├── error.tsx                 #   Route error boundary (client) with retry
│   ├── not-found.tsx
│   ├── orders/
│   │   ├── page.tsx              #   Prefetches page 1 on the server, hydrates <OrdersView /> (client)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── api/                      #   Mock REST API (route handlers)
│       ├── analytics/route.ts    #   GET /api/analytics?range=
│       ├── orders/route.ts       #   GET /api/orders?search=&status=&range=&page=&pageSize=
│       ├── orders/[id]/route.ts  #   GET /api/orders/:id
│       └── activities/route.ts   #   GET /api/activities?limit=
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (Base UI + Tailwind)
│   ├── providers/                # QueryProvider (TanStack Query client + devtools)
│   ├── layout/                   # AppShell, Sidebar, Header, MobileNav, NavLinks, ThemeToggle
│   ├── dashboard/                # StatsGrid, StatCard, RevenueChart, OrdersChart,
│   │                             # RecentOrders, ActivityFeed, RangeSelector, skeletons
│   ├── orders/                   # OrdersView, OrdersFilters, OrdersTable, OrdersPagination,
│   │                             # OrderDetailsSheet, OrderStatusBadge, skeletons
│   └── shared/                   # PageHeader, EmptyState, ErrorState, FilterSelect
│
├── hooks/
│   ├── use-orders-filters.ts     # URL-synced filter / selection state
│   └── use-debounced-callback.ts
│
├── lib/
│   ├── api/                      # BROWSER → API service layer
│   │   ├── contracts.ts          #   query schemas, endpoint builders, response envelopes
│   │   ├── client.ts             #   apiFetch(): timeout, abort, HTTP errors, zod validation
│   │   ├── errors.ts             #   ApiError with typed codes
│   │   ├── query-options.ts      #   React Query keys + queryOptions() per endpoint
│   │   └── orders.ts | analytics.ts | activities.ts   # typed service functions
│   ├── query/                    # TanStack Query plumbing
│   │   ├── query-client.ts       #   makeQueryClient()/getQueryClient() + defaults
│   │   └── server.ts             #   per-request client for Server Component prefetching
│   ├── server/                   # SERVER-ONLY data layer (import "server-only")
│   │   ├── store.ts              #   repository over the JSON dataset (validated on load)
│   │   ├── analytics.ts          #   KPI + time-series transforms
│   │   ├── queries.ts            #   service functions used by RSCs AND route handlers
│   │   ├── http.ts               #   JSON envelopes + error → status mapping
│   │   ├── simulation.ts         #   latency / error / empty simulation
│   │   └── errors.ts
│   ├── types.ts                  # zod schemas + inferred domain types (single source of truth)
│   ├── constants.ts              # statuses, ranges, pagination, status badge metadata
│   ├── format.ts                 # currency / number / date formatters (pure)
│   ├── pagination.ts             # page-button algorithm (pure)
│   └── utils.ts                  # cn()
│
└── data/                         # Generated JSON dataset (customers, orders, traffic, activities)
scripts/generate-data.mjs         # Seeded, deterministic dataset generator
```

**Conventions**

- `app/` contains only routing concerns and composition; no business logic.
- `components/<feature>/` groups components by feature; `components/shared/` holds
  feature-agnostic building blocks; `components/ui/` is vendor code from shadcn.
- `lib/` has no React except `React.cache`; everything there is plain TypeScript
  and unit-testable in isolation.
- Types are **inferred from zod schemas** (`lib/types.ts`), so there is exactly
  one definition of each payload and runtime validation can never drift from it.

---

## Architecture

```
                 ┌──────────────────────────────────────────────────────────────┐
                 │                          SERVER                              │
                 │                                                              │
   JSON dataset ─┼─► lib/server/store.ts ──► lib/server/analytics.ts            │
   (validated)   │        (repository)            (transforms)                  │
                 │                 │                   │                        │
                 │                 └──────┬────────────┘                        │
                 │                        ▼                                     │
                 │              lib/server/queries.ts   ◄── React.cache()       │
                 │               (server services)                              │
                 │                 │              │                              │
                 │     ┌───────────┘              └────────────┐                │
                 │     ▼                                       ▼                │
                 │  Server Components                  app/api/** route handlers│
                 │  (dashboard sections)               (lib/server/http.ts)     │
                 └─────┼──────────────────────────────────────┼─────────────────┘
                       │ RSC payload (streamed)               │ JSON over HTTP
                       ▼                                      ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │                          BROWSER                             │
                 │   dashboard UI                      lib/api/client.ts        │
                 │                                      (apiFetch + zod)        │
                 │                                             ▲                │
                 │               TanStack Query (lib/api/query-options.ts) ─────┘│
                 │                 ▲ hydrated from the server prefetch           │
                 │                 │                                             │
                 │       Orders feature (Client Components, useQuery)            │
                 └──────────────────────────────────────────────────────────────┘
```

Three layers, each with one job:

1. **Repository** (`lib/server/store.ts`) is the only code that knows the data is
   JSON. It validates the dataset with the shared schemas on first load, pre-sorts
   orders once, and exposes filtering/pagination primitives. Swapping it for a
   database would not touch anything above it.
2. **Services** (`lib/server/queries.ts`) are the single entry point for server
   code. Both the dashboard's Server Components and the API route handlers call
   them, so the two paths can never disagree. `lib/server/analytics.ts` holds the
   pure transforms (KPIs with period-over-period deltas, day/week bucketing).
3. **Delivery**: route handlers wrap services in HTTP (`lib/server/http.ts` adds the
   `{ data }` / `{ error: { code, message } }` envelopes and maps thrown errors to
   400/404/503/500). The browser service layer (`lib/api/*`) is the mirror image:
   typed functions that build URLs from the shared contract, fetch, and validate.
   TanStack Query (`lib/api/query-options.ts`) sits on top of it in the browser
   and owns caching, de-duplication, cancellation and retries.

---

## API and data fetching

### The mock API

| Endpoint                                                     | Returns                                          |
| ------------------------------------------------------------ | ------------------------------------------------ |
| `GET /api/analytics?range=7d\|30d\|90d\|all`                 | KPI summary + time series (day or week buckets)  |
| `GET /api/orders?search=&status=&range=&page=&pageSize=`     | Paginated order summaries (no line items)        |
| `GET /api/orders/:id`                                        | Full order with line items (404 if unknown)      |
| `GET /api/activities?limit=`                                 | Latest system/order/customer events              |

All responses are `{ data: … }` on success or `{ error: { code, message } }` on
failure, sent with `Cache-Control: no-store`. Query strings are validated with zod;
invalid input gets a `400` whose message names the offending field.

### Two consumers, one contract

The dashboard and the orders page fetch data differently **on purpose**:

| Page      | Who fetches                              | Why                                                                                                                                                       |
| --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard | Server Components → `lib/server/queries` | Read-mostly, one interaction (range). Rendering on the server ships zero data-fetching JS, streams each section as it resolves, and avoids a client→server→self round-trip. Next.js docs explicitly recommend calling the data function directly rather than fetching your own route handler from a Server Component. |
| Orders    | Server prefetch + Client Components via TanStack Query → `lib/api/*` → `/api` | Filter-heavy and interactive. The Server Component prefetches the first page straight from the data layer and hydrates the query cache, so the initial HTML already has rows. Every later filter/page change is a client request: instant feedback, stale requests cancelled as the user types, paging back served from cache, and the real HTTP contract exercised (timeouts, 4xx/5xx, malformed payloads). |

Both paths end in the same service functions, and both validate with the same
zod schemas (`lib/types.ts`): the server validates the dataset on load; the browser
validates every API response. A payload that fails validation becomes an
`ApiError("INVALID_RESPONSE")` and is **never** rendered, which is what
"handle unexpected data" means in practice (try `/orders?simulate=malformed`).

### Client data fetching with TanStack Query

Client-side calls go through [TanStack Query](https://tanstack.com/query) v5.
The integration is small and deliberate:

- **One `queryOptions()` per endpoint** (`lib/api/query-options.ts`) bundles the
  key, the service function and per-query settings, so call sites are a single
  line: `useQuery(ordersListOptions(filters))`. Keys are built from the
  *normalised* query (defaults stripped, same serialisation as the URL), which is
  what lets server and client agree on them.
- **Server prefetch + hydration** (`app/orders/page.tsx`): the Server Component
  creates a per-request `QueryClient` (`lib/query/server.ts`, wrapped in
  `React.cache`), calls `prefetchQuery` with the *server* data function (no HTTP
  round-trip to itself) and wraps the client tree in `<HydrationBoundary>`. The
  browser's `useQuery` finds the data already in cache, renders rows in the
  initial HTML, and only hits `/api/orders` when the user changes something.
  A deep link like `/orders?order=ORD-10042` prefetches the order detail too.
- **Sensible defaults** (`lib/query/query-client.ts`): `staleTime` 30s so hydrated
  data is not refetched on mount; `retry` only for transient errors (network,
  timeout, 5xx), never for 404s or schema failures; no refetch on window focus.
- **Cancellation**: every `queryFn` forwards React Query's `AbortSignal` into
  `apiFetch`, so a response for `search=ab` can never overwrite `search=abc`.
- **`placeholderData: keepPreviousData`** on the list query keeps the previous
  page visible (dimmed, `aria-busy`) while the next loads: no skeleton flash, no
  layout jump.
- **Typed errors**: `Register.defaultError` is set to `ApiError`, so `error.code`
  is available on every query result without casting.
- Devtools are mounted in `QueryProvider` and tree-shaken from production.

### Avoiding duplicate requests on the server

`getAnalytics` is wrapped in `React.cache`, so the KPI grid and the charts section
can each `await getAnalytics(range)` independently (and stream independently)
while the computation runs **once per request**. The orders list is pre-sorted
once at module load and every query filters/slices without re-sorting.

---

## Server vs Client Components

The rule used throughout: **a component is a Client Component only if it needs
browser APIs, event handlers, state or effects.** Everything else stays on the
server, so the client bundle only contains what is interactive.

| Component                                              | Type   | Why                                                                                                 |
| ------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------- |
| `app/page.tsx`, `StatsGrid`, `ChartsSection`, `RecentOrders`, `ActivityFeed` | Server | Async data access, no interactivity. Each streams inside its own `<Suspense>`. |
| `AppShell`, `Sidebar`, `Header`, `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `OrderStatusBadge`, skeletons | Server | Pure presentation. Rendered to HTML; zero JS shipped. |
| `RevenueChart`, `OrdersChart`                          | Client | Recharts needs the DOM. They receive already-computed series as props from the Server Component, so Recharts is the *only* reason they are on the client. |
| `RangeSelector`                                        | Client | `useRouter` + `useTransition` to navigate without dropping the current UI.                          |
| `NavLinks`, `MobileNav`, `ThemeToggle`                 | Client | `usePathname` for the active link; drawer open state; theme state.                                  |
| `OrdersView`, `OrdersFilters`, `OrdersTable`, `OrdersPagination`, `OrderDetailsSheet`, `FilterSelect` | Client | Filter state, debounced input, data fetching, selection, Base UI popups. |
| `app/error.tsx`, `app/orders/error.tsx`                | Client | Error boundaries must be Client Components.                                                         |

Notable boundaries:

- `app/orders/page.tsx` is a Server Component that reads the URL, prefetches the
  matching page of orders from the data layer and hands it to the client
  `OrdersView` through a React Query `HydrationBoundary`. The table is therefore
  server-rendered on first load and client-driven afterwards.
- `RecentOrders` (server) links into the orders page with `?order=ORD-10042`;
  `OrdersView` (client) reads that param and opens the detail panel. Server and
  client coordinate through the URL, not shared state.
- `lib/server/*` imports `server-only`, so importing it from a Client Component
  is a **build error**, not a silent bundle leak.

---

## State management

There is no global store because there is no global state. Each piece of state
lives in the narrowest place that works:

| State                                        | Where                                | Why                                                                                              |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Dashboard date range                         | URL (`?range=`)                      | Read by Server Components; shareable; a change is a navigation (`router.replace` in a transition). |
| Orders filters, page, page size, selected order | URL (`useOrdersFilters`)          | Shareable/bookmarkable, survives refresh, back/forward works. Written with `history.replaceState`, which Next.js syncs with `useSearchParams` **without a server round-trip**. |
| Search input text                            | Local `useState` in `OrdersFilters`  | Typing must be instant; only the 300ms-debounced value is committed to the URL (and thus the API). |
| Fetched data                                 | TanStack Query cache                 | Shared across components by key; hydrated from the server; survives remounts.                    |
| Mobile drawer open, theme                    | Local state / `next-themes`          | Purely UI.                                                                                       |

The same `ordersQuerySchema` that validates API requests parses the URL (leniently,
falling back to defaults for a hand-edited `?page=abc`), so the UI's idea of
"current filters" and the API's can never diverge.

---

## Loading, empty and error handling

| Situation                               | Dashboard                                                           | Orders                                                                 |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| First load / navigation                 | `app/loading.tsx` full skeleton, then per-section `<Suspense>` skeletons stream in | `app/orders/loading.tsx`, then table skeleton until the first response |
| Changing a filter / range               | Previous UI stays visible; spinner next to the range control (`useTransition`) | Previous rows stay, dimmed, until new rows arrive (`keepPreviousData`) |
| Empty data                              | Per-widget empty states (charts, recent orders, activity)          | "No orders match these filters" with a *Clear filters* action          |
| Server error (`?simulate=error`)        | `app/error.tsx` boundary with *Try again* (`retry()` re-fetches)   | 503 → `ErrorState` with *Try again* (re-runs the query)                |
| Network / timeout                       | n/a (server render)                                                 | Typed `ApiError` → offline / timeout copy, retryable                   |
| Not found (`/api/orders/XYZ`)           | n/a                                                                 | 404 → non-retryable "Not found" in the details panel                   |
| Malformed response (`?simulate=malformed`) | n/a                                                              | zod rejects it → "Unexpected response", data is never rendered         |
| Corrupt dataset file                    | Server fails fast on first load with the exact path of the bad field | same                                                                   |

`ErrorState` maps `ApiError.code` to copy, icon and whether a retry button makes
sense, so individual components never string-match error messages.

---

## Performance decisions

The guiding principle: **optimise structure first, memoise second.** Most
re-render problems are avoided by where state lives, not by `useMemo`.

### Rendering architecture

- **Server Components by default** keep Recharts, Base UI popups and the data
  layer out of the dashboard's client bundle except for the two chart components.
- **Streaming with Suspense**: four dashboard sections render independently, so
  the slowest query never blocks the fastest. `loading.tsx` gives an instant
  shell on navigation.
- **Transitions for range changes**: `startTransition(() => router.replace(…))`
  keeps the current dashboard on screen while the new one renders, instead of
  unmounting to skeletons.
- **Server-prefetched orders**: the first page of `/orders` is rendered with data
  on the server and hydrated into the React Query cache; no client request on load.

### Avoiding re-renders by design

- The search draft lives inside `OrdersFilters`, so keystrokes re-render one input,
  not the table.
- Filter state is derived from the URL with `useMemo`, so `OrdersView` recomputes
  the query key only when the URL changes.
- `React.cache` dedupes the analytics computation across server sections;
  TanStack Query dedupes and caches on the client, and the first page of orders
  is prefetched on the server so the client never fetches it at all.

### Where `useMemo`, `useCallback` and `memo` are used, and why

| Where                                     | What                                                     | Why it earns its keep                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `useChartPoints` (both charts)            | `useMemo` over the series: formats date labels           | Recharts re-renders the chart on **every pointer move** for the hover layer; formatting 180 dates per mouse-move is waste.    |
| `OrdersPagination`                        | `useMemo` for the page-button list                       | Derived data (with ellipsis logic) recomputed only when `page`/`totalPages` change; also keeps the render body declarative.   |
| `useOrdersFilters`                        | `useMemo` for parsed filters + canonical query key       | zod parsing per render would also make `filters` a new object each time, breaking every downstream dependency array.         |
| `useOrdersFilters`, `OrdersView`          | `useCallback` for `setFilters`, `onSelect`, page handlers | They are passed to **memoised** children (`OrderRow`) and used as effect/`useCallback` dependencies; unstable refs would defeat both. |
| `useDebouncedCallback`                    | `useCallback` returning stable functions                 | Hook return values are contractually stable so callers can depend on them.                                                   |
| `OrderRow`                                | `React.memo`                                             | Opening/closing the details panel changes `selectedId` on the parent; with `memo` only the two affected rows re-render, not 10–50. |

**Deliberately *not* memoised:** `RangeSelector`'s handler, the `FilterSelect`
`onChange` closures, `StatCard`, `EmptyState`, etc. They are cheap, their children
are not memoised, or they live in Server Components where hooks don't apply.
Memoising them would add indirection without a measurable win.

### `useEffect` usage

`useEffect` appears in exactly two places, both genuine side effects:

1. `useDebouncedCallback` — keep the "latest callback" ref in sync and clear the
   pending timer on unmount.
2. `error.tsx` — log the error once.

There is no data-fetching `useEffect` anywhere: Server Components fetch during
render, and client fetching is delegated to TanStack Query. Everything else that
looked like it wanted an effect was solved differently: syncing the search input
with the URL uses React's "adjust state during render" pattern, and URL updates
happen in event handlers.

---

## Responsive design and accessibility

- **Layout**: fixed sidebar from `lg` (1024px) up; sticky top bar with a drawer
  below. Content is capped at `max-w-7xl` and uses a `grid` that collapses from
  4 → 2 → 1 KPI columns and 2 → 1 chart columns.
- **Tables**: secondary columns hide progressively (`sm`/`md`/`lg`) and the
  customer/date move under the order ID on phones, so there is no horizontal
  scroll. Pagination collapses page numbers into "2 / 12" on small screens.
- **Details panel**: full-width sheet on phones, 32rem side panel otherwise.
- **Charts** follow a validated colour palette (CVD-safe, ≥3:1 contrast in both
  themes), use solid hairline grids, 2px lines, ≤24px bars with rounded tops,
  single-series (so no legend), and a crosshair/hover tooltip with formatted
  values. Recharts' `accessibilityLayer` enables keyboard navigation of data points.
- **A11y**: semantic landmarks, `aria-current` on nav and pagination, labelled
  controls, `role="status"`/`role="alert"` on empty/error states, `aria-busy`
  while refetching, visible focus rings, and a fully keyboard-operable table (each
  order ID is a button).
- **Theming**: light/dark via `next-themes` (`class` strategy, system default);
  all colours are tokens, including chart series.

---

## Quality checks

```bash
pnpm typecheck   # ✓ tsc --noEmit, strict mode
pnpm lint        # ✓ 0 errors, 0 warnings (incl. react-hooks rules)
pnpm build       # ✓ all routes build; / and /orders are dynamic (read the URL)


## Deployment

Any Node host works; Vercel needs zero config:

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Optionally set `MOCK_LATENCY_MS=300` in the project's environment variables so
reviewers can see the loading states in production too.

---


