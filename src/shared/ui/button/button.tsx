import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-foreground shadow-[0_18px_34px_rgba(16,167,120,0.24)] hover:bg-emerald-700",
  secondary:
    "bg-premium text-premium-foreground shadow-[0_18px_34px_rgba(87,75,245,0.18)] hover:bg-indigo-700",
  outline: "border border-border bg-white text-slate-800 hover:border-brand hover:text-brand",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 gap-2 rounded-full px-4 text-sm",
  md: "h-11 gap-2 rounded-full px-5 text-sm",
  lg: "h-12 gap-2 rounded-2xl px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "upnext-focus inline-flex items-center justify-center font-bold transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
