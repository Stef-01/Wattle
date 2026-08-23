"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Sheet — a slide-in panel on Radix Dialog.
 *
 * WHY A PANEL AND NOT A STACKED ROW, on mobile. The header used to stack the wordmark over a row
 * of four inline links so nothing clipped. It never clipped, and the targets were about 34px tall
 * — under the threshold where pointing error climbs — sitting in the top corner of the screen,
 * the furthest reach from a thumb. That is two Fitts's law penalties at once: small, and far.
 *
 * A panel trades one tap for targets that are 48px tall, full-width, and land in the lower half
 * of the screen where a thumb already is. HICK-HYMAN is the second half of the argument: choice
 * time rises with the number of simultaneous options, so collapsing four doors behind one control
 * makes the header a single decision, and the four are presented only once the visitor has said
 * they are choosing.
 *
 * Radix is doing the part that is genuinely hard and easy to get wrong: focus trapping, restoring
 * focus to the trigger on close, `aria-modal`, escape-to-dismiss, and inert-ing the page behind.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[rgb(23_31_18/0.55)] backdrop-blur-[2px]",
      "data-[state=open]:animate-[sheet-fade-in_200ms_cubic-bezier(0.2,0,0,1)_both]",
      "data-[state=closed]:animate-[sheet-fade-out_150ms_ease-in_both]",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[rgb(252_250_244/0.16)]",
        "bg-leaf-deep text-on-leaf p-6 pb-8 shadow-[0_-8px_40px_-12px_rgb(23_31_18/0.6)]",
        // Enters from the bottom: the panel arrives from where the thumb is.
        "data-[state=open]:animate-[sheet-in_260ms_cubic-bezier(0.2,0,0,1)_both]",
        "data-[state=closed]:animate-[sheet-out_180ms_ease-in_both]",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
