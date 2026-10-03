"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";

/** Hamburger + drawer navigation for screens below `lg`. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
      >
        <Menu aria-hidden="true" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="h-14 justify-center border-b">
          <SheetTitle className="sr-only">{APP_NAME} navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Switch between the dashboard and orders pages.
          </SheetDescription>
          <Brand />
        </SheetHeader>
        <div className="p-3">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
