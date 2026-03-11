import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface DateOfBirthPickerProps {
  value: string; // MM/DD/YYYY or empty string
  onChange: (value: string) => void;
  id?: string;
}

export default function DateOfBirthPicker({
  value,
  onChange,
  id,
}: DateOfBirthPickerProps) {
  const [open, setOpen] = useState(false);

  // Parse the stored MM/DD/YYYY string into a Date object for the Calendar
  const selectedDate: Date | undefined = (() => {
    if (!value) return undefined;
    const parsed = parse(value, "MM/dd/yyyy", new Date());
    return isValid(parsed) ? parsed : undefined;
  })();

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "MM/dd/yyyy"));
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const currentYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 rounded-sm",
            !value && "text-muted-foreground",
          )}
          aria-label="Select date of birth"
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">{value || "MM/DD/YYYY"}</span>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded-sm opacity-60 hover:opacity-100 focus:outline-none"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          fromYear={currentYear - 30}
          toYear={currentYear - 3}
          defaultMonth={selectedDate ?? new Date(currentYear - 10, 0, 1)}
          disabled={(date) =>
            date > new Date() || date < new Date("1990-01-01")
          }
          initialFocus
          className="[&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-day_button]:w-10 [&_.rdp-day_button]:h-10 [&_.rdp-head_cell]:w-10 [&_.rdp-cell]:p-0.5"
        />
      </PopoverContent>
    </Popover>
  );
}
