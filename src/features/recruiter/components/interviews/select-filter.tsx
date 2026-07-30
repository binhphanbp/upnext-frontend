import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export type SelectFilterOption = {
  label: string;
  value: string;
};

type SelectFilterProps = Readonly<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: SelectFilterOption[];
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
  showSearch?: boolean;
}>;

export function SelectFilter({
  label,
  value,
  onChange,
  placeholder = "Select option",
  options,
  className,
  triggerClassName,
  ariaLabel,
  showSearch = false,
}: SelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = searchQuery
    ? options.filter(
        (opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || opt.value === "ALL",
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = value === "ALL" || !selectedOption ? placeholder : selectedOption.label;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
      ) : null}
      <Select
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSearchQuery("");
          }
        }}
      >
        <SelectTrigger
          aria-label={ariaLabel ?? label ?? placeholder}
          className={cn(
            "h-10 w-full min-w-[160px] cursor-pointer rounded-lg border-slate-200 bg-white font-normal text-slate-700 shadow-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500",
            triggerClassName,
          )}
        >
          <span className="flex-1 truncate pr-2 text-left">
            <SelectValue placeholder={placeholder}>{displayLabel}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent
          className="max-h-[300px]"
          header={
            showSearch ? (
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
                <MagnifyingGlass size={16} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  aria-label="Tìm kiếm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full border-none bg-transparent p-0 text-sm font-normal text-slate-700 placeholder-slate-400 outline-hidden focus:ring-0 focus:outline-hidden"
                />
              </div>
            ) : null
          }
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="cursor-pointer font-normal">
                {opt.label}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-3 text-center text-xs text-slate-400">
              Không tìm thấy kết quả
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
