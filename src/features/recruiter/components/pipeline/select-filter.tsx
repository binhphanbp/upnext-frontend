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
}>;

export function SelectFilter({
  label,
  value,
  onChange,
  placeholder = "Select option",
  options,
  className,
}: SelectFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 min-w-[160px] cursor-pointer rounded-lg border-slate-200 bg-white text-slate-700 shadow-none">
          <span className="flex-1 truncate pr-2 text-left">
            <SelectValue placeholder={placeholder} />
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
