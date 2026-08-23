import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — shadcn's pattern (cva + Slot + cn), written against this site's own tokens.
 *
 * FITTS'S LAW SETS THE SIZES, NOT TASTE. Time to acquire a target falls with its size and rises
 * with its distance, so every variant clears a 44px minimum on its short axis — the size below
 * which pointing error climbs sharply on touch. `sm` is 40px and exists only for controls that
 * sit inside another target's reach, never for a primary action.
 *
 * `asChild` is what lets a Next.js <Link> carry button styling without nesting an <a> in a
 * <button> — which would be invalid HTML and would give a screen reader two controls where the
 * page has one.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap",
    "text-[0.9375rem] font-medium no-underline cursor-pointer select-none",
    "border border-transparent transition-[background-color,border-color,color,box-shadow] duration-[120ms]",
    // One focus ring for the whole site: a control that invents its own is one a keyboard user
    // has to learn twice.
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gold",
    "disabled:pointer-events-none disabled:opacity-50",
  ),
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-leaf hover:shadow-[var(--lift)]",
        quiet: "border-line text-ink hover:border-ink",
        onLeaf: "bg-paper text-leaf-deep hover:bg-blossom",
        ghostOnLeaf: "border-sage text-on-leaf hover:bg-[rgb(252_250_244/0.1)]",
      },
      size: {
        // 44px and 48px. Nothing primary is smaller.
        default: "min-h-11 px-[1.4rem] py-3",
        lg: "min-h-12 px-7 py-3.5",
        sm: "min-h-10 px-4 py-2 text-[0.8125rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
