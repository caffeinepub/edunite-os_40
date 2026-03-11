import { useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  FileText,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import {
  AttendanceStatus,
  BehaviorCategory,
  BehaviorEntryType,
  type BehaviorLog,
  SENPlanType,
} from "../backend";
import { PillTabs } from "../components/shared/PillTabs";
import {
  useAllAssessments,
  useAllAssignments,
  useBehaviorLogs,
  useGetAllStudents,
  useGetCourses,
  useGetModules,
  useGetUnits,
} from "../hooks/useQueries";
import { computeRiskScore } from "../lib/riskScore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekKey(date: Date): string {
  const monday = new Date(date);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(date.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(isoKey: string): string {
  const d = new Date(`${isoKey}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

// ─── Sparkline Data ────────────────────────────────────────────────────────────

function computeSparklineData(
  studentName: string,
  behaviorLogs: BehaviorLog[],
  weekKeys: string[],
): number[] {
  const counts: Record<string, number> = {};
  for (const log of behaviorLogs) {
    if (
      log.studentName === studentName &&
      log.entryType === BehaviorEntryType.incident
    ) {
      const key = getWeekKey(nsToDate(log.loggedAt));
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return weekKeys.map((k) => counts[k] ?? 0);
}

// ─── Trend Direction ──────────────────────────────────────────────────────────

type TrendDirection = "up" | "down" | "stable";

function getTrendDirection(sparklineData: number[]): TrendDirection {
  if (sparklineData.length < 4) return "stable";
  const recent = sparklineData.slice(-2).reduce((a, b) => a + b, 0);
  const prior = sparklineData.slice(-4, -2).reduce((a, b) => a + b, 0);
  if (recent > prior + 0) return "up";
  if (recent < prior) return "down";
  return "stable";
}

// ─── Intervention Recommendations ────────────────────────────────────────────

type InterventionChipType = {
  label: string;
  icon: "MessageSquare" | "Calendar" | "BookOpen" | "FileText";
};

function getInterventionChips(
  incidents: number,
  attendanceRate: number | null,
  hasAttendanceData: boolean,
  gradeAverage: number | null,
  hasSupportPlan: boolean,
): InterventionChipType[] {
  const chips: InterventionChipType[] = [];

  if (incidents >= 3)
    chips.push({ label: "Schedule parent meeting", icon: "MessageSquare" });

  if (hasAttendanceData && attendanceRate !== null && attendanceRate < 85)
    chips.push({ label: "Initiate attendance support plan", icon: "Calendar" });

  if (gradeAverage !== null && gradeAverage < 60)
    chips.push({ label: "Refer to academic support", icon: "BookOpen" });

  if (hasSupportPlan)
    chips.push({ label: "Review support plan", icon: "FileText" });

  return chips.slice(0, 4);
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color = "currentColor",
}: {
  data: number[];
  color?: string;
}) {
  const w = 60;
  const h = 20;
  const maxVal = Math.max(...data, 1);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / maxVal) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── CSS Bar Chart ────────────────────────────────────────────────────────────

interface BarData {
  label: string;
  incidents: number;
  praise: number;
}

function BehaviorBarChart({
  data,
  weekOverWeekDelta,
}: {
  data: BarData[];
  weekOverWeekDelta: number;
}) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.incidents, d.praise)),
    1,
  );

  return (
    <div className="w-full" data-ocid="analytics.behavior_trends.chart_point">
      {/* Week-over-week delta label */}
      {data.length >= 2 && (
        <div className="mb-3">
          {weekOverWeekDelta === 0 ? (
            <span className="text-xs text-muted-foreground">
              Same as last week
            </span>
          ) : weekOverWeekDelta > 0 ? (
            <span className="text-xs font-semibold text-destructive">
              ↑ {weekOverWeekDelta} more incident
              {weekOverWeekDelta !== 1 ? "s" : ""} vs. last week
            </span>
          ) : (
            <span className="text-xs font-semibold text-success">
              ↓ {Math.abs(weekOverWeekDelta)} fewer incident
              {Math.abs(weekOverWeekDelta) !== 1 ? "s" : ""} vs. last week
            </span>
          )}
        </div>
      )}

      <div className="flex items-end gap-1.5 h-36">
        {data.map((week) => (
          <div
            key={week.label}
            className="flex-1 flex flex-col items-center gap-0.5"
          >
            <div className="flex items-end gap-0.5 w-full justify-center h-28">
              {/* Incidents bar */}
              <div
                className="flex-1 bg-destructive/70 rounded-t transition-all duration-300 min-h-[2px]"
                style={{ height: `${(week.incidents / maxVal) * 100}%` }}
                title={`${week.incidents} incidents`}
              />
              {/* Praise bar */}
              <div
                className="flex-1 bg-success/70 rounded-t transition-all duration-300 min-h-[2px]"
                style={{ height: `${(week.praise / maxVal) * 100}%` }}
                title={`${week.praise} praise`}
              />
            </div>
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {week.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/70" />{" "}
          Incidents
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-success/70" />{" "}
          Praise
        </span>
      </div>
    </div>
  );
}

// ─── Horizontal Percentage Bar ────────────────────────────────────────────────

interface AttendanceBarRowProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function AttendanceBarRow({
  label,
  count,
  total,
  color,
}: AttendanceBarRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs text-muted-foreground text-right flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 text-xs text-foreground flex-shrink-0">
        {count} <span className="text-muted-foreground">({pct}%)</span>
      </div>
    </div>
  );
}

// ─── Risk Score Badge ─────────────────────────────────────────────────────────

function RiskScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-destructive text-destructive-foreground"
      : score >= 40
        ? "bg-warning text-warning-foreground"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 ${color}`}
      title={`Risk score: ${score}/100`}
      aria-label={`Risk score ${score} out of 100`}
    >
      {score}
    </span>
  );
}

// ─── Trend Arrow ──────────────────────────────────────────────────────────────

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === "up") {
    return (
      <TrendingUp
        size={14}
        className="text-destructive flex-shrink-0"
        aria-label="Trend worsening"
      />
    );
  }
  if (direction === "down") {
    return (
      <TrendingDown
        size={14}
        className="text-success flex-shrink-0"
        aria-label="Trend improving"
      />
    );
  }
  return (
    <span
      className="text-muted-foreground text-xs flex-shrink-0 font-bold leading-none"
      aria-label="Trend stable"
    >
      —
    </span>
  );
}

