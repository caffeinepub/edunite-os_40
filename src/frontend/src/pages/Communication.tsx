import { Button } from "@/components/ui/button";
import { useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Megaphone,
  MessageSquare,
  Send,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AnnouncementsView from "../components/communication/AnnouncementsView";
import MessagesView from "../components/communication/MessagesView";
import { PillTabs } from "../components/shared/PillTabs";
import {
  useAllAssessments,
  useAllAssignments,
  useBehaviorLogs,
  useGetAllStudents,
} from "../hooks/useQueries";
import { getAnnouncements } from "../lib/communicationStore";

type CommTab = "messages" | "announcements" | "digest";

function getTabFromSearch(search: unknown): CommTab {
  const params = new URLSearchParams(String(search ?? ""));
  const t = params.get("tab");
  if (t === "announcements") return "announcements";
  if (t === "digest") return "digest";
  return "messages";
}

// ─── Weekly Digest helpers ────────────────────────────────────────────────────

function getWeekDates(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { start: mon, end: fri, label: `${fmt(mon)} – ${fmt(fri)}` };
}

function isThisWeek(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const { start, end } = getWeekDates();
  const d = new Date(dateStr);
  // extend end to end of day
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  return d >= start && d <= endOfDay;
}

function WeeklyDigestView() {
  const week = getWeekDates();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ── Real data from ICP backend hooks ──
  const { data: studentsData } = useGetAllStudents();
  const { data: behaviorLogsData } = useBehaviorLogs();
  const { data: assignmentsData } = useAllAssignments();
  const { data: assessmentsData } = useAllAssessments();

  const students = studentsData ?? [];
  const behaviorLogs = behaviorLogsData ?? [];
  const allAssignments = assignmentsData ?? [];
  const allAssessments = assessmentsData ?? [];

  // ── Announcements from communicationStore (correct key: edunite_announcements) ──
  const pinnedAnnouncements = useMemo(() => {
    return getAnnouncements().filter((a) => a.pinned && !a.archived);
  }, []);

  // ── Derived: upcoming due items this week ──
  const upcomingAssignments = useMemo(
    () =>
      allAssignments.filter((a) => {
        const due = (a as { dueDate?: string }).dueDate;
        return isThisWeek(due);
      }),
    [allAssignments],
  );

  const upcomingAssessments = useMemo(
    () =>
      allAssessments.filter((a) => {
        const due = (a as { dueDate?: string }).dueDate;
        return isThisWeek(due);
      }),
    [allAssessments],
  );

  // ── Derived: behavior praise this week ──
  const praiseThisWeek = useMemo(
    () =>
      behaviorLogs.filter(
        (b) =>
          (b as { type?: string }).type === "Praise" &&
          isThisWeek((b as { date?: string }).date),
      ),
    [behaviorLogs],
  );

  const incidentsThisWeek = useMemo(
    () =>
      behaviorLogs.filter(
        (b) =>
          (b as { type?: string }).type === "Incident" &&
          isThisWeek((b as { date?: string }).date),
      ),
    [behaviorLogs],
  );

  // ── Attendance: aggregate from enrollment/attendance records if stored ──
  // Classes.tsx stores attendance in edunite_gradebook per-cell; no per-day
  // attendance roll is persisted separately yet. Show 0/0 until integrated.
  const attendanceSummary = useMemo(() => {
    // Attempt to read any attendance data keyed per student
    try {
      const raw = localStorage.getItem("edunite_attendance");
      if (raw) {
        const records = JSON.parse(raw) as Array<{
          date: string;
          status: string;
        }>;
        let present = 0;
        let absent = 0;
        for (const r of records) {
          if (isThisWeek(r.date)) {
            if (r.status === "present") present++;
            else if (r.status === "absent") absent++;
          }
        }
        const total = present + absent;
        return {
          present,
          absent,
          rate: total > 0 ? `${Math.round((present / total) * 100)}%` : "—",
          hasData: total > 0,
        };
      }
    } catch {
      // ignore
    }
    return { present: 0, absent: 0, rate: "—", hasData: false };
  }, []);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast.success("Weekly Digest sent to all parents");
    }, 1200);
  };

  // ── Build upcoming list (no fake seed data — show empty state if nothing due) ──
  const upcomingItems = useMemo(() => {
    const fmt = (d: string) =>
      `Due ${new Date(d).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}`;
    return [
      ...upcomingAssignments.map((a) => ({
        title: (a as { title?: string }).title ?? "Assignment",
        type: "assignment" as const,
        dueDate: (a as { dueDate?: string }).dueDate
          ? fmt((a as { dueDate: string }).dueDate)
          : "",
      })),
      ...upcomingAssessments.map((a) => ({
        title: (a as { title?: string }).title ?? "Assessment",
        type: "assessment" as const,
        dueDate: (a as { dueDate?: string }).dueDate
          ? fmt((a as { dueDate: string }).dueDate)
          : "",
      })),
    ];
  }, [upcomingAssignments, upcomingAssessments]);

  const praiseCount = praiseThisWeek.length;
  const incidentCount = incidentsThisWeek.length;
  const studentCount = students.length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header strip */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
            Weekly Digest
          </p>
          <h2 className="text-xl font-bold text-foreground">
            Week of {week.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Summary for {studentCount} enrolled student
            {studentCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="gap-1.5"
            data-ocid="digest.preview_button"
          >
            <BookOpen size={14} />
            {showPreview ? "Hide Preview" : "Preview Email"}
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || sent}
            className="gap-1.5 bg-violet-700 hover:bg-violet-800 text-white"
            data-ocid="digest.send.primary_button"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : sent ? (
              <CheckCircle2 size={14} />
            ) : (
              <Send size={14} />
            )}
            {sent ? "Sent!" : "Send to All Parents"}
          </Button>
        </div>
      </div>

      {/* Email preview */}
      {showPreview && (
        <div
          className="border border-border rounded-xl bg-white overflow-hidden"
          data-ocid="digest.preview.panel"
        >
          <div className="px-6 py-4 bg-violet-700 text-white">
            <p className="text-xs font-medium opacity-75">EdUnite OS</p>
            <h3 className="text-lg font-bold mt-0.5">
              Weekly Update · {week.label}
            </h3>
          </div>
          <div className="px-6 py-5 space-y-5 text-sm text-gray-800">
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                📅 Upcoming This Week
              </p>
              {upcomingItems.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No assignments or assessments due this week.
                </p>
              ) : (
                <ul className="space-y-1">
                  {upcomingItems.slice(0, 4).map((item, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ordered preview list
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 shrink-0 ${
                          item.type === "assessment"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.type === "assessment" ? "Quiz" : "Assignment"}
                      </span>
                      <span>{item.title}</span>
                      <span className="text-gray-500 ml-auto shrink-0">
                        {item.dueDate}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                📊 Attendance This Week
              </p>
              {attendanceSummary.hasData ? (
                <p>
                  {attendanceSummary.present} days present ·{" "}
                  {attendanceSummary.absent} absences ·{" "}
                  <strong>{attendanceSummary.rate}</strong> attendance rate
                </p>
              ) : (
                <p className="text-gray-500">
                  No attendance records for this week yet.
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                📌 Announcements
              </p>
              {pinnedAnnouncements.length === 0 ? (
                <p className="text-gray-500">No pinned announcements.</p>
              ) : (
                pinnedAnnouncements.slice(0, 2).map((a, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered preview list
                  <div key={i} className="mb-2">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-gray-600">{a.body}</p>
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                🌟 Behavior Highlights
              </p>
              {praiseCount > 0 ? (
                <p>
                  {praiseCount} praise entr{praiseCount === 1 ? "y" : "ies"}{" "}
                  logged this week. Keep up the great work!
                </p>
              ) : (
                <p className="text-gray-500">
                  No praise entries logged this week.
                </p>
              )}
              {incidentCount > 0 && (
                <p className="mt-1 text-gray-600">
                  {incidentCount} incident{incidentCount === 1 ? "" : "s"} also
                  recorded.
                </p>
              )}
            </div>
          </div>
          <div className="px-6 py-3 bg-muted/40 border-t border-border text-xs text-muted-foreground">
            Sent via EdUnite OS · To unsubscribe, reply STOP
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upcoming */}
        <div
          className="rounded-xl border border-border bg-card p-5 space-y-3"
          data-ocid="digest.upcoming.card"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <CalendarDays size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Upcoming This Week
              </p>
              <p className="text-xs text-muted-foreground">
                {upcomingItems.length} due item
                {upcomingItems.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {upcomingItems.length === 0 ? (
            <p
              className="text-xs text-muted-foreground py-2"
              data-ocid="digest.upcoming.empty_state"
            >
              Nothing due this week — add assignments in Curriculum.
            </p>
          ) : (
            <div className="space-y-1.5">
              {upcomingItems.slice(0, 4).map((item) => (
                <div
                  key={item.title + item.dueDate}
                  className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0"
                >
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                      item.type === "assessment"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.type === "assessment" ? "Quiz" : "Hw"}
                  </span>
                  <span className="text-xs text-foreground flex-1 truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {item.dueDate}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div
          className="rounded-xl border border-border bg-card p-5 space-y-3"
          data-ocid="digest.attendance.card"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Users size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Attendance Summary
              </p>
              <p className="text-xs text-muted-foreground">This week</p>
            </div>
          </div>
          {attendanceSummary.hasData ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Days Present
                </span>
                <span className="text-sm font-semibold text-green-700">
                  {attendanceSummary.present}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Absences</span>
                <span className="text-sm font-semibold text-red-600">
                  {attendanceSummary.absent}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-xs font-medium text-foreground">
                  Attendance Rate
                </span>
                <span className="text-sm font-bold text-foreground">
                  {attendanceSummary.rate}
                </span>
              </div>
            </div>
          ) : (
            <p
              className="text-xs text-muted-foreground py-2"
              data-ocid="digest.attendance.empty_state"
            >
              No attendance records for this week yet.
            </p>
          )}
        </div>

        {/* Announcements */}
        <div
          className="rounded-xl border border-border bg-card p-5 space-y-3"
          data-ocid="digest.announcements.card"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Megaphone size={16} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Announcements
              </p>
              <p className="text-xs text-muted-foreground">
                {pinnedAnnouncements.length} pinned
              </p>
            </div>
          </div>
          {pinnedAnnouncements.length === 0 ? (
            <p
              className="text-xs text-muted-foreground py-2"
              data-ocid="digest.announcements.empty_state"
            >
              No pinned announcements — pin one in the Announcements tab.
            </p>
          ) : (
            <div className="space-y-2">
              {pinnedAnnouncements.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="py-1 border-b border-border/30 last:border-0"
                >
                  <p className="text-xs font-medium text-foreground">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Behavior Highlights */}
        <div
          className="rounded-xl border border-border bg-card p-5 space-y-3"
          data-ocid="digest.behavior.card"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Star size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Behavior Highlights
              </p>
              <p className="text-xs text-muted-foreground">This week</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Praise Logged
              </span>
              <span className="text-2xl font-bold text-amber-600">
                {praiseCount}
              </span>
            </div>
            {incidentCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Incidents</span>
                <span className="text-sm font-semibold text-red-600">
                  {incidentCount}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {praiseCount === 0 && incidentCount === 0
                ? "No behavior entries logged this week."
                : praiseCount >= 5
                  ? "Great week — lots of positive recognition! 🌟"
                  : praiseCount > 0
                    ? "A few highlights logged this week."
                    : incidentCount > 0
                      ? "Some incidents recorded — review in Behavior."
                      : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Communication() {
  const routerState = useRouterState();

  const [activeTab, setActiveTab] = useState<CommTab>(() =>
    getTabFromSearch(routerState.location.search),
  );

  useEffect(() => {
    setActiveTab(getTabFromSearch(routerState.location.search));
  }, [routerState.location.search]);

  return (
    <div className="space-y-5">
      <PillTabs
        tabs={[
          {
            value: "messages" as const,
            label: "Messages",
            icon: <MessageSquare size={14} />,
          },
          {
            value: "announcements" as const,
            label: "Announcements",
            icon: <Megaphone size={14} />,
          },
          {
            value: "digest" as const,
            label: "Weekly Digest",
            icon: <CalendarDays size={14} />,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "messages" && <MessagesView />}
      {activeTab === "announcements" && <AnnouncementsView />}
      {activeTab === "digest" && <WeeklyDigestView />}
    </div>
  );
}
