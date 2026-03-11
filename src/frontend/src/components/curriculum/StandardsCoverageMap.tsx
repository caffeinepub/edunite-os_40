import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Layers,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useGetAssessments,
  useGetAssignments,
  useGetModules,
  useGetUnits,
} from "../../hooks/useQueries";
import { STANDARDS_LIBRARY, type Standard } from "../../lib/standardsLibrary";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StandardsCoverageMapProps {
  courseId: number;
}

interface CoverageItem {
  label: string;
  type: "unit" | "module" | "assignment" | "assessment";
  unitTitle: string;
}

type Framework = "All" | "CCSS ELA" | "CCSS Math" | "NGSS";
type CoverageStatus = "All" | "Covered" | "Not Tagged";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FRAMEWORK_BADGE_CLASSES: Record<string, string> = {
  "CCSS ELA": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "CCSS Math": "bg-blue-100 text-blue-700 border-blue-200",
  NGSS: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const FRAMEWORK_HEADER_CLASSES: Record<string, string> = {
  "CCSS ELA": "bg-indigo-50 border-indigo-100 text-indigo-800",
  "CCSS Math": "bg-blue-50 border-blue-100 text-blue-800",
  NGSS: "bg-emerald-50 border-emerald-100 text-emerald-800",
};

const ITEM_TYPE_ICONS: Record<CoverageItem["type"], React.ReactNode> = {
  unit: <BookOpen size={12} className="text-violet-500 shrink-0" />,
  module: <Layers size={12} className="text-amber-500 shrink-0" />,
  assignment: <FileText size={12} className="text-sky-500 shrink-0" />,
  assessment: <ClipboardList size={12} className="text-rose-500 shrink-0" />,
};

const ITEM_TYPE_LABELS: Record<CoverageItem["type"], string> = {
  unit: "Unit",
  module: "Module",
  assignment: "Assignment",
  assessment: "Assessment",
};

function exportToCSV(
  coverageMap: Map<string, CoverageItem[]>,
  standards: Standard[],
) {
  const rows = [
    ["Code", "Description", "Framework", "Domain", "Coverage Count", "Items"],
  ];
  for (const standard of standards) {
    const items = coverageMap.get(standard.id) ?? [];
    rows.push([
      standard.code,
      standard.description,
      standard.framework,
      standard.domain,
      String(items.length),
      items.map((i) => `${i.label} (${i.type})`).join("; "),
    ]);
  }
  const csv = rows
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "standards-coverage.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── StandardRow ─────────────────────────────────────────────────────────────

interface StandardRowProps {
  standard: Standard;
  items: CoverageItem[];
  index: number;
}

function StandardRow({ standard, items, index }: StandardRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isCovered = items.length > 0;

  return (
    <div
      className="border-b border-border/30 last:border-0"
      data-ocid={`curriculum.standards_map.standard.item.${index}`}
    >
      {/* Row header */}
      <button
        type="button"
        onClick={() => isCovered && setExpanded((v) => !v)}
        disabled={!isCovered}
        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
          isCovered
            ? "hover:bg-violet-50/40 cursor-pointer"
            : "cursor-default opacity-75"
        }`}
        aria-expanded={expanded}
      >
        {/* Expand chevron */}
        <span className="mt-0.5 flex-shrink-0 w-4">
          {isCovered ? (
            expanded ? (
              <ChevronDown size={14} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={14} className="text-muted-foreground" />
            )
          ) : (
            <span className="w-4" />
          )}
        </span>

        {/* Framework badge + code */}
        <span
          className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
            FRAMEWORK_BADGE_CLASSES[standard.framework] ??
            "bg-muted text-muted-foreground border-border"
          }`}
        >
          {standard.code}
        </span>

        {/* Description */}
        <p className="flex-1 text-sm text-foreground leading-snug line-clamp-2 min-w-0">
          {standard.description}
        </p>

        {/* Coverage badge */}
        <span className="flex-shrink-0 ml-2">
          {isCovered ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              Not tagged
            </span>
          )}
        </span>
      </button>

      {/* Expanded item list */}
      {expanded && isCovered && (
        <div className="pl-11 pr-4 pb-3 space-y-1.5">
          {items.map((item, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable positional list
              key={idx}
              className="flex items-start gap-2 py-1.5 px-3 rounded-lg bg-muted/30"
            >
              {ITEM_TYPE_ICONS[item.type]}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate block">
                  {item.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {ITEM_TYPE_LABELS[item.type]}
                  {item.unitTitle && ` · ${item.unitTitle}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StandardsCoverageMap({
  courseId,
}: StandardsCoverageMapProps) {
  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: units = [] } = useGetUnits(courseId);
  const { data: allModules = [] } = useGetModules(undefined);
  const { data: allAssignments = [] } = useGetAssignments(undefined);
  const { data: allAssessments = [] } = useGetAssessments(undefined);

  // Filter to this course
  const modules = useMemo(
    () => allModules.filter((m) => m.courseId === courseId),
    [allModules, courseId],
  );
  const assignments = useMemo(
    () => allAssignments.filter((a) => a.courseId === courseId),
    [allAssignments, courseId],
  );
  const assessments = useMemo(
    () => allAssessments.filter((a) => a.courseId === courseId),
    [allAssessments, courseId],
  );

  // Build a unit title lookup by unitId
  const unitTitleById = useMemo(
    () => new Map(units.map((u) => [u.id, u.title])),
    [units],
  );

  // Build module→unitId lookup
  const moduleUnitId = useMemo(
    () => new Map(allModules.map((m) => [m.id, m.unitId])),
    [allModules],
  );

  // ── Coverage map ───────────────────────────────────────────────────────────
  const coverageMap = useMemo(() => {
    const map = new Map<string, CoverageItem[]>();

    const addItems = (
      stdIds: string[],
      label: string,
      type: CoverageItem["type"],
      unitTitle: string,
    ) => {
      for (const id of stdIds) {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push({ label, type, unitTitle });
      }
    };

    for (const unit of units) {
      addItems(unit.standards ?? [], unit.title, "unit", unit.title);
    }

    for (const mod of modules) {
      const unitTitle = unitTitleById.get(mod.unitId) ?? "";
      addItems(mod.standards ?? [], mod.title, "module", unitTitle);
    }

    for (const a of assignments) {
      const unitId = moduleUnitId.get(a.moduleId);
      const unitTitle =
        (unitId !== undefined ? unitTitleById.get(unitId) : undefined) ?? "";
      addItems(a.standards ?? [], a.title, "assignment", unitTitle);
    }

    for (const a of assessments) {
      const unitId = moduleUnitId.get(a.moduleId);
      const unitTitle =
        (unitId !== undefined ? unitTitleById.get(unitId) : undefined) ?? "";
      addItems(a.standards ?? [], a.title, "assessment", unitTitle);
    }

    return map;
  }, [units, modules, assignments, assessments, unitTitleById, moduleUnitId]);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [frameworkFilter, setFrameworkFilter] = useState<Framework>("All");
  const [statusFilter, setStatusFilter] = useState<CoverageStatus>("All");
  const [unitFilter, setUnitFilter] = useState<string>("All");

  // ── Derived data ───────────────────────────────────────────────────────────
  const coveredIds = useMemo(() => new Set(coverageMap.keys()), [coverageMap]);

  const totalInLibrary = STANDARDS_LIBRARY.length;
  const coveredCount = coveredIds.size;
  const coveragePercent =
    totalInLibrary > 0 ? Math.round((coveredCount / totalInLibrary) * 100) : 0;

  // Filtered standards list
  const filteredStandards = useMemo(() => {
    return STANDARDS_LIBRARY.filter((s) => {
      // Framework filter
      if (frameworkFilter !== "All" && s.framework !== frameworkFilter)
        return false;

      // Status filter
      if (statusFilter === "Covered" && !coveredIds.has(s.id)) return false;
      if (statusFilter === "Not Tagged" && coveredIds.has(s.id)) return false;

      // Unit filter — only show standards whose coverage items reference this unit
      if (unitFilter !== "All") {
        const items = coverageMap.get(s.id) ?? [];
        if (!items.some((i) => i.unitTitle === unitFilter)) return false;
      }

      return true;
    });
  }, [frameworkFilter, statusFilter, unitFilter, coveredIds, coverageMap]);

  // Group by framework then domain
  const groupedByFramework = useMemo(() => {
    const frameworkOrder: Standard["framework"][] = [
      "CCSS ELA",
      "CCSS Math",
      "NGSS",
    ];
    const groups: Array<{
      framework: Standard["framework"];
      domains: Array<{ domain: string; standards: Standard[] }>;
    }> = [];

    for (const fw of frameworkOrder) {
      const fwStandards = filteredStandards.filter((s) => s.framework === fw);
      if (fwStandards.length === 0) continue;

      const domainMap = new Map<string, Standard[]>();
      for (const s of fwStandards) {
        if (!domainMap.has(s.domain)) domainMap.set(s.domain, []);
        domainMap.get(s.domain)!.push(s);
      }

      groups.push({
        framework: fw,
        domains: Array.from(domainMap.entries()).map(([domain, stds]) => ({
          domain,
          standards: stds,
        })),
      });
    }

    return groups;
  }, [filteredStandards]);

  // Has any standards been tagged at all?
  const hasAnyTagged = coveredCount > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 space-y-5 flex-1 overflow-y-auto">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-2xl font-bold text-violet-600">
            {coveredCount}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Standards Covered
          </span>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
          <span className="text-2xl font-bold text-foreground">
            {totalInLibrary}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Total in Library
          </span>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
          <span
            className={`text-2xl font-bold ${
              coveragePercent >= 50 ? "text-green-600" : "text-amber-600"
            }`}
          >
            {coveragePercent}%
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Coverage
          </span>
          {/* Mini progress bar */}
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                coveragePercent >= 50 ? "bg-green-500" : "bg-amber-500"
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter + Export row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Framework filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Framework:
            </span>
            {(["All", "CCSS ELA", "CCSS Math", "NGSS"] as Framework[]).map(
              (fw, i) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setFrameworkFilter(fw)}
                  data-ocid={`curriculum.standards_map.framework.tab.${i + 1}`}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                    frameworkFilter === fw
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-transparent text-muted-foreground border-border hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {fw}
                </button>
              ),
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Status:
            </span>
            {(["All", "Covered", "Not Tagged"] as CoverageStatus[]).map(
              (s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  data-ocid={`curriculum.standards_map.status.tab.${i + 1}`}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                    statusFilter === s
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-transparent text-muted-foreground border-border hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {s}
                </button>
              ),
            )}
          </div>

          {/* Unit filter — only show if there are units */}
          {units.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium mr-1">
                Unit:
              </span>
              <button
                type="button"
                onClick={() => setUnitFilter("All")}
                data-ocid="curriculum.standards_map.unit.tab"
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                  unitFilter === "All"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-transparent text-muted-foreground border-border hover:border-violet-400 hover:text-violet-600"
                }`}
              >
                All Units
              </button>
              {units.map((unit, i) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() =>
                    setUnitFilter(
                      unitFilter === unit.title ? "All" : unit.title,
                    )
                  }
                  data-ocid={`curriculum.standards_map.unit.tab.${i + 1}`}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border max-w-[180px] truncate ${
                    unitFilter === unit.title
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-transparent text-muted-foreground border-border hover:border-violet-400 hover:text-violet-600"
                  }`}
                  title={unit.title}
                >
                  {unit.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(coverageMap, filteredStandards)}
          data-ocid="curriculum.standards_map.export.button"
          className="flex items-center gap-1.5 shrink-0 text-xs"
        >
          <Download size={13} />
          Export CSV
        </Button>
      </div>

      {/* Main content */}
      {!hasAnyTagged && statusFilter !== "Not Tagged" ? (
        /* Empty state — no standards tagged yet */
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="curriculum.standards_map.empty_state"
        >
          <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-4">
            <Tag size={22} className="text-violet-400" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No standards tagged yet
          </p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Tag standards on units, modules, assignments, and assessments to see
            coverage here. Use the Standards picker when editing any curriculum
            item.
          </p>
        </div>
      ) : filteredStandards.length === 0 ? (
        /* Filtered empty state */
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-ocid="curriculum.standards_map.empty_state"
        >
          <BarChart2 size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No standards match your filters
          </p>
          <button
            type="button"
            onClick={() => {
              setFrameworkFilter("All");
              setStatusFilter("All");
              setUnitFilter("All");
            }}
            className="mt-2 text-xs text-violet-600 hover:text-violet-700 underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Standards grouped table */
        <div className="space-y-4">
          {groupedByFramework.map((group) => (
            <div
              key={group.framework}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Framework header */}
              <div
                className={`flex items-center justify-between px-4 py-2.5 border-b ${
                  FRAMEWORK_HEADER_CLASSES[group.framework] ??
                  "bg-muted border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-[10px] px-2 py-0 border font-semibold ${
                      FRAMEWORK_BADGE_CLASSES[group.framework] ??
                      "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {group.framework}
                  </Badge>
                  <span className="text-xs font-semibold">
                    {group.domains.reduce(
                      (sum, d) => sum + d.standards.length,
                      0,
                    )}{" "}
                    standards
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {
                    group.domains
                      .flatMap((d) => d.standards)
                      .filter((s) => coveredIds.has(s.id)).length
                  }{" "}
                  covered
                </span>
              </div>

              {/* Domain groups */}
              {group.domains.map((domainGroup) => {
                // Running index for data-ocid
                let rowIndex = 0;

                return (
                  <div key={domainGroup.domain}>
                    {/* Domain sub-header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border/30">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {domainGroup.domain}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        ({domainGroup.standards.length})
                      </span>
                    </div>

                    {/* Standards rows */}
                    <div>
                      {domainGroup.standards.map((standard) => {
                        rowIndex++;
                        const items = coverageMap.get(standard.id) ?? [];
                        return (
                          <StandardRow
                            key={standard.id}
                            standard={standard}
                            items={items}
                            index={rowIndex}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