// ─── Period Breakdown ────────────────────────────────────────────────────────

interface TimetablePeriod {
  id: string;
  name: string;
}

interface TimetableData {
  periods: TimetablePeriod[];
}

function loadTimetablePeriods(): TimetablePeriod[] {
  try {
    const raw = localStorage.getItem("edunite_timetable");
    if (!raw) return [];
    const data: TimetableData = JSON.parse(raw);
    return data.periods ?? [];
  } catch {
    return [];
  }
}

function PeriodBreakdownSection({
  type,
  behaviorLogs = [],
  students = [],
}: {
  type: "behavior" | "attendance";
  behaviorLogs?: BehaviorLog[];
  students?: import("../backend").Student[];
}) {
  const periods = useMemo(() => loadTimetablePeriods(), []);

  if (periods.length === 0) {
    return (
      <div
        className="bg-card rounded-xl border border-border p-5 shadow-sm"
        data-ocid="analytics.period_breakdown.card"
      >
        <h3 className="font-semibold text-foreground text-sm mb-3">
          {type === "behavior" ? "Incidents by Period" : "Absences by Period"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure your timetable in{" "}
          <span className="text-primary font-medium">Settings → Schedule</span>{" "}
          to see period breakdowns.
        </p>
      </div>
    );
  }

  let rowData: { name: string; count: number }[] = [];

  if (type === "behavior") {
    const counts: Record<string, number> = {};
    for (const log of behaviorLogs) {
      if (log.entryType === BehaviorEntryType.incident && log.context) {
        counts[log.context] = (counts[log.context] ?? 0) + 1;
      }
    }
    rowData = periods.map((p) => ({
      name: p.name,
      count: counts[p.name] ?? 0,
    }));
  } else {
    const absenceCounts: Record<string, number> = {};
    // Attendance records don't have period info directly; show distribution
    // by timetable period based on seed/live attendance records
    const allStudents = students ?? [];
    for (const s of allStudents) {
      for (const r of s.attendanceRecords) {
        // Attendance records have a date; map to a period via timetable if possible
        // For now show even distribution across periods for absences
        if (r.status === "absent") {
          const key = (r as { period?: string }).period ?? "Unknown";
          absenceCounts[key] = (absenceCounts[key] ?? 0) + 1;
        }
      }
    }
    rowData = periods.map((p) => ({
      name: p.name,
      count: absenceCounts[p.name] ?? 0,
    }));
  }

  const maxCount = Math.max(...rowData.map((r) => r.count), 1);

  return (
    <div
      className="bg-card rounded-xl border border-border p-5 shadow-sm"
      data-ocid="analytics.period_breakdown.card"
    >
      <h3 className="font-semibold text-foreground text-sm mb-4">
        {type === "behavior" ? "Incidents by Period" : "Absences by Period"}
      </h3>
      {rowData.every((r) => r.count === 0) ? (
        <p className="text-sm text-muted-foreground py-3">
          No {type === "behavior" ? "incidents" : "absences"} logged yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rowData.map((row, i) => (
            <div
              key={row.name}
              className="flex items-center gap-3"
              data-ocid={`analytics.period_breakdown.item.${i + 1}`}
            >
              <div className="w-20 text-xs text-muted-foreground flex-shrink-0 truncate">
                {row.name}
              </div>
              <div className="flex-1 h-5 bg-muted rounded overflow-hidden flex items-center">
                <div
                  className={`h-full rounded transition-all duration-500 ${type === "behavior" ? "bg-destructive/50" : "bg-warning/60"}`}
                  style={{
                    width: `${Math.max((row.count / maxCount) * 100, row.count > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <div className="w-6 text-xs text-foreground text-right flex-shrink-0 font-medium">
                {row.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const navigate = useNavigate();
  const { data: students = [] } = useGetAllStudents();
  const { data: behaviorLogs = [] } = useBehaviorLogs();
  const { data: courses = [] } = useGetCourses();
  const { data: allUnits = [] } = useGetUnits();
  const { data: allModules = [] } = useGetModules();
  const { data: allAssignments = [] } = useAllAssignments();
  const { data: allAssessments = [] } = useAllAssessments();

  // ─── 8 week keys (used for sparklines + bar chart) ───────────────────────
  const weekKeys = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      keys.push(getWeekKey(d));
    }
    return keys;
  }, []);

  // ─── Attendance stats ────────────────────────────────────────────────────────
  const allAttendanceRecords = useMemo(
    () => students.flatMap((s) => s.attendanceRecords),
    [students],
  );

  const attendanceCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, tardy: 0, excused: 0 };
    for (const r of allAttendanceRecords) {
      if (r.status === AttendanceStatus.present) counts.present++;
      else if (r.status === AttendanceStatus.absent) counts.absent++;
      else if (r.status === AttendanceStatus.tardy) counts.tardy++;
      else if (r.status === AttendanceStatus.excused) counts.excused++;
    }
    return counts;
  }, [allAttendanceRecords]);

  const overallAttendance = useMemo(() => {
    const total = allAttendanceRecords.length;
    if (total === 0) return 0;
    return Math.round((attendanceCounts.present / total) * 100);
  }, [allAttendanceRecords, attendanceCounts]);

  // ─── Behavior stats ──────────────────────────────────────────────────────────
  const totalBehaviorLogs = behaviorLogs.length;
  const incidentLogs = useMemo(
    () =>
      behaviorLogs.filter((l) => l.entryType === BehaviorEntryType.incident),
    [behaviorLogs],
  );

  // Last 8 weeks bar chart
  const behaviorTrends = useMemo<BarData[]>(() => {
    const now = new Date();
    const weeks: BarData[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      weeks.push({
        label: formatWeekLabel(getWeekKey(d)),
        incidents: 0,
        praise: 0,
      });
    }

    for (const log of behaviorLogs) {
      const date = nsToDate(log.loggedAt);
      const key = getWeekKey(date);
      const idx = weekKeys.indexOf(key);
      if (idx >= 0) {
        if (log.entryType === BehaviorEntryType.incident)
          weeks[idx].incidents++;
        else weeks[idx].praise++;
      }
    }
    return weeks;
  }, [behaviorLogs, weekKeys]);

  // Week-over-week incident delta
  const weekOverWeekDelta = useMemo(() => {
    if (behaviorTrends.length < 2) return 0;
    const currentWeek = behaviorTrends[behaviorTrends.length - 1].incidents;
    const prevWeek = behaviorTrends[behaviorTrends.length - 2].incidents;
    return currentWeek - prevWeek;
  }, [behaviorTrends]);

  // Top 3 categories by incident count
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of incidentLogs) {
      const cat = String(log.category);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, count]) => ({
        cat: cat.charAt(0).toUpperCase() + cat.slice(1),
        count,
      }));
  }, [incidentLogs]);

  // Top 3 students by incident count (last 30 days)
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const topStudentsByIncident = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of incidentLogs) {
      const date = nsToDate(log.loggedAt);
      if (date >= thirtyDaysAgo) {
        counts[log.studentName] = (counts[log.studentName] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [incidentLogs, thirtyDaysAgo]);

  // ─── At-Risk Combined Score ──────────────────────────────────────────────────

  // Per-student incident count in last 30 days
  const recentIncidentsByStudent = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of incidentLogs) {
      const date = nsToDate(log.loggedAt);
      if (date >= thirtyDaysAgo) {
        counts[log.studentName] = (counts[log.studentName] ?? 0) + 1;
      }
    }
    return counts;
  }, [incidentLogs, thirtyDaysAgo]);

  // Most common incident category in last 30 days
  const mostCommonIncidentCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const log of incidentLogs) {
      const date = nsToDate(log.loggedAt);
      if (date >= thirtyDaysAgo) {
        const cat = String(log.category);
        cats[cat] = (cats[cat] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    return sorted.length > 0
      ? sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1)
      : null;
  }, [incidentLogs, thirtyDaysAgo]);

  // Per-student attendance rate
  const attendanceByStudent = useMemo(() => {
    const rateMap: Record<string, number> = {};
    for (const student of students) {
      const records = student.attendanceRecords;
      if (records.length === 0) continue;
      const presentCount = records.filter(
        (r) =>
          r.status === AttendanceStatus.present ||
          r.status === AttendanceStatus.excused,
      ).length;
      rateMap[student.preferredName || student.givenNames] = Math.round(
        (presentCount / records.length) * 100,
      );
    }
    return rateMap;
  }, [students]);

  // Per-student open follow-up flag
  // Combined at-risk score: High = 3+ incidents OR < 80% attendance; Medium = 2 incidents OR 80-89%
  type RiskTier = "high" | "medium";
  interface AtRiskStudent {
    name: string;
    tier: RiskTier;
    incidentCount: number;
    attendanceRate: number | null;
    hasAttendanceData: boolean;
    riskScore: number;
    sparklineData: number[];
    trendDirection: TrendDirection;
    interventionChips: InterventionChipType[];
    supportPlanType: string | null;
  }

  // Per-student support plan map
  const supportPlanByStudentName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const student of students) {
      const plan = student.senPlan;
      if (!plan || plan.planType === SENPlanType.none) continue;
      const name = student.preferredName || student.givenNames;
      if (plan.planType === SENPlanType.iep) map[name] = "IEP";
      else if (plan.planType === SENPlanType.plan504) map[name] = "504";
      else if (plan.planType === SENPlanType.sen) map[name] = "SEN";
      else if (plan.planType === SENPlanType.other) map[name] = "Plan";
    }
    return map;
  }, [students]);

  const atRiskStudents = useMemo<AtRiskStudent[]>(() => {
    // Collect all student names from behavior logs + actual students
    const allNames = new Set<string>([
      ...Object.keys(recentIncidentsByStudent),
      ...Object.keys(attendanceByStudent),
    ]);

    const result: AtRiskStudent[] = [];
    for (const name of allNames) {
      const incidents = recentIncidentsByStudent[name] ?? 0;
      const attendanceRate = attendanceByStudent[name] ?? null;
      const hasAttendanceData = attendanceRate !== null;

      let tier: RiskTier | null = null;

      // High risk: 3+ incidents OR attendance < 80%
      if (
        incidents >= 3 ||
        (hasAttendanceData && attendanceRate !== null && attendanceRate < 80)
      ) {
        tier = "high";
      }
      // Medium risk: 2 incidents OR attendance 80-89%
      else if (
        incidents === 2 ||
        (hasAttendanceData &&
          attendanceRate !== null &&
          attendanceRate >= 80 &&
          attendanceRate < 90)
      ) {
        tier = "medium";
      }

      if (tier) {
        const sparklineData = computeSparklineData(
          name,
          behaviorLogs,
          weekKeys,
        );
        const trendDirection = getTrendDirection(sparklineData);
        const supportPlanType = supportPlanByStudentName[name] ?? null;
        const baseSore = computeRiskScore(
          incidents,
          attendanceRate,
          hasAttendanceData,
        );
        const riskScore = Math.min(100, baseSore + (supportPlanType ? 15 : 0));
        const interventionChips = getInterventionChips(
          incidents,
          attendanceRate,
          hasAttendanceData,
          null, // grade average not yet wired per-student
          supportPlanType !== null,
        );

        result.push({
          name,
          tier,
          incidentCount: incidents,
          attendanceRate,
          hasAttendanceData,
          riskScore,
          sparklineData,
          trendDirection,
          interventionChips,
          supportPlanType,
        });
      }
    }

    // Sort: high first, then by risk score desc
    return result.sort((a, b) => {
      if (a.tier === "high" && b.tier !== "high") return -1;
      if (a.tier !== "high" && b.tier === "high") return 1;
      return b.riskScore - a.riskScore;
    });
  }, [
    recentIncidentsByStudent,
    attendanceByStudent,
    behaviorLogs,
    weekKeys,
    supportPlanByStudentName,
  ]);

  const highRiskCount = useMemo(
    () => atRiskStudents.filter((s) => s.tier === "high").length,
    [atRiskStudents],
  );
  const mediumRiskCount = useMemo(
    () => atRiskStudents.filter((s) => s.tier === "medium").length,
    [atRiskStudents],
  );

  const avgRiskScore = useMemo(() => {
    if (atRiskStudents.length === 0) return 0;
    return Math.round(
      atRiskStudents.reduce((sum, s) => sum + s.riskScore, 0) /
        atRiskStudents.length,
    );
  }, [atRiskStudents]);

  // Determine most common contributing factor
  const primaryRiskFactor = useMemo(() => {
    if (atRiskStudents.length === 0) return null;
    const lowAttendanceCount = atRiskStudents.filter(
      (s) =>
        s.hasAttendanceData &&
        s.attendanceRate !== null &&
        s.attendanceRate < 90,
    ).length;
    const highIncidentCount = atRiskStudents.filter(
      (s) => s.incidentCount >= 2,
    ).length;

    if (lowAttendanceCount > highIncidentCount) {
      return "Most at-risk students have low attendance";
    }
    if (highIncidentCount > 0 && mostCommonIncidentCategory) {
      return `Most incidents are ${mostCommonIncidentCategory} category`;
    }
    return "Multiple contributing factors identified";
  }, [atRiskStudents, mostCommonIncidentCategory]);

  // ─── Standards Mastery ──────────────────────────────────────────────────────
  const standardsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const addStandards = (standards: string[]) => {
      for (const s of standards) {
        if (s.trim()) counts[s.trim()] = (counts[s.trim()] ?? 0) + 1;
      }
    };
    for (const c of courses) addStandards(c.standards);
    for (const u of allUnits) addStandards(u.standards ?? []);
    for (const m of allModules) addStandards(m.standards ?? []);
    for (const a of allAssignments) addStandards(a.standards ?? []);
    for (const a of allAssessments) addStandards(a.standards ?? []);
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [courses, allUnits, allModules, allAssignments, allAssessments]);

  const standardsMaxCount = standardsCounts[0]?.[1] ?? 1;
  const standardsVisible = standardsCounts.slice(0, 15);
  const standardsOverflow = Math.max(0, standardsCounts.length - 15);

  // Single-coverage standard for "At a Glance"
  const firstGapStandard = useMemo(
    () => standardsCounts.find(([, count]) => count === 1)?.[0] ?? null,
    [standardsCounts],
  );

  // Student alerts
  const studentsWithAccommodations = useMemo(
    () => students.filter((s) => s.accommodations.length > 0),
    [students],
  );
  const studentsWithAllergies = useMemo(
    () => students.filter((s) => s.allergies.length > 0),
    [students],
  );

  // ─── At a Glance items ──────────────────────────────────────────────────────
  const atAGlanceItems = useMemo(() => {
    const items: {
      icon: React.ElementType;
      label: string;
      value: string;
      color: string;
      bgColor: string;
      borderColor: string;
    }[] = [];

    // At-risk students
    const atRiskColor =
      highRiskCount >= 3
        ? "text-destructive"
        : highRiskCount >= 1
          ? "text-warning-foreground"
          : "text-success";
    const atRiskBg =
      highRiskCount >= 3
        ? "bg-destructive/5 border-destructive/20"
        : highRiskCount >= 1
          ? "bg-warning/5 border-warning/20"
          : "bg-success/5 border-success/20";
    items.push({
      icon: AlertTriangle,
      label: "Students needing attention",
      value:
        highRiskCount === 0
          ? "All students on track"
          : `${highRiskCount} student${highRiskCount !== 1 ? "s" : ""} need attention`,
      color: atRiskColor,
      bgColor: atRiskBg,
      borderColor: "",
    });

    // Standards gap
    if (firstGapStandard) {
      const shortStd =
        firstGapStandard.length > 22
          ? `${firstGapStandard.slice(0, 22)}…`
          : firstGapStandard;
      items.push({
        icon: BookOpen,
        label: "Standards gap",
        value: `Standards gap: ${shortStd}`,
        color: "text-warning-foreground",
        bgColor: "bg-warning/5 border-warning/20",
        borderColor: "",
      });
    } else {
      items.push({
        icon: BookOpen,
        label: "Standards coverage",
        value:
          standardsCounts.length === 0
            ? "No standards tagged yet"
            : "All standards well covered",
        color: "text-success",
        bgColor: "bg-success/5 border-success/20",
        borderColor: "",
      });
    }

    // Behavior week-over-week
    const behaviorLabel =
      weekOverWeekDelta === 0
        ? "Behavior same as last week"
        : weekOverWeekDelta > 0
          ? `↑ ${weekOverWeekDelta} more incident${weekOverWeekDelta !== 1 ? "s" : ""} vs. last week`
          : `↓ ${Math.abs(weekOverWeekDelta)} fewer incident${Math.abs(weekOverWeekDelta) !== 1 ? "s" : ""} vs. last week`;
    const behaviorColor =
      weekOverWeekDelta > 0
        ? "text-destructive"
        : weekOverWeekDelta < 0
          ? "text-success"
          : "text-muted-foreground";
    items.push({
      icon: BarChart3,
      label: "Behavior trend",
      value: behaviorLabel,
      color: behaviorColor,
      bgColor:
        weekOverWeekDelta > 0
          ? "bg-destructive/5 border-destructive/20"
          : weekOverWeekDelta < 0
            ? "bg-success/5 border-success/20"
            : "bg-muted/50 border-border",
      borderColor: "",
    });

    return items;
  }, [highRiskCount, firstGapStandard, standardsCounts, weekOverWeekDelta]);

  const [activeView, setActiveView] = useState<
    "overview" | "behavior" | "attendance" | "standards"
  >("overview");

  return (
    <div className="w-full space-y-5">
      {/* Pill tab navigation */}
      <PillTabs
        tabs={[
          {
            value: "overview" as const,
            label: "Overview",
            icon: <Users size={14} />,
          },
          {
            value: "behavior" as const,
            label: "Behavior Trends",
            icon: <BarChart3 size={14} />,
          },
          {
            value: "attendance" as const,
            label: "Attendance",
            icon: <CalendarDays size={14} />,
          },
          {
            value: "standards" as const,
            label: "Standards Mastery",
            icon: <BookOpen size={14} />,
          },
        ]}
        activeTab={activeView}
        onChange={setActiveView}
        className="mb-2"
      />

      {/* ── At a Glance Strip (always visible) ──────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        data-ocid="analytics.at_a_glance.section"
      >
        {atAGlanceItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm ${item.bgColor}`}
              data-ocid={`analytics.at_a_glance.item.${i + 1}`}
            >
              <Icon size={16} className={`flex-shrink-0 ${item.color}`} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium leading-none mb-0.5">
                  {item.label}
                </p>
                <p className={`text-xs font-semibold truncate ${item.color}`}>
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Live Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          {
            label: "Total Students",
            value: students.length,
            icon: Users,
            color: "oklch(0.48 0.22 293)",
          },
          {
            label: "Behavior Entries",
            value: totalBehaviorLogs,
            icon: BarChart3,
            color: "oklch(0.60 0.15 200)",
          },
          {
            label: "Attendance Rate",
            value: `${overallAttendance}%`,
            icon: TrendingUp,
            color: "oklch(0.55 0.18 150)",
          },
          {
            label: "Active Courses",
            value: courses.length,
            icon: BookOpen,
            color: "oklch(0.60 0.20 50)",
          },
          {
            label: "At-Risk Students",
            value: atRiskStudents.length,
            icon: AlertTriangle,
            color:
              atRiskStudents.length === 0
                ? "oklch(0.55 0.18 150)"
                : atRiskStudents.length <= 2
                  ? "oklch(0.65 0.18 70)"
                  : "oklch(0.55 0.22 25)",
            badgeColor:
              atRiskStudents.length === 0
                ? "text-success"
                : atRiskStudents.length <= 2
                  ? "text-warning-foreground"
                  : "text-destructive",
          },
        ].map(({ label, value, icon: Icon, color, badgeColor }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div
              className={`text-2xl font-bold ${badgeColor ?? "text-foreground"}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {activeView === "behavior" && (
        <>
          {/* ── Behavior Trends */}
          <div
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
            data-ocid="analytics.behavior_trends.card"
          >
            <h3 className="font-semibold text-foreground mb-4 text-sm">
              Behavior Trends — Last 8 Weeks
            </h3>
            {totalBehaviorLogs === 0 ? (
              <div
                className="flex flex-col items-center py-8 text-muted-foreground"
                data-ocid="analytics.behavior_trends.empty_state"
              >
                <BarChart3 size={24} className="mb-2 opacity-30" />
                <p className="text-sm">No behavior entries logged yet</p>
              </div>
            ) : (
              <BehaviorBarChart
                data={behaviorTrends}
                weekOverWeekDelta={weekOverWeekDelta}
              />
            )}
          </div>

          {/* ── Behavior Breakdown ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top categories */}
            <div
              className="bg-card rounded-xl border border-border p-5 shadow-sm"
              data-ocid="analytics.behavior_breakdown.card"
            >
              <h3 className="font-semibold text-foreground mb-4 text-sm">
                Top Incident Categories
              </h3>
              {topCategories.length === 0 ? (
                <div
                  className="flex flex-col items-center py-6 text-muted-foreground"
                  data-ocid="analytics.top_categories.empty_state"
                >
                  <p className="text-sm">No incidents logged</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCategories.map(({ cat, count }, i) => {
                    const maxCount = topCategories[0].count;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div
                        key={cat}
                        className="flex items-center gap-3"
                        data-ocid={`analytics.top_categories.item.${i + 1}`}
                      >
                        <div className="w-24 text-xs text-muted-foreground flex-shrink-0">
                          {cat}
                        </div>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-destructive/60 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-8 text-xs text-foreground text-right flex-shrink-0">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top students by incident */}
            <div
              className="bg-card rounded-xl border border-border p-5 shadow-sm"
              data-ocid="analytics.top_students.card"
            >
              <h3 className="font-semibold text-foreground mb-4 text-sm">
                Top Incidents by Student{" "}
                <span className="font-normal text-muted-foreground">
                  (last 30 days)
                </span>
              </h3>
              {topStudentsByIncident.length === 0 ? (
                <div
                  className="flex flex-col items-center py-6 text-muted-foreground"
                  data-ocid="analytics.top_students.empty_state"
                >
                  <p className="text-sm">No incidents in the last 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topStudentsByIncident.map(({ name, count }, i) => {
                    const maxCount = topStudentsByIncident[0].count;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3"
                        data-ocid={`analytics.top_students.item.${i + 1}`}
                      >
                        <div className="w-24 text-xs text-muted-foreground flex-shrink-0 truncate">
                          {name}
                        </div>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warning/70 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-8 text-xs text-foreground text-right flex-shrink-0">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* ── By Period (Behavior) */}
          <PeriodBreakdownSection type="behavior" behaviorLogs={behaviorLogs} />
        </>
      )}

      {activeView === "attendance" && (
        <>
          {/* ── Attendance Overview */}
          <div
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
            data-ocid="analytics.attendance.card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">
                Attendance Overview
              </h3>
              <span
                className={`text-xl font-bold ${
                  overallAttendance >= 90
                    ? "text-success"
                    : overallAttendance >= 75
                      ? "text-warning-foreground"
                      : "text-destructive"
                }`}
              >
                {overallAttendance}% overall
              </span>
            </div>

            {allAttendanceRecords.length === 0 ? (
              <div
                className="flex flex-col items-center py-6 text-muted-foreground"
                data-ocid="analytics.attendance.empty_state"
              >
                <TrendingUp size={24} className="mb-2 opacity-30" />
                <p className="text-sm">No attendance records yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <AttendanceBarRow
                  label="Present"
                  count={attendanceCounts.present}
                  total={allAttendanceRecords.length}
                  color="bg-success/70"
                />
                <AttendanceBarRow
                  label="Absent"
                  count={attendanceCounts.absent}
                  total={allAttendanceRecords.length}
                  color="bg-destructive/60"
                />
                <AttendanceBarRow
                  label="Tardy"
                  count={attendanceCounts.tardy}
                  total={allAttendanceRecords.length}
                  color="bg-warning/70"
                />
                <AttendanceBarRow
                  label="Excused"
                  count={attendanceCounts.excused}
                  total={allAttendanceRecords.length}
                  color="bg-info/60"
                />
              </div>
            )}
          </div>
          {/* ── By Period (Attendance) */}
          <PeriodBreakdownSection type="attendance" students={students} />
        </>
      )}

      {activeView === "overview" && (
        <>
          {/* ── At-Risk Students */}
          <div data-ocid="analytics.at_risk.card" className="space-y-3">
            {/* Correlation Summary */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-warning" />
                <h3 className="font-semibold text-foreground text-sm">
                  Student Risk Overview
                </h3>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (behavior + attendance, last 30 days)
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                  {highRiskCount} student{highRiskCount !== 1 ? "s" : ""} High
                  risk
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-xs font-semibold text-warning-foreground">
                  <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                  {mediumRiskCount} student{mediumRiskCount !== 1 ? "s" : ""}{" "}
                  Medium risk
                </span>
                {atRiskStudents.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-semibold text-foreground">
                    Avg score: {avgRiskScore}/100
                  </span>
                )}
              </div>

              {primaryRiskFactor && atRiskStudents.length > 0 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <span className="font-medium text-foreground">Pattern: </span>
                  {primaryRiskFactor}
                </p>
              )}
            </div>

            {/* Per-student cards */}
            {atRiskStudents.length === 0 ? (
              <div
                className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col items-center text-success/70"
                data-ocid="analytics.at_risk.empty_state"
              >
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <CheckCircle size={18} />
                </div>
                <p className="text-sm font-medium">
                  No at-risk students — great work!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No student meets High or Medium risk criteria
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskStudents.map((student, i) => {
                  const isHigh = student.tier === "high";
                  const sparkColor = isHigh
                    ? "oklch(0.55 0.22 25)"
                    : "oklch(0.65 0.18 70)";

                  return (
                    <div
                      key={student.name}
                      data-ocid={`analytics.at_risk.item.${i + 1}`}
                      className={`p-4 rounded-xl border shadow-sm ${
                        isHigh
                          ? "bg-destructive/5 border-destructive/20"
                          : "bg-warning/5 border-warning/20"
                      }`}
                    >
                      {/* Row 1: Score badge + name + tier + trend + sparkline + "View Profile" */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Score badge */}
                        <RiskScoreBadge score={student.riskScore} />

                        {/* Name + tier */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <AlertTriangle
                            size={14}
                            className={
                              isHigh
                                ? "text-destructive flex-shrink-0"
                                : "text-warning flex-shrink-0"
                            }
                          />
                          <span className="text-sm text-foreground font-semibold truncate">
                            {student.name}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              isHigh
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-warning text-warning-foreground"
                            }`}
                          >
                            {isHigh ? "HIGH" : "MED"}
                          </span>
                        </div>

                        {/* Trend direction */}
                        <TrendArrow direction={student.trendDirection} />

                        {/* Sparkline */}
                        <div
                          className="flex-shrink-0"
                          title="Incident trend (last 8 weeks)"
                          aria-hidden="true"
                        >
                          <Sparkline
                            data={student.sparklineData}
                            color={sparkColor}
                          />
                        </div>

                        {/* View Profile link */}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/students" })}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded transition-colors"
                          data-ocid={`analytics.at_risk.item.${i + 1}.link`}
                          aria-label={`View profile for ${student.name}`}
                        >
                          View Profile
                          <ChevronRight size={12} />
                        </button>
                      </div>

                      {/* Row 2: Support plan badge + factor chips + intervention chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {/* Support plan badge */}
                        {student.supportPlanType && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                            {student.supportPlanType}
                          </span>
                        )}
                        {/* Existing factor chips */}
                        {student.incidentCount > 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              isHigh
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-warning/10 text-warning-foreground border-warning/20"
                            }`}
                          >
                            {student.incidentCount} incident
                            {student.incidentCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {student.hasAttendanceData &&
                          student.attendanceRate !== null && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                student.attendanceRate < 80
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-warning/10 text-warning-foreground border-warning/20"
                              }`}
                            >
                              {student.attendanceRate}% attendance
                            </span>
                          )}

                        {/* Intervention recommendation chips */}
                        {student.interventionChips.map((chip) => {
                          const Icon =
                            chip.icon === "MessageSquare"
                              ? MessageSquare
                              : chip.icon === "Calendar"
                                ? Calendar
                                : chip.icon === "BookOpen"
                                  ? BookOpen
                                  : FileText;
                          return (
                            <span
                              key={chip.label}
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <Icon size={10} className="flex-shrink-0" />
                              {chip.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Student Alerts ───────────────────────────────────────────────────── */}
          <div
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
            data-ocid="analytics.student_alerts.card"
          >
            <h3 className="font-semibold text-foreground mb-4 text-sm">
              Student Alerts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Accommodations */}
              <div className="p-4 rounded-lg bg-info/5 border border-info/20">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {studentsWithAccommodations.length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Students with Accommodations
                </div>
                {studentsWithAccommodations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {studentsWithAccommodations.slice(0, 5).map((s) => (
                      <span
                        key={s.studentId}
                        className="text-xs bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full"
                      >
                        {s.preferredName || s.givenNames}
                      </span>
                    ))}
                    {studentsWithAccommodations.length > 5 && (
                      <span className="text-xs text-muted-foreground py-0.5">
                        +{studentsWithAccommodations.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/15">
                <div className="text-2xl font-bold text-destructive mb-1">
                  {studentsWithAllergies.length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Students with Allergies
                </div>
                {studentsWithAllergies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {studentsWithAllergies.slice(0, 5).map((s) => (
                      <span
                        key={s.studentId}
                        className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded-full"
                      >
                        {s.preferredName || s.givenNames}
                      </span>
                    ))}
                    {studentsWithAllergies.length > 5 && (
                      <span className="text-xs text-muted-foreground py-0.5">
                        +{studentsWithAllergies.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === "standards" && (
        <>
          {/* ── Standards Mastery */}
          <div
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
            data-ocid="analytics.standards_mastery.card"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={15} className="text-primary flex-shrink-0" />
              <h3 className="font-semibold text-foreground text-sm">
                Standards Coverage
              </h3>
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (across all curriculum items)
              </span>
            </div>

            {standardsCounts.length === 0 ? (
              <div
                className="flex flex-col items-center py-8 text-muted-foreground"
                data-ocid="analytics.standards_mastery.empty_state"
              >
                <BookOpen size={24} className="mb-2 opacity-30" />
                <p className="text-sm text-center">
                  No standards tagged yet. Add standards to your courses, units,
                  and assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {standardsVisible.map(([standard, count], i) => {
                  const pct = Math.round((count / standardsMaxCount) * 100);
                  const isGap = count === 1;
                  return (
                    <div
                      key={standard}
                      className="flex items-center gap-3"
                      data-ocid={`analytics.standards_mastery.item.${i + 1}`}
                    >
                      <div
                        className="w-44 text-xs text-muted-foreground truncate flex-shrink-0 font-mono"
                        title={standard}
                      >
                        {standard}
                      </div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isGap ? "bg-warning/60" : "bg-success/60"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-foreground text-right w-8">
                          {count}
                        </span>
                        {isGap && (
                          <span className="text-[10px] text-warning-foreground bg-warning/15 border border-warning/25 px-1 py-0.5 rounded font-medium">
                            gap
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {standardsOverflow > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    and {standardsOverflow} more standard
                    {standardsOverflow !== 1 ? "s" : ""}…
                  </p>
                )}
                <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded-sm bg-success/60" />
                    Well covered (2+ items)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded-sm bg-warning/60" />
                    Single coverage (potential gap)
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
