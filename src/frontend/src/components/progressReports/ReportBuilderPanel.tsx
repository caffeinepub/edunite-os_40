import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Loader2, Users, X } from "lucide-react";
import { useState } from "react";
import type { Student } from "../../backend";
import { useGetAllStudents } from "../../hooks/useQueries";
import { useCreateReport } from "../../lib/progressReportStore";
import type {
  ProgressReport,
  ReportPeriod,
  ReportStatus,
} from "../../lib/progressReportTypes";

interface ReportBuilderPanelProps {
  onCancel: () => void;
  onCreated: (report: ProgressReport) => void;
}

const PERIOD_OPTIONS: ReportPeriod[] = [
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "Semester 1",
  "Semester 2",
  "Full Year",
  "Custom",
];

function formatStudentLabel(student: Student): string {
  const preferred = student.preferredName ?? "";
  const given = student.givenNames;
  const family = student.familyName;
  if (preferred) return `${family}, ${preferred} (${given})`;
  return `${family}, ${given}`;
}

export default function ReportBuilderPanel({
  onCancel,
  onCreated,
}: ReportBuilderPanelProps) {
  const { data: students = [], isLoading: studentsLoading } =
    useGetAllStudents();
  const createReport = useCreateReport();

  // Mode: single vs batch
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single mode state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [period, setPeriod] = useState<ReportPeriod>("Q1");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [status, setStatus] = useState<ReportStatus>("draft");
  const [includeSections, setIncludeSections] = useState({
    attendance: true,
    behavior: true,
    academic: true,
    standards: true,
    comments: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{ student?: string; period?: string }>(
    {},
  );

  // Batch mode state
  const [batchSearch, setBatchSearch] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [batchPeriod, setBatchPeriod] = useState<ReportPeriod>("Q1");
  const [batchStatus, setBatchStatus] = useState<ReportStatus>("draft");
  const [batchIncludeSections, setBatchIncludeSections] = useState({
    attendance: true,
    behavior: true,
    academic: true,
    standards: true,
    comments: true,
  });
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const selectedStudent =
    students.find((s) => s.studentId === selectedStudentId) ?? null;

  const filteredStudents = students.filter((s) => {
    const label = formatStudentLabel(s).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  const batchFilteredStudents = students.filter((s) =>
    formatStudentLabel(s).toLowerCase().includes(batchSearch.toLowerCase()),
  );

  function toggleSection(key: keyof typeof includeSections) {
    setIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleBatchSection(key: keyof typeof batchIncludeSections) {
    setBatchIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleBatchStudent(id: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllBatch() {
    setSelectedBatchIds(new Set(batchFilteredStudents.map((s) => s.studentId)));
  }

  function deselectAllBatch() {
    setSelectedBatchIds(new Set());
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!selectedStudentId) newErrors.student = "Please select a student.";
    if (period === "Custom" && (!customStart || !customEnd)) {
      newErrors.period =
        "Please enter both start and end dates for Custom period.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const student = students.find((s) => s.studentId === selectedStudentId);
    if (!student) return;
    const report = await createReport.mutateAsync({
      studentId: student.studentId,
      studentName: `${student.givenNames} ${student.familyName}`,
      gradeLevel: student.gradeLevel,
      period,
      customStartDate: period === "Custom" ? customStart : undefined,
      customEndDate: period === "Custom" ? customEnd : undefined,
      status,
      includeSections,
    });
    onCreated(report);
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBatchIds.size === 0) return;
    setBatchSubmitting(true);
    const selectedStudents = students.filter((s) =>
      selectedBatchIds.has(s.studentId),
    );
    setBatchProgress({ current: 0, total: selectedStudents.length });
    let lastReport: ProgressReport | null = null;
    for (let i = 0; i < selectedStudents.length; i++) {
      const student = selectedStudents[i];
      setBatchProgress({ current: i + 1, total: selectedStudents.length });
      lastReport = await createReport.mutateAsync({
        studentId: student.studentId,
        studentName: `${student.givenNames} ${student.familyName}`,
        gradeLevel: student.gradeLevel,
        period: batchPeriod,
        status: batchStatus,
        includeSections: batchIncludeSections,
      });
    }
    setBatchSubmitting(false);
    setBatchProgress({ current: 0, total: 0 });
    if (lastReport) onCreated(lastReport);
  }

  const sectionItems: { key: keyof typeof includeSections; label: string }[] = [
    { key: "attendance", label: "Attendance Summary" },
    { key: "behavior", label: "Behavior Summary" },
    { key: "academic", label: "Academic Progress" },
    { key: "standards", label: "Standards Mastery" },
    { key: "comments", label: "Teacher Comments" },
  ];

  return (
    <div
      className="border border-border rounded-lg bg-card mb-6"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            New Progress Report
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure and generate a student progress report
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close builder"
          data-ocid="progress_reports.builder.cancel_button"
        >
          <X size={15} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1.5 px-6 pt-5">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "single"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="progress_reports.builder.mode_single.toggle"
        >
          Single Student
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === "batch"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
          data-ocid="progress_reports.builder.mode_batch.toggle"
        >
          <Users size={12} />
          Multiple Students
        </button>
      </div>

      {/* ── Single mode ─────────────────────────────────────────────────── */}
      {mode === "single" && (
        <form onSubmit={handleSingleSubmit} className="px-6 py-5 space-y-6">
          {/* Student selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="student-search"
              className="text-sm font-medium text-foreground"
            >
              Student <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              {selectedStudent ? (
                <div
                  className="flex items-center gap-2 h-9 px-3 border border-border rounded-md bg-background hover:border-border-strong transition-colors"
                  data-ocid="progress_reports.builder.student_select"
                >
                  <button
                    type="button"
                    className="text-sm text-foreground flex-1 truncate text-left"
                    onClick={() => {
                      setSelectedStudentId("");
                      setSearchQuery("");
                      setDropdownOpen(true);
                    }}
                  >
                    {formatStudentLabel(selectedStudent)}
                  </button>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 flex-shrink-0"
                  >
                    {selectedStudent.gradeLevel}
                  </Badge>
                  <button
                    type="button"
                    aria-label="Clear student selection"
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5 rounded"
                    onClick={() => {
                      setSelectedStudentId("");
                      setSearchQuery("");
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="student-search"
                    placeholder={
                      studentsLoading ? "Loading students…" : "Search by name…"
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="h-9 text-sm"
                    disabled={studentsLoading}
                    autoComplete="off"
                    data-ocid="progress_reports.builder.student_select"
                  />
                  {dropdownOpen && filteredStudents.length > 0 && (
                    <div
                      className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto"
                      style={{ boxShadow: "var(--shadow-md)" }}
                    >
                      {filteredStudents.map((s) => (
                        <button
                          key={s.studentId}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedStudentId(s.studentId);
                            setSearchQuery("");
                            setDropdownOpen(false);
                            setErrors((prev) => ({
                              ...prev,
                              student: undefined,
                            }));
                          }}
                        >
                          <span className="flex-1">
                            {formatStudentLabel(s)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {s.gradeLevel}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen &&
                    searchQuery &&
                    filteredStudents.length === 0 && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md px-3 py-3 text-sm text-muted-foreground">
                        No students match "{searchQuery}"
                      </div>
                    )}
                </div>
              )}
            </div>
            {errors.student && (
              <p
                className="text-xs text-destructive"
                data-ocid="progress_reports.builder.error_state"
              >
                {errors.student}
              </p>
            )}
          </div>

          {/* Period + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Report Period <span className="text-destructive">*</span>
              </Label>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as ReportPeriod)}
              >
                <SelectTrigger
                  className="h-9 text-sm"
                  data-ocid="progress_reports.builder.period_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Status
              </Label>
              <div
                className="flex items-center gap-4 h-9"
                data-ocid="progress_reports.builder.status_radio"
              >
                {(["draft", "final"] as ReportStatus[]).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="report-status"
                      value={s}
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Custom date range */}
          {period === "Custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  End Date
                </Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              {errors.period && (
                <p className="col-span-2 text-xs text-destructive">
                  {errors.period}
                </p>
              )}
            </div>
          )}

          {/* Include sections */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Include Sections
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
              {sectionItems.map(({ key, label }) => (
                <label
                  key={key}
                  htmlFor={`section-${key}`}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <Checkbox
                    id={`section-${key}`}
                    checked={includeSections[key]}
                    onCheckedChange={() => toggleSection(key)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button
              type="submit"
              size="sm"
              disabled={createReport.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="progress_reports.builder.submit_button"
            >
              {createReport.isPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground"
              data-ocid="progress_reports.builder.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* ── Batch mode ──────────────────────────────────────────────────── */}
      {mode === "batch" && (
        <form onSubmit={handleBatchSubmit} className="px-6 py-5 space-y-5">
          {/* Student checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Select Students
              </Label>
              <div className="flex items-center gap-2">
                {selectedBatchIds.size > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    data-ocid="progress_reports.batch.count.card"
                  >
                    {selectedBatchIds.size} selected
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={selectAllBatch}
                  className="text-xs text-primary hover:underline font-medium"
                  data-ocid="progress_reports.batch.select_all.button"
                >
                  Select All
                </button>
                <span className="text-muted-foreground/40">·</span>
                <button
                  type="button"
                  onClick={deselectAllBatch}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  data-ocid="progress_reports.batch.deselect_all.button"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search */}
            <Input
              placeholder="Filter students by name…"
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              className="h-8 text-sm"
              data-ocid="progress_reports.batch.search_input"
            />

            {/* Checklist */}
            <div className="border border-border rounded-md bg-background max-h-52 overflow-y-auto divide-y divide-border">
              {batchFilteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                  No students match your search.
                </p>
              ) : (
                batchFilteredStudents.map((s, i) => (
                  <label
                    key={s.studentId}
                    htmlFor={`batch-student-${s.studentId}`}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                    data-ocid={`progress_reports.batch.student.item.${i + 1}`}
                  >
                    <Checkbox
                      id={`batch-student-${s.studentId}`}
                      checked={selectedBatchIds.has(s.studentId)}
                      onCheckedChange={() => toggleBatchStudent(s.studentId)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      data-ocid={`progress_reports.batch.student.checkbox.${i + 1}`}
                    />
                    <span className="text-sm text-foreground flex-1">
                      {formatStudentLabel(s)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {s.gradeLevel}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Batch period + status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Report Period
              </Label>
              <Select
                value={batchPeriod}
                onValueChange={(v) => setBatchPeriod(v as ReportPeriod)}
              >
                <SelectTrigger
                  className="h-9 text-sm"
                  data-ocid="progress_reports.batch.period_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Status
              </Label>
              <div className="flex items-center gap-4 h-9">
                {(["draft", "final"] as ReportStatus[]).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="batch-status"
                      value={s}
                      checked={batchStatus === s}
                      onChange={() => setBatchStatus(s)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground capitalize">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Batch include sections */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Include Sections
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
              {sectionItems.map(({ key, label }) => (
                <label
                  key={key}
                  htmlFor={`batch-section-${key}`}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <Checkbox
                    id={`batch-section-${key}`}
                    checked={batchIncludeSections[key]}
                    onCheckedChange={() => toggleBatchSection(key)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Button
              type="submit"
              size="sm"
              disabled={selectedBatchIds.size === 0 || batchSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="progress_reports.batch.submit_button"
            >
              {batchSubmitting ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  {batchProgress.total > 0
                    ? `Generating ${batchProgress.current} of ${batchProgress.total}…`
                    : "Generating…"}
                </>
              ) : (
                `Generate ${selectedBatchIds.size > 0 ? selectedBatchIds.size : ""} Report${selectedBatchIds.size !== 1 ? "s" : ""}`
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground"
              data-ocid="progress_reports.batch.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
