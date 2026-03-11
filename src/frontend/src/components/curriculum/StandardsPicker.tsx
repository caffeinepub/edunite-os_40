import { Input } from "@/components/ui/input";
import { Check, Plus, Search, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { STANDARDS_LIBRARY, type Standard } from "../../lib/standardsLibrary";

export interface StandardsPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

type Framework = "All" | "CCSS ELA" | "CCSS Math" | "NGSS";

const FRAMEWORK_FILTERS: Framework[] = ["All", "CCSS ELA", "CCSS Math", "NGSS"];

const FRAMEWORK_BADGE_COLORS: Record<string, string> = {
  "CCSS ELA": "bg-indigo-100 text-indigo-700",
  "CCSS Math": "bg-blue-100 text-blue-700",
  NGSS: "bg-emerald-100 text-emerald-700",
};

export default function StandardsPicker({
  selected,
  onChange,
  label = "Standards",
}: StandardsPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState<Framework>("All");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleRemove = (id: string) => {
    onChange(selected.filter((s) => s !== id));
  };

  const handleAdd = (standard: Standard) => {
    if (!selected.includes(standard.id)) {
      onChange([...selected, standard.id]);
    }
  };

  const filteredResults: Standard[] = (() => {
    const q = query.trim().toLowerCase();
    return STANDARDS_LIBRARY.filter((s) => {
      const matchesFramework =
        frameworkFilter === "All" || s.framework === frameworkFilter;
      if (!matchesFramework) return false;
      if (!q) return true;
      return (
        s.code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q)
      );
    }).slice(0, 20);
  })();

  // Get full Standard objects for selected IDs (for showing chips)
  const selectedStandards = selected.map((id) => {
    const found = STANDARDS_LIBRARY.find((s) => s.id === id);
    return (
      found ?? {
        id,
        code: id,
        description: id,
        framework: "CCSS ELA" as const,
        grade: "",
        domain: "",
      }
    );
  });

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Label */}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-1.5">
        {selectedStandards.map((s) => (
          <span
            key={s.id}
            title={s.description}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium cursor-default"
          >
            {s.code}
            <button
              type="button"
              onClick={() => handleRemove(s.id)}
              aria-label={`Remove standard ${s.code}`}
              className="hover:text-primary/60 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {/* Add standard trigger */}
        {!open && (
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            data-ocid="curriculum.standards_picker.add_button"
          >
            <Plus size={10} />
            Add standard
          </button>
        )}
      </div>

      {/* Expanded search panel */}
      {open && (
        <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
          {/* Framework filter row */}
          <div className="flex items-center gap-1 px-3 pt-2.5 pb-2 border-b border-border/40 flex-wrap">
            {FRAMEWORK_FILTERS.map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => setFrameworkFilter(fw)}
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors border ${
                  frameworkFilter === fw
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {fw}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClose}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close standards picker"
              data-ocid="curriculum.standards_picker.close_button"
            >
              <X size={14} />
            </button>
          </div>

          {/* Search input */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Search
                size={13}
                className="text-muted-foreground flex-shrink-0"
              />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code or description..."
                className="h-7 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                data-ocid="curriculum.standards_picker.search_input"
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-56 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No standards found.{" "}
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="underline hover:text-foreground"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredResults.map((standard) => {
                const isSelected = selected.includes(standard.id);
                return (
                  <button
                    key={standard.id}
                    type="button"
                    onClick={() => !isSelected && handleAdd(standard)}
                    disabled={isSelected}
                    className={`w-full text-left flex items-start gap-2.5 px-3 py-2 border-b border-border/20 last:border-0 transition-colors ${
                      isSelected
                        ? "bg-primary/5 cursor-default"
                        : "hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    {/* Checkmark / spacer */}
                    <span className="flex-shrink-0 w-4 mt-0.5">
                      {isSelected ? (
                        <Check size={12} className="text-primary" />
                      ) : null}
                    </span>

                    {/* Framework badge + code + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span
                          className={`text-[10px] px-1.5 py-0 rounded-sm font-semibold ${
                            FRAMEWORK_BADGE_COLORS[standard.framework] ??
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {standard.framework}
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {standard.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Gr. {standard.grade}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {standard.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
