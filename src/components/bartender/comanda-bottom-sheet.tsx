"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";


interface ComandaBottomSheetProps {
  itemCount: number;
  subtotal: number;
  children: React.ReactNode;
}

export function ComandaBottomSheet({ itemCount, subtotal, children }: ComandaBottomSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="animate-fade-in-up fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl border-t border-white/10 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
          open ? "translate-y-0" : "translate-y-[calc(100%-4.5rem)]"
        )}
        style={{ background: "var(--bg-elevated)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[4.5rem] shrink-0 items-center justify-between gap-3 px-4 transition duration-150 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 min-w-9 items-center justify-center rounded bg-accent px-2 font-mono text-body-sm font-bold text-accent-fg">
              {itemCount}
            </span>
            <span className="text-body-sm text-fg-subtle">{open ? "Comanda atual" : "Ver comanda"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-body font-mono font-bold text-fg">{currency.format(subtotal)}</span>
            <ChevronUp
              className={cn("h-5 w-5 text-fg-subtle transition-transform duration-200", open && "rotate-180")}
            />
          </div>
        </button>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
