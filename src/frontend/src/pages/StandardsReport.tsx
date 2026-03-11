import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Loader2, Printer, Star, User } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAllAssessments,
  useAllAssignments,
  useGetAllStudents,
  useGetCourses,
  useGetUnits,
} from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Standard {
  id: string;
  code: string;
  description: string;
  subject: string;
}

type Rating = "exceeds" | "meets" | "approaching" | "below" | null;

interface StandardRating {
  studentId: string;
  standardId: string;
  rating: Rating;
  comment: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadRatings(): StandardRating[] {
  try {
    const raw = localStorage.getItem("edunite_standards_ratings");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRatings(ratings: StandardRating[]) {
  localStorage.setItem("edunite_standards_ratings", JSON.stringify(ratings));
}

function getDisplayName(student: {
  givenNames?: string;
  familyName?: string;
  preferredName?: string;
}): string {
  const given = student.preferredName || student.givenNames || "";
  const family = student.familyName || "";
  return `${given} ${family}`.trim() || "Unknown";
}

const RATING_OPTIONS: {
  value: NonNullable<Rating>;
  label: string;
  short: string;
  selectedClass: string;
  unselectedClass: string;
}[] = [
  {
    value: "exceeds",
    label: "Exceeds Expectations",
    short: "Exceeds",
    selectedClass: "bg-emerald-600 text-white border-emerald-600",
    unselectedClass:
      "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50",
  },
  {
    value: "meets",
    label: "Meets Expectations",
    short: "Meets",
    selectedClass: "bg-blue-600 text-white border-blue-600",
    unselectedClass:
      "border-border text-muted-foreground hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50",
  },
  {
    value: "approaching",
    label: "Approaching",
    short: "Approaching",
    selectedClass: "bg-amber-500 text-white border-amber-500",
    unselectedClass:
      "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50",
  },
  {
    value: "below",
    label: "Below Expectations",
    short: "Below",
    selectedClass: "bg-red-600 text-white border-red-600",
    unselectedClass:
      "border-border text-muted-foreground hover:border-red-400 hover:text-red-700 hover:bg-red-50",
  },
];

const DEFAULT_STANDARDS: Standard[] = [
  {
    id: "ELA.9-10.RI.1",
    code: "RI.9-10.1",
    description: "Cite strong and thorough textual evidence",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.RI.2",
    code: "RI.9-10.2",
    description:
      "Determine a central idea of a text and analyze its development",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.RI.3",
    code: "RI.9-10.3",
    description:
      "Analyze how the author unfolds an analysis or series of ideas",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.W.1",
    code: "W.9-10.1",
    description:
      "Write arguments to support claims with clear reasons and evidence",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.W.2",
    code: "W.9-10.2",
    description: "Write informative/explanatory texts",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.W.3",
    code: "W.9-10.3",
    description: "Write narratives to develop real or imagined experiences",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.SL.1",
    code: "SL.9-10.1",
    description: "Initiate and participate in collaborative discussions",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.SL.4",
    code: "SL.9-10.4",
    description: "Present information, findings, and supporting evidence",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.L.1",
    code: "L.9-10.1",
    description:
      "Demonstrate command of the conventions of standard English grammar",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.L.2",
    code: "L.9-10.2",
    description:
      "Demonstrate command of the conventions of standard English capitalization",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.L.4",
    code: "L.9-10.4",
    description:
      "Determine or clarify the meaning of unknown and multiple-meaning words",
    subject: "ELA",
  },
  {
    id: "ELA.9-10.L.5",
    code: "L.9-10.5",
    description: "Demonstrate understanding of figurative language and nuance",
    subject: "ELA",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StandardsReport() {
  const { data: students = [] } = useGetAllStudents();
  const { data: courses = [], isLoading: coursesLoading } = useGetCourses();
  const { data: allUnits = [] } = useGetUnits();
  const { data: allAssignments = [] } = useAllAssignments();
  const { data: allAssessments = [] } = useAllAssessments();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [ratings, setRatings] = useState<StandardRating[]>(() => loadRatings());

  // ─── Build standards list from real curriculum data ───────────────────────
  const standards = useMemo((): Standard[] => {
    const seen = new Set<string>();
    const result: Standard[] = [];

    // Build course id → course map for subject lookup
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    function addStd(
      stdRaw:
        | string
        | { id?: string; code?: string; description?: string; title?: string },
      subject: string,
    ) {
      const id =
        typeof stdRaw === "string"
          ? stdRaw
          : (stdRaw.id ?? stdRaw.code ?? String(stdRaw));
      if (!id || seen.has(id)) return;
      seen.add(id);
      result.push({
        id,
        code: typeof stdRaw === "string" ? stdRaw : (stdRaw.code ?? id),
        description:
          typeof stdRaw === "string"
            ? id
            : (stdRaw.description ?? stdRaw.title ?? id),
        subject,
      });
    }

    // Walk units for unit-level standards
    for (const unit of allUnits) {
      const course = courseMap.get(unit.courseId);
      const subject = course?.subject ?? course?.title ?? "General";
      for (const std of (
        unit as unknown as {
          standards?: (
            | string
            | { id?: string; code?: string; description?: string }
          )[];
        }
      ).standards ?? []) {
        addStd(
          std as string | { id?: string; code?: string; description?: string },
          subject,
        );
      }
    }

    // Walk assignments for assignment-level standards
    for (const assignment of allAssignments) {
      const unit = assignment.moduleId
        ? allUnits.find((u) => u.id === assignment.moduleId)
        : undefined;
      const course = unit
        ? courseMap.get(unit.courseId)
        : assignment.courseId
          ? courseMap.get(assignment.courseId)
          : undefined;
      const subject = course?.subject ?? course?.title ?? "General";
      for (const std of assignment.standards ?? []) {
        addStd(std, subject);
      }
    }

    // Walk assessments for assessment-level standards
    for (const assessment of allAssessments) {
      const unit = assessment.moduleId
        ? allUnits.find((u) => u.id === assessment.moduleId)
        : undefined;
      const course = unit
        ? courseMap.get(unit.courseId)
        : assessment.courseId
          ? courseMap.get(assessment.courseId)
          : undefined;
      const subject = course?.subject ?? course?.title ?? "General";
      for (const std of assessment.standards ?? []) {
        addStd(std, subject);
      }
    }

    // Fall back to defaults if no standards found in real data
    return result.length > 0 ? result : DEFAULT_STANDARDS;
  }, [courses, allUnits, allAssignments, allAssessments]);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) =>
        getDisplayName(s).toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [students, searchQuery],
  );

  const selectedStudent = students.find(
    (s) => s.studentId === selectedStudentId,
  );

  // Group standards by subject
  const standardsBySubject = useMemo(() => {
    const map = new Map<string, Standard[]>();
    for (const std of standards) {
      const subject = std.subject || "General";
      if (!map.has(subject)) map.set(subject, []);
      map.get(subject)!.push(std);
    }
    return map;
  }, [standards]);

  function getStudentRating(studentId: string, standardId: string): Rating {
    return (
      ratings.find(
        (r) => r.studentId === studentId && r.standardId === standardId,
      )?.rating ?? null
    );
  }

  function getStudentComment(studentId: string, standardId: string): string {
    return (
      ratings.find(
        (r) => r.studentId === studentId && r.standardId === standardId,
      )?.comment ?? ""
    );
  }

  function setRating(studentId: string, standardId: string, rating: Rating) {
    setRatings((prev) => {
      const idx = prev.findIndex(
        (r) => r.studentId === studentId && r.standardId === standardId,
      );
      const existing = prev[idx];
      const updated: StandardRating = {
        studentId,
        standardId,
        rating,
        comment: existing?.comment ?? "",
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        saveRatings(next);
        return next;
      }
      const next = [...prev, updated];
      saveRatings(next);
      return next;
    });
  }

  function setComment(studentId: string, standardId: string, comment: string) {
    setRatings((prev) => {
      const idx = prev.findIndex(
        (r) => r.studentId === studentId && r.standardId === standardId,
      );
      const existing = prev[idx];
      const updated: StandardRating = {
        studentId,
        standardId,
        rating: existing?.rating ?? null,
        comment,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        saveRatings(next);
        return next;
      }
      const next = [...prev, updated];
      saveRatings(next);
      return next;
    });
  }

  function getRatedCount(studentId: string): number {
    return ratings.filter((r) => r.studentId === studentId && r.rating !== null)
      .length;
  }

  const ratedCount = selectedStudentId ? getRatedCount(selectedStudentId) : 0;
  const progressPct =
    standards.length > 0
      ? Math.round((ratedCount / standards.length) * 100)
      : 0;

  let globalIndex = 0;

  return (
    <div className="flex gap-5 min-h-[600px]" data-ocid="standards.section">
      {/* Student List */}
      <div className="w-64 flex-shrink-0 space-y-3">
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
          data-ocid="standards.search_input"
        />
        <div className="space-y-0.5 max-h-[540px] overflow-y-auto pr-1">
          {filteredStudents.map((s) => {
            const rated = getRatedCount(s.studentId);
            const isSelected = s.studentId === selectedStudentId;
            return (
              <button
                key={s.studentId}
                type="button"
                onClick={() => setSelectedStudentId(s.studentId)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  <span className="truncate font-medium">
                    {getDisplayName(s)}
                  </span>
                </div>
                {rated > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {rated}/{standards.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Standards Panel */}
      <div className="flex-1 min-w-0">
        {!selectedStudent ? (
          <div
            className="flex flex-col items-center justify-center h-full text-muted-foreground py-20"
            data-ocid="standards.empty_state"
          >
            <Star className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">
              Select a student to view their standards report
            </p>
            <p className="text-sm mt-1 opacity-70">
              Choose a student from the list on the left
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {getDisplayName(selectedStudent)}
                  </h3>
                  {coursesLoading ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading standards from curriculum...
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {standards.length} standard
                      {standards.length !== 1 ? "s" : ""} from curriculum
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="gap-1.5"
                data-ocid="standards.print.button"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Report
              </Button>
            </div>

            {/* Summary strip */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Standards rated</span>
                <span className="font-semibold text-foreground">
                  {ratedCount} / {standards.length}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({progressPct}%)
                  </span>
                </span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                {RATING_OPTIONS.map((opt) => {
                  const count = ratings.filter(
                    (r) =>
                      r.studentId === selectedStudentId &&
                      r.rating === opt.value,
                  ).length;
                  return (
                    <span key={opt.value}>
                      <span className="font-medium text-foreground">
                        {count}
                      </span>{" "}
                      {opt.short}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Standards grouped by subject */}
            <div className="space-y-6" data-ocid="standards.list">
              {Array.from(standardsBySubject.entries()).map(
                ([subject, subjectStandards]) => (
                  <div key={subject}>
                    {/* Subject section header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                        {subject}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-xs text-muted-foreground">
                        {
                          subjectStandards.filter(
                            (s) =>
                              getStudentRating(selectedStudentId!, s.id) !==
                              null,
                          ).length
                        }
                        /{subjectStandards.length} rated
                      </span>
                    </div>

                    <div className="space-y-3">
                      {subjectStandards.map((std) => {
                        const itemIdx = ++globalIndex;
                        const currentRating = getStudentRating(
                          selectedStudentId!,
                          std.id,
                        );
                        const comment = getStudentComment(
                          selectedStudentId!,
                          std.id,
                        );
                        const isUnrated = currentRating === null;
                        return (
                          <div
                            key={std.id}
                            className={`border rounded-lg p-4 space-y-3 bg-card transition-colors ${
                              isUnrated ? "border-border/50" : "border-border"
                            }`}
                            data-ocid={`standards.item.${itemIdx}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-mono font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded">
                                    {std.code}
                                  </span>
                                  {isUnrated && (
                                    <span className="text-[10px] text-muted-foreground/60 italic">
                                      not yet rated
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-foreground mt-1.5 leading-snug">
                                  {std.description}
                                </p>
                              </div>
                            </div>

                            {/* Rating Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {RATING_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    setRating(
                                      selectedStudentId!,
                                      std.id,
                                      currentRating === opt.value
                                        ? null
                                        : opt.value,
                                    )
                                  }
                                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                                    currentRating === opt.value
                                      ? opt.selectedClass
                                      : opt.unselectedClass
                                  }`}
                                  data-ocid="standards.rating.toggle"
                                >
                                  {opt.short}
                                </button>
                              ))}
                            </div>

                            {/* Optional Comment */}
                            <Textarea
                              placeholder="Add a comment (optional)..."
                              value={comment}
                              onChange={(e) =>
                                setComment(
                                  selectedStudentId!,
                                  std.id,
                                  e.target.value,
                                )
                              }
                              className="text-xs resize-none h-14 min-h-0"
                              data-ocid="standards.textarea"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
