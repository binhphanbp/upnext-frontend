import type { InputHTMLAttributes } from "react";
import { useId } from "react";

import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";

import { Input } from "./input";

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  action?: React.ReactNode;
  required?: boolean;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  suffix?: React.ReactNode;
}

export function FormInput({
  label,
  action,
  required,
  error,
  containerClassName,
  labelClassName,
  id,
  className,
  type = "text",
  suffix,
  ...props
}: FormInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-3">
          {label && (
            <Label
              htmlFor={inputId}
              className={cn("text-sm font-bold text-slate-700", labelClassName)}
            >
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </Label>
          )}
          {action}
        </div>
      )}
      <div className="relative flex w-full items-center">
        <Input id={inputId} type={type} className={cn(className, suffix && "pr-10")} {...props} />
        {suffix && (
          <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
