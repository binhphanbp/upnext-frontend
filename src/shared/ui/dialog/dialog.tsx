"use client";

import { X } from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Stacking order this file has to live in, lowest first:
 *
 *   marketing page content   ..120   (features/public/**.css)
 *   public site header       1000    (.marketing-home-header, sticky)
 *   follow tooltip           1010
 *   dialog overlay           1020    <- here
 *   dialog content           1030    <- here
 *   select / popover content 1040    (must open above an open dialog)
 *   SweetAlert2              1060    (library default; confirms fired from a dialog)
 *
 * The public header sits at 1000, so anything below that is painted over by it —
 * a modal on a public page would render behind the header and outside the scrim.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-[1020] bg-slate-950/55 animate-dialog-overlay", className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { closeLabel?: string }
>(
  (
    { className, children, closeLabel = "Đóng", onPointerDownOutside, onInteractOutside, ...props },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <div className="pointer-events-none fixed inset-0 z-[1030] flex items-center justify-center p-4">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "pointer-events-auto relative z-50 grid w-full max-w-lg gap-4 rounded-2xl border border-border bg-background p-6 shadow-2xl animate-dialog-unfold",
            className,
          )}
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement;
            if (
              target?.closest(".swal2-container") ||
              target?.closest("[data-radix-popper-content-wrapper]") ||
              target?.closest("[data-radix-popover-content]")
            ) {
              return;
            }
            onPointerDownOutside?.(event);
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement;
            if (
              target?.closest(".swal2-container") ||
              target?.closest("[data-radix-popper-content-wrapper]") ||
              target?.closest("[data-radix-popover-content]")
            ) {
              return;
            }
            onInteractOutside?.(event);
          }}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="upnext-focus text-muted-foreground absolute top-4 right-4 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100">
            <X size={18} />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 sm:text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg leading-none font-semibold tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
