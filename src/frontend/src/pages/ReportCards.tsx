import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Database,
  Loader2,
  Lock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Student } from "../backend";
import CommentBankPanel from "../components/reports/CommentBankPanel";
import { useGetAllStudents } from "../hooks/useQueries";
import { getCurrentPeriod, getFinalizedPeriods } from "../lib/gradingPeriods";
import { getGradingPeriods } from "../lib/gradingPeriods";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CitizenshipMark =
  | "Excellent"
  | "Good"
  | "Satisfactory"
  | "Needs Improvement"
  | "";

export interface CitizenshipMarks {
  workHabits: CitizenshipMark;
  respectsOthers: CitizenshipMark;
  followsDirections: CitizenshipMark;
  worksIndependently: CitizenshipMark;
}

export interface ReportCard {
  id: number;
  studentName: string;
  gradeLevel: string;
  course: string;
  gradingPeriod: string;
  teacherComment: string;
  citizenshipMarks: CitizenshipMarks;
  status: "draft" | "final" | "sent";
  parentAcknowledged: boolean;
  generatedAt: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const REPORT_CARDS_KEY = "edunite_report_cards";

function getReportCards(): ReportCard[] {
  try {
    const raw = localStorage.getItem(REPORT_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReportCard[];
    // Migrate old records without citizenshipMarks
    return parsed.map((rc) => ({
      ...rc,
      citizenshipMarks: rc.citizenshipMarks ?? {
        workHabits: "",
        respectsOthers: "",
        followsDirections: "",
        worksIndependently: "",
      },
    }));
  } catch {
    return [];
  }
}

function saveReportCards(cards: ReportCard[]): void {
  localStorage.setItem(REPORT_CARDS_KEY, JSON.stringify(cards));
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportCard["status"] }) {
  const cls =
    status === "sent"
      ? "bg-green-100 text-green-700 border-green-200"
      : status === "final"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <Badge variant="outline" className={`text-xs capitalize ${cls}`}>
      {status}
    </Badge>
  );
}

// ─── Student Format ───────────────────────────────────────────────────────────

function formatStudentLabel(student: Student): string {
  const preferred = student.preferredName ?? "";
  const given = student.givenNames;
  const family = student.familyName;
  if (preferred) return `${family}, ${preferred} (${given})`;
  return `${family}, ${given}`;
}

// ─── Citizenship Mark Select Row ──────────────────────────────────────────────

const CITIZENSHIP_ROWS: {
  key: keyof CitizenshipMarks;
  label: string;
}[] = [
  { key: "workHabits", label: "Work Habits" },
  { key: "respectsOthers", label: "Respects Others" },
  { key: "followsDirections", label: "Follows Directions" },
  { key: "worksIndependently", label: "Works Independently" },
];

// Star rating: Excellent=4, Good=3, Satisfactory=2, Needs Improvement=1
const MARK_TO_STARS: Record<CitizenshipMark, number> = {
  Excellent: 4,
  Good: 3,
  Satisfactory: 2,
  "Needs Improvement": 1,
  "": 0,
};
const STARS_TO_MARK: Record<number, CitizenshipMark> = {
  4: "Excellent",
  3: "Good",
  2: "Satisfactory",
  1: "Needs Improvement",
  0: "",
};

