"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/shared/lib/cn";

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 w-fit relative", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-[252px]",
        month: "space-y-3 relative w-full",
        month_caption:
          "flex justify-center items-center font-semibold text-slate-900 text-sm h-9 px-8 relative mb-1",
        caption_label: "text-sm font-semibold text-slate-900",
        nav: "flex items-center justify-between absolute top-4 left-4 right-0 h-9 pointer-events-none z-10",
        button_previous:
          "pointer-events-auto h-8 w-8 bg-white p-0 opacity-80 hover:opacity-100 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs",
        button_next:
          "pointer-events-auto h-8 w-8 bg-white p-0 opacity-80 hover:opacity-100 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full justify-between items-center",
        weekday:
          "w-9 h-9 text-slate-500 font-medium text-[0.8rem] flex items-center justify-center p-0 m-0 select-none shrink-0",
        week: "flex w-full justify-between items-center mt-1",
        day: "w-9 h-9 p-0 rounded-xl flex items-center justify-center text-slate-700 text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-900 focus:outline-hidden font-normal shrink-0",
        selected:
          "bg-emerald-600 text-white font-semibold hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white shadow-xs rounded-xl",
        today: "bg-slate-100 text-emerald-700 font-bold border border-emerald-300 rounded-xl",
        outside: "text-slate-400 opacity-40 hover:bg-slate-50 hover:text-slate-600",
        disabled:
          "text-slate-300 opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-300",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...iconProps }) =>
          orientation === "left" ? (
            <CaretLeft className={cn("h-4 w-4", chevronClassName)} {...iconProps} />
          ) : (
            <CaretRight className={cn("h-4 w-4", chevronClassName)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
