"use client";

import { CalendarDays } from "lucide-react";
import { useRef, useState, type ComponentProps, type ReactElement } from "react";
import { DayPicker, type ClassNames, type DateRange, type DayPickerProps } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { cn } from "./cn.js";
import { Button } from "./coss/button.js";
import { Popover, PopoverPopup, PopoverTrigger } from "./coss/popover.js";

export type { DateRange } from "react-day-picker";

export type CalendarProps = Extract<DayPickerProps, { mode: "single" | "range" }>;

const focus = "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
const navButton = `grid size-8 place-items-center rounded-md not-aria-disabled:hover:bg-accent aria-disabled:text-muted-foreground ${focus}`;
const calendarClasses = {
  root: "relative w-fit max-w-full text-sm tabular-nums",
  months: "flex flex-wrap gap-4",
  month: "w-63 max-w-full",
  month_caption: "flex h-8 items-center px-1 pr-20 font-semibold",
  nav: "absolute end-0 top-0 flex gap-1",
  button_previous: navButton,
  button_next: navButton,
  chevron: "size-4 fill-current",
  month_grid: "mt-1 w-full table-fixed border-separate border-spacing-0",
  weekday: "h-8 text-xs font-medium text-muted-foreground",
  day: "p-0 text-center",
  day_button: `block h-9 w-full max-w-9 rounded-md hover:bg-accent disabled:cursor-default disabled:line-through disabled:hover:bg-transparent ${focus}`,
  today: "[&>button]:underline [&>button]:underline-offset-4",
  outside: "text-muted-foreground",
  disabled: "text-muted-foreground",
  selected: "[&:not(.ole-calendar-range-middle)>button]:bg-primary [&:not(.ole-calendar-range-middle)>button]:font-semibold [&:not(.ole-calendar-range-middle)>button]:text-primary-foreground [&>button:focus-visible]:outline-offset-2",
  range_middle: "ole-calendar-range-middle bg-accent text-accent-foreground",
  range_start: "rounded-s-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
  range_end: "rounded-e-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
} satisfies Partial<ClassNames>;

export function Calendar({ locale = zhCN, weekStartsOn = 1, classNames, labels, ...props }: CalendarProps): ReactElement {
  const navigationLabels = locale.code === "zh-CN" ? {
    labelNav: () => "月份导航",
    labelPrevious: () => "上个月",
    labelNext: () => "下个月",
  } : undefined;
  return (
    <div data-slot="calendar" className="max-w-full" lang={locale.code}>
      <DayPicker
        {...props}
        animate={false}
        locale={locale}
        weekStartsOn={weekStartsOn}
        labels={{ ...navigationLabels, ...labels }}
        classNames={{ ...calendarClasses, ...classNames }}
      />
    </div>
  );
}

type PickerCalendarProps<T extends CalendarProps["mode"]> = Omit<
  Extract<CalendarProps, { mode: T; required?: false }>, "mode" | "selected" | "onSelect" | "required" | "autoFocus"
>;

interface DatePickerBaseProps {
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  formatLocale?: string;
  portalProps?: ComponentProps<typeof PopoverPopup>["portalProps"];
}

export interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date | undefined) => void;
  calendarProps?: PickerCalendarProps<"single">;
}

export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange | undefined) => void;
  /** The default minimum is one night, so the picker waits for an end date. */
  calendarProps?: PickerCalendarProps<"range">;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

export function formatDatePickerValue(value: Date | DateRange | undefined, locale = "zh-CN", timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone });
  if (value instanceof Date) return formatter.format(value);
  if (!value?.from) return value?.to ? formatter.format(value.to) : "";
  const start = formatter.format(value.from);
  return value.to ? `${start} – ${formatter.format(value.to)}` : start;
}

/** DatePicker uses the scoped COSS popover for collision handling and focus return. */
export function DatePicker(props: DatePickerProps): ReactElement {
  const { className, disabled, formatLocale, portalProps } = props;
  const range = props.mode === "range";
  const label = props.label ?? (range ? "日期范围" : "日期");
  const placeholder = props.placeholder ?? (range ? "选择日期范围" : "选择日期");
  const controlled = "value" in props;
  const [value, setValue] = useState<Date | DateRange | undefined>(props.defaultValue);
  const [open, setOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const selection = controlled ? props.value : value;
  const formatted = formatDatePickerValue(selection, formatLocale, props.calendarProps?.timeZone);
  const sharedCalendarProps = {
    defaultMonth: selection instanceof Date ? selection : selection?.from ?? selection?.to,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={`${label} · ${formatted || placeholder}`}
        render={<Button variant="outline" className={cn("justify-start", className)} />}
      >
        <CalendarDays aria-hidden="true" />
        <span className={formatted ? undefined : "text-muted-foreground"}>{formatted || placeholder}</span>
      </PopoverTrigger>
      <PopoverPopup
        ref={calendarRef}
        aria-label={label}
        align="start"
        className="min-w-0"
        portalProps={portalProps}
        initialFocus={() => calendarRef.current?.querySelector<HTMLElement>('button[tabindex="0"]') ?? true}
      >
        {range ? (
          <Calendar
            {...sharedCalendarProps}
            min={1}
            {...props.calendarProps}
            mode="range"
            selected={selection instanceof Date ? undefined : selection}
            onSelect={(next) => {
              if (!controlled) setValue(next);
              props.onValueChange?.(next);
              if (next?.from && next.to) setOpen(false);
            }}
          />
        ) : (
          <Calendar
            {...sharedCalendarProps}
            {...props.calendarProps}
            mode="single"
            selected={selection instanceof Date ? selection : undefined}
            onSelect={(next) => {
              if (!controlled) setValue(next);
              props.onValueChange?.(next);
              setOpen(false);
            }}
          />
        )}
      </PopoverPopup>
    </Popover>
  );
}
