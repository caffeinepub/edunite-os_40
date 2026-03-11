import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Edit2, Plus, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "edunite_timetable";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// ─── Canonical string-based schema (shared with Classes.tsx, Calendar.tsx) ──────

export interface TimetablePeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface TimetableAssignment {
  periodId: string;
  day: string; // "Monday"|"Tuesday"|...
  courseName: string;
  room?: string;
}

export interface TimetableData {
  periods: TimetablePeriod[];
  assignments: TimetableAssignment[];
}

const DEFAULT_DATA: TimetableData = {
  periods: [
    { id: "p1", name: "Period 1", startTime: "08:00", endTime: "09:00" },
    { id: "p2", name: "Period 2", startTime: "09:00", endTime: "10:00" },
    { id: "p3", name: "Period 3", startTime: "10:00", endTime: "11:00" },
    { id: "p4", name: "Period 4", startTime: "11:00", endTime: "12:00" },
    { id: "p5", name: "Period 5", startTime: "13:00", endTime: "14:00" },
    { id: "p6", name: "Period 6", startTime: "14:00", endTime: "15:00" },
  ],
  assignments: [
    {
      periodId: "p1",
      day: "Monday",
      courseName: "English 10",
      room: "Room 201",
    },
    {
      periodId: "p1",
      day: "Tuesday",
      courseName: "English 10",
      room: "Room 201",
    },
    {
      periodId: "p1",
      day: "Wednesday",
      courseName: "English 10",
      room: "Room 201",
    },
    {
      periodId: "p1",
      day: "Thursday",
      courseName: "English 10",
      room: "Room 201",
    },
    {
      periodId: "p1",
      day: "Friday",
      courseName: "English 10",
      room: "Room 201",
    },
    { periodId: "p3", day: "Monday", courseName: "Advisory", room: "Room 201" },
    {
      periodId: "p3",
      day: "Wednesday",
      courseName: "Advisory",
      room: "Room 201",
    },
    { periodId: "p3", day: "Friday", courseName: "Advisory", room: "Room 201" },
  ],
};

// ─── Migrate legacy numeric-id data on load ─────────────────────────────────────────

function migrateLegacyData(raw: unknown): TimetableData {
  const data = raw as any;
  if (!data || typeof data !== "object") return DEFAULT_DATA;

  const periods: TimetablePeriod[] = [];

  const numericToStringId: Record<number, string> = {};

  for (const p of data.periods ?? []) {
    const strId = typeof p.id === "number" ? `p${p.id}` : String(p.id);
    if (typeof p.id === "number") numericToStringId[p.id] = strId;
    periods.push({
      id: strId,
      name: p.name ?? "Period",
      startTime: p.startTime ?? "08:00",
      endTime: p.endTime ?? "09:00",
    });
  }

  const assignments: TimetableAssignment[] = [];
  for (const a of data.assignments ?? []) {
    // Legacy format: { periodId: number, dayOfWeek: number (0=Mon) }
    // New format:    { periodId: string, day: string ("Monday") }
    let periodId: string;
    if (typeof a.periodId === "number") {
      periodId = numericToStringId[a.periodId] ?? `p${a.periodId}`;
    } else {
      periodId = String(a.periodId);
    }

    let day: string;
    if (typeof a.day === "string" && DAYS.includes(a.day)) {
      day = a.day;
    } else if (typeof a.dayOfWeek === "number") {
      day = DAYS[a.dayOfWeek] ?? "Monday";
    } else {
      continue; // skip invalid
    }

    assignments.push({
      periodId,
      day,
      courseName: a.courseName ?? a.subject ?? "",
      room: a.room ?? "",
    });
  }

  return { periods, assignments };
}

