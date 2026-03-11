import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookOpen,
  CalendarCheck,
  CalendarX2,
  Check,
  CheckCircle2,
  GraduationCap,
  Info,
  LayoutGrid,
  Lock,
  Minus,
  Plus,
  Printer,
  Scale,
  Settings2,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserX,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend";
import { BehaviorEntryType, SENPlanType } from "../backend";
import { PillTabs } from "../components/shared/PillTabs";
import {
  useAllAssessments,
  useAllAssignments,
  useBehaviorLogs,
  useGetAllStudents,
  useGetCourses,
} from "../hooks/useQueries";
import { getGradingScale, getLetterGradeFromScale } from "../lib/appSettings";
import { getAssignmentTypes } from "../lib/assignmentTypes";
import {
  type CategoryWeights,
  getWeightsForTypes,
} from "../lib/categoryWeights";
import type { Course } from "../lib/curriculumTypes";
import {
  finalizePeriod,
  getCurrentPeriod,
  getFinalizedPeriods,
  getGradingPeriods,
  isPeriodFinalized,
} from "../lib/gradingPeriods";
import { AT_RISK_THRESHOLD, computeRiskScore } from "../lib/riskScore";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassTab = "today" | "gradebook" | "roster" | "overview";
type TodayViewMode = "today" | "thisweek" | "snapshot";

type AttendanceStatusType = "present" | "absent" | "tardy" | "excused" | null;

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatusType;
}

const ATTENDANCE_STORE_KEY = "edunite_attendance";

