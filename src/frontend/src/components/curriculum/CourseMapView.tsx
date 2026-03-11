import { Badge } from "@/components/ui/badge";
// html2canvas and jsPDF are not available in this build; PDF export uses window.print()
import {
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Download,
  FileText,
  Layers,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import React, { useRef, useState } from "react";
import {
  useGetAssessments,
  useGetAssignments,
  useGetModules,
  useGetUnits,
} from "../../hooks/useQueries";
import type {
  Assessment,
  Assignment,
  Course,
  Module,
  Unit,
} from "../../lib/curriculumTypes";

interface CourseMapViewProps {
  courses: Course[];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function AssignmentRow({ a }: { a: Assignment }) {
  return (
    <div className="flex items-center gap-2 py-1.5 pl-4 border-l-2 border-indigo-200 ml-3">
      <FileText size={12} className="text-indigo-500 shrink-0" />
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${
          a.assignmentType === "writing"
            ? "bg-indigo-100 text-indigo-700"
            : a.assignmentType === "project"
              ? "bg-violet-100 text-violet-700"
              : "bg-gray-100 text-gray-700"
        }`}
      >
        {a.assignmentType}
      </span>
      <span className="text-sm text-foreground flex-1">{a.title}</span>
      <span className="text-xs text-muted-foreground shrink-0">
        {a.points}pt
      </span>
      {a.dueDate && (
        <span className="text-xs text-muted-foreground shrink-0">
          Due {formatDate(a.dueDate)}
        </span>
      )}
    </div>
  );
}

function AssessmentRow({ a }: { a: Assessment }) {
  return (
    <div className="flex items-center gap-2 py-1.5 pl-4 border-l-2 border-amber-200 ml-3">
      <ClipboardCheck size={12} className="text-amber-500 shrink-0" />
      <Badge className="bg-amber-100 text-amber-700 border-0 text-[11px] shrink-0">
        Assessment
      </Badge>
      <span className="text-sm text-foreground flex-1">{a.title}</span>
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${
          a.difficulty === "easy"
            ? "bg-green-100 text-green-700"
            : a.difficulty === "medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
        }`}
      >
        {a.difficulty}
      </span>
      <span className="text-xs text-muted-foreground shrink-0">
        {a.totalPoints}pt
      </span>
    </div>
  );
}

function ModuleSection({
  mod,
  showStandards,
}: {
  mod: Module;
  showStandards: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: assignments = [] } = useGetAssignments(mod.id);
  const { data: assessments = [] } = useGetAssessments(mod.id);

  return (
    <div className="ml-5 border-l border-border pl-4 py-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full text-left py-1"
      >
        {expanded ? (
          <ChevronDown size={13} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-muted-foreground shrink-0" />
        )}
        <BookMarked size={13} className="text-muted-foreground shrink-0" />
        {mod.title}
        <span className="text-xs text-muted-foreground font-normal ml-auto shrink-0">
          {assignments.length + assessments.length} items
        </span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-0.5">
          {mod.learningObjectives && mod.learningObjectives.length > 0 && (
            <div className="ml-5 mb-2">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Objectives:
              </p>
              <ul className="space-y-0.5">
                {mod.learningObjectives.map((obj) => (
                  <li
                    key={obj}
                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="text-primary/60 shrink-0">•</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showStandards && mod.standards.length > 0 && (
            <div className="ml-5 mb-2 flex flex-wrap gap-1">
              {mod.standards.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {assignments.map((a) => (
            <AssignmentRow key={a.id} a={a} />
          ))}
          {assessments.map((a) => (
            <AssessmentRow key={a.id} a={a} />
          ))}
          {assignments.length === 0 && assessments.length === 0 && (
            <p className="text-xs text-muted-foreground ml-5 py-1">No items</p>
          )}
        </div>
      )}
    </div>
  );
}

function UnitSection({
  unit,
  showFrameworkFields: _showFrameworkFields,
  showStandards,
}: {
  unit: Unit;
  showFrameworkFields: boolean;
  showStandards: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: modules = [] } = useGetModules(unit.id);

  return (
    <div className="mb-4 unit-section">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left py-2 hover:bg-muted/40 rounded-lg px-2 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={15} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-muted-foreground shrink-0" />
        )}
        <Layers size={15} className="text-primary/70 shrink-0" />
        <h3 className="text-base font-semibold text-foreground flex-1">
          {unit.title}
        </h3>
        <span className="text-xs text-muted-foreground shrink-0">
          {unit.durationValue} {unit.durationUnit}
        </span>
      </button>

      {expanded && (
        <div className="ml-2 mt-1 space-y-1">
          {unit.essentialQuestion && (
            <p className="text-sm text-muted-foreground italic ml-6 mb-2">
              "{unit.essentialQuestion}"
            </p>
          )}
          {showStandards && unit.standards.length > 0 && (
            <div className="ml-6 mb-2 flex flex-wrap gap-1">
              {unit.standards.map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {modules.map((mod) => (
            <ModuleSection
              key={mod.id}
              mod={mod}
              showStandards={showStandards}
            />
          ))}
          {modules.length === 0 && (
            <p className="text-xs text-muted-foreground ml-6 py-1">
              No modules
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pacing Strip ─────────────────────────────────────────────────────────────

const PACING_COLORS = [
  "bg-primary/5",
  "bg-primary/10",
  "bg-secondary/20",
  "bg-secondary/30",
];

function unitToWeeks(unit: Unit): number {
  if (unit.durationUnit === "weeks") return unit.durationValue;
  return unit.durationValue / 5;
}

function PacingStrip({ units }: { units: Unit[] }) {
  if (units.length === 0) return null;

  const unitWeeks = units.map(unitToWeeks);
  const totalWeeks = unitWeeks.reduce((sum, w) => sum + w, 0);

  return (
    <div
      className="bg-card rounded-xl border border-border p-4 mb-4"
      data-ocid="curriculum.pacing_strip.section"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Pacing Overview
      </p>
      <div className="flex overflow-hidden rounded-lg border border-border">
        {units.map((unit, idx) => {
          const weeks = unitToWeeks(unit);
          const pct = totalWeeks > 0 ? (weeks / totalWeeks) * 100 : 0;
          const colorClass = PACING_COLORS[idx % PACING_COLORS.length];
          return (
            <div
              key={unit.id}
              className={`${colorClass} flex-shrink-0 px-2 py-3 border-r border-border/40 last:border-r-0 overflow-hidden`}
              style={{ width: `max(${pct}%, 60px)` }}
              title={`${unit.title} — ${weeks} week${weeks !== 1 ? "s" : ""}`}
            >
              <div className="text-[10px] font-bold text-primary/80 leading-none mb-1">
                U{idx + 1}
              </div>
              <div className="text-xs font-medium text-foreground truncate leading-tight">
                {unit.title}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {weeks % 1 === 0 ? weeks : weeks.toFixed(1)} wk
                {weeks !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        {totalWeeks % 1 === 0 ? totalWeeks : totalWeeks.toFixed(1)} weeks total
      </p>
    </div>
  );
}

// ─── Standards Coverage Map ───────────────────────────────────────────────────

function StandardsCoverageMapInner({ units }: { units: Unit[] }) {
  // Collect module standards for each unit using individual hooks
  // We call them unconditionally at the top level
  const moduleData0 = useGetModules(units[0]?.id);
  const moduleData1 = useGetModules(units[1]?.id);
  const moduleData2 = useGetModules(units[2]?.id);
  const moduleData3 = useGetModules(units[3]?.id);
  const moduleData4 = useGetModules(units[4]?.id);
  const moduleData5 = useGetModules(units[5]?.id);
  const moduleData6 = useGetModules(units[6]?.id);
  const moduleData7 = useGetModules(units[7]?.id);

  const allModulesByUnit: Module[][] = [
    moduleData0.data ?? [],
    moduleData1.data ?? [],
    moduleData2.data ?? [],
    moduleData3.data ?? [],
    moduleData4.data ?? [],
    moduleData5.data ?? [],
    moduleData6.data ?? [],
    moduleData7.data ?? [],
  ].slice(0, units.length);

  // Build coverage matrix
  const allStandardsSet = new Set<string>();
  for (const unit of units) {
    for (const s of unit.standards) allStandardsSet.add(s);
  }
  for (const mods of allModulesByUnit) {
    for (const mod of mods) {
      for (const s of mod.standards) allStandardsSet.add(s);
    }
  }
  const allStandards = Array.from(allStandardsSet).sort();

  if (allStandards.length === 0) {
    return (
      <div className="px-5 pb-5">
        <p className="text-sm text-muted-foreground italic">
          No standards tagged yet
        </p>
      </div>
    );
  }

  // coverage[standardIdx][unitIdx] = true|false
  const coverage: boolean[][] = allStandards.map((std) =>
    units.map((unit, unitIdx) => {
      const inUnit = unit.standards.includes(std);
      const inModule = (allModulesByUnit[unitIdx] ?? []).some((m) =>
        m.standards.includes(std),
      );
      return inUnit || inModule;
    }),
  );

  // Gap analysis: standards covered by only 1 unit
  const singleCoverage = allStandards.filter((_, sIdx) => {
    const count = coverage[sIdx].filter(Boolean).length;
    return count === 1;
  });

  return (
    <div className="px-5 pb-5">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">
                Standard
              </th>
              {units.map((unit, idx) => (
                <th
                  key={unit.id}
                  className="text-center py-2 px-2 font-medium text-muted-foreground max-w-[80px]"
                  title={unit.title}
                >
                  <div className="truncate max-w-[70px] text-[10px]">
                    U{idx + 1}
                  </div>
                  <div className="truncate max-w-[70px] text-[9px] text-muted-foreground/60 font-normal">
                    {unit.title}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allStandards.map((std, sIdx) => (
              <tr
                key={std}
                className="border-t border-border/40 hover:bg-muted/20 transition-colors"
              >
                <td className="py-2 pr-4 sticky left-0 bg-card z-10">
                  <span className="font-mono text-xs text-foreground">
                    {std}
                  </span>
                </td>
                {units.map((_unit, uIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: matrix cell
                  <td key={uIdx} className="text-center py-2 px-2">
                    {coverage[sIdx][uIdx] ? (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground mx-auto">
                        <Circle size={6} className="fill-current" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-4 h-4 mx-auto">
                        <Circle
                          size={10}
                          className="text-muted-foreground/25"
                        />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {singleCoverage.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Gap Analysis
          </p>
          <div className="flex flex-wrap gap-2">
            {singleCoverage.map((std) => (
              <span
                key={std}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-mono"
              >
                <TriangleAlert size={11} className="shrink-0" />
                {std}
                <span className="font-sans text-[10px] bg-amber-200 px-1 rounded text-amber-800">
                  Single coverage
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StandardsCoverageMap({ units }: { units: Unit[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-card rounded-xl border border-border overflow-hidden mb-4"
      data-ocid="curriculum.standards_map.section"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors text-left"
        data-ocid="curriculum.standards_map.toggle"
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Standards Coverage Map
        </span>
        {expanded ? (
          <ChevronDown size={14} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && units.length > 0 && (
        <div className="border-t border-border pt-4">
          <StandardsCoverageMapInner units={units} />
        </div>
      )}
      {expanded && units.length === 0 && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground italic">No units yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Course Section ───────────────────────────────────────────────────────────

function CourseSection({ course }: { course: Course }) {
  const { data: units = [] } = useGetUnits(course.id);
  const [showFrameworkFields, setShowFrameworkFields] = useState(false);
  const [showStandards, setShowStandards] = useState(true);

  return (
    <div className="mb-8 bg-card rounded-xl border border-border overflow-hidden">
      {/* Course Header */}
      <div className="p-6 border-b border-border bg-primary/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {course.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {course.subject}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-sm text-muted-foreground">
                  Grades {course.gradeBand}
                </span>
                <Badge variant="secondary" className="text-xs capitalize ml-1">
                  {course.framework === "ubd"
                    ? "UbD"
                    : course.framework === "ims"
                      ? "IMS"
                      : course.framework === "5e"
                        ? "5E"
                        : course.framework}
                </Badge>
              </div>
              {course.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-prose">
                  {course.description}
                </p>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            v{course.version} •{" "}
            {course.draftStatus === "published" ? (
              <span className="text-green-600">Published</span>
            ) : (
              <span className="text-amber-600">Draft</span>
            )}
          </div>
        </div>

        {/* Standards chips */}
        {showStandards && course.standards.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {course.standards.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* View options */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={showFrameworkFields}
              onChange={(e) => setShowFrameworkFields(e.target.checked)}
              className="accent-primary"
            />
            Show framework fields
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={showStandards}
              onChange={(e) => setShowStandards(e.target.checked)}
              className="accent-primary"
            />
            Show standards
          </label>
        </div>
      </div>

      {/* Pacing Strip + Standards Map — between view options and units list */}
      <div className="px-6 pt-4">
        <PacingStrip units={units} />
        <StandardsCoverageMap units={units} />
      </div>

      {/* Units */}
      <div className="p-6 space-y-2">
        {units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units</p>
        ) : (
          units.map((unit) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              showFrameworkFields={showFrameworkFields}
              showStandards={showStandards}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function CourseMapView({ courses }: CourseMapViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-8"
        data-ocid="curriculum.course_map.view"
      >
        <BookOpen size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">
          No courses yet
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Add a course to see the course map
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto"
      data-ocid="curriculum.course_map.view"
    >
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #course-map-print-area { display: block !important; }
          #course-map-print-area * { visibility: visible; }
          #course-map-print-area { position: fixed; top: 0; left: 0; width: 100%; page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Course Map</h2>
            <p className="text-sm text-muted-foreground">
              Full curriculum overview — {courses.length} course
              {courses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            data-ocid="curriculum.export_pdf.button"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={14} />
                Export PDF
              </>
            )}
          </button>
        </div>

        {/* Courses — this div is captured for PDF */}
        <div ref={contentRef} id="course-map-print-area">
          {courses.map((course) => (
            <CourseSection key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