function loadData(): TimetableData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Detect if it's already new format (string ids) or legacy (numeric)
      const firstPeriod = parsed?.periods?.[0];
      if (firstPeriod && typeof firstPeriod.id === "number") {
        // Legacy format — migrate and re-save
        const migrated = migrateLegacyData(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return parsed as TimetableData;
    }
  } catch {
    // ignore
  }
  return DEFAULT_DATA;
}

function saveData(data: TimetableData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Internal editor state types ──────────────────────────────────────────────────

interface CellKey {
  periodId: string;
  day: string;
}

interface EditingPeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function Timetable() {
  const [data, setData] = useState<TimetableData>(loadData);
  const [editingCell, setEditingCell] = useState<CellKey | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<EditingPeriod | null>(
    null,
  );
  const [cellDraft, setCellDraft] = useState({ courseName: "", room: "" });
  const courseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    if (editingCell && courseInputRef.current) {
      courseInputRef.current.focus();
    }
  }, [editingCell]);

  function getAssignment(
    periodId: string,
    day: string,
  ): TimetableAssignment | undefined {
    return data.assignments.find(
      (a) => a.periodId === periodId && a.day === day,
    );
  }

  function startEditCell(periodId: string, day: string) {
    const existing = getAssignment(periodId, day);
    setCellDraft({
      courseName: existing?.courseName ?? "",
      room: existing?.room ?? "",
    });
    setEditingCell({ periodId, day });
  }

  function commitCell() {
    if (!editingCell) return;
    const { periodId, day } = editingCell;
    setData((prev) => {
      const filtered = prev.assignments.filter(
        (a) => !(a.periodId === periodId && a.day === day),
      );
      const next: TimetableAssignment[] = [
        ...filtered,
        ...(cellDraft.courseName.trim()
          ? [
              {
                periodId,
                day,
                courseName: cellDraft.courseName.trim(),
                room: cellDraft.room.trim(),
              },
            ]
          : []),
      ];
      return { ...prev, assignments: next };
    });
    setEditingCell(null);
  }

  function cancelCell() {
    setEditingCell(null);
  }

  function startEditPeriod(period: TimetablePeriod) {
    setEditingPeriod({
      id: period.id,
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
    });
  }

  function commitPeriod() {
    if (!editingPeriod) return;
    setData((prev) => ({
      ...prev,
      periods: prev.periods.map((p) =>
        p.id === editingPeriod.id
          ? {
              ...p,
              name: editingPeriod.name,
              startTime: editingPeriod.startTime,
              endTime: editingPeriod.endTime,
            }
          : p,
      ),
    }));
    setEditingPeriod(null);
  }

  function cancelPeriod() {
    setEditingPeriod(null);
  }

  function addPeriod() {
    const existingNums = data.periods
      .map((p) => Number(p.id.replace(/\D/g, "")))
      .filter((n) => !Number.isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newId = `p${nextNum}`;
    const lastPeriod = data.periods[data.periods.length - 1];
    const startTime = lastPeriod?.endTime ?? "08:00";
    const [h, m] = startTime.split(":").map(Number);
    const endH = h + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
    setData((prev) => ({
      ...prev,
      periods: [
        ...prev.periods,
        { id: newId, name: `Period ${nextNum}`, startTime, endTime },
      ],
    }));
  }

  function deletePeriod(id: string) {
    setData((prev) => ({
      periods: prev.periods.filter((p) => p.id !== id),
      assignments: prev.assignments.filter((a) => a.periodId !== id),
    }));
  }

  const isEditingCell = (periodId: string, day: string) =>
    editingCell?.periodId === periodId && editingCell?.day === day;

  return (
    <div
      className="h-full overflow-auto"
      style={{ backgroundColor: "#F8F8FC" }}
      data-ocid="timetable.page"
    >
      <div className="p-6 min-w-[700px]">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Click any cell to assign a class. Click the pencil icon to edit
            period times.
          </p>
          <Button
            size="sm"
            onClick={addPeriod}
            className="gap-1.5"
            data-ocid="timetable.add_period.button"
          >
            <Plus size={14} />
            Add Period
          </Button>
        </div>

        {data.periods.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-border"
            data-ocid="timetable.empty_state"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "oklch(0.94 0.02 293)" }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.55 0.14 293)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Timetable"
                role="img"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No periods yet
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first period to start building your timetable.
            </p>
            <Button
              size="sm"
              onClick={addPeriod}
              data-ocid="timetable.empty.add_period.button"
            >
              <Plus size={14} className="mr-1.5" />
              Add Period
            </Button>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm">
            <table
              className="w-full border-collapse"
              data-ocid="timetable.table"
            >
              <thead>
                <tr>
                  <th
                    className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid oklch(0.92 0.01 293)",
                      backgroundColor: "oklch(0.97 0.01 293)",
                      width: "160px",
                      minWidth: "160px",
                    }}
                  >
                    Period
                  </th>
                  {DAYS.map((day, di) => (
                    <th
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                      style={{
                        padding: "12px 8px",
                        borderBottom: "1px solid oklch(0.92 0.01 293)",
                        borderLeft: "1px solid oklch(0.92 0.01 293)",
                        backgroundColor: "oklch(0.97 0.01 293)",
                      }}
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{DAY_SHORT[di]}</span>
                    </th>
                  ))}
                  <th
                    style={{
                      width: "40px",
                      borderBottom: "1px solid oklch(0.92 0.01 293)",
                      borderLeft: "1px solid oklch(0.92 0.01 293)",
                      backgroundColor: "oklch(0.97 0.01 293)",
                    }}
                  />
                </tr>
              </thead>
              <tbody>
                {data.periods.map((period, rowIdx) => {
                  const isEditingThisPeriod = editingPeriod?.id === period.id;
                  return (
                    <tr
                      key={period.id}
                      className="group/row"
                      style={{
                        borderBottom:
                          rowIdx < data.periods.length - 1
                            ? "1px solid oklch(0.93 0.01 293)"
                            : undefined,
                      }}
                      data-ocid={`timetable.row.${rowIdx + 1}`}
                    >
                      {/* Period label cell */}
                      <td
                        style={{
                          padding: "0 16px",
                          backgroundColor: "oklch(0.98 0.005 293)",
                          verticalAlign: "middle",
                        }}
                      >
                        {isEditingThisPeriod ? (
                          <div className="flex flex-col gap-1 py-2">
                            <Input
                              value={editingPeriod.name}
                              onChange={(e) =>
                                setEditingPeriod(
                                  (p) => p && { ...p, name: e.target.value },
                                )
                              }
                              className="h-7 text-xs font-medium"
                              placeholder="Period name"
                              data-ocid={`timetable.period.name.input.${rowIdx + 1}`}
                            />
                            <div className="flex gap-1 items-center">
                              <Input
                                type="time"
                                value={editingPeriod.startTime}
                                onChange={(e) =>
                                  setEditingPeriod(
                                    (p) =>
                                      p && { ...p, startTime: e.target.value },
                                  )
                                }
                                className="h-6 text-xs w-24"
                                data-ocid={`timetable.period.start.input.${rowIdx + 1}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                –
                              </span>
                              <Input
                                type="time"
                                value={editingPeriod.endTime}
                                onChange={(e) =>
                                  setEditingPeriod(
                                    (p) =>
                                      p && { ...p, endTime: e.target.value },
                                  )
                                }
                                className="h-6 text-xs w-24"
                                data-ocid={`timetable.period.end.input.${rowIdx + 1}`}
                              />
                            </div>
                            <div className="flex gap-1 mt-0.5">
                              <button
                                type="button"
                                onClick={commitPeriod}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded text-white font-medium"
                                style={{
                                  backgroundColor: "oklch(0.47 0.18 293)",
                                }}
                                data-ocid={`timetable.period.save.button.${rowIdx + 1}`}
                              >
                                <Save size={10} /> Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelPeriod}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded text-muted-foreground hover:text-foreground border border-border"
                                data-ocid={`timetable.period.cancel.button.${rowIdx + 1}`}
                              >
                                <X size={10} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 py-3">
                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                {period.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {period.startTime} – {period.endTime}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEditPeriod(period)}
                              className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-muted transition-all"
                              title="Edit period"
                              data-ocid={`timetable.period.edit.button.${rowIdx + 1}`}
                            >
                              <Edit2
                                size={12}
                                className="text-muted-foreground"
                              />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Day cells */}
                      {DAYS.map((day, dayIdx) => {
                        const assignment = getAssignment(period.id, day);
                        const isEditing = isEditingCell(period.id, day);
                        const hasCourse = !!assignment?.courseName;

                        return (
                          <td
                            key={day}
                            style={{
                              borderLeft: "1px solid oklch(0.93 0.01 293)",
                              padding: 0,
                              verticalAlign: "top",
                              minWidth: "120px",
                            }}
                            data-ocid={`timetable.cell.${rowIdx + 1}.${dayIdx + 1}`}
                          >
                            {isEditing ? (
                              <div className="p-2 flex flex-col gap-1.5">
                                <Input
                                  ref={courseInputRef}
                                  value={cellDraft.courseName}
                                  onChange={(e) =>
                                    setCellDraft((d) => ({
                                      ...d,
                                      courseName: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitCell();
                                    if (e.key === "Escape") cancelCell();
                                  }}
                                  placeholder="Course name"
                                  className="h-7 text-xs"
                                  data-ocid="timetable.cell.course.input"
                                />
                                <Input
                                  value={cellDraft.room}
                                  onChange={(e) =>
                                    setCellDraft((d) => ({
                                      ...d,
                                      room: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") commitCell();
                                    if (e.key === "Escape") cancelCell();
                                  }}
                                  placeholder="Room"
                                  className="h-7 text-xs"
                                  data-ocid="timetable.cell.room.input"
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitCell();
                                    }}
                                    className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded text-white font-medium"
                                    style={{
                                      backgroundColor: "oklch(0.47 0.18 293)",
                                    }}
                                    data-ocid="timetable.cell.save.button"
                                  >
                                    <Save size={10} /> Save
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      cancelCell();
                                    }}
                                    className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded text-muted-foreground hover:text-foreground border border-border"
                                    data-ocid="timetable.cell.cancel.button"
                                  >
                                    <X size={10} /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditCell(period.id, day)}
                                className={cn(
                                  "w-full h-full text-left p-2.5 transition-colors group/cell",
                                  hasCourse
                                    ? "hover:bg-primary/5"
                                    : "hover:bg-muted/50",
                                )}
                                style={{ minHeight: "60px" }}
                                data-ocid={`timetable.cell.edit.button.${rowIdx + 1}`}
                              >
                                {hasCourse ? (
                                  <>
                                    <div
                                      className="text-xs font-semibold leading-snug"
                                      style={{ color: "oklch(0.40 0.18 293)" }}
                                    >
                                      {assignment!.courseName}
                                    </div>
                                    {assignment!.room && (
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {assignment!.room}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40 group-hover/cell:text-muted-foreground transition-colors">
                                    + Add class
                                  </span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Delete period button */}
                      <td
                        style={{
                          borderLeft: "1px solid oklch(0.93 0.01 293)",
                          padding: "0 4px",
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => deletePeriod(period.id)}
                          className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete period"
                          data-ocid={`timetable.period.delete.button.${rowIdx + 1}`}
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add period inline footer */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                borderTop: "1px solid oklch(0.93 0.01 293)",
                backgroundColor: "oklch(0.98 0.005 293)",
              }}
            >
              <button
                type="button"
                onClick={addPeriod}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="timetable.footer.add_period.button"
              >
                <Plus size={13} />
                Add period
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
