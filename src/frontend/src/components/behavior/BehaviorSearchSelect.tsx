import { Search, X } from "lucide-react";
/**
 * BehaviorSearchSelect — behavior-first search that replaces the category-first dropdown.
 *
 * UX flow:
 *   1. Teacher types (or leaves blank to see all options grouped by category)
 *   2. Results show behavior label + category chip in a flat, scrollable list
 *   3. Selecting a behavior auto-assigns category + severity (overridable)
 *   4. "Custom..." always appears at the bottom for free-text entry
 */
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type BehaviorCategory,
  BehaviorEntryType,
  BehaviorSeverity,
} from "../../backend";
import {
  type BehaviorOption,
  CUSTOM_LABEL,
  CUSTOM_OPTION,
  INCIDENT_OPTIONS,
  PRAISE_OPTIONS,
} from "./behaviorOptions";

export interface BehaviorSelection {
  behavior: string; // label, or CUSTOM_OPTION
  category: BehaviorCategory;
  severity?: BehaviorSeverity; // only for incidents
  description: string; // pre-filled description (editable by caller)
}

interface FlatOption extends BehaviorOption {
  category: BehaviorCategory;
  entryType: BehaviorEntryType;
}

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Academic",
  social: "Social",
  safety: "Safety",
  respect: "Respect",
  responsibility: "Responsibility",
  emotional_regulation: "Emotional Regulation",
  other: "Other",
};

const CATEGORY_ORDER = [
  "academic",
  "social",
  "safety",
  "respect",
  "responsibility",
  "emotional_regulation",
  "other",
];

function buildFlatOptions(entryType: BehaviorEntryType): FlatOption[] {
  const source =
    entryType === BehaviorEntryType.incident
      ? INCIDENT_OPTIONS
      : PRAISE_OPTIONS;
  const result: FlatOption[] = [];
  for (const cat of CATEGORY_ORDER) {
    const opts = source[cat] ?? [];
    for (const opt of opts) {
      result.push({ ...opt, category: cat as BehaviorCategory, entryType });
    }
  }
  return result;
}

interface Props {
  entryType: BehaviorEntryType;
  value: string; // currently selected behavior label or ""
  onSelect: (selection: BehaviorSelection | null) => void;
  placeholder?: string;
  /** data-ocid for the search input */
  dataOcid?: string;
}

export function BehaviorSearchSelect({
  entryType,
  value,
  onSelect,
  placeholder,
  dataOcid,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo(() => buildFlatOptions(entryType), [entryType]);

  // Reset query when entryType changes — intentionally using entryType as trigger only
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset is intentional on type change
  useEffect(() => {
    setQuery("");
  }, [entryType]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allOptions;
    const q = query.toLowerCase();
    return allOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        CATEGORY_LABELS[o.category]?.toLowerCase().includes(q),
    );
  }, [allOptions, query]);

  // Group filtered results by category for display
  const grouped = useMemo(() => {
    const map: Record<string, FlatOption[]> = {};
    for (const opt of filtered) {
      if (!map[opt.category]) map[opt.category] = [];
      map[opt.category].push(opt);
    }
    // keep category order
    return CATEGORY_ORDER.filter((c) => map[c]?.length).map((c) => ({
      category: c,
      options: map[c],
    }));
  }, [filtered]);

  const displayValue =
    value && value !== CUSTOM_OPTION
      ? value
      : value === CUSTOM_OPTION
        ? CUSTOM_LABEL
        : "";

  const handleSelect = (opt: FlatOption) => {
    onSelect({
      behavior: opt.label,
      category: opt.category,
      severity: opt.severity,
      description: opt.label,
    });
    setQuery("");
    setOpen(false);
  };

  const handleCustom = () => {
    // find any category — default to academic
    const cat = CATEGORY_ORDER[0] as BehaviorCategory;
    onSelect({
      behavior: CUSTOM_OPTION,
      category: cat,
      description: "",
    });
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasValue = !!value;

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (displayValue) setQuery("");
          }}
          placeholder={placeholder ?? "Search behaviors..."}
          className="w-full pl-8 pr-8 py-2 h-9 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          autoComplete="off"
          data-ocid={dataOcid}
          aria-label="Search behaviors"
          aria-autocomplete="list"
          aria-controls="behavior-search-listbox"
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id="behavior-search-listbox"
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-y-auto"
          tabIndex={-1}
        >
          {grouped.length === 0 && !query ? null : grouped.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No behaviors match "{query}"
            </div>
          ) : (
            grouped.map(({ category, options }) => (
              <div key={category}>
                {/* Category header */}
                <div className="sticky top-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 border-b border-border backdrop-blur-sm">
                  {CATEGORY_LABELS[category]}
                </div>
                {options.map((opt) => (
                  <button
                    key={`${opt.category}-${opt.label}`}
                    type="button"
                    aria-pressed={value === opt.label}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-muted transition-colors ${
                      value === opt.label
                        ? "bg-primary/5 text-primary"
                        : "text-foreground"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.severity && (
                      <span
                        className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          opt.severity === BehaviorSeverity.major
                            ? "bg-destructive/15 text-destructive"
                            : opt.severity === BehaviorSeverity.moderate
                              ? "bg-warning/15 text-warning"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}
                      >
                        {opt.severity.charAt(0).toUpperCase() +
                          opt.severity.slice(1)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}

          {/* Custom option — always at the bottom */}
          <div className="border-t border-border">
            <button
              type="button"
              aria-pressed={value === CUSTOM_OPTION}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                value === CUSTOM_OPTION
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCustom();
              }}
            >
              {CUSTOM_LABEL}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
