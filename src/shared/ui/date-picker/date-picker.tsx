"use client";

import { Calendar as CalendarIcon, X } from "@phosphor-icons/react";
import { format, isValid, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useId, useMemo, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Calendar } from "@/shared/ui/calendar";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export interface DatePickerProps {
  id?: string | undefined;
  name?: string | undefined;
  label?: string | undefined;
  value?: string | Date | null | undefined;
  onChange?: ((value: string) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  minDate?: Date | string | undefined;
  maxDate?: Date | string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  triggerClassName?: string | undefined;
  helperText?: string | undefined;
  showClearButton?: boolean | undefined;
  showTodayButton?: boolean | undefined;
  displayFormat?: string | undefined;
  ariaLabel?: string | undefined;
  /** Adds the red asterisk to the label. `aria-required` is not valid on the button trigger. */
  required?: boolean | undefined;
}

function parseToDate(val?: string | Date | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isValid(val) ? val : undefined;
  if (typeof val === "string" && val.trim() !== "") {
    // Check YYYY-MM-DD
    const parsed = parseISO(val);
    if (isValid(parsed)) return parsed;
    const directDate = new Date(val);
    if (isValid(directDate)) return directDate;
  }
  return undefined;
}

function formatDateToValue(date?: Date): string {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  id: explicitId,
  label,
  value,
  onChange,
  placeholder = "Chọn ngày...",
  disabled = false,
  minDate,
  maxDate,
  error,
  className,
  triggerClassName,
  helperText,
  showClearButton = true,
  showTodayButton = true,
  displayFormat = "dd/MM/yyyy",
  ariaLabel,
  required = false,
}: DatePickerProps) {
  const generatedId = useId();
  const datePickerId = explicitId || generatedId;
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseToDate(value), [value]);

  const minParsed = useMemo(() => parseToDate(minDate), [minDate]);
  const maxParsed = useMemo(() => parseToDate(maxDate), [maxDate]);

  const formattedDisplayText = useMemo(() => {
    if (!selectedDate) return "";
    try {
      return format(selectedDate, displayFormat, { locale: vi });
    } catch {
      return "";
    }
  }, [selectedDate, displayFormat]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("");
    } else {
      onChange?.(formatDateToValue(date));
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.("");
  };

  const handleTodaySelect = () => {
    const today = new Date();
    onChange?.(formatDateToValue(today));
    setOpen(false);
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDateToValue(date);
    if (minParsed && dateStr < formatDateToValue(minParsed)) return true;
    if (maxParsed && dateStr > formatDateToValue(maxParsed)) return true;
    return false;
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={datePickerId} className="text-sm font-semibold text-slate-700">
          {label}
          {required ? (
            <span className="text-rose-600" title="Bắt buộc">
              {" *"}
            </span>
          ) : null}
        </Label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            id={datePickerId}
            type="button"
            aria-label={ariaLabel || label || placeholder}
            disabled={disabled}
            className={cn(
              "upnext-focus group flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-none transition-colors hover:border-slate-300 focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 hover:border-red-600 focus:border-red-600",
              triggerClassName,
            )}
          >
            <div className="flex items-center gap-2 truncate overflow-hidden">
              <CalendarIcon
                size={18}
                className={cn(
                  "shrink-0 text-slate-400 transition-colors group-hover:text-slate-600",
                  selectedDate && "text-emerald-600 group-hover:text-emerald-700",
                )}
              />
              {formattedDisplayText ? (
                <span className="truncate font-normal text-slate-900">{formattedDisplayText}</span>
              ) : (
                <span className="truncate text-slate-400">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {showClearButton && selectedDate && !disabled ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Xóa ngày đã chọn"
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleClear(e as unknown as React.MouseEvent);
                    }
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                </span>
              ) : null}
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto rounded-2xl border-slate-200 p-0 shadow-2xl"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={vi}
            disabled={isDateDisabled}
            autoFocus
          />

          {(showTodayButton || showClearButton) && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              {showClearButton && selectedDate ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  Xóa chọn
                </button>
              ) : (
                <div />
              )}

              {showTodayButton ? (
                <button
                  type="button"
                  onClick={handleTodaySelect}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Hôm nay
                </button>
              ) : null}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
