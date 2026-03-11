import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  endOfDay,
  format,
  getDay,
  isAfter,
  isBefore,
  startOfDay,
  subDays,
} from "date-fns";
import {
  AlertOctagon,
  AlertTriangle,
  BarChart2,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit2,
  Filter,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import {
  BehaviorEntryType,
  type BehaviorLog,
  BehaviorSeverity,
} from "../backend";
import EditBehaviorLogInlineForm from "../components/behavior/EditBehaviorLogDialog";
import FollowUpResolutionForm, {
  type ResolutionOutcome,
} from "../components/behavior/FollowUpResolutionForm";
import QuickLogBehaviorForm from "../components/behavior/QuickLogBehaviorForm";
import { PillTabs } from "../components/shared/PillTabs";
import { useAppUI } from "../context/AppUIContext";
import { useStudentContext } from "../context/StudentContextProvider";
import {
  useBehaviorLogs,
  useDeleteBehaviorLog,
  useStudentRoster,
  useUpdateBehaviorLog,
} from "../hooks/useQueries";
import { useGetAllStudents } from "../hooks/useQueries";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ActiveTab = "log" | "incidents" | "praise" | "followups";

function severityOrder(s?: BehaviorSeverity): number {
  if (s === BehaviorSeverity.major) return 0;
  if (s === BehaviorSeverity.moderate) return 1;
  if (s === BehaviorSeverity.minor) return 2;
  return 3;
}

function severityLabel(s?: BehaviorSeverity): string {
  if (s === BehaviorSeverity.major) return "Major";
  if (s === BehaviorSeverity.moderate) return "Moderate";
  if (s === BehaviorSeverity.minor) return "Minor";
  return "";
}

function severityBadgeClass(s?: BehaviorSeverity): string {
  if (s === BehaviorSeverity.major)
    return "bg-destructive/15 text-destructive border-destructive/30";
  if (s === BehaviorSeverity.moderate)
    return "bg-warning/15 text-warning border-warning/30";
  if (s === BehaviorSeverity.minor)
    return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400";
  return "";
}

function categoryLabel(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function formatLogDate(ts: bigint): string {
  return format(new Date(Number(ts) / 1_000_000), "MMM d, yyyy h:mm a");
}

// ─── Pattern Detection ────────────────────────────────────────────────────────

interface Pattern {
  id: string;
  label: string;
  type: "warning" | "info" | "success";
}

function detectPatterns(logs: BehaviorLog[]): Pattern[] {
  const patterns: Pattern[] = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Group by student
  const byStudent: Record<string, BehaviorLog[]> = {};
  for (const log of logs) {
    if (!byStudent[log.studentName]) byStudent[log.studentName] = [];
    byStudent[log.studentName].push(log);
  }

  for (const [student, studentLogs] of Object.entries(byStudent)) {
    // Rule 1: 5+ incidents in last 30 days
    const recentIncidents = studentLogs.filter(
      (l) =>
        l.entryType === BehaviorEntryType.incident &&
        Number(l.loggedAt) / 1_000_000 >= thirtyDaysAgo,
    );
    if (recentIncidents.length >= 5) {
      patterns.push({
        id: `freq-incidents-${student}`,
        label: `${student}: ${recentIncidents.length} incidents in the last 30 days`,
        type: "warning",
      });
    }

    // Rule 2: 3+ incidents on same weekday
    const incidentsByDay: Record<number, number> = {};
    for (const log of studentLogs.filter(
      (l) => l.entryType === BehaviorEntryType.incident,
    )) {
      const day = getDay(new Date(Number(log.loggedAt) / 1_000_000));
      incidentsByDay[day] = (incidentsByDay[day] || 0) + 1;
    }
    for (const [day, count] of Object.entries(incidentsByDay)) {
      if (count >= 3) {
        patterns.push({
          id: `weekday-incidents-${student}-${day}`,
          label: `${student}: Frequent incidents on ${WEEKDAY_NAMES[Number(day)]}s`,
          type: "warning",
        });
      }
    }

    // Rule 3: 3+ praise for same category
    const praiseByCategory: Record<string, number> = {};
    for (const log of studentLogs.filter(
      (l) => l.entryType === BehaviorEntryType.praise,
    )) {
      praiseByCategory[log.category] =
        (praiseByCategory[log.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(praiseByCategory)) {
      if (count >= 3) {
        patterns.push({
          id: `praise-${student}-${cat}`,
          label: `${student}: Consistent praise for ${categoryLabel(cat)} (${count}×)`,
          type: "success",
        });
      }
    }
  }

  // Rule 4: Unresolved follow-ups
  const unresolved = logs.filter(
    (l) => l.entryType === BehaviorEntryType.incident && l.followUpNeeded,
  );
  if (unresolved.length > 0) {
    patterns.push({
      id: "unresolved-followups",
      label: `${unresolved.length} incident${unresolved.length > 1 ? "s" : ""} with unresolved follow-up needed`,
      type: "info",
    });
  }

  return patterns;
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

function exportCSV(logs: BehaviorLog[]) {
  const headers = [
    "Entry ID",
    "Date/Time",
    "Student Name",
    "Type",
    "Category",
    "Where / When",
    "Description",
    "Severity",
    "Action Taken",
    "Follow-up Needed",
  ];
  const rows = logs.map((l) => [
    String(l.entryId),
    formatLogDate(l.loggedAt),
    l.studentName,
    l.entryType,
    l.category,
    l.context,
    `"${l.description.replace(/"/g, '""')}"`,
    l.severity ?? "",
    l.actionTaken ? `"${l.actionTaken.replace(/"/g, '""')}"` : "",
    l.followUpNeeded ? "Yes" : "No",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `behavior-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(logs: BehaviorLog[]) {
  const lines: string[] = [
    "BEHAVIOR LOG EXPORT",
    `Generated: ${format(new Date(), "MMMM d, yyyy h:mm a")}`,
    `Total Entries: ${logs.length}`,
    "",
    "─".repeat(80),
    "",
  ];
  for (const log of logs) {
    lines.push(`Date: ${formatLogDate(log.loggedAt)}`);
    lines.push(`Student: ${log.studentName}`);
    lines.push(
      `Type: ${log.entryType.toUpperCase()}  |  Category: ${categoryLabel(log.category)}  |  Where/When: ${log.context}`,
    );
    if (log.severity) lines.push(`Severity: ${severityLabel(log.severity)}`);
    lines.push(`Description: ${log.description}`);
    if (log.actionTaken) lines.push(`Action Taken: ${log.actionTaken}`);
    lines.push(`Follow-up Needed: ${log.followUpNeeded ? "Yes" : "No"}`);
    lines.push("─".repeat(80));
    lines.push("");
  }
  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `behavior-log-${format(new Date(), "yyyy-MM-dd")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Entry Row Component ──────────────────────────────────────────────────────

interface EntryRowProps {
  log: BehaviorLog;
  onDelete: (log: BehaviorLog) => void;
  onStudentClick: (name: string) => void;
  index: number;
}

function EntryRow({ log, onDelete, onStudentClick, index }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const updateBehaviorLog = useUpdateBehaviorLog();

  const handleMarkResolved = async (
    outcome: ResolutionOutcome,
    notes: string,
  ) => {
    const resolutionSuffix = notes
      ? `\n\nResolution (${outcome}): ${notes}`
      : `\n\nResolution: ${outcome}`;

    await updateBehaviorLog.mutateAsync({
      entryId: log.entryId,
      studentName: log.studentName,
      entryType: log.entryType,
      category: log.category,
      context: log.context,
      description: log.description + resolutionSuffix,
      severity: log.severity ?? null,
      actionTaken: log.actionTaken ?? null,
      followUpNeeded: false,
    });
    setShowResolutionForm(false);
  };

  return (
    <div
      className="border border-border rounded-lg overflow-hidden bg-card shadow-sm"
      data-ocid={`behavior.log.item.${index}`}
    >
      <button
        type="button"
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors"
        onClick={() => {
          setExpanded((e) => !e);
          setEditing(false);
          if (expanded) setShowResolutionForm(false);
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {formatLogDate(log.loggedAt)}
            </span>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onStudentClick(log.studentName);
              }}
            >
              {log.studentName}
            </button>
            <Badge
              className={`text-xs px-2 py-0 ${
                log.entryType === BehaviorEntryType.incident
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-success/15 text-success border-success/30"
              }`}
              variant="outline"
            >
              {log.entryType === BehaviorEntryType.incident
                ? "Incident"
                : "Praise"}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 text-muted-foreground"
            >
              {categoryLabel(log.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">{log.context}</span>
            {log.severity && (
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0 ${severityBadgeClass(log.severity)}`}
              >
                {severityLabel(log.severity)}
              </Badge>
            )}
            {log.followUpNeeded ? (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0 bg-warning/10 text-warning border-warning/40 flex items-center gap-1"
              >
                <Clock className="h-2.5 w-2.5" /> Follow-up
              </Badge>
            ) : log.description.includes("\n\nResolution") ? (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0 bg-success/10 text-success border-success/30 flex items-center gap-1"
              >
                <CheckCircle className="h-2.5 w-2.5" /> Resolved
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-foreground truncate">
            {expanded
              ? log.description
              : log.description.slice(0, 80) +
                (log.description.length > 80 ? "…" : "")}
          </p>
        </div>
        <div className="flex-shrink-0 text-muted-foreground mt-0.5">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && !editing && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          <div className="pt-3 space-y-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full Description
              </span>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                {log.description}
              </p>
            </div>
            {log.actionTaken && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Action Taken
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {log.actionTaken
                    .split("; ")
                    .filter(Boolean)
                    .map((action) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className="text-xs px-2 py-0.5 text-foreground"
                      >
                        {action}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Follow-up Needed:
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${log.followUpNeeded ? "text-warning border-warning/40" : "text-muted-foreground"}`}
              >
                {log.followUpNeeded ? "Yes" : "No"}
              </Badge>
            </div>

            {/* Resolution indicator — shows when resolved */}
            {!log.followUpNeeded &&
              log.description.includes("\n\nResolution") && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs text-success font-medium">
                    Follow-up resolved
                  </span>
                </div>
              )}

            <div className="flex gap-2 pt-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(true);
                  setShowResolutionForm(false);
                }}
                className="gap-1"
                data-ocid={`behavior.log.edit_button.${index}`}
              >
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
              {log.followUpNeeded && !showResolutionForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResolutionForm(true)}
                  className="gap-1 text-success hover:text-success border-success/40 hover:border-success/60 hover:bg-success/5"
                  data-ocid={`behavior.log.resolve_button.${index}`}
                >
                  <CheckCircle className="h-3 w-3" /> Mark Resolved
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(log)}
                className="gap-1 text-destructive hover:text-destructive"
                data-ocid={`behavior.log.delete_button.${index}`}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </div>

            {/* Inline resolution form */}
            {showResolutionForm && (
              <FollowUpResolutionForm
                onClose={() => setShowResolutionForm(false)}
                onSubmit={handleMarkResolved}
                isPending={updateBehaviorLog.isPending}
              />
            )}
          </div>
        </div>
      )}

      {expanded && editing && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          <EditBehaviorLogInlineForm
            log={log}
            onClose={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Header Tab Pills Component ───────────────────────────────────────────────

// ─── Main Behavior Page ───────────────────────────────────────────────────────

export default function BehaviorPage() {
  const { data: logs = [], isLoading } = useBehaviorLogs();
  const { data: roster = [] } = useStudentRoster();
  const { data: students = [] } = useGetAllStudents();
  const deleteBehaviorLog = useDeleteBehaviorLog();
  const { openStudentContext } = useStudentContext();
  const { setHeaderTabs } = useAppUI();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("log");

  // Log entry inline form
  const [showLogForm, setShowLogForm] = useState(false);

  // Filters
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterContext, setFilterContext] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Delete state
  const [deletingLog, setDeletingLog] = useState<BehaviorLog | null>(null);

  // Apply filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterStudent !== "all" && log.studentName !== filterStudent)
        return false;
      if (filterType !== "all" && log.entryType !== filterType) return false;
      if (filterSeverity !== "all" && log.severity !== filterSeverity)
        return false;
      if (filterCategory !== "all" && log.category !== filterCategory)
        return false;
      if (
        filterContext &&
        !log.context.toLowerCase().includes(filterContext.toLowerCase())
      )
        return false;
      if (
        filterSearch &&
        !log.description.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !log.studentName.toLowerCase().includes(filterSearch.toLowerCase())
      )
        return false;
      if (filterDateFrom) {
        const logDate = new Date(Number(log.loggedAt) / 1_000_000);
        if (isBefore(logDate, startOfDay(filterDateFrom))) return false;
      }
      if (filterDateTo) {
        const logDate = new Date(Number(log.loggedAt) / 1_000_000);
        if (isAfter(logDate, endOfDay(filterDateTo))) return false;
      }
      return true;
    });
  }, [
    logs,
    filterStudent,
    filterType,
    filterSeverity,
    filterCategory,
    filterContext,
    filterSearch,
    filterDateFrom,
    filterDateTo,
  ]);

  const clearFilters = () => {
    setFilterStudent("all");
    setFilterType("all");
    setFilterSeverity("all");
    setFilterCategory("all");
    setFilterContext("");
    setFilterSearch("");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const hasActiveFilters =
    filterStudent !== "all" ||
    filterType !== "all" ||
    filterSeverity !== "all" ||
    filterCategory !== "all" ||
    filterContext ||
    filterSearch ||
    filterDateFrom ||
    filterDateTo;

  // Quick stats (this week)
  const oneWeekAgo = subDays(new Date(), 7);
  const thisWeekLogs = logs.filter((l) =>
    isAfter(new Date(Number(l.loggedAt) / 1_000_000), oneWeekAgo),
  );
  const totalIncidents = logs.filter(
    (l) => l.entryType === BehaviorEntryType.incident,
  ).length;
  const totalPraise = logs.filter(
    (l) => l.entryType === BehaviorEntryType.praise,
  ).length;

  // Tab-specific sorted lists
  const allSorted = [...filteredLogs].sort(
    (a, b) => Number(b.loggedAt) - Number(a.loggedAt),
  );
  const incidentsSorted = [...filteredLogs]
    .filter((l) => l.entryType === BehaviorEntryType.incident)
    .sort((a, b) => {
      const sev = severityOrder(a.severity) - severityOrder(b.severity);
      if (sev !== 0) return sev;
      return Number(b.loggedAt) - Number(a.loggedAt);
    });
  const praiseSorted = [...filteredLogs]
    .filter((l) => l.entryType === BehaviorEntryType.praise)
    .sort((a, b) => Number(b.loggedAt) - Number(a.loggedAt));

  // Follow-ups: all unresolved follow-up entries (not just filtered)
  const followupsSorted = [...logs]
    .filter((l) => l.followUpNeeded)
    .sort((a, b) => Number(b.loggedAt) - Number(a.loggedAt));

  // Patterns
  const patterns = useMemo(() => detectPatterns(logs), [logs]);

  // Clear any header tabs on mount/unmount
  useEffect(() => {
    setHeaderTabs(null);
    return () => setHeaderTabs(null);
  }, [setHeaderTabs]);

  const handleDelete = async () => {
    if (!deletingLog) return;
    await deleteBehaviorLog.mutateAsync(deletingLog.entryId);
    setDeletingLog(null);
  };

  const handleStudentClick = (name: string) => {
    const student = students.find((s) => {
      const fullName = s.preferredName
        ? `${s.preferredName} ${s.familyName}`
        : `${s.givenNames} ${s.familyName}`;
      return (
        fullName === name || s.givenNames === name || s.preferredName === name
      );
    });
    if (student) {
      openStudentContext(student.studentId);
    }
  };

  // Get active list
  const activeList =
    activeTab === "log"
      ? allSorted
      : activeTab === "incidents"
        ? incidentsSorted
        : activeTab === "praise"
          ? praiseSorted
          : followupsSorted;

  return (
    <div className="space-y-5">
      {/* Tab Pills — inline in page content, never in header */}
      <PillTabs
        tabs={[
          { value: "log" as const, label: "Log", badge: allSorted.length },
          {
            value: "incidents" as const,
            label: "Incidents",
            badge: incidentsSorted.length,
            badgeVariant: "destructive",
          },
          {
            value: "praise" as const,
            label: "Praise",
            badge: praiseSorted.length,
            badgeVariant: "success",
          },
          {
            value: "followups" as const,
            label: "Follow-ups",
            badge:
              followupsSorted.length > 0 ? followupsSorted.length : undefined,
            badgeVariant: "warning",
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {thisWeekLogs.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entries this week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalIncidents}
                </p>
                <p className="text-xs text-muted-foreground">Total incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalPraise}
                </p>
                <p className="text-xs text-muted-foreground">Total praise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patterns — prominent alert banners */}
      {patterns.length > 0 && (
        <div className="space-y-2" data-ocid="behavior.patterns.section">
          {patterns.map((p) => (
            <div
              key={p.id}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
                p.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : p.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
              data-ocid="behavior.patterns.item"
            >
              {p.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              ) : p.type === "success" ? (
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              ) : (
                <BarChart2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{p.label}</p>
              </div>
              {p.type === "warning" && (
                <button
                  type="button"
                  onClick={() => {
                    // Extract student name from pattern label (format: "Name: ...")
                    const match = p.label.match(/^([^:]+):/);
                    if (match) setFilterStudent(match[1].trim());
                  }}
                  className="text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 shrink-0"
                  data-ocid="behavior.patterns.view_button"
                >
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline Log Entry Form */}
      {showLogForm && (
        <QuickLogBehaviorForm
          open={showLogForm}
          onClose={() => setShowLogForm(false)}
        />
      )}

      {/* Filter Bar + Actions Row */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
                data-ocid="behavior.search_input"
              />
            </div>

            {/* Student */}
            <Select value={filterStudent} onValueChange={setFilterStudent}>
              <SelectTrigger
                className="h-9 w-[160px] text-sm"
                data-ocid="behavior.filter.select"
              >
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all">All Students</SelectItem>
                {roster.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 w-[120px] text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="praise">Praise</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity */}
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="major">Major</SelectItem>
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="respect">Respect</SelectItem>
                <SelectItem value="responsibility">Responsibility</SelectItem>
                <SelectItem value="emotional_regulation">
                  Emotional Regulation
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Where / When search */}
            <Input
              placeholder="Where / When..."
              value={filterContext}
              onChange={(e) => setFilterContext(e.target.value)}
              className="h-9 w-[140px] text-sm"
            />

            {/* Date From */}
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-sm font-normal"
                >
                  {filterDateFrom
                    ? format(filterDateFrom, "MMM d")
                    : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDateFrom}
                  onSelect={(d) => {
                    setFilterDateFrom(d);
                    setDateFromOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-sm font-normal"
                >
                  {filterDateTo ? format(filterDateTo, "MMM d") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDateTo}
                  onSelect={(d) => {
                    setFilterDateTo(d);
                    setDateToOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCSV(filteredLogs)}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportPDF(filteredLogs)}>
                  Export as PDF/Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Serious Incident Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
              onClick={() => navigate({ to: "/behavior/serious-incident" })}
              data-ocid="behavior.serious_incident.button"
            >
              <AlertOctagon className="h-4 w-4" />
              Serious Incident
            </Button>

            {/* Log Entry Button */}
            <Button
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowLogForm((v) => !v)}
              data-ocid="behavior.add_entry.button"
            >
              <Plus className="h-4 w-4" />
              {showLogForm ? "Cancel" : "Log Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entry List — driven by activeTab state set from header tabs */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="behavior.log.empty_state"
        >
          {activeTab === "log" && (
            <>
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No behavior entries yet</p>
              <p className="text-sm mt-1">
                Use the Log Entry button above to add your first entry
              </p>
            </>
          )}
          {activeTab === "incidents" && (
            <>
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No incidents recorded</p>
              <p className="text-sm mt-1">
                Incidents will appear here when logged
              </p>
            </>
          )}
          {activeTab === "praise" && (
            <>
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No praise entries yet</p>
              <p className="text-sm mt-1">
                Praise entries will appear here when logged
              </p>
            </>
          )}
          {activeTab === "followups" && (
            <>
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-success" />
              <p className="font-medium">All caught up</p>
              <p className="text-sm mt-1">
                No open follow-ups — great work staying on top of things
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {activeList.map((log, i) => (
            <EntryRow
              key={String(log.entryId)}
              log={log}
              onDelete={setDeletingLog}
              onStudentClick={handleStudentClick}
              index={i + 1}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation — AlertDialog is acceptable for destructive action guards */}
      <AlertDialog
        open={!!deletingLog}
        onOpenChange={(open) => !open && setDeletingLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Behavior Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this behavior entry for{" "}
              <strong>{deletingLog?.studentName}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="behavior.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="behavior.delete.confirm_button"
            >
              {deleteBehaviorLog.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
