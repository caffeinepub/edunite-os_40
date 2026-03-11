import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import React from "react";

export const GRADE_LEVEL_OPTIONS = [
  "K",
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

interface FilterBarProps {
  selectedGrades: string[];
  onGradeToggle: (grade: string) => void;
  selectedClasses: string[];
  onClassToggle: (cls: string) => void;
  availableClasses: string[];
  advancedFilterCount: number;
  onOpenMoreFilters: () => void;
  onClearAll: () => void;
}

export default function FilterBar({
  selectedGrades,
  onGradeToggle,
  selectedClasses,
  onClassToggle,
  availableClasses,
  advancedFilterCount,
  onOpenMoreFilters,
  onClearAll,
}: FilterBarProps) {
  const hasAnyFilter =
    selectedGrades.length > 0 ||
    selectedClasses.length > 0 ||
    advancedFilterCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Grade Level chips */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground mr-1 whitespace-nowrap">
          Grade:
        </span>
        {GRADE_LEVEL_OPTIONS.map((grade) => {
          const isActive = selectedGrades.includes(grade);
          return (
            <button
              key={grade}
              type="button"
              onClick={() => onGradeToggle(grade)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 select-none",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {grade}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      {availableClasses.length > 0 && (
        <div className="h-5 w-px bg-border mx-1 flex-shrink-0" />
      )}

      {/* Class chips */}
      {availableClasses.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1 whitespace-nowrap">
            Class:
          </span>
          {availableClasses.map((cls) => {
            const isActive = selectedClasses.includes(cls);
            return (
              <button
                key={cls}
                type="button"
                onClick={() => onClassToggle(cls)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 select-none",
                  isActive
                    ? "bg-accent text-accent-foreground border-primary/40 shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
                )}
              >
                {cls}
              </button>
            );
          })}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Clear All (only when filters active) */}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}

      {/* More Filters button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenMoreFilters}
        className="relative gap-2 flex-shrink-0"
      >
        <SlidersHorizontal className="h-4 w-4" />
        More Filters
        {advancedFilterCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full">
            {advancedFilterCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
