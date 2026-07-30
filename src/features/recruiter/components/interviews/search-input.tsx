import { MagnifyingGlass } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/input";

type SearchInputProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}>;

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 text-slate-400" />
      <Input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border-slate-200 bg-white pl-9 font-normal text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500",
          inputClassName,
        )}
      />
    </div>
  );
}
