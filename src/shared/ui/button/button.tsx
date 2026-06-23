import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "upnext-focus inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground shadow-[0_18px_34px_rgba(16,167,120,0.24)] hover:bg-emerald-700",
        secondary:
          "bg-premium text-premium-foreground shadow-[0_18px_34px_rgba(87,75,245,0.18)] hover:bg-indigo-700",
        outline: "border border-border bg-white text-slate-800 hover:border-brand hover:text-brand",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        destructive: "bg-destructive text-white shadow-sm hover:bg-red-600",
        link: "h-auto rounded-none p-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-sm [&_svg]:size-4",
        md: "h-11 rounded-full px-5 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-2xl px-6 text-base [&_svg]:size-5",
        icon: "size-10 rounded-full [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  asChild = false,
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const buttonProps = asChild ? props : { ...props, type };

  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...buttonProps} />;
}

export { buttonVariants };
