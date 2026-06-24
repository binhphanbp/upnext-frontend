import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "upnext-focus flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
