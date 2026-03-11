import {
  Activity,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { AttendanceStatus } from "../backend";
import { PillTabs } from "../components/shared/PillTabs";
import {
  useAllAssignments,
  useBehaviorLogs,
  useGetAllStudents,
} from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: "incident" | "praise" | "absence" | "tardy" | "assignment" | "class";
  label: string;
  studentName?: string;
}

// ─── Timetable types (minimal, matches edunite_timetable schema) ─────────────

interface TimetablePeriodLocal {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface TimetableAssignmentLocal {
  periodId: string;
  day: string; // "Monday"|"Tuesday"|...
  courseName: string;
  room?: string;
}

interface TimetableDataLocal {
  periods: TimetablePeriodLocal[];
  assignments: TimetableAssignmentLocal[];
}

function loadTimetableLocal(): TimetableDataLocal {
  try {
    const raw = localStorage.getItem("edunite_timetable");
    if (raw) return JSON.parse(raw) as TimetableDataLocal;
  } catch {
    /* ignore */
  }
  return { periods: [], assignments: [] };
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDays(anchorDate: Date): Date[] {
  const day = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function formatTime(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return toDateStr(d);
}

// ─── Event Dot ────────────────────────────────────────────────────────────────

function EventDot({ type }: { type: CalendarEvent["type"] }) {
  const colors: Record<CalendarEvent["type"], string> = {
    incident: "bg-destructive",
    praise: "bg-success",
    absence: "bg-info",
    tardy: "bg-warning",
    assignment: "bg-primary",
    class: "bg-primary/40",
  };
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[type]}`} />
  );
}

// ─── Event Chip ───────────────────────────────────────────────────────────────

function EventChip({ event }: { event: CalendarEvent }) {
  const styles: Record<CalendarEvent["type"], string> = {
    incident: "bg-destructive/10 text-destructive border-destructive/20",
    praise: "bg-success/10 text-success border-success/20",
    absence: "bg-info/10 text-info border-info/20",
    tardy: "bg-warning/10 text-warning-foreground border-warning/20",
    assignment: "bg-primary/10 text-primary border-primary/30",
    class: "bg-primary/5 text-primary/70 border-primary/15",
  };
  const labels: Record<CalendarEvent["type"], string> = {
    incident: "Incident",
    praise: "Praise",
    absence: "Absent",
    tardy: "Tardy",
    assignment: "Due",
    class: "Class",
  };
  return (
    <div
      className={`text-xs px-2 py-0.5 rounded border truncate ${styles[event.type]}`}
    >
      <span className="font-medium">{labels[event.type]}</span>
      {event.type === "assignment" ? (
        <span className="opacity-75"> · {event.label.slice(0, 20)}</span>
      ) : (
        event.studentName && (
          <span className="opacity-75">
            {" "}
            · {event.studentName.split(" ")[0]}
          </span>
        )
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Calendar() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: behaviorLogs = [] } = useBehaviorLogs();
  const { data: students = [] } = useGetAllStudents();
  const { data: assignments = [] } = useAllAssignments();

  const [showTimetableEvents, setShowTimetableEvents] = useState(true);

  // ─── Aggregate Events ───────────────────────────────────────────────────────

  // Timetable recurring events — generated for 52 weeks around today
  const timetableEvents = useMemo<CalendarEvent[]>(() => {
    if (!showTimetableEvents) return [];
    const timetable = loadTimetableLocal();
    const result: CalendarEvent[] = [];
    const periodMap = new Map(timetable.periods.map((p) => [p.id, p]));
    const base = new Date();
    // Generate for 26 weeks back + 26 weeks forward
    for (let weekOffset = -26; weekOffset <= 26; weekOffset++) {
      for (const assignment of timetable.assignments) {
        const dayIdx = DAY_NAME_TO_INDEX[assignment.day];
        if (dayIdx === undefined) continue;
        const period = periodMap.get(assignment.periodId);
        // Find the date for this day in this week
        const monday = new Date(base);
        monday.setDate(
          base.getDate() - ((base.getDay() + 6) % 7) + weekOffset * 7,
        );
        const targetDate = new Date(monday);
        // dayIdx: Monday=1 -> offset 0, Tuesday=2 -> offset 1, etc.
        targetDate.setDate(monday.getDate() + (dayIdx - 1));
        const dateStr = toDateStr(targetDate);
        const periodLabel = period
          ? ` (${period.startTime}–${period.endTime})`
          : "";
        result.push({
          id: `tt-${assignment.periodId}-${assignment.day}-${dateStr}`,
          date: dateStr,
          type: "class",
          label: `${assignment.courseName}${assignment.room ? ` · ${assignment.room}` : ""}${periodLabel}`,
        });
      }
    }
    return result;
  }, [showTimetableEvents]);

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    // Behavior log events
    for (const log of behaviorLogs) {
      const dateStr = formatTime(log.loggedAt);
      if (!dateStr) continue;
      result.push({
        id: `bl-${String(log.entryId)}`,
        date: dateStr,
        type: log.entryType === "incident" ? "incident" : "praise",
        label: log.description.slice(0, 40),
        studentName: log.studentName,
      });
    }

    // Attendance events
    for (const student of students) {
      for (const rec of student.attendanceRecords) {
        if (
          rec.status === AttendanceStatus.absent ||
          rec.status === AttendanceStatus.excused
        ) {
          result.push({
            id: `att-absent-${student.studentId}-${rec.date}`,
            date: rec.date,
            type: "absence",
            label: "Absent",
            studentName: student.preferredName || student.givenNames,
          });
        } else if (rec.status === AttendanceStatus.tardy) {
          result.push({
            id: `att-tardy-${student.studentId}-${rec.date}`,
            date: rec.date,
            type: "tardy",
            label: "Tardy",
            studentName: student.preferredName || student.givenNames,
          });
        }
      }
    }

    // Assignment due-date events
    for (const assignment of assignments) {
      if (!assignment.dueDate) continue;
      // dueDate is already "YYYY-MM-DD"
      result.push({
        id: `asgn-${assignment.id}`,
        date: assignment.dueDate,
        type: "assignment",
        label: assignment.title,
      });
    }

    return result;
  }, [behaviorLogs, students, assignments]);

  // Group by date for quick lookup — merge timetable events
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of [...timetableEvents, ...events]) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events, timetableEvents]);

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  const goPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
      setSelectedDay(null);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const goNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
      setSelectedDay(null);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  // ─── Period label ────────────────────────────────────────────────────────────

  const periodLabel = useMemo(() => {
    if (viewMode === "month") {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    {
      const week = getWeekDays(currentDate);
      const start = week[0];
      const end = week[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
  }, [viewMode, currentDate]);

  // ─── Selected day events ────────────────────────────────────────────────────

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : [];

  // ─── Month View ──────────────────────────────────────────────────────────────

  const monthGrid = useMemo(
    () => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  );

  // ─── Week View ───────────────────────────────────────────────────────────────

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const todayDateStr = todayStr();

  return (
    <div className="flex flex-col h-full min-h-0 gap-0">
      {/* ── View Switcher + Nav — inline in content, not in header ─────────── */}
      <div className="flex items-center justify-between flex-shrink-0 mb-3">
        {/* View pill tabs */}
        <PillTabs
          tabs={[
            { value: "month" as const, label: "Month" },
            { value: "week" as const, label: "Week" },
          ]}
          activeTab={viewMode}
          onChange={(v) => {
            setViewMode(v);
            setSelectedDay(null);
          }}
        />

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="calendar.pagination_prev"
            onClick={goPrev}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">
            {periodLabel}
          </span>
          <button
            type="button"
            data-ocid="calendar.pagination_next"
            onClick={goNext}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            data-ocid="calendar.today.button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-colors ml-1"
          >
            Today
          </button>
        </div>

        {/* Legend + timetable toggle */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <EventDot type="incident" /> Incident
          </span>
          <span className="flex items-center gap-1">
            <EventDot type="praise" /> Praise
          </span>
          <span className="flex items-center gap-1">
            <EventDot type="absence" /> Absent
          </span>
          <span className="flex items-center gap-1">
            <EventDot type="tardy" /> Tardy
          </span>
          <span className="flex items-center gap-1">
            <EventDot type="assignment" /> Assignment
          </span>
          <button
            type="button"
            data-ocid="calendar.timetable.toggle"
            onClick={() => setShowTimetableEvents((v) => !v)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
              showTimetableEvents
                ? "border-primary/30 bg-primary/5 text-primary/80"
                : "border-border bg-transparent text-muted-foreground/50"
            }`}
          >
            <EventDot type="class" /> Classes{" "}
            {showTimetableEvents ? "on" : "off"}
          </button>
        </div>
      </div>

      {/* ── Calendar Card ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
        {/* Day header row */}
        <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0"
            >
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAY_LABELS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* ── Month View ──────────────────────────────────────────────────── */}
        {viewMode === "month" && (
          <div
            className="flex-1 min-h-0 grid grid-cols-7 overflow-auto"
            style={{
              gridTemplateRows: `repeat(${monthGrid.length / 7}, minmax(80px, 1fr))`,
            }}
          >
            {monthGrid.map((date, pos) => {
              const dateStr = date ? toDateStr(date) : null;
              const cellKey = dateStr ?? `empty-${pos}`;
              const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : [];
              const isToday = dateStr === todayDateStr;
              const isSelected = dateStr === selectedDay;
              const isCurrentMonth = date
                ? date.getMonth() === currentDate.getMonth()
                : false;

              return (
                <div
                  key={cellKey}
                  role={date ? "button" : undefined}
                  tabIndex={date ? 0 : undefined}
                  data-ocid={date ? `calendar.item.${pos + 1}` : undefined}
                  onClick={() => {
                    if (!dateStr) return;
                    setSelectedDay(selectedDay === dateStr ? null : dateStr);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && dateStr) {
                      e.preventDefault();
                      setSelectedDay(selectedDay === dateStr ? null : dateStr);
                    }
                  }}
                  className={`border-b border-r border-border last:border-r-0 p-1.5 flex flex-col gap-1 transition-colors ${
                    !date
                      ? "bg-muted/20"
                      : isSelected
                        ? "bg-primary/5 ring-inset ring-1 ring-primary/30"
                        : "hover:bg-accent/40 cursor-pointer"
                  }`}
                >
                  {date && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                            isToday
                              ? "bg-primary text-primary-foreground font-bold"
                              : isCurrentMonth
                                ? "text-foreground"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap justify-end">
                            {/* Show up to 4 dots */}
                            {dayEvents.slice(0, 4).map((ev) => (
                              <EventDot key={ev.id} type={ev.type} />
                            ))}
                            {dayEvents.length > 4 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{dayEvents.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Show first 2 event labels on desktop */}
                      <div className="hidden lg:flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <EventChip key={ev.id} event={ev} />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Week View ───────────────────────────────────────────────────── */}
        {viewMode === "week" && (
          <div className="flex-1 min-h-0 grid grid-cols-7 overflow-auto">
            {weekDays.map((date) => {
              const dateStr = toDateStr(date);
              const dayEvents = eventsByDate[dateStr] ?? [];
              const isToday = dateStr === todayDateStr;

              return (
                <div
                  key={dateStr}
                  className={`border-r border-border last:border-r-0 flex flex-col ${
                    isToday ? "bg-primary/3" : ""
                  }`}
                >
                  {/* Day number header */}
                  <div
                    className={`flex flex-col items-center py-2 border-b border-border flex-shrink-0 ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    <span
                      className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events for the day */}
                  <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/40">
                          —
                        </span>
                      </div>
                    ) : (
                      dayEvents.map((ev) => (
                        <EventChip key={ev.id} event={ev} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Selected Day Panel (month view only, inline below calendar) ─────── */}
      {viewMode === "month" && selectedDay && (
        <div
          className="flex-shrink-0 bg-card rounded-xl border border-border shadow-sm mt-3 p-4"
          data-ocid="calendar.panel"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CalendarIcon size={14} className="text-primary" />
              {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <button
              type="button"
              data-ocid="calendar.close_button"
              onClick={() => setSelectedDay(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
            >
              Close
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <div
              className="flex flex-col items-center py-6 text-muted-foreground"
              data-ocid="calendar.empty_state"
            >
              <Activity size={20} className="mb-2 opacity-40" />
              <p className="text-sm">No events on this day</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((ev, i) => {
                const typeLabel: Record<CalendarEvent["type"], string> = {
                  incident: "Incident",
                  praise: "Praise",
                  absence: "Absence",
                  tardy: "Tardy",
                  assignment: "Assignment Due",
                  class: "Class",
                };
                const typeStyle: Record<CalendarEvent["type"], string> = {
                  incident:
                    "bg-destructive/10 text-destructive border-destructive/20",
                  praise: "bg-success/10 text-success border-success/20",
                  absence: "bg-info/10 text-info border-info/20",
                  tardy:
                    "bg-warning/10 text-warning-foreground border-warning/20",
                  assignment: "bg-primary/10 text-primary border-primary/30",
                  class: "bg-primary/5 text-primary/70 border-primary/15",
                };

                return (
                  <div
                    key={ev.id}
                    data-ocid={`calendar.event.item.${i + 1}`}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${typeStyle[ev.type]}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                          {typeLabel[ev.type]}
                        </span>
                        {ev.type === "assignment" ? (
                          <span className="text-xs font-medium">
                            {ev.label}
                          </span>
                        ) : (
                          ev.studentName && (
                            <span className="text-xs font-medium">
                              {ev.studentName}
                            </span>
                          )
                        )}
                      </div>
                      {ev.type !== "assignment" && ev.label && (
                        <p className="text-xs opacity-80 truncate">
                          {ev.label}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
