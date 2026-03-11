import { AlertTriangle, CalendarDays, Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  useAllAssessments,
  useAllAssignments,
  useUpdateAssessment,
  useUpdateAssignment,
} from "../../hooks/useQueries";
import type { Assessment, Assignment, Course } from "../../lib/curriculumTypes";

interface CurriculumTimelineViewProps {
  courses: Course[];
  onAssignmentClick: (lessonId: number, courseId: number) => void;
}

const COURSE_COLORS = [
  {
    bg: "oklch(0.48 0.22 293 / 0.12)",
    border: "oklch(0.48 0.22 293 / 0.4)",
    text: "oklch(0.48 0.22 293)",
    dot: "oklch(0.48 0.22 293)",
  },
  {
    bg: "oklch(0.55 0.18 220 / 0.12)",
    border: "oklch(0.55 0.18 220 / 0.4)",
    text: "oklch(0.55 0.18 220)",
    dot: "oklch(0.55 0.18 220)",
  },
  {
    bg: "oklch(0.60 0.18 160 / 0.12)",
    border: "oklch(0.60 0.18 160 / 0.4)",
    text: "oklch(0.60 0.18 160)",
    dot: "oklch(0.60 0.18 160)",
  },
  {
    bg: "oklch(0.65 0.18 50 / 0.12)",
    border: "oklch(0.65 0.18 50 / 0.4)",
    text: "oklch(0.65 0.18 50)",
    dot: "oklch(0.65 0.18 50)",
  },
  {
    bg: "oklch(0.60 0.20 20 / 0.12)",
    border: "oklch(0.60 0.20 20 / 0.4)",
    text: "oklch(0.60 0.20 20)",
    dot: "oklch(0.60 0.20 20)",
  },
];

function getWeekKey(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0];
}

function formatWeekLabel(weekKey: string): string {
  const d = new Date(weekKey);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateChip(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Inline date editor for an assignment card ─────────────────────────────────

function AssignmentDateChip({
  item,
  moduleId,
}: {
  item: Assignment;
  moduleId: number;
}) {
  const [editing, setEditing] = useState(false);
  const updateAssignment = useUpdateAssignment();

  const handleChange = async (newDate: string) => {
    setEditing(false);
    if (newDate === item.dueDate) return;
    await updateAssignment.mutateAsync({
      id: item.id,
      moduleId,
      lessonId: moduleId,
      dueDate: newDate,
    });
  };

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: intentional for inline editing
        autoFocus
        type="date"
        defaultValue={item.dueDate}
        onBlur={(e) => handleChange(e.target.value)}
        onChange={(e) => {
          if (e.target.value) handleChange(e.target.value);
        }}
        className="mt-1 w-full text-[10px] border border-border rounded px-1 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        data-ocid="curriculum.timeline.date_input"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="mt-0.5 inline-flex items-center text-[10px] opacity-70 hover:opacity-100 transition-opacity underline-offset-2 hover:underline cursor-pointer"
      title="Click to edit due date"
    >
      {item.dueDate ? formatDateChip(item.dueDate) : "Set date"}
    </button>
  );
}

// ─── Inline date editor for an assessment card ────────────────────────────────

function AssessmentDateChip({ item }: { item: Assessment }) {
  const [editing, setEditing] = useState(false);
  const updateAssessment = useUpdateAssessment();

  const handleChange = async (newDate: string) => {
    setEditing(false);
    if (newDate === item.dueDate) return;
    await updateAssessment.mutateAsync({
      id: item.id,
      moduleId: item.moduleId,
      dueDate: newDate,
    });
  };

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: intentional for inline editing
        autoFocus
        type="date"
        defaultValue={item.dueDate}
        onBlur={(e) => handleChange(e.target.value)}
        onChange={(e) => {
          if (e.target.value) handleChange(e.target.value);
        }}
        className="mt-1 w-full text-[10px] border border-border rounded px-1 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        data-ocid="curriculum.timeline.date_input"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="mt-0.5 inline-flex items-center text-[10px] opacity-70 hover:opacity-100 transition-opacity hover:underline underline-offset-2 cursor-pointer"
      title="Click to edit due date"
    >
      {item.dueDate ? formatDateChip(item.dueDate) : "Set date"}
    </button>
  );
}

