import type { ReactNode } from "react";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

/**
 * Responsive application frame: a fixed sidebar from `lg` up, a top bar with a
 * drawer below that. Server Component; only the nav links and the drawer are
 * client components because they need pathname / open state.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar className="sticky top-0 hidden h-dvh lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
