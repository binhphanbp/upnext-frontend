"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";

import { cn } from "@/shared/lib/cn";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "upnext-focus flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
      // A label longer than the trigger used to wrap onto a second line and get
      // clipped by the fixed height; it now stays on one line and ellipsises.
      "whitespace-nowrap [&>span]:min-w-0 [&>span]:truncate",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <CaretDown size={16} className="shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & { header?: React.ReactNode }
>(({ className, children, position = "popper", header, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // Must stay above an open dialog — see the stacking-order note in dialog.tsx.
        "z-[1040] max-h-96 min-w-32 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl flex flex-col",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      {header}
      <SelectPrimitive.Viewport
        className={cn(
          "p-1 flex-1 scroll-my-1",
          // min-h, not h: a fixed trigger-height would squash the list into a
          // one-row scroll box. The trigger height is only a floor so a
          // single-option menu still looks deliberate; max-h on Content caps it.
          position === "popper" &&
            "min-h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer items-center rounded-md py-2 pr-2 pl-8 text-sm font-medium outline-none transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[state=checked]:bg-accent/50 data-[state=checked]:font-semibold",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={14} weight="bold" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue };
