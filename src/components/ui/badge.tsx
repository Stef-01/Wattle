import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — for status, not for decoration.
 *
 * AFFORDANCE: a badge must not look pressable. It carries no border radius pill on a coloured
 * fill, no hover state and no cursor change, because every one of those signals "click me" and
 * this never does anything. Mistaking a label for a control is a false affordance, and the cost
 * is a visitor clicking a status and learning the interface lies to them.
 */
const badgeVariants = cva("inline-flex items-center text-[0.8125rem] font-medium", {
  variants: {
    tone: {
      building: "text-gold",
      live: "text-leaf",
      muted: "text-muted",
    },
  },
  defaultVariants: { tone: "muted" },
});

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