function CitizenshipMarkRow({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: CitizenshipMark;
  onChange: (v: CitizenshipMark) => void;
  id: string;
}) {
  const currentStars = MARK_TO_STARS[value] ?? 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-foreground min-w-[160px]">{label}</span>
      <div className="flex items-center gap-1" title={value || "Not set"}>
        {[1, 2, 3, 4].map((star) => {
          const filled = star <= currentStars;
          const markForStar = STARS_TO_MARK[star];
          return (
            <button
              key={star}
              type="button"
              onClick={() =>
                onChange(currentStars === star ? "" : STARS_TO_MARK[star])
              }
              className={`transition-colors ${filled ? "text-amber-400 hover:text-amber-500" : "text-muted-foreground/30 hover:text-amber-300"}`}
              title={markForStar}
              aria-label={`${label}: ${markForStar}`}
              data-ocid={`report_cards.citizenship.${id}.toggle`}
            >
              <svg
                className="h-5 w-5"
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                role="img"
              >
                <title>{markForStar}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={filled ? 0 : 1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          );
        })}
        {value && (
          <span className="ml-1 text-[11px] text-muted-foreground">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Citizenship Marks Summary for table ─────────────────────────────────────

function CitizenshipSummary({ marks }: { marks: CitizenshipMarks }) {
  const set = Object.values(marks).filter(Boolean);
  if (set.length === 0) return null;
  const abbrev: Record<string, string> = {
    Excellent: "E",
    Good: "G",
    Satisfactory: "S",
    "Needs Improvement": "NI",
  };
  return (
    <div className="flex gap-1">
      {CITIZENSHIP_ROWS.map(({ key, label }) => {
        const v = marks[key];
        if (!v) return null;
        return (
          <span
            key={key}
            title={`${label}: ${v}`}
            className={`text-xs px-1.5 py-0.5 rounded font-mono font-semibold ${
              v === "Excellent"
                ? "bg-green-100 text-green-700"
                : v === "Good"
                  ? "bg-blue-100 text-blue-700"
                  : v === "Satisfactory"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
            }`}
          >
            {abbrev[v]}
          </span>
        );
      })}
    </div>
  );
}

// ─── Report Card Builder Form ─────────────────────────────────────────────────

function ReportCardBuilder({
  onCreated,
  onCancel,
}: {
  onCreated: (card: ReportCard) => void;
  onCancel: () => void;
}) {
  const { data: students = [], isLoading: studentsLoading } =
    useGetAllStudents();
  const periods = getGradingPeriods();

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [gradingPeriod, setGradingPeriod] = useState(periods[0]?.label ?? "Q1");
  const [course, setCourse] = useState("");
  const [teacherComment, setTeacherComment] = useState("");
  const [showCommentBank, setShowCommentBank] = useState(false);
  const [citizenshipMarks, setCitizenshipMarks] = useState<CitizenshipMarks>({
    workHabits: "",
    respectsOthers: "",
    followsDirections: "",
    worksIndependently: "",
  });
  const [parentAcknowledged, setParentAcknowledged] = useState(false);
  const [status, setStatus] = useState<ReportCard["status"]>("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    student?: string;
    course?: string;
  }>({});

  const selectedStudent =
    students.find((s) => s.studentId === selectedStudentId) ?? null;

  const filteredStudents = students.filter((s) =>
    formatStudentLabel(s).toLowerCase().includes(studentSearch.toLowerCase()),
  );

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!selectedStudentId) newErrors.student = "Please select a student.";
    if (!course.trim()) newErrors.course = "Course name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const student = students.find((s) => s.studentId === selectedStudentId);
    if (!student) return;

    const card: ReportCard = {
      id: Date.now(),
      studentName: student.preferredName
        ? `${student.preferredName} ${student.familyName}`
        : `${student.givenNames} ${student.familyName}`,
      gradeLevel: student.gradeLevel,
      course: course.trim(),
      gradingPeriod,
      teacherComment: teacherComment.trim(),
      citizenshipMarks,
      status,
      parentAcknowledged,
      generatedAt: Date.now(),
    };

    const existing = getReportCards();
    saveReportCards([card, ...existing]);

    setIsSaving(false);
    toast.success("Report card created");
    onCreated(card);
  }

  return (
    <div className="bg-card border border-border rounded-lg mb-6 overflow-hidden">
      {/* Form Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            New Report Card
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official end-of-period student record
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Cancel"
          data-ocid="report_cards.form.cancel_button"
        >
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {/* Student */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Student <span className="text-destructive">*</span>
            </Label>
            {selectedStudentId && (
              <span
                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                data-ocid="report_cards.form.student.auto_filled.card"
              >
                <Database size={10} />
                Auto-filled from system
              </span>
            )}
          </div>
          <div className="relative">
            {selectedStudent ? (
              <div
                className="flex items-center gap-2 h-9 px-3 border border-border rounded-md bg-background"
                data-ocid="report_cards.form.student.select"
              >
                <button
                  type="button"
                  className="text-sm text-foreground flex-1 text-left truncate"
                  onClick={() => {
                    setSelectedStudentId("");
                    setStudentSearch("");
                    setStudentDropdownOpen(true);
                  }}
                >
                  {formatStudentLabel(selectedStudent)}
                </button>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {selectedStudent.gradeLevel}
                </Badge>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId("");
                    setStudentSearch("");
                  }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    studentsLoading ? "Loading students…" : "Search by name…"
                  }
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentDropdownOpen(true);
                  }}
                  onFocus={() => setStudentDropdownOpen(true)}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={studentsLoading}
                  autoComplete="off"
                  data-ocid="report_cards.form.student.select"
                />
                {studentDropdownOpen && filteredStudents.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.studentId}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedStudentId(s.studentId);
                          setStudentSearch("");
                          setStudentDropdownOpen(false);
                          setErrors((p) => ({ ...p, student: undefined }));
                        }}
                      >
                        <span className="flex-1">{formatStudentLabel(s)}</span>
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          {s.gradeLevel}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.student && (
            <p
              className="text-xs text-destructive"
              data-ocid="report_cards.form.student.error_state"
            >
              {errors.student}
            </p>
          )}
        </div>

        {/* Grading Period + Course row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Grading Period
            </Label>
            <Select value={gradingPeriod} onValueChange={setGradingPeriod}>
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="report_cards.form.period.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.label}>
                    {p.label}
                    {p.startDate && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({p.startDate} – {p.endDate})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Course <span className="text-destructive">*</span>
            </Label>
            <input
              type="text"
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                if (errors.course)
                  setErrors((p) => ({ ...p, course: undefined }));
              }}
              placeholder="e.g. English 10"
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.course && (
              <p className="text-xs text-destructive">{errors.course}</p>
            )}
          </div>
        </div>

        {/* Teacher Comment */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Teacher Comment
            </Label>
            <button
              type="button"
              onClick={() => setShowCommentBank((v) => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              data-ocid="report_cards.form.comment_bank.toggle"
            >
              Comment Bank
              {showCommentBank ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
          <Textarea
            value={teacherComment}
            onChange={(e) => setTeacherComment(e.target.value)}
            placeholder="Official teacher comment for this grading period..."
            rows={4}
            className="text-sm resize-none"
            data-ocid="report_cards.form.comment.textarea"
          />
          <div className="flex justify-end mt-0.5">
            <span
              className={`text-[10px] tabular-nums ${teacherComment.length > 500 ? "text-amber-600 font-semibold" : "text-muted-foreground/60"}`}
            >
              {teacherComment.length}/500
              {teacherComment.length > 500 && " — consider shortening"}
            </span>
          </div>
          {showCommentBank && (
            <CommentBankPanel
              onInsert={(text) => {
                setTeacherComment(text);
                setShowCommentBank(false);
              }}
            />
          )}
        </div>

        {/* Citizenship / Effort Marks */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Citizenship &amp; Effort Marks
          </Label>
          <div className="space-y-2.5">
            {CITIZENSHIP_ROWS.map(({ key, label }) => (
              <CitizenshipMarkRow
                key={key}
                id={key}
                label={label}
                value={citizenshipMarks[key]}
                onChange={(v) =>
                  setCitizenshipMarks((prev) => ({ ...prev, [key]: v }))
                }
              />
            ))}
          </div>
        </div>

        {/* Status + Parent Acknowledged row */}
        <div className="flex items-center gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Status
            </Label>
            <div className="flex items-center gap-3 h-9">
              {(["draft", "final", "sent"] as ReportCard["status"][]).map(
                (s) => (
                  <label
                    key={s}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-card-status"
                      value={s}
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">
                      {s}
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <label
            htmlFor="parent-ack"
            className="flex items-center gap-2 cursor-pointer mt-5"
          >
            <Checkbox
              id="parent-ack"
              checked={parentAcknowledged}
              onCheckedChange={(v) => setParentAcknowledged(!!v)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm text-foreground">Parent acknowledged</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-ocid="report_cards.form.submit_button"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Report Card"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground"
            data-ocid="report_cards.form.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportCards() {
  const [reportCards, setReportCards] = useState<ReportCard[]>(() =>
    getReportCards().sort((a, b) => b.generatedAt - a.generatedAt),
  );
  const [showBuilder, setShowBuilder] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  function handleCreated(card: ReportCard) {
    setReportCards((prev) => [card, ...prev]);
    setShowBuilder(false);
  }

  function handleDelete(id: number) {
    const updated = reportCards.filter((r) => r.id !== id);
    saveReportCards(updated);
    setReportCards(updated);
    setConfirmDeleteId(null);
    toast.success("Report card deleted");
  }

  const currentPeriod = getCurrentPeriod();
  const isCurrentPeriodFinalized = getFinalizedPeriods().includes(
    currentPeriod.id,
  );

  return (
    <div className="space-y-5">
      {/* Finalized period banner */}
      {isCurrentPeriodFinalized && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
          style={{
            backgroundColor: "oklch(0.96 0.05 145)",
            borderColor: "oklch(0.75 0.12 145)",
            color: "oklch(0.35 0.14 145)",
          }}
          data-ocid="report_cards.finalized_banner"
        >
          <Lock className="h-4 w-4 flex-shrink-0" />
          <p className="font-medium">
            {currentPeriod.label} grades are finalized — report cards are ready
            to generate.
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Report Cards
          </span>
          {reportCards.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {reportCards.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowBuilder((v) => !v)}
          variant={showBuilder ? "outline" : "default"}
          className="gap-1.5"
          data-ocid="report_cards.new_button"
        >
          {showBuilder ? (
            <>
              <X className="h-3.5 w-3.5" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> New Report Card
            </>
          )}
        </Button>
      </div>

      {/* Inline Builder */}
      {showBuilder && (
        <ReportCardBuilder
          onCreated={handleCreated}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {/* Report Cards Table */}
      {reportCards.length === 0 ? (
        <div
          className="py-16 text-center text-muted-foreground"
          data-ocid="report_cards.list.empty_state"
        >
          <BookmarkCheck className="h-10 w-10 mx-auto mb-3 opacity-25" />
          <p className="font-medium">No report cards yet</p>
          <p className="text-sm mt-1 opacity-70">
            Report cards are official end-of-period records. Create one above.
          </p>
        </div>
      ) : (
        <div
          className="bg-card border border-border rounded-lg overflow-hidden"
          data-ocid="report_cards.list.table"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Student
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Course
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Period
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Citizenship
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Generated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reportCards.map((rc, i) => (
                <tr
                  key={rc.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  data-ocid={`report_cards.list.item.${i + 1}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {rc.studentName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Grade {rc.gradeLevel}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{rc.course}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rc.gradingPeriod}
                  </td>
                  <td className="px-4 py-3">
                    <CitizenshipSummary marks={rc.citizenshipMarks} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rc.status} />
                    {rc.parentAcknowledged && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ✓ Ack
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(rc.generatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {confirmDeleteId === rc.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-destructive font-medium">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(rc.id)}
                            className="text-xs text-destructive hover:underline font-medium"
                            data-ocid={`report_cards.list.confirm_button.${i + 1}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-muted-foreground hover:underline"
                            data-ocid={`report_cards.list.cancel_button.${i + 1}`}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(rc.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete report card"
                          data-ocid={`report_cards.list.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