export default function CurriculumTimelineView({
  courses,
  onAssignmentClick,
}: CurriculumTimelineViewProps) {
  const { data: allAssignments = [], isLoading: loadingA } =
    useAllAssignments();
  const { data: allAssessments = [], isLoading: loadingB } =
    useAllAssessments();

  const isLoading = loadingA || loadingB;

  // Course filter state — "all" or a courseId
  const [activeCourseFilter, setActiveCourseFilter] = useState<number | "all">(
    "all",
  );

  const visibleCourses =
    activeCourseFilter === "all"
      ? courses
      : courses.filter((c) => c.id === activeCourseFilter);

  const { weeks, assignmentsByWeekAndCourse, assessmentsByWeekAndCourse } =
    useMemo(() => {
      const weekSet = new Set<string>();
      const aMap: Record<string, Record<number, Assignment[]>> = {};
      const assMap: Record<string, Record<number, Assessment[]>> = {};

      const courseIds = new Set(visibleCourses.map((c) => c.id));

      for (const a of allAssignments) {
        if (!courseIds.has(a.courseId)) continue;
        const wk = getWeekKey(a.dueDate);
        if (!wk) continue;
        weekSet.add(wk);
        if (!aMap[wk]) aMap[wk] = {};
        if (!aMap[wk][a.courseId]) aMap[wk][a.courseId] = [];
        aMap[wk][a.courseId].push(a);
      }

      for (const a of allAssessments) {
        if (!courseIds.has(a.courseId)) continue;
        const wk = getWeekKey(a.dueDate);
        if (!wk) continue;
        weekSet.add(wk);
        if (!assMap[wk]) assMap[wk] = {};
        if (!assMap[wk][a.courseId]) assMap[wk][a.courseId] = [];
        assMap[wk][a.courseId].push(a);
      }

      const sortedWeeks = [...weekSet].sort();
      return {
        weeks: sortedWeeks,
        assignmentsByWeekAndCourse: aMap,
        assessmentsByWeekAndCourse: assMap,
      };
    }, [allAssignments, allAssessments, visibleCourses]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <CalendarDays size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No courses to display</p>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="flex-1 flex flex-col gap-4">
        {/* Course filter pills (shown even on empty state if multiple courses) */}
        {courses.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCourseFilter("all")}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
                activeCourseFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
              data-ocid="curriculum.timeline.course_filter.tab"
            >
              All courses
            </button>
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCourseFilter(c.id)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
                  activeCourseFilter === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
                data-ocid="curriculum.timeline.course_filter.tab"
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <CalendarDays size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No assignments or assessments with due dates yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
            Set due dates on assignments and assessments in the Structure view,
            or click any date chip in this timeline to edit dates inline.
          </p>
        </div>
      </div>
    );
  }

  const WEEK_WIDTH = 180;

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-3 bg-card rounded-xl border border-border shadow-card">
      {/* Course filter pills — shown when multiple courses exist */}
      {courses.length > 1 && (
        <div className="px-4 pt-3 flex items-center gap-1.5 flex-wrap flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveCourseFilter("all")}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
              activeCourseFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
            data-ocid="curriculum.timeline.course_filter.tab"
          >
            All courses
          </button>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCourseFilter(c.id)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
                activeCourseFilter === c.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
              data-ocid="curriculum.timeline.course_filter.tab"
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-shrink-0">
        <CalendarDays size={15} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          Assignment & Assessment Timeline
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          — click any item to navigate · click date to edit inline
        </span>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: `${200 + weeks.length * WEEK_WIDTH}px` }}>
          {/* Week Headers */}
          <div className="flex sticky top-0 z-10 bg-card border-b border-border">
            <div className="w-48 flex-shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Course
            </div>
            {weeks.map((wk) => (
              <div
                key={wk}
                style={{ width: WEEK_WIDTH, minWidth: WEEK_WIDTH }}
                className="flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
              >
                <div className="font-semibold text-foreground">Week of</div>
                <div>{formatWeekLabel(wk)}</div>
              </div>
            ))}
          </div>

          {/* Course Rows */}
          {visibleCourses.map((course) => {
            // Use the original course index for consistent coloring
            const colorIdx = courses.findIndex((c) => c.id === course.id);
            const color = COURSE_COLORS[colorIdx % COURSE_COLORS.length];
            return (
              <div
                key={course.id}
                className="flex border-b border-border last:border-b-0"
              >
                {/* Course Label */}
                <div
                  className="w-48 flex-shrink-0 px-4 py-3 border-r border-border flex items-center gap-2"
                  style={{ backgroundColor: color.bg }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color.dot }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {course.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {course.subject}
                    </div>
                  </div>
                </div>

                {/* Week Cells */}
                {weeks.map((wk) => {
                  const cellAssignments =
                    assignmentsByWeekAndCourse[wk]?.[course.id] || [];
                  const cellAssessments =
                    assessmentsByWeekAndCourse[wk]?.[course.id] || [];
                  const hasConflict = cellAssessments.length >= 2;

                  return (
                    <div
                      key={wk}
                      style={{ width: WEEK_WIDTH, minWidth: WEEK_WIDTH }}
                      className={`flex-shrink-0 px-2 py-2 border-r border-border last:border-r-0 min-h-[60px] ${
                        hasConflict ? "bg-amber-50/60 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      {hasConflict && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 mb-1">
                          <AlertTriangle size={10} />
                          Multiple assessments
                        </div>
                      )}
                      <div className="space-y-1">
                        {cellAssignments.map((a) => (
                          <div
                            key={`a-${a.id}`}
                            className="rounded text-xs"
                            style={{
                              backgroundColor: color.bg,
                              border: `1px solid ${color.border}`,
                              color: color.text,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onAssignmentClick(
                                  a.moduleId ?? a.lessonId ?? 0,
                                  a.courseId,
                                )
                              }
                              className="w-full text-left px-2 pt-1 transition-opacity hover:opacity-80"
                            >
                              <div className="font-medium truncate">
                                {a.title}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 opacity-70 pb-0.5">
                                <span className="capitalize">
                                  {a.assignmentType}
                                </span>
                                <span>·</span>
                                <span>
                                  {a.points ?? a.pointsPossible ?? 0}pt
                                </span>
                              </div>
                            </button>
                            <div className="px-2 pb-1.5">
                              <AssignmentDateChip
                                item={a}
                                moduleId={a.moduleId ?? a.lessonId ?? 0}
                              />
                            </div>
                          </div>
                        ))}
                        {cellAssessments.map((a) => (
                          <div
                            key={`assess-${a.id}`}
                            className="rounded text-xs bg-amber-100 border border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700/40 dark:text-amber-300"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                onAssignmentClick(a.moduleId, a.courseId)
                              }
                              className="w-full text-left px-2 pt-1 transition-opacity hover:opacity-80"
                            >
                              <div className="font-medium truncate">
                                ◆ {a.title}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 opacity-70 pb-0.5">
                                <span>Assessment</span>
                                <span>·</span>
                                <span>{a.totalPoints}pt</span>
                              </div>
                            </button>
                            <div className="px-2 pb-1.5">
                              <AssessmentDateChip item={a} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
