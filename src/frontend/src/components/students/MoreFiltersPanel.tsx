import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusFilter = "Active" | "Inactive" | "Transferred" | null;
export type YesNoFilter = "Yes" | "No" | null;
export type AttendanceRiskFilter = "On Track" | "At Risk" | "Critical" | null;
export type RecentIncidentsFilter =
  | "Last 7 days"
  | "Last 30 days"
  | "None"
  | null;
export type GradeTrendFilter = "Improving" | "Declining" | "Stable" | null;

export interface AdvancedFilters {
  status: StatusFilter;
  hasAccommodations: YesNoFilter;
  hasAllergies: YesNoFilter;
  hasMedicalNotes: YesNoFilter;
  attendanceRisk: AttendanceRiskFilter;
  recentIncidents: RecentIncidentsFilter;
  behaviorFlag: YesNoFilter;
  gradeTrend: GradeTrendFilter;
  hasMissingWork: YesNoFilter;
  hasParentContact: YesNoFilter;
  doNotContact: YesNoFilter;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  status: null,
  hasAccommodations: null,
  hasAllergies: null,
  hasMedicalNotes: null,
  attendanceRisk: null,
  recentIncidents: null,
  behaviorFlag: null,
  gradeTrend: null,
  hasMissingWork: null,
  hasParentContact: null,
  doNotContact: null,
};

export function countActiveAdvancedFilters(filters: AdvancedFilters): number {
  return Object.values(filters).filter((v) => v !== null).length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ChipGroupProps<T extends string> {
  label: string;
  options: T[];
  value: T | null;
  onChange: (val: T | null) => void;
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(isActive ? null : opt)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Panel — inline expandable (no slide-in, no backdrop) ───────────────

interface MoreFiltersPanelProps {
  open: boolean;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onApply: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export default function MoreFiltersPanel({
  open,
  filters,
  onFiltersChange,
  onApply,
  onClearAll,
  onClose,
}: MoreFiltersPanelProps) {
  const set = <K extends keyof AdvancedFilters>(
    key: K,
    val: AdvancedFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: val });
  };

  const activeCount = countActiveAdvancedFilters(filters);

  if (!open) return null;

  return (
    <div
      className="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
      data-ocid="students.more_filters.panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            More Filters
          </span>
          {activeCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {activeCount} active filter{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 text-xs"
          data-ocid="students.more_filters.close_button"
        >
          <ChevronUp className="h-3.5 w-3.5" />
          Collapse
        </button>
      </div>

      {/* Filter groups — 2-column grid layout */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          {/* Status */}
          <ChipGroup<NonNullable<StatusFilter>>
            label="Status"
            options={["Active", "Inactive", "Transferred"]}
            value={filters.status}
            onChange={(v) => set("status", v)}
          />

          {/* Attendance */}
          <ChipGroup<NonNullable<AttendanceRiskFilter>>
            label="Attendance Risk"
            options={["On Track", "At Risk", "Critical"]}
            value={filters.attendanceRisk}
            onChange={(v) => set("attendanceRisk", v)}
          />

          {/* Accommodations */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Has Accommodations (IEP / 504)"
            options={["Yes", "No"]}
            value={filters.hasAccommodations}
            onChange={(v) => set("hasAccommodations", v)}
          />

          {/* Allergies */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Has Allergies / Dietary Restrictions"
            options={["Yes", "No"]}
            value={filters.hasAllergies}
            onChange={(v) => set("hasAllergies", v)}
          />

          {/* Medical Notes */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Has Medical Notes"
            options={["Yes", "No"]}
            value={filters.hasMedicalNotes}
            onChange={(v) => set("hasMedicalNotes", v)}
          />

          {/* Recent Incidents */}
          <ChipGroup<NonNullable<RecentIncidentsFilter>>
            label="Recent Incidents"
            options={["Last 7 days", "Last 30 days", "None"]}
            value={filters.recentIncidents}
            onChange={(v) => set("recentIncidents", v)}
          />

          {/* Behavior Flag */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Behavior Flag"
            options={["Yes", "No"]}
            value={filters.behaviorFlag}
            onChange={(v) => set("behaviorFlag", v)}
          />

          {/* Grade Trend */}
          <ChipGroup<NonNullable<GradeTrendFilter>>
            label="Grade Trend"
            options={["Improving", "Declining", "Stable"]}
            value={filters.gradeTrend}
            onChange={(v) => set("gradeTrend", v)}
          />

          {/* Missing Work */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Missing Work"
            options={["Yes", "No"]}
            value={filters.hasMissingWork}
            onChange={(v) => set("hasMissingWork", v)}
          />

          {/* Parent Contact */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Parent Contact on File"
            options={["Yes", "No"]}
            value={filters.hasParentContact}
            onChange={(v) => set("hasParentContact", v)}
          />

          {/* Do Not Contact */}
          <ChipGroup<NonNullable<YesNoFilter>>
            label="Do Not Contact Flag"
            options={["Yes", "No"]}
            value={filters.doNotContact}
            onChange={(v) => set("doNotContact", v)}
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={activeCount === 0}
            data-ocid="students.more_filters.clear_button"
          >
            Clear All
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            data-ocid="students.more_filters.apply_button"
          >
            Apply Filters
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeCount > 0
              ? `${activeCount} filter${activeCount !== 1 ? "s" : ""} active`
              : "No filters active"}
          </span>
        </div>
      </div>
    </div>
  );
}