interface PersistedAttendanceRecord {
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "excused";
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadAttendanceStore(): PersistedAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORE_KEY);
    if (raw) return JSON.parse(raw) as PersistedAttendanceRecord[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveAttendanceStore(records: PersistedAttendanceRecord[]): void {
  try {
    localStorage.setItem(ATTENDANCE_STORE_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

function loadTodayAttendance(
  classId: string,
): Record<string, AttendanceStatusType> {
  const store = loadAttendanceStore();
  const today = todayIso();
  const map: Record<string, AttendanceStatusType> = {};
  for (const r of store) {
    if (r.classId === classId && r.date === today) {
      // Map "late" back to "tardy" for internal state
      const status =
        r.status === "late"
          ? ("tardy" as AttendanceStatusType)
          : (r.status as AttendanceStatusType);
      map[r.studentId] = status;
    }
  }
  return map;
}

function persistAttendanceRecord(
  classId: string,
  studentId: string,
  status: AttendanceStatusType,
): void {
  if (!status) return;
  const today = todayIso();
  const store = loadAttendanceStore();
  const filtered = store.filter(
    (r) =>
      !(r.classId === classId && r.date === today && r.studentId === studentId),
  );
  const persisted =
    status === "tardy"
      ? ("late" as const)
      : (status as "present" | "absent" | "excused");
  filtered.push({ studentId, classId, date: today, status: persisted });
  saveAttendanceStore(filtered);
}

function loadLast5DaysAttendance(
  classId: string,
  studentId: string,
): AttendanceStatusType[] {
  const store = loadAttendanceStore();
  const days: AttendanceStatusType[] = [];
  const today = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rec = store.find(
      (r) =>
        r.classId === classId && r.date === iso && r.studentId === studentId,
    );
    days.push(
      rec
        ? rec.status === "late"
          ? "tardy"
          : (rec.status as AttendanceStatusType)
        : null,
    );
  }
  return days;
}

interface GradeEntry {
  studentId: string;
  assignmentId: number;
  score: number | null;
}

interface ClassAssignment {
  id: number;
  name: string;
  dueDate: string;
  pointsPossible: number;
  type: string;
}

// ─── Timetable Types ──────────────────────────────────────────────────────────

interface TimetablePeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface TimetablePeriodAssignment {
  periodId: string;
  day: string;
  courseName: string;
  room: string;
}

interface TimetableData {
  periods: TimetablePeriod[];
  assignments: TimetablePeriodAssignment[];
}

function loadTimetable(): TimetableData {
  try {
    const raw = localStorage.getItem("edunite_timetable");
    if (!raw) return { periods: [], assignments: [] };
    return JSON.parse(raw);
  } catch {
    return { periods: [], assignments: [] };
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getCurrentAndNextPeriod(timetable: TimetableData): {
  current: (TimetablePeriod & { courseName: string; room: string }) | null;
  next: (TimetablePeriod & { courseName: string; room: string }) | null;
} {
  const now = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayAssignments = timetable.assignments.filter((a) => a.day === today);

  const periodsWithSubjects = timetable.periods
    .map((p) => {
      const assignment = todayAssignments.find((a) => a.periodId === p.id);
      return {
        ...p,
        courseName: assignment?.courseName ?? "",
        room: assignment?.room ?? "",
        startMinutes: timeToMinutes(p.startTime),
        endMinutes: timeToMinutes(p.endTime),
      };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const current =
    periodsWithSubjects.find(
      (p) => currentMinutes >= p.startMinutes && currentMinutes < p.endMinutes,
    ) ?? null;

  const next =
    periodsWithSubjects.find((p) => p.startMinutes > currentMinutes) ?? null;

  return { current, next };
}

// ─── Grade Persistence ────────────────────────────────────────────────────────
// Grades stored as: { [courseId]: { [studentId]: { [assignmentId]: number | null } } }

type GradeStore = Record<string, Record<string, Record<string, number | null>>>;

function loadGradesFromStorage(): GradeStore {
  try {
    const raw = localStorage.getItem("edunite_gradebook");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveGradesToStorage(grades: GradeStore): void {
  try {
    localStorage.setItem("edunite_gradebook", JSON.stringify(grades));
  } catch {
    // ignore quota errors
  }
}

// ─── Enrollment Persistence ────────────────────────────────────────────────────
// Enrollment stored as: { [courseId]: string[] } (array of studentIds)

function loadEnrollmentFromStorage(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem("edunite_enrollment");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveEnrollmentToStorage(enrollment: Record<string, string[]>): void {
  try {
    localStorage.setItem("edunite_enrollment", JSON.stringify(enrollment));
  } catch {
    // ignore quota errors
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(student: Student): string {
  return student.preferredName
    ? `${student.preferredName} ${student.familyName}`
    : `${student.givenNames} ${student.familyName}`;
}

function getInitials(student: Student): string {
  const first = student.preferredName || student.givenNames;
  return `${first[0] || ""}${student.familyName[0] || ""}`.toUpperCase();
}

// Returns a subtle background colour for a grade cell based on score %
function gradeCellBg(scorePct: number | null): string {
  if (scorePct === null) return "";
  if (scorePct >= 90) return "bg-green-50/60";
  if (scorePct >= 70) return "bg-amber-50/60";
  return "bg-red-50/60";
}

const TYPE_BORDER_HEX = [
  "#2563EB",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0D9488",
  "#059669",
  "#DB2777",
  "#EA580C",
];

function assignmentTypeBorderHex(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++)
    hash = (hash * 31 + type.charCodeAt(i)) & 0xffff;
  return TYPE_BORDER_HEX[hash % TYPE_BORDER_HEX.length];
}

function assignmentTypeShortLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("homework") || t.includes("hw")) return "HW";
  if (t.includes("quiz")) return "QZ";
  if (t.includes("test") || t.includes("exam")) return "TST";
  if (t.includes("project")) return "PRJ";
  if (t.includes("lab")) return "LAB";
  if (t.includes("essay") || t.includes("writing")) return "ESS";
  if (t.includes("discussion") || t.includes("participation")) return "DIS";
  if (t.includes("assessment")) return "ASS";
  // Take first 3 uppercase letters
  return (
    type
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 3)
      .toUpperCase() || "?"
  );
}

// ─── Class Selector ───────────────────────────────────────────────────────────

function ClassSelector({
  courses,
  value,
  onChange,
  enrollment,
}: {
  courses: Course[];
  value: number | null;
  onChange: (v: number) => void;
  enrollment?: Record<string, string[]>;
}) {
  const timetable = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("edunite_timetable");
      if (raw)
        return JSON.parse(raw) as {
          assignments?: Array<{
            courseName: string;
            periodId: string;
            day: string;
          }>;
        };
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  function getPeriodLabel(courseTitle: string): string {
    if (!timetable?.assignments) return "";
    const match = timetable.assignments.find(
      (a) => a.courseName === courseTitle && a.day === "Monday",
    );
    if (!match) return "";
    // map periodId to number
    const num = match.periodId.replace("p", "");
    return `P${num}`;
  }

  return (
    <Select
      value={value !== null ? String(value) : ""}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger
        className="w-[280px] h-9 text-sm"
        data-ocid="classes.class.select"
      >
        <SelectValue placeholder="Select a course..." />
      </SelectTrigger>
      <SelectContent className="max-h-64 overflow-y-auto">
        {courses.map((c) => {
          const periodLabel = getPeriodLabel(c.title);
          const count = enrollment?.[String(c.id)]?.length ?? 0;
          return (
            <SelectItem key={c.id} value={String(c.id)}>
              <span className="flex items-center gap-2">
                <span>{c.title}</span>
                {periodLabel && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {periodLabel}
                  </span>
                )}
                {count > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    ({count})
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ─── Today's Class Tab ────────────────────────────────────────────────────────

function TodayTab({
  selectedClass,
  students,
}: {
  selectedClass: string;
  students: Student[];
}) {
  const [todayView, setTodayView] = useState<TodayViewMode>("today");
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [recentBehavior] = useState<
    { student: string; text: string; type: "incident" | "praise" }[]
  >([
    {
      student: students[0] ? getDisplayName(students[0]) : "Alex Rivera",
      text: "Excellent participation in group discussion",
      type: "praise",
    },
    {
      student: students[1] ? getDisplayName(students[1]) : "Jordan Kim",
      text: "Off-task during instruction",
      type: "incident",
    },
    {
      student: students[2] ? getDisplayName(students[2]) : "Sam Chen",
      text: "Helped classmate understand concept",
      type: "praise",
    },
  ]);

  // Initialize attendance for this class — load from localStorage, fall back to null
  useEffect(() => {
    if (!selectedClass) {
      setAttendance(
        students.map((s) => ({ studentId: s.studentId, status: null })),
      );
      return;
    }
    const saved = loadTodayAttendance(selectedClass);
    setAttendance(
      students.map((s) => ({
        studentId: s.studentId,
        status: saved[s.studentId] ?? null,
      })),
    );
  }, [students, selectedClass]);

  const setStatus = (studentId: string, status: AttendanceStatusType) => {
    setAttendance((prev) =>
      prev.map((a) => (a.studentId === studentId ? { ...a, status } : a)),
    );
    if (selectedClass)
      persistAttendanceRecord(selectedClass, studentId, status);
  };

  const markAllPresent = () => {
    setAttendance(
      students.map((s) => ({ studentId: s.studentId, status: "present" })),
    );
    if (selectedClass) {
      for (const s of students)
        persistAttendanceRecord(selectedClass, s.studentId, "present");
    }
  };

  const summary = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    tardy: attendance.filter((a) => a.status === "tardy").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    unmarked: attendance.filter((a) => a.status === null).length,
  };

  // Real data hooks for briefing strip
  const { data: behaviorLogs = [] } = useBehaviorLogs();
  const { data: allAssignments = [] } = useAllAssignments();
  const { data: allAssessments = [] } = useAllAssessments();

  if (!selectedClass) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="classes.today.empty_state"
      >
        <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No class selected</p>
        <p className="text-sm mt-1">
          Choose a class from the dropdown above to take attendance
        </p>
      </div>
    );
  }

  // Morning briefing: count items due in the next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const dueThisWeek =
    allAssignments.filter((a) => {
      if (!a.dueDate) return false;
      const d = new Date(a.dueDate);
      return d >= today && d <= weekFromNow;
    }).length +
    allAssessments.filter((a) => {
      if (!a.dueDate) return false;
      const d = new Date(a.dueDate);
      return d >= today && d <= weekFromNow;
    }).length;

  // Open follow-ups: behavior incidents with followUpNeeded = true
  const openFollowUps = behaviorLogs.filter(
    (log) => log.entryType === BehaviorEntryType.incident && log.followUpNeeded,
  ).length;

  // At-risk: students flagged by combined risk score (same formula as Analytics, including SEN/IEP/504)
  const atRisk = students.filter((s) => {
    const name = getDisplayName(s);
    const incidentCount = behaviorLogs.filter(
      (log) =>
        log.entryType === BehaviorEntryType.incident &&
        log.studentName === name,
    ).length;
    const baseScore = computeRiskScore(incidentCount, null, false);
    const hasSupportPlan =
      s.senPlan &&
      s.senPlan.planType !== SENPlanType.none &&
      s.senPlan.planType !== undefined;
    const score = Math.min(100, baseScore + (hasSupportPlan ? 15 : 0));
    return score >= AT_RISK_THRESHOLD;
  }).length;

  // Timetable: current and next period
  const timetable = loadTimetable();
  const { current: currentPeriod, next: nextPeriod } =
    getCurrentAndNextPeriod(timetable);

  // First period of the day for "school day starts at" fallback
  const firstPeriod =
    timetable.periods.length > 0
      ? [...timetable.periods].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        )[0]
      : null;

  return (
    <div className="space-y-5">
      {/* View Switcher Pill Tabs */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5 self-start">
        {(["today", "thisweek", "snapshot"] as TodayViewMode[]).map((v) => {
          const labels: Record<TodayViewMode, string> = {
            today: "Today",
            thisweek: "This Week",
            snapshot: "Class Snapshot",
          };
          return (
            <button
              key={v}
              type="button"
              onClick={() => setTodayView(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${todayView === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-ocid={`classes.today.${v}.tab`}
            >
              {labels[v]}
            </button>
          );
        })}
      </div>

      {/* Morning Briefing Strip */}
      <div
        className="flex items-center gap-6 px-4 py-2.5 rounded-lg bg-muted/40 border border-border/60 flex-wrap"
        data-ocid="classes.today.briefing.section"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarCheck className="h-4 w-4 text-primary/70 flex-shrink-0" />
          <span className="font-semibold text-foreground">{dueThisWeek}</span>
          <span>due this week</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
          <span className="font-semibold text-foreground">{openFollowUps}</span>
          <span>open follow-ups</span>
        </div>
        <div className="w-px h-4 bg-border hidden sm:block" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserX className="h-4 w-4 text-destructive/70 flex-shrink-0" />
          <span className="font-semibold text-foreground">{atRisk}</span>
          <span>at-risk</span>
        </div>
        {!(currentPeriod || nextPeriod || firstPeriod) && (
          <>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <button
              type="button"
              onClick={() => {
                const event = new CustomEvent("navigate-to", {
                  detail: "timetable",
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
              data-ocid="classes.timetable.setup.button"
            >
              <span>Set up your timetable →</span>
            </button>
          </>
        )}
        {(currentPeriod || nextPeriod || firstPeriod) && (
          <>
            <div className="w-px h-4 bg-border hidden sm:block" />
            {currentPeriod ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-success inline-block flex-shrink-0 animate-pulse" />
                <span className="text-muted-foreground text-xs">Now:</span>
                <span className="font-semibold text-foreground">
                  {currentPeriod.name}
                  {currentPeriod.courseName
                    ? ` — ${currentPeriod.courseName}`
                    : ""}
                </span>
                {currentPeriod.room && (
                  <span className="text-muted-foreground text-xs">
                    · {currentPeriod.room}
                  </span>
                )}
              </div>
            ) : nextPeriod ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block flex-shrink-0" />
                <span>No class now</span>
              </div>
            ) : firstPeriod ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block flex-shrink-0" />
                <span>
                  School day starts at{" "}
                  <span className="font-medium text-foreground">
                    {firstPeriod.startTime}
                  </span>
                </span>
              </div>
            ) : null}
            {nextPeriod && (
              <>
                <div className="w-px h-4 bg-border hidden sm:block" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  <span>
                    Next:{" "}
                    <span className="font-medium text-foreground">
                      {nextPeriod.name}
                      {nextPeriod.courseName
                        ? ` — ${nextPeriod.courseName}`
                        : ""}
                    </span>
                    <span className="text-xs ml-1">
                      at {nextPeriod.startTime}
                    </span>
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Today View Content */}
      {todayView === "today" && (
        <div className="space-y-5">
          {/* Attendance Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Present",
                count: summary.present,
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                label: "Absent",
                count: summary.absent,
                color: "text-destructive",
                bg: "bg-destructive/10",
              },
              {
                label: "Tardy",
                count: summary.tardy,
                color: "text-warning",
                bg: "bg-warning/10",
              },
              {
                label: "Excused",
                count: summary.excused,
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
            ].map((stat) => (
              <Card key={stat.label} className="border-border shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Check className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${stat.color}`}>
                        {stat.count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attendance Table */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Attendance — {format(new Date(), "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {summary.unmarked > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {summary.unmarked} unmarked
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllPresent}
                    className="gap-1.5 h-8 text-xs"
                    data-ocid="classes.today.primary_button"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark All Present
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              {students.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="classes.today.roster.empty_state"
                >
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No students in this class yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {students.map((student, i) => {
                    const att = attendance.find(
                      (a) => a.studentId === student.studentId,
                    );
                    const status = att?.status ?? null;
                    return (
                      <div
                        key={student.studentId}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                        data-ocid={`classes.attendance.row.${i + 1}`}
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {getInitials(student)}
                        </div>
                        {/* Name */}
                        <span className="flex-1 text-sm font-medium text-foreground">
                          {getDisplayName(student)}
                        </span>
                        {/* Status badge */}
                        {status && (
                          <Badge
                            variant="outline"
                            className={`text-xs mr-2 ${
                              status === "present"
                                ? "bg-success/10 text-success border-success/30"
                                : status === "absent"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : status === "tardy"
                                    ? "bg-warning/10 text-warning border-warning/30"
                                    : "bg-blue-100 text-blue-600 border-blue-200"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        )}
                        {/* Buttons */}
                        <div className="flex items-center gap-1">
                          {(
                            [
                              {
                                s: "present",
                                label: "P",
                                className:
                                  "hover:bg-success/20 hover:text-success hover:border-success/40",
                                activeClass:
                                  "bg-success/20 text-success border-success/40",
                              },
                              {
                                s: "absent",
                                label: "A",
                                className:
                                  "hover:bg-destructive/20 hover:text-destructive hover:border-destructive/40",
                                activeClass:
                                  "bg-destructive/20 text-destructive border-destructive/40",
                              },
                              {
                                s: "tardy",
                                label: "T",
                                className:
                                  "hover:bg-warning/20 hover:text-warning hover:border-warning/40",
                                activeClass:
                                  "bg-warning/20 text-warning border-warning/40",
                              },
                              {
                                s: "excused",
                                label: "E",
                                className:
                                  "hover:bg-blue-100 hover:text-blue-600 hover:border-blue-300",
                                activeClass:
                                  "bg-blue-100 text-blue-600 border-blue-300",
                              },
                            ] as const
                          ).map(({ s, label, className, activeClass }) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setStatus(
                                  student.studentId,
                                  status === s ? null : s,
                                )
                              }
                              className={`w-7 h-7 rounded-md border text-xs font-semibold transition-all ${
                                status === s
                                  ? activeClass
                                  : `border-border text-muted-foreground ${className}`
                              }`}
                              aria-label={`Mark ${getDisplayName(student)} as ${s}`}
                              data-ocid={`classes.attendance.${s}.${i + 1}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Behavior */}
          {recentBehavior.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Recent Behavior — This Class
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {recentBehavior.map((entry, i) => (
                    <div
                      key={`${entry.student}-${i}`}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/30"
                      data-ocid={`classes.behavior.item.${i + 1}`}
                    >
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 mt-0.5 ${
                          entry.type === "praise"
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }`}
                      >
                        {entry.type === "praise" ? "Praise" : "Incident"}
                      </Badge>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-foreground">
                          {entry.student}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* This Week View */}
      {todayView === "thisweek" && (
        <ThisWeekView
          allAssignments={allAssignments}
          allAssessments={allAssessments}
          attendance={attendance}
          students={students}
        />
      )}

      {/* Snapshot View */}
      {todayView === "snapshot" && (
        <ClassSnapshotView
          students={students}
          behaviorLogs={behaviorLogs}
          selectedClass={selectedClass}
          grades={[]}
        />
      )}
    </div>
  );
}

// ─── This Week View ───────────────────────────────────────────────────────────

function ThisWeekView({
  allAssignments,
  allAssessments,
  attendance,
  students,
}: {
  allAssignments: { title?: string; dueDate?: string }[];
  allAssessments: { title?: string; dueDate?: string }[];
  attendance: StudentAttendance[];
  students: Student[];
}) {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  const itemsForDay = (day: Date) => {
    const items: { title: string; type: "assignment" | "assessment" }[] = [];
    for (const a of allAssignments) {
      if (a.dueDate && isSameDay(new Date(a.dueDate), day)) {
        items.push({ title: a.title ?? "Untitled", type: "assignment" });
      }
    }
    for (const a of allAssessments) {
      if (a.dueDate && isSameDay(new Date(a.dueDate), day)) {
        items.push({ title: a.title ?? "Untitled", type: "assessment" });
      }
    }
    return items;
  };

  const present = attendance.filter((a) => a.status === "present").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const tardy = attendance.filter((a) => a.status === "tardy").length;

  return (
    <div className="space-y-5">
      {/* Attendance summary */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-muted/40 border border-border/60">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          This Week Attendance
        </span>
        <span className="text-xs text-success font-medium">
          {present} Present
        </span>
        <span className="text-xs text-destructive font-medium">
          {absent} Absent
        </span>
        <span className="text-xs text-warning font-medium">{tardy} Tardy</span>
        <span className="text-xs text-muted-foreground">
          / {students.length} students
        </span>
      </div>

      {/* Weekly calendar grid */}
      <div className="grid grid-cols-5 gap-3">
        {days.map((day) => {
          const items = itemsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`rounded-lg border p-3 space-y-2 ${isToday ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card"}`}
              data-ocid="classes.week.day.panel"
            >
              <div className="flex items-baseline justify-between">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}
                >
                  {format(day, "EEE")}
                </span>
                <span
                  className={`text-lg font-bold tabular-nums leading-none ${isToday ? "text-primary" : "text-foreground/50"}`}
                >
                  {format(day, "d")}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50 italic">
                  No items due
                </p>
              ) : (
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: items have no unique id
                      key={idx}
                      className={`text-[10px] px-2 py-1 rounded font-medium truncate ${item.type === "assessment" ? "bg-amber-50 text-amber-700 border border-amber-200/60" : "bg-blue-50 text-blue-700 border border-blue-200/60"}`}
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Class Snapshot View ──────────────────────────────────────────────────────

function ClassSnapshotView({
  students,
  behaviorLogs,
  selectedClass,
  grades: _grades,
}: {
  students: Student[];
  behaviorLogs: import("../backend").BehaviorLog[];
  selectedClass: string;
  grades: { studentId: string; score: number | null }[];
}) {
  if (students.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="classes.snapshot.empty_state"
      >
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No students in this class</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      data-ocid="classes.snapshot.table"
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Student
            </th>
            <th className="text-center px-3 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Attendance
            </th>
            <th className="text-center px-3 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Behavior
            </th>
            <th className="text-center px-3 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Risk
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => {
            const name = getDisplayName(student);
            const incidentCount = behaviorLogs.filter(
              (log) =>
                log.entryType === BehaviorEntryType.incident &&
                log.studentName === name,
            ).length;
            const baseRisk = computeRiskScore(incidentCount, null, false);
            const hasSupportPlan =
              student.senPlan &&
              student.senPlan.planType !== SENPlanType.none &&
              student.senPlan.planType !== undefined;
            const riskScore = Math.min(
              100,
              baseRisk + (hasSupportPlan ? 15 : 0),
            );
            const isAtRisk = riskScore >= AT_RISK_THRESHOLD;
            const last5Days = loadLast5DaysAttendance(
              selectedClass,
              student.studentId,
            );

            return (
              <tr
                key={student.studentId}
                className={`border-b border-border/30 ${i % 2 === 1 ? "bg-muted/20" : ""} hover:bg-muted/30 transition-colors`}
                data-ocid={`classes.snapshot.row.${i + 1}`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                      {getInitials(student)}
                    </div>
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                </td>
                <td className="text-center px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    {last5Days.map((dayStatus, di) => {
                      const dotColor =
                        dayStatus === "present"
                          ? "bg-success"
                          : dayStatus === "absent"
                            ? "bg-destructive"
                            : dayStatus === "tardy"
                              ? "bg-warning"
                              : dayStatus === "excused"
                                ? "bg-info"
                                : "bg-muted-foreground/20";
                      const dayLabel = ["Mon", "Tue", "Wed", "Thu", "Fri"][di];
                      return (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5 dots
                          key={di}
                          className={`w-2 h-2 rounded-full ${dotColor}`}
                          title={
                            dayStatus
                              ? `${dayLabel}: ${dayStatus}`
                              : `${dayLabel}: no record`
                          }
                        />
                      );
                    })}
                  </div>
                </td>
                <td className="text-center px-3 py-2.5">
                  {incidentCount > 0 ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                      {incidentCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </td>
                <td className="text-center px-3 py-2.5">
                  {isAtRisk ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      At Risk
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Gradebook Tab ────────────────────────────────────────────────────────────

function GradebookTab({
  selectedCourseId,
  courseName,
  students,
}: {
  selectedCourseId: number | null;
  courseName: string;
  students: Student[];
}) {
  // Load assignments from curriculum store for the selected course
  const { data: allCurriculumAssignments = [] } = useAllAssignments();
  const { data: allCurriculumAssessments = [] } = useAllAssessments();

  // Map curriculum assignments/assessments into the local ClassAssignment shape
  const curriculumAssignments = useMemo<ClassAssignment[]>(() => {
    if (selectedCourseId === null) return [];
    const fromAssignments: ClassAssignment[] = allCurriculumAssignments
      .filter((a) => a.courseId === selectedCourseId)
      .map((a) => ({
        id: a.id,
        name: a.title,
        dueDate: a.dueDate || format(new Date(), "yyyy-MM-dd"),
        pointsPossible: a.points ?? a.pointsPossible ?? 100,
        type: a.assignmentType,
      }));
    const fromAssessments: ClassAssignment[] = allCurriculumAssessments
      .filter((a) => a.courseId === selectedCourseId)
      .map((a) => ({
        id: a.id + 100000, // offset to avoid collision with assignment IDs
        name: a.title,
        dueDate: a.dueDate || format(new Date(), "yyyy-MM-dd"),
        pointsPossible: a.totalPoints ?? 100,
        type: a.assessmentType,
      }));
    return [...fromAssignments, ...fromAssessments].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [selectedCourseId, allCurriculumAssignments, allCurriculumAssessments]);

  // Manually-added gradebook-only assignments (not from curriculum)
  const [localAssignments, setLocalAssignments] = useState<ClassAssignment[]>(
    [],
  );

  // Combined: curriculum assignments + locally added ones
  const assignments = useMemo<ClassAssignment[]>(
    () => [...curriculumAssignments, ...localAssignments],
    [curriculumAssignments, localAssignments],
  );

  // ─── Grade state (persisted to localStorage) ────────────────────────────────
  // gradeStore: { [courseId]: { [studentId]: { [assignmentId]: score } } }
  const [gradeStore, setGradeStore] = useState<GradeStore>(() =>
    loadGradesFromStorage(),
  );

  // Debounced persistence
  const persistTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistGrades = (store: GradeStore) => {
    if (persistTimeout.current) clearTimeout(persistTimeout.current);
    persistTimeout.current = setTimeout(() => saveGradesToStorage(store), 500);
  };

  // Derive flat GradeEntry[] from gradeStore for the current course
  const grades = useMemo<GradeEntry[]>(() => {
    if (selectedCourseId === null) return [];
    const courseGrades = gradeStore[String(selectedCourseId)] ?? {};
    const entries: GradeEntry[] = [];
    for (const [studentId, assignmentMap] of Object.entries(courseGrades)) {
      for (const [assignmentId, score] of Object.entries(assignmentMap)) {
        entries.push({ studentId, assignmentId: Number(assignmentId), score });
      }
    }
    return entries;
  }, [gradeStore, selectedCourseId]);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    studentId: string;
    assignmentId: number;
  } | null>(null);

  // Dynamic assignment types from settings
  const [availableTypes] = useState<string[]>(() => getAssignmentTypes());
  const navigate = useNavigate();

  // Import React ref for debounce
  // (already imported as React at top level)

  // ── Grading scale (loaded once, respects Settings changes between mounts) ───
  const gradingScale = useMemo(() => getGradingScale(), []);

  // ── Grading period switcher ─────────────────────────────────────────────────
  const gradingPeriods = useMemo(() => getGradingPeriods(), []);
  const [activePeriodId, setActivePeriodId] = useState(
    () => getCurrentPeriod().id,
  );

  // ── Grade finalization ────────────────────────────────────────────────────
  const [finalizedPeriods, setFinalizedPeriods] = useState<string[]>(() =>
    getFinalizedPeriods(),
  );
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const isActivePeriodFinalized = finalizedPeriods.includes(activePeriodId);

  function handleFinalizeConfirm() {
    finalizePeriod(activePeriodId);
    setFinalizedPeriods(getFinalizedPeriods());
    setShowFinalizeConfirm(false);
    toast.success(
      `${activePeriod?.label ?? activePeriodId} grades finalized and locked.`,
    );
  }

  // ── Derive active-period assignments ────────────────────────────────────────
  const activePeriod =
    gradingPeriods.find((p) => p.id === activePeriodId) ?? gradingPeriods[0];
  const activePeriodAssignments = useMemo(() => {
    if (!activePeriod) return assignments;
    const start = new Date(activePeriod.startDate);
    const end = new Date(activePeriod.endDate);
    return assignments.filter((a) => {
      const d = new Date(a.dueDate);
      return d >= start && d <= end;
    });
  }, [assignments, activePeriod]);

  // ── Category weights ─────────────────────────────────────────────────────────
  // Unique assignment types present in the full assignment list (for the class)
  const assignmentTypes = useMemo(() => {
    const types = new Set<string>();
    for (const a of assignments) types.add(a.type);
    return Array.from(types);
  }, [assignments]);

  // Use courseId as string key for per-course weights
  const courseKey =
    selectedCourseId !== null ? String(selectedCourseId) : courseName;
  const [categoryWeights, setCategoryWeights] = useState<CategoryWeights>(() =>
    getWeightsForTypes(assignmentTypes, courseKey),
  );

  // Reload weights when assignment types or course changes
  useEffect(() => {
    setCategoryWeights(getWeightsForTypes(assignmentTypes, courseKey));
  }, [assignmentTypes, courseKey]);

  const totalWeight = useMemo(
    () => Object.values(categoryWeights).reduce((s, w) => s + w, 0),
    [categoryWeights],
  );
  const weightsActive = totalWeight > 0;

  // ── Extra credit IDs ────────────────────────────────────────────────────────
  const [extraCreditIds, setExtraCreditIds] = useState<Set<number>>(new Set());

  // ── Drop lowest settings ────────────────────────────────────────────────────
  const [dropLowest, setDropLowest] = useState<Record<string, number>>({});

  // New assignment form state
  const [newAssignment, setNewAssignment] = useState({
    name: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    pointsPossible: 100,
    type: getAssignmentTypes()[0] ?? "Homework",
  });

  // Reset local assignments and extra credit when course changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: setters are stable
  useEffect(() => {
    setLocalAssignments([]);
    setExtraCreditIds(new Set());
    setDropLowest({});
  }, [selectedCourseId]);

  const getGrade = (studentId: string, assignmentId: number): number | null => {
    return (
      grades.find(
        (g) => g.studentId === studentId && g.assignmentId === assignmentId,
      )?.score ?? null
    );
  };

  const setGrade = (
    studentId: string,
    assignmentId: number,
    score: number | null,
  ) => {
    if (selectedCourseId === null) return;
    setGradeStore((prev) => {
      const courseKey = String(selectedCourseId);
      const courseGrades = { ...(prev[courseKey] ?? {}) };
      const studentGrades = { ...(courseGrades[studentId] ?? {}) };
      studentGrades[String(assignmentId)] = score;
      courseGrades[studentId] = studentGrades;
      const next = { ...prev, [courseKey]: courseGrades };
      persistGrades(next);
      return next;
    });
  };

  const getStudentAverage = (studentId: string): number | null => {
    // Use active-period assignments for the average
    const periodTypes = Array.from(
      new Set(activePeriodAssignments.map((a) => a.type)),
    );

    if (periodTypes.length === 0) return null;

    const hasGrades = activePeriodAssignments.some(
      (a) =>
        grades.find((g) => g.studentId === studentId && g.assignmentId === a.id)
          ?.score !== null &&
        grades.find((g) => g.studentId === studentId && g.assignmentId === a.id)
          ?.score !== undefined,
    );
    if (!hasGrades) return null;

    const isEC = (id: number) => extraCreditIds.has(id);

    // ── Weighted path ──────────────────────────────────────────────────────────
    if (weightsActive) {
      let weightedSum = 0;
      let totalUsedWeight = 0;

      for (const type of periodTypes) {
        const w = categoryWeights[type] ?? 0;
        if (w === 0) continue;

        const typeAssignments = activePeriodAssignments.filter(
          (a) => a.type === type,
        );
        const dropN = dropLowest[type] ?? 0;

        const regularAssignments = typeAssignments.filter((a) => !isEC(a.id));
        const gradedRegular = regularAssignments
          .map((a) => ({
            assignment: a,
            score:
              grades.find(
                (g) => g.studentId === studentId && g.assignmentId === a.id,
              )?.score ?? null,
          }))
          .filter((e) => e.score !== null)
          .sort((a, b) => {
            const pctA = (a.score ?? 0) / a.assignment.pointsPossible;
            const pctB = (b.score ?? 0) / b.assignment.pointsPossible;
            return pctA - pctB;
          });

        const kept = gradedRegular.slice(Math.min(dropN, gradedRegular.length));
        if (kept.length === 0) continue;

        let earned = 0;
        let possible = 0;
        for (const e of kept) {
          earned += e.score ?? 0;
          possible += e.assignment.pointsPossible;
        }

        // EC for this type
        for (const a of typeAssignments.filter((x) => isEC(x.id))) {
          const s =
            grades.find(
              (g) => g.studentId === studentId && g.assignmentId === a.id,
            )?.score ?? null;
          if (s !== null) earned += s;
        }

        if (possible > 0) {
          weightedSum += (earned / possible) * 100 * w;
          totalUsedWeight += w;
        }
      }

      return totalUsedWeight === 0
        ? null
        : Math.round(weightedSum / totalUsedWeight);
    }

    // ── Total-points fallback ─────────────────────────────────────────────────
    let totalEarned = 0;
    let totalPossible = 0;

    for (const type of periodTypes) {
      const typeAssignments = activePeriodAssignments.filter(
        (a) => a.type === type,
      );
      const dropN = dropLowest[type] ?? 0;

      const regularAssignments = typeAssignments.filter((a) => !isEC(a.id));
      const gradedRegular = regularAssignments
        .map((a) => ({
          assignment: a,
          score:
            grades.find(
              (g) => g.studentId === studentId && g.assignmentId === a.id,
            )?.score ?? null,
        }))
        .filter((e) => e.score !== null)
        .sort((a, b) => {
          const pctA = (a.score ?? 0) / a.assignment.pointsPossible;
          const pctB = (b.score ?? 0) / b.assignment.pointsPossible;
          return pctA - pctB;
        });

      const kept = gradedRegular.slice(Math.min(dropN, gradedRegular.length));

      for (const e of kept) {
        totalEarned += e.score ?? 0;
        totalPossible += e.assignment.pointsPossible;
      }

      for (const a of typeAssignments.filter((x) => isEC(x.id))) {
        const score =
          grades.find(
            (g) => g.studentId === studentId && g.assignmentId === a.id,
          )?.score ?? null;
        if (score !== null) totalEarned += score;
      }
    }

    return totalPossible === 0
      ? null
      : Math.round((totalEarned / totalPossible) * 100);
  };

  const getAssignmentAverage = (assignmentId: number): number | null => {
    const assignmentGrades = grades.filter(
      (g) => g.assignmentId === assignmentId && g.score !== null,
    );
    if (assignmentGrades.length === 0) return null;
    const avg =
      assignmentGrades.reduce((sum, g) => sum + (g.score ?? 0), 0) /
      assignmentGrades.length;
    const assignment = activePeriodAssignments.find(
      (a) => a.id === assignmentId,
    );
    return Math.round((avg / (assignment?.pointsPossible ?? 100)) * 100);
  };

  const getMissingCount = (studentId: string): number => {
    const today = new Date();
    return activePeriodAssignments.filter((a) => {
      const dueDate = new Date(a.dueDate);
      const isPastDue = dueDate < today;
      const score =
        grades.find((g) => g.studentId === studentId && g.assignmentId === a.id)
          ?.score ?? null;
      return isPastDue && score === null;
    }).length;
  };

  const getGradeTrend = (studentId: string): "up" | "down" | "flat" | null => {
    const entries = grades
      .filter((g) => g.studentId === studentId && g.score !== null)
      .filter((g) =>
        activePeriodAssignments.some((a) => a.id === g.assignmentId),
      )
      .sort((a, b) => {
        const idxA = activePeriodAssignments.findIndex(
          (x) => x.id === a.assignmentId,
        );
        const idxB = activePeriodAssignments.findIndex(
          (x) => x.id === b.assignmentId,
        );
        return idxA - idxB;
      });
    if (entries.length < 2) return null;
    const mid = Math.floor(entries.length / 2);
    const earlier = entries.slice(0, mid);
    const recent = entries.slice(mid);
    const pct = (g: GradeEntry) => {
      const assignment = activePeriodAssignments.find(
        (a) => a.id === g.assignmentId,
      );
      return ((g.score ?? 0) / (assignment?.pointsPossible ?? 100)) * 100;
    };
    const earlierAvg =
      earlier.reduce((sum, g) => sum + pct(g), 0) / earlier.length;
    const recentAvg =
      recent.reduce((sum, g) => sum + pct(g), 0) / recent.length;
    if (recentAvg - earlierAvg >= 5) return "up";
    if (earlierAvg - recentAvg >= 5) return "down";
    return "flat";
  };

  const handleAddAssignment = () => {
    if (!newAssignment.name.trim()) return;
    const id = Date.now();
    setLocalAssignments((prev) => [
      ...prev,
      {
        id,
        name: newAssignment.name.trim(),
        dueDate: newAssignment.dueDate,
        pointsPossible: newAssignment.pointsPossible,
        type: newAssignment.type,
      },
    ]);
    setNewAssignment({
      name: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      pointsPossible: 100,
      type: availableTypes[0] ?? "Homework",
    });
    setShowAddAssignment(false);
  };

  const deleteAssignment = (id: number) => {
    // Only local assignments can be deleted from here; curriculum assignments
    // should be managed in the Curriculum module.
    setLocalAssignments((prev) => prev.filter((a) => a.id !== id));
    if (selectedCourseId !== null) {
      setGradeStore((prev) => {
        const courseKey = String(selectedCourseId);
        const courseGrades = { ...(prev[courseKey] ?? {}) };
        for (const studentId of Object.keys(courseGrades)) {
          const sg = { ...courseGrades[studentId] };
          delete sg[String(id)];
          courseGrades[studentId] = sg;
        }
        const next = { ...prev, [courseKey]: courseGrades };
        persistGrades(next);
        return next;
      });
    }
  };

  if (selectedCourseId === null) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="classes.gradebook.empty_state"
      >
        <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No course selected</p>
        <p className="text-sm mt-1">
          Choose a course from the dropdown above to view the gradebook
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Course assignments prompt when no assignments in curriculum */}
      {assignments.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
          <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm text-primary/80 flex-1">
            No assignments for{" "}
            <span className="font-semibold">{courseName}</span> yet. Add
            assignments in{" "}
            <button
              type="button"
              onClick={() => navigate({ to: "/curriculum" })}
              className="underline underline-offset-2 font-semibold hover:text-primary transition-colors"
            >
              Curriculum
            </button>{" "}
            to populate the gradebook automatically — or add manually below.
          </p>
        </div>
      )}
      {/* Grading Period Switcher + Weighted Badge + Finalize */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Grading Period:
        </span>
        <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5">
          {gradingPeriods.map((p) => {
            const isFinalized = finalizedPeriods.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePeriodId(p.id);
                  setShowFinalizeConfirm(false);
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activePeriodId === p.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`classes.gradebook.period.${p.id}.toggle`}
              >
                {isFinalized && <Lock className="h-2.5 w-2.5 text-amber-600" />}
                {p.label}
              </button>
            );
          })}
        </div>
        {isActivePeriodFinalized && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              backgroundColor: "oklch(0.97 0.04 75)",
              color: "oklch(0.45 0.14 75)",
              borderColor: "oklch(0.82 0.12 75)",
            }}
            data-ocid="classes.gradebook.finalized_badge"
          >
            <Lock className="h-2.5 w-2.5" />
            Finalized
          </span>
        )}
        {weightsActive && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
            data-ocid="classes.gradebook.weighted_badge"
          >
            <Scale className="h-2.5 w-2.5" />
            Weighted
          </span>
        )}
        {!isActivePeriodFinalized && (
          <button
            type="button"
            onClick={() => setShowFinalizeConfirm((v) => !v)}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-700 transition-colors px-3 py-1.5 rounded-md hover:bg-amber-50 border border-transparent hover:border-amber-200"
            data-ocid="classes.gradebook.finalize.button"
          >
            <Lock className="h-3 w-3" />
            Finalize {activePeriod?.label} Grades
          </button>
        )}
      </div>

      {/* Finalize confirmation banner */}
      {showFinalizeConfirm && !isActivePeriodFinalized && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
          style={{
            backgroundColor: "oklch(0.98 0.04 75)",
            borderColor: "oklch(0.82 0.12 75)",
            color: "oklch(0.35 0.14 75)",
          }}
          data-ocid="classes.gradebook.finalize_confirm.panel"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p className="flex-1 font-medium">
            This will lock {activePeriod?.label} grades. Grades cannot be edited
            after finalization. Continue?
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white border-0"
              onClick={handleFinalizeConfirm}
              data-ocid="classes.gradebook.finalize.confirm_button"
            >
              <Lock className="h-3 w-3" /> Lock Grades
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowFinalizeConfirm(false)}
              data-ocid="classes.gradebook.finalize.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add Assignment Form */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart2 className="h-4 w-4" />
          <span className="font-medium">
            {activePeriodAssignments.length} assignment
            {activePeriodAssignments.length !== 1 ? "s" : ""} in{" "}
            {activePeriod?.label ?? "this period"}
            {(() => {
              // Show a breakdown by type for the top 3 most common types
              const typeCounts: Record<string, number> = {};
              for (const a of activePeriodAssignments) {
                typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
              }
              return Object.entries(typeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([type, count]) => (
                  <span key={type}>
                    {" "}
                    · {count} {type.toLowerCase()}
                    {count !== 1 ? "s" : ""}
                  </span>
                ));
            })()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="gap-1.5 text-muted-foreground"
                data-ocid="classes.gradebook.print_button"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Print gradebook
            </TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            variant={showAddAssignment ? "outline" : "default"}
            onClick={() => setShowAddAssignment((v) => !v)}
            className="gap-1.5"
            data-ocid="classes.gradebook.primary_button"
          >
            {showAddAssignment ? (
              <>
                <X className="h-3.5 w-3.5" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Add Assignment
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Inline Add Assignment Form */}
      {showAddAssignment && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-primary">
              New Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assignment Name
                </Label>
                <Input
                  value={newAssignment.name}
                  onChange={(e) =>
                    setNewAssignment((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Chapter 5 Quiz"
                  className="h-9"
                  data-ocid="classes.assignment.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) =>
                    setNewAssignment((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Points Possible
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={newAssignment.pointsPossible}
                  onChange={(e) =>
                    setNewAssignment((p) => ({
                      ...p,
                      pointsPossible: Number(e.target.value),
                    }))
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Type
                </Label>
                <Select
                  value={newAssignment.type}
                  onValueChange={(v) =>
                    setNewAssignment((p) => ({
                      ...p,
                      type: v,
                    }))
                  }
                >
                  <SelectTrigger
                    className="h-9 text-sm"
                    data-ocid="classes.assignment.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-52 overflow-y-auto">
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/settings" })}
                  className="text-[11px] text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors mt-1"
                  data-ocid="classes.gradebook.settings.link"
                >
                  Configure types in Settings →
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddAssignment}
                disabled={!newAssignment.name.trim()}
                data-ocid="classes.assignment.submit_button"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Assignment
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddAssignment(false)}
                data-ocid="classes.assignment.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gradebook Grid */}
      {assignments.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="classes.gradebook.assignments.empty_state"
        >
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm mt-1">
            Add an assignment above to start tracking grades
          </p>
        </div>
      ) : activePeriodAssignments.length === 0 ? (
        <Card className="border-border shadow-sm overflow-hidden">
          <div
            className="py-12 text-center text-muted-foreground"
            data-ocid="classes.gradebook.period.empty_state"
          >
            <CalendarX2 className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">
              No assignments due in this period
            </p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              {activePeriod
                ? `${activePeriod.label}: ${activePeriod.startDate} – ${activePeriod.endDate}`
                : "Switch to another period or add assignments with due dates in this range"}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Type grouping row */}
                {(() => {
                  const groups: {
                    type: string;
                    count: number;
                  }[] = [];
                  for (const a of activePeriodAssignments) {
                    const last = groups[groups.length - 1];
                    if (last && last.type === a.type) {
                      last.count++;
                    } else {
                      groups.push({ type: a.type, count: 1 });
                    }
                  }
                  return (
                    <tr className="border-b border-border/30">
                      {/* Empty cell spanning student name column */}
                      <th className="sticky left-0 bg-background border-r border-border/40 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] min-w-[180px]" />
                      {groups.map((g, idx) => (
                        <th
                          key={`${g.type}-${idx}`}
                          colSpan={g.count}
                          className="px-2 py-1.5 text-center"
                          style={{
                            borderTop: `2px solid ${assignmentTypeBorderHex(g.type)}55`,
                          }}
                        >
                          <span
                            className="text-[10px] font-semibold tracking-wide uppercase"
                            style={{ color: assignmentTypeBorderHex(g.type) }}
                          >
                            {g.type}
                          </span>
                        </th>
                      ))}
                      {/* Empty cell spanning Average column */}
                      <th className="min-w-[90px]" />
                    </tr>
                  );
                })()}
                <tr className="border-b border-border/60 bg-background">
                  <th className="sticky left-0 z-10 bg-muted/5 text-left px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-widest min-w-[200px] border-r border-border/40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    Student
                  </th>
                  {activePeriodAssignments.map((a) => {
                    const isEC = extraCreditIds.has(a.id);
                    const manyAssignments = activePeriodAssignments.length > 6;
                    return (
                      <th
                        key={a.id}
                        className={`text-center py-2 font-medium text-foreground group border-r border-border/20 last:border-r-0 ${manyAssignments ? "min-w-[60px] px-0" : "min-w-[80px] px-1"}`}
                        style={manyAssignments ? { paddingTop: "40px" } : {}}
                      >
                        <div
                          className={`flex flex-col items-center gap-1 ${manyAssignments ? "" : ""}`}
                        >
                          <div
                            className={`flex items-center gap-1 ${manyAssignments ? "w-full justify-center" : ""}`}
                          >
                            <span
                              className={
                                manyAssignments
                                  ? "text-[10px] font-medium text-muted-foreground block"
                                  : "truncate max-w-[80px] text-xs"
                              }
                              style={
                                manyAssignments
                                  ? {
                                      writingMode: "vertical-rl",
                                      transform: "rotate(180deg)",
                                      maxHeight: "80px",
                                      overflow: "hidden",
                                    }
                                  : {}
                              }
                              title={a.name}
                            >
                              {a.name.length > 12
                                ? `${a.name.slice(0, 12)}…`
                                : a.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteAssignment(a.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              aria-label={`Delete assignment ${a.name}`}
                              data-ocid="classes.assignment.delete_button"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          {/* Type badge */}
                          <span
                            className="text-[9px] font-bold px-1 py-0 rounded leading-4 mt-0.5"
                            style={{
                              backgroundColor: `${assignmentTypeBorderHex(a.type)}18`,
                              color: assignmentTypeBorderHex(a.type),
                              border: `1px solid ${assignmentTypeBorderHex(a.type)}40`,
                            }}
                            title={a.type}
                          >
                            {assignmentTypeShortLabel(a.type)}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              /{a.pointsPossible}pts
                            </span>
                            {/* EC toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                setExtraCreditIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(a.id)) next.delete(a.id);
                                  else next.add(a.id);
                                  return next;
                                })
                              }
                              className={`text-[9px] font-bold px-1 py-0 rounded transition-colors leading-tight ${
                                isEC
                                  ? "bg-green-500 text-white"
                                  : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700"
                              }`}
                              title={
                                isEC
                                  ? "Remove extra credit"
                                  : "Mark as extra credit"
                              }
                              data-ocid={`classes.gradebook.ec_toggle.${a.id}`}
                            >
                              +EC
                            </button>
                          </div>
                          {isEC && (
                            <span className="text-[10px] font-semibold text-green-600 bg-green-50 rounded px-1">
                              EC
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="sticky right-0 z-10 text-center px-3 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-widest min-w-[90px] bg-muted/40 border-l border-border/40 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => {
                  const avg = getStudentAverage(student.studentId);
                  return (
                    <tr
                      key={student.studentId}
                      className={`border-b border-border/20 transition-colors ${i % 2 === 1 ? "bg-muted/20" : "bg-background"} hover:bg-primary/5`}
                      data-ocid={`classes.gradebook.row.${i + 1}`}
                    >
                      <td
                        className={`sticky left-0 z-10 px-4 py-1.5 border-r border-border/30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] ${i % 2 === 1 ? "bg-muted/20" : "bg-background"}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                            {getInitials(student)}
                          </div>
                          <span className="font-semibold text-foreground text-xs whitespace-nowrap min-w-[140px]">
                            {getDisplayName(student)}
                          </span>
                          {getMissingCount(student.studentId) > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 flex-shrink-0"
                              title={`${getMissingCount(student.studentId)} missing assignment${getMissingCount(student.studentId) !== 1 ? "s" : ""}`}
                              data-ocid="classes.gradebook.missing_flag"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                              <span className="text-[10px] text-destructive font-medium">
                                {getMissingCount(student.studentId)}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      {activePeriodAssignments.map((a) => {
                        const score = getGrade(student.studentId, a.id);
                        const isEditing =
                          editingCell?.studentId === student.studentId &&
                          editingCell?.assignmentId === a.id;
                        const cellId = `cell-${student.studentId}-${a.id}`;
                        const scorePct =
                          score !== null
                            ? Math.round((score / a.pointsPossible) * 100)
                            : null;
                        return (
                          <td
                            key={a.id}
                            className="text-center px-1 py-0 border-r border-border/20 last:border-r-0"
                          >
                            {isEditing && !isActivePeriodFinalized ? (
                              <input
                                id={cellId}
                                type="number"
                                min={0}
                                max={a.pointsPossible}
                                defaultValue={score ?? ""}
                                ref={(el) => el?.focus()}
                                className="w-full h-8 text-center text-sm border-0 border-b-2 border-primary bg-primary/5 focus:outline-none"
                                onBlur={(e) => {
                                  const val = Number.parseFloat(e.target.value);
                                  setGrade(
                                    student.studentId,
                                    a.id,
                                    Number.isNaN(val)
                                      ? null
                                      : Math.min(val, a.pointsPossible),
                                  );
                                  setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Tab") {
                                    e.preventDefault();
                                    const val = Number.parseFloat(
                                      (e.target as HTMLInputElement).value,
                                    );
                                    setGrade(
                                      student.studentId,
                                      a.id,
                                      Number.isNaN(val)
                                        ? null
                                        : Math.min(val, a.pointsPossible),
                                    );
                                    const currentIdx =
                                      activePeriodAssignments.findIndex(
                                        (x) => x.id === a.id,
                                      );
                                    const nextAssignment =
                                      activePeriodAssignments[currentIdx + 1];
                                    if (nextAssignment) {
                                      setEditingCell({
                                        studentId: student.studentId,
                                        assignmentId: nextAssignment.id,
                                      });
                                    } else {
                                      setEditingCell(null);
                                    }
                                  } else if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = Number.parseFloat(
                                      (e.target as HTMLInputElement).value,
                                    );
                                    setGrade(
                                      student.studentId,
                                      a.id,
                                      Number.isNaN(val)
                                        ? null
                                        : Math.min(val, a.pointsPossible),
                                    );
                                    const currentStudentIdx =
                                      students.findIndex(
                                        (s) =>
                                          s.studentId === student.studentId,
                                      );
                                    const nextStudent =
                                      students[currentStudentIdx + 1];
                                    if (nextStudent) {
                                      setEditingCell({
                                        studentId: nextStudent.studentId,
                                        assignmentId: a.id,
                                      });
                                    } else {
                                      setEditingCell(null);
                                    }
                                  } else if (e.key === "Escape") {
                                    setEditingCell(null);
                                  }
                                }}
                              />
                            ) : (
                              <button
                                type="button"
                                className={`h-8 w-full flex flex-col items-center justify-center transition-colors group relative ${score !== null ? `text-foreground ${gradeCellBg(scorePct)}` : "text-muted-foreground/30"} ${isActivePeriodFinalized ? "cursor-not-allowed opacity-75" : "hover:bg-primary/5 focus-visible:bg-primary/5"}`}
                                onClick={() => {
                                  if (isActivePeriodFinalized) {
                                    toast.info(
                                      "Grades are finalized. Contact admin to make changes.",
                                    );
                                    return;
                                  }
                                  setEditingCell({
                                    studentId: student.studentId,
                                    assignmentId: a.id,
                                  });
                                }}
                                aria-label={`Enter grade for ${getDisplayName(student)}, ${a.name}`}
                              >
                                {score !== null ? (
                                  <>
                                    <span className="text-xs font-medium leading-tight tabular-nums">
                                      {score}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground leading-tight tabular-nums">
                                      {scorePct}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs opacity-0 group-hover:opacity-40 transition-opacity">
                                    +
                                  </span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className={`sticky right-0 z-10 text-center px-3 py-1.5 border-l border-border/30 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.04)] ${i % 2 === 1 ? "bg-muted/40" : "bg-muted/20"}`}
                      >
                        {avg !== null ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-0.5">
                              <span
                                className={`text-sm font-semibold ${
                                  avg >= 90
                                    ? "text-success"
                                    : avg >= 70
                                      ? "text-warning"
                                      : "text-destructive"
                                }`}
                              >
                                {avg}%
                              </span>
                              {(() => {
                                const trend = getGradeTrend(student.studentId);
                                if (trend === "up")
                                  return (
                                    <TrendingUp
                                      className="h-3 w-3 text-success"
                                      data-ocid="classes.gradebook.trend_indicator"
                                    />
                                  );
                                if (trend === "down")
                                  return (
                                    <TrendingDown
                                      className="h-3 w-3 text-destructive"
                                      data-ocid="classes.gradebook.trend_indicator"
                                    />
                                  );
                                if (trend === "flat")
                                  return (
                                    <Minus
                                      className="h-3 w-3 text-muted-foreground"
                                      data-ocid="classes.gradebook.trend_indicator"
                                    />
                                  );
                                return null;
                              })()}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {getLetterGradeFromScale(avg, gradingScale)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Averages Row + Category Weight Summary */}
              <tfoot>
                <tr className="border-t border-border/60 bg-muted/20">
                  <td className="sticky left-0 z-10 bg-muted/20 px-4 py-2.5 border-r border-border/30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      Class Avg
                    </span>
                  </td>
                  {activePeriodAssignments.map((a) => {
                    const avg = getAssignmentAverage(a.id);
                    return (
                      <td key={a.id} className="text-center px-3 py-2">
                        {avg !== null ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xs font-semibold ${
                                avg >= 90
                                  ? "text-success"
                                  : avg >= 70
                                    ? "text-warning"
                                    : "text-destructive"
                              }`}
                            >
                              {avg}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td />
                </tr>
                {/* Category weight summary row */}
                {weightsActive &&
                  (() => {
                    // Compute category averages for each assignment type group
                    const typeGroups: Record<string, number[]> = {};
                    for (const a of activePeriodAssignments) {
                      const avg = getAssignmentAverage(a.id);
                      if (avg !== null) {
                        if (!typeGroups[a.type]) typeGroups[a.type] = [];
                        typeGroups[a.type].push(avg);
                      }
                    }
                    const uniqueTypes = [
                      ...new Set(activePeriodAssignments.map((a) => a.type)),
                    ];
                    if (uniqueTypes.length === 0) return null;
                    return (
                      <tr className="border-t-2 border-primary/20 bg-primary/5">
                        <td className="sticky left-0 z-10 bg-primary/5 px-4 py-2 border-r border-border/30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                            Category Weights
                          </span>
                        </td>
                        <td
                          colSpan={activePeriodAssignments.length}
                          className="px-3 py-2"
                        >
                          <div className="flex flex-wrap gap-2">
                            {uniqueTypes.map((type) => {
                              const weight = categoryWeights[type];
                              const avgs = typeGroups[type] ?? [];
                              const catAvg =
                                avgs.length > 0
                                  ? Math.round(
                                      avgs.reduce((s, v) => s + v, 0) /
                                        avgs.length,
                                    )
                                  : null;
                              return (
                                <span
                                  key={type}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                                  style={{
                                    backgroundColor: `${assignmentTypeBorderHex(type)}12`,
                                    borderColor: `${assignmentTypeBorderHex(type)}40`,
                                    color: assignmentTypeBorderHex(type),
                                  }}
                                >
                                  {type}
                                  {weight != null && weight > 0 && (
                                    <span className="opacity-70">
                                      {weight}%
                                    </span>
                                  )}
                                  {catAvg !== null && (
                                    <span className="font-bold ml-0.5">
                                      · {catAvg}%
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td />
                      </tr>
                    );
                  })()}
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2 bg-muted/5 border-t border-border/40">
            <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
              <Info className="h-3 w-3" />
              Click a cell to enter a grade.{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
                Tab
              </kbd>{" "}
              moves to the next assignment ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
                Enter
              </kbd>{" "}
              moves to the next student ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">
                Esc
              </kbd>{" "}
              to cancel ·{" "}
              <AlertTriangle className="h-3 w-3 text-amber-500 inline" />{" "}
              missing work · colored arrows = grade trend
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Roster Tab ───────────────────────────────────────────────────────────────

function RosterTab({
  selectedClass,
  students,
  allStudents,
  onAddStudent,
  onRemoveStudent,
}: {
  selectedClass: string;
  students: Student[];
  allStudents: Student[];
  onAddStudent: (studentId: string) => void;
  onRemoveStudent: (studentId: string) => void;
}) {
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState("");

  const studentsNotInClass = allStudents.filter(
    (s) => !students.find((cs) => cs.studentId === s.studentId),
  );

  if (!selectedClass) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="classes.roster.empty_state"
      >
        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No class selected</p>
        <p className="text-sm mt-1">
          Choose a class from the dropdown above to view the roster
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="font-medium">
            {students.length} student{students.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          size="sm"
          variant={showAddStudent ? "outline" : "default"}
          onClick={() => setShowAddStudent((v) => !v)}
          className="gap-1.5"
          data-ocid="classes.roster.primary_button"
        >
          {showAddStudent ? (
            <>
              <X className="h-3.5 w-3.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> Add Student
            </>
          )}
        </Button>
      </div>

      {/* Inline add student form */}
      {showAddStudent && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add Student to {selectedClass}
                </Label>
                <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                  <SelectTrigger
                    className="h-9 text-sm"
                    data-ocid="classes.roster.student.select"
                  >
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {studentsNotInClass.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        All students are already enrolled
                      </SelectItem>
                    ) : (
                      studentsNotInClass.map((s) => (
                        <SelectItem key={s.studentId} value={s.studentId}>
                          {getDisplayName(s)} — Grade {s.gradeLevel}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                disabled={!selectedToAdd || selectedToAdd === "__none__"}
                onClick={() => {
                  if (selectedToAdd) {
                    onAddStudent(selectedToAdd);
                    setSelectedToAdd("");
                    setShowAddStudent(false);
                  }
                }}
                data-ocid="classes.roster.add_student.button"
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      {students.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="py-12 text-center">
            <div
              className="text-muted-foreground"
              data-ocid="classes.roster.students.empty_state"
            >
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No students enrolled</p>
              <p className="text-sm mt-1">
                Add students to this class using the button above
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border/50">
            {students.map((student, i) => (
              <div
                key={student.studentId}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
                data-ocid={`classes.roster.item.${i + 1}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {getInitials(student)}
                </div>
                {/* Name + Grade */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {getDisplayName(student)}
                    </span>
                    {student.preferredName && (
                      <span className="text-xs text-muted-foreground">
                        (legal: {student.givenNames})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Grade {student.gradeLevel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID: {student.studentId}
                    </span>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {student.accommodations.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <BookOpen className="h-2.5 w-2.5 mr-1" />
                      IEP/504
                    </Badge>
                  )}
                  {student.allergies.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0 bg-amber-100 text-amber-700 border-amber-200"
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                      Allergy
                    </Badge>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onRemoveStudent(student.studentId)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${getDisplayName(student)} from class`}
                    data-ocid={`classes.roster.delete_button.${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Main Classes Page ────────────────────────────────────────────────────────

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  courses,
  enrollment,
  allStudents,
  allCurriculumAssignments,
  onSelectCourse,
}: {
  courses: Course[];
  enrollment: Record<string, string[]>;
  allStudents: import("../backend").Student[];
  allCurriculumAssignments: { courseId?: number; dueDate?: string }[];
  onSelectCourse: (courseId: number) => void;
}) {
  const timetable = loadTimetable();
  const { current: currentPeriod, next: nextPeriod } =
    getCurrentAndNextPeriod(timetable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const currentGradingPeriod = useMemo(() => getCurrentPeriod(), []);

  // Load grade averages per course from persisted gradebook data
  const gradeAverages = useMemo(() => {
    const grades = loadGradesFromStorage();
    const averages: Record<number, number | null> = {};
    for (const course of courses) {
      const courseGrades = grades[String(course.id)];
      if (!courseGrades) {
        averages[course.id] = null;
        continue;
      }
      const enrolled = enrollment[String(course.id)] ?? [];
      const allScores: number[] = [];
      for (const studentId of enrolled) {
        const studentGrades = courseGrades[studentId];
        if (!studentGrades) continue;
        for (const score of Object.values(studentGrades)) {
          if (typeof score === "number") allScores.push(score);
        }
      }
      averages[course.id] =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : null;
    }
    return averages;
  }, [courses, enrollment]);

  // Per-course upcoming assignment count from real curriculum data
  const perCourseUpcoming = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const a of allCurriculumAssignments) {
      if (!a.dueDate || a.courseId === undefined) continue;
      const d = new Date(a.dueDate);
      if (d >= today && d <= weekFromNow) {
        counts[a.courseId] = (counts[a.courseId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allCurriculumAssignments, today, weekFromNow]);

  if (courses.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="classes.overview.empty_state"
      >
        <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No courses yet
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Add a course in Curriculum to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-ocid="classes.overview.section">
      {/* Summary strip */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">
          {courses.length} course{courses.length !== 1 ? "s" : ""}
        </span>
        <span className="w-px h-4 bg-border" />
        <span>{allStudents.length} students total</span>
        <span className="w-px h-4 bg-border" />
        <span className="text-primary font-medium">
          {currentGradingPeriod.label}
        </span>
        {(currentPeriod || nextPeriod) && (
          <>
            <span className="w-px h-4 bg-border" />
            {currentPeriod ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                <span className="font-medium text-foreground">
                  {currentPeriod.name}
                  {currentPeriod.courseName
                    ? ` — ${currentPeriod.courseName}`
                    : ""}
                </span>
                <span>active now</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                Next:{" "}
                <span className="font-medium text-foreground">
                  {nextPeriod?.name} at {nextPeriod?.startTime}
                </span>
              </span>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, i) => {
          const enrolled = enrollment[String(course.id)] ?? [];
          const enrollmentCount = enrolled.length;
          const upcomingCount = perCourseUpcoming[course.id] ?? 0;
          return (
            <Card
              key={course.id}
              className="border-border shadow-sm overflow-hidden transition-all hover:shadow-md"
              data-ocid={`classes.overview.item.${i + 1}`}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug truncate">
                      {course.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.subject}
                      {course.gradeBand ? ` · Grade ${course.gradeBand}` : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {(() => {
                  const avg = gradeAverages[course.id];
                  const avgColor =
                    avg === null
                      ? "text-foreground"
                      : avg >= 80
                        ? "text-emerald-600"
                        : avg >= 60
                          ? "text-amber-600"
                          : "text-red-600";
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-foreground tabular-nums">
                          {enrollmentCount}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          students
                        </div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div className="text-base font-bold text-foreground tabular-nums">
                          {upcomingCount}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          due this wk
                        </div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2 text-center">
                        <div
                          className={`text-base font-bold tabular-nums ${avgColor}`}
                        >
                          {avg !== null ? `${Math.round(avg)}%` : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          avg grade
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs font-medium"
                  onClick={() => onSelectCourse(course.id)}
                  data-ocid={`classes.overview.gradebook_button.${i + 1}`}
                >
                  Open Gradebook
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getTabFromSearch(search: unknown): ClassTab {
  const params = new URLSearchParams(String(search ?? ""));
  const tab = params.get("tab");
  if (tab === "gradebook") return "gradebook";
  if (tab === "roster") return "roster";
  return "today";
}

export default function ClassesPage() {
  const routerState = useRouterState();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ClassTab>(() =>
    getTabFromSearch(String(routerState.location.search ?? "")),
  );

  // Use courseId (number) as primary identifier — sourced from Curriculum
  const { data: courses = [], isLoading: coursesLoading } = useGetCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  // Auto-select the first course once courses load
  useEffect(() => {
    if (courses.length > 0 && selectedCourseId === null) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;

  // Enrollment: per-course student IDs, persisted to localStorage
  const [enrollment, setEnrollment] = useState<Record<string, string[]>>(() =>
    loadEnrollmentFromStorage(),
  );

  // Sync tab when URL search changes
  useEffect(() => {
    setActiveTab(getTabFromSearch(String(routerState.location.search ?? "")));
  }, [routerState.location.search]);

  const { data: allStudents = [], isLoading: studentsLoading } =
    useGetAllStudents();
  const { data: allCurriculumAssignments = [] } = useAllAssignments();
  const { data: allCurriculumAssessments = [] } = useAllAssessments();

  // Auto-enroll all students into a course the first time it's opened
  useEffect(() => {
    if (selectedCourseId === null || allStudents.length === 0) return;
    const courseKey = String(selectedCourseId);
    if (enrollment[courseKey] !== undefined) return; // already initialized
    // Default: enroll all students
    const allIds = allStudents.map((s) => s.studentId);
    setEnrollment((prev) => {
      const next = { ...prev, [courseKey]: allIds };
      saveEnrollmentToStorage(next);
      return next;
    });
  }, [selectedCourseId, allStudents, enrollment]);

  const studentsInCourse = useMemo(() => {
    if (selectedCourseId === null) return allStudents;
    const enrolled = enrollment[String(selectedCourseId)] ?? [];
    if (enrolled.length === 0) return [];
    return allStudents.filter((s) => enrolled.includes(s.studentId));
  }, [allStudents, enrollment, selectedCourseId]);

  const handleAddStudent = (studentId: string) => {
    if (selectedCourseId === null) return;
    setEnrollment((prev) => {
      const courseKey = String(selectedCourseId);
      const next = {
        ...prev,
        [courseKey]: [...(prev[courseKey] ?? []), studentId],
      };
      saveEnrollmentToStorage(next);
      return next;
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (selectedCourseId === null) return;
    setEnrollment((prev) => {
      const courseKey = String(selectedCourseId);
      const next = {
        ...prev,
        [courseKey]: (prev[courseKey] ?? []).filter((id) => id !== studentId),
      };
      saveEnrollmentToStorage(next);
      return next;
    });
  };

  const isLoading = coursesLoading || studentsLoading;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5">
        {/* Tab Pills — inline in page content area, never in header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabs
            tabs={[
              {
                value: "today" as const,
                label: "Today's Class",
                icon: <CheckCircle2 size={14} />,
              },
              {
                value: "gradebook" as const,
                label: "Gradebook",
                icon: <BarChart2 size={14} />,
              },
              {
                value: "roster" as const,
                label: "Roster",
                icon: <Users size={14} />,
              },
              {
                value: "overview" as const,
                label: "All Courses",
                icon: <LayoutGrid size={14} />,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex items-center gap-2">
            {/* Only show course selector when not on overview tab */}
            {activeTab !== "overview" &&
              (courses.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/curriculum" })}
                  className="text-xs text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20"
                  data-ocid="classes.curriculum.link"
                >
                  Add a course in Curriculum →
                </button>
              ) : (
                <ClassSelector
                  courses={courses}
                  value={selectedCourseId}
                  onChange={setSelectedCourseId}
                  enrollment={enrollment}
                />
              ))}
            {activeTab === "gradebook" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate({ to: "/settings" })}
                    aria-label="Gradebook settings"
                    data-ocid="classes.gradebook.configure_button"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Gradebook settings
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div
              className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-3"
              data-ocid="classes.loading_state"
            />
            <p className="text-sm">Loading...</p>
          </div>
        ) : activeTab === "today" ? (
          <TodayTab
            selectedClass={selectedCourse?.title ?? ""}
            students={studentsInCourse}
          />
        ) : activeTab === "gradebook" ? (
          <GradebookTab
            selectedCourseId={selectedCourseId}
            courseName={selectedCourse?.title ?? ""}
            students={studentsInCourse}
          />
        ) : activeTab === "overview" ? (
          <OverviewTab
            courses={courses}
            enrollment={enrollment}
            allStudents={allStudents}
            allCurriculumAssignments={[
              ...allCurriculumAssignments,
              ...allCurriculumAssessments,
            ]}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setActiveTab("gradebook");
            }}
          />
        ) : (
          <RosterTab
            selectedClass={selectedCourse?.title ?? ""}
            students={studentsInCourse}
            allStudents={allStudents}
            onAddStudent={handleAddStudent}
            onRemoveStudent={handleRemoveStudent}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
