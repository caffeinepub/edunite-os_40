import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Search, Upload, UserPlus, X } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import type { Student } from "../backend";
import { AddStudentForm } from "../components/students/AddStudentForm";
import { BulkImportCSVPanel } from "../components/students/BulkImportCSVPanel";
import FilterBar from "../components/students/FilterBar";
import MoreFiltersPanel, {
  type AdvancedFilters,
  DEFAULT_ADVANCED_FILTERS,
  countActiveAdvancedFilters,
} from "../components/students/MoreFiltersPanel";
import PaginationControls from "../components/students/PaginationControls";
import { StudentListItem } from "../components/students/StudentListItem";
import StudentListItemSkeleton from "../components/students/StudentListItemSkeleton";
import { useAppUI } from "../context/AppUIContext";
import { useGetAllStudents, useSeedStudents } from "../hooks/useQueries";
import {
  getGradeTrendLabel,
  hasDoNotContactFlag,
  hasMissingWorkFlag,
} from "../utils/studentDerived";

const ITEMS_PER_PAGE = 25;

// Derive attendance risk from attendance records
function getAttendanceRisk(
  student: Student,
): "On Track" | "At Risk" | "Critical" {
  const records = student.attendanceRecords;
  if (records.length === 0) return "On Track";
  const absences = records.filter((r) => r.status === "absent").length;
  const ratio = absences / records.length;
  if (ratio >= 0.2) return "Critical";
  if (ratio >= 0.1) return "At Risk";
  return "On Track";
}

function applyFilters(
  students: Student[],
  searchQuery: string,
  selectedGrades: string[],
  selectedClasses: string[],
  advanced: AdvancedFilters,
): Student[] {
  return students.filter((student) => {
    const fullName =
      `${student.givenNames} ${student.familyName}`.toLowerCase();
    const preferred = (student.preferredName ?? "").toLowerCase();
    const query = searchQuery.toLowerCase();

    // Search
    if (
      searchQuery &&
      !fullName.includes(query) &&
      !preferred.includes(query) &&
      !student.studentId.toLowerCase().includes(query)
    ) {
      return false;
    }

    // Grade filter — FilterBar uses '1st', '2nd' etc. but backend stores '1', '2'
    if (selectedGrades.length > 0) {
      const gradeMap: Record<string, string> = {
        K: "K",
        "1st": "1",
        "2nd": "2",
        "3rd": "3",
        "4th": "4",
        "5th": "5",
        "6th": "6",
        "7th": "7",
        "8th": "8",
        "9th": "9",
        "10th": "10",
        "11th": "11",
        "12th": "12",
      };
      const mappedGrades = selectedGrades.map((g) => gradeMap[g] ?? g);
      if (!mappedGrades.includes(student.gradeLevel)) return false;
    }

    // Class filter (gradeLevel used as class identifier)
    if (
      selectedClasses.length > 0 &&
      !selectedClasses.includes(student.gradeLevel)
    ) {
      return false;
    }

    // Advanced: Status — seed data doesn't have a status field so we treat all
    // students as "Active". "Inactive" and "Transferred" will show no results
    // until those statuses are tracked on the student record.
    if (advanced.status !== null) {
      // All seed/current students are implicitly "Active"
      const studentStatus = "Active";
      if (studentStatus !== advanced.status) return false;
    }

    // Advanced: Accommodations
    if (
      advanced.hasAccommodations === "Yes" &&
      student.accommodations.length === 0
    )
      return false;
    if (
      advanced.hasAccommodations === "No" &&
      student.accommodations.length > 0
    )
      return false;

    // Advanced: Allergies
    if (advanced.hasAllergies === "Yes" && student.allergies.length === 0)
      return false;
    if (advanced.hasAllergies === "No" && student.allergies.length > 0)
      return false;

    // Advanced: Medical Notes
    if (advanced.hasMedicalNotes === "Yes" && !student.medicalNotes.trim())
      return false;
    if (advanced.hasMedicalNotes === "No" && student.medicalNotes.trim())
      return false;

    // Advanced: Attendance Risk
    if (advanced.attendanceRisk !== null) {
      const risk = getAttendanceRisk(student);
      if (risk !== advanced.attendanceRisk) return false;
    }

    // Advanced: Recent Incidents (behavior entries)
    if (advanced.recentIncidents !== null) {
      const now = new Date();
      if (advanced.recentIncidents === "None") {
        if (student.behaviorEntries.length > 0) return false;
      } else {
        const days = advanced.recentIncidents === "Last 7 days" ? 7 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const hasRecent = student.behaviorEntries.some(
          (e) => new Date(e.date) >= cutoff,
        );
        if (!hasRecent) return false;
      }
    }

    // Advanced: Behavior Flag
    if (advanced.behaviorFlag === "Yes" && student.behaviorEntries.length === 0)
      return false;
    if (advanced.behaviorFlag === "No" && student.behaviorEntries.length > 0)
      return false;

    // Advanced: Parent Contact on File
    if (
      advanced.hasParentContact === "Yes" &&
      student.guardianContacts.length === 0
    )
      return false;
    if (
      advanced.hasParentContact === "No" &&
      student.guardianContacts.length > 0
    )
      return false;

    // Advanced: Grade Trend
    if (advanced.gradeTrend !== null) {
      const trend = getGradeTrendLabel(student.studentId);
      if (trend !== advanced.gradeTrend) return false;
    }

    // Advanced: Missing Work
    if (advanced.hasMissingWork === "Yes" && !hasMissingWorkFlag(student))
      return false;
    if (advanced.hasMissingWork === "No" && hasMissingWorkFlag(student))
      return false;

    // Advanced: Do Not Contact
    if (advanced.doNotContact === "Yes" && !hasDoNotContactFlag(student))
      return false;
    if (advanced.doNotContact === "No" && hasDoNotContactFlag(student))
      return false;

    return true;
  });
}

type ViewMode = "list" | "add-student" | "edit-student" | "bulk-import";

export default function Students() {
  const navigate = useNavigate();
  const { data: students = [], isLoading } = useGetAllStudents();
  const seedStudents = useSeedStudents();
  const { setHideFAB, setModuleNameOverride } = useAppUI();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    DEFAULT_ADVANCED_FILTERS,
  );
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Sync FAB visibility and header title with current view mode
  useEffect(() => {
    const isFormMode =
      viewMode === "add-student" ||
      viewMode === "edit-student" ||
      viewMode === "bulk-import";
    setHideFAB(isFormMode);
    if (viewMode === "add-student") {
      setModuleNameOverride("Add New Student");
    } else if (viewMode === "edit-student" && editingStudent) {
      setModuleNameOverride("Edit Student");
    } else {
      setModuleNameOverride(null);
    }
    return () => {
      setHideFAB(false);
      setModuleNameOverride(null);
    };
  }, [viewMode, editingStudent, setHideFAB, setModuleNameOverride]);

  // Auto-seed if no students — store mutate in a ref so the effect deps stay stable
  const seedMutateRef = React.useRef(seedStudents.mutate);
  seedMutateRef.current = seedStudents.mutate;
  const seedCalledRef = React.useRef(false);
  useEffect(() => {
    if (!isLoading && students.length === 0 && !seedCalledRef.current) {
      seedCalledRef.current = true;
      seedMutateRef.current();
    }
  }, [isLoading, students.length]);

  // Reset to page 1 whenever filters or search change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-run when filter values change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGrades, selectedClasses, advancedFilters]);

  // Derive available classes from student data (unique gradeLevel values)
  const availableClasses = useMemo(() => {
    const levels = new Set(students.map((s) => s.gradeLevel));
    return Array.from(levels).sort();
  }, [students]);

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls],
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedGrades([]);
    setSelectedClasses([]);
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  };

  const advancedFilterCount = countActiveAdvancedFilters(advancedFilters);
  const hasFilters =
    !!searchQuery ||
    selectedGrades.length > 0 ||
    selectedClasses.length > 0 ||
    advancedFilterCount > 0;

  const filteredStudents = useMemo(
    () =>
      applyFilters(
        students,
        searchQuery,
        selectedGrades,
        selectedClasses,
        advancedFilters,
      ),
    [students, searchQuery, selectedGrades, selectedClasses, advancedFilters],
  );

  // Paginated slice of filtered students
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleReturnToList = () => {
    setViewMode("list");
    setEditingStudent(null);
  };

  // ── Inline Add/Edit Student form ──────────────────────────────────────────
  if (viewMode === "add-student" || viewMode === "edit-student") {
    return (
      <div className="w-full min-w-0 bg-background rounded-sm">
        <AddStudentForm
          editStudent={editingStudent}
          onSuccess={handleReturnToList}
          onCancel={handleReturnToList}
          inline
        />
      </div>
    );
  }

  // ── Inline Bulk Import panel ──────────────────────────────────────────────
  if (viewMode === "bulk-import") {
    return (
      <div className="w-full min-w-0">
        <BulkImportCSVPanel onClose={handleReturnToList} />
      </div>
    );
  }

  // ── Student list view ─────────────────────────────────────────────────────
  return (
    <>
      {/* Main students list */}
      <div className="w-full min-w-0 space-y-4">
        {/* Actions row */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or student ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Count + Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {isLoading
                ? "Loading..."
                : `${filteredStudents.length} of ${students.length}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("bulk-import")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setViewMode("add-student")}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="w-full">
          <FilterBar
            selectedGrades={selectedGrades}
            onGradeToggle={toggleGrade}
            selectedClasses={selectedClasses}
            onClassToggle={toggleClass}
            availableClasses={availableClasses}
            advancedFilterCount={advancedFilterCount}
            onOpenMoreFilters={() => setMoreFiltersOpen((v) => !v)}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* More Filters Panel — inline expandable, no slide-in */}
        <MoreFiltersPanel
          open={moreFiltersOpen}
          onClose={() => setMoreFiltersOpen(false)}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onApply={() => setMoreFiltersOpen(false)}
          onClearAll={clearAllFilters}
        />

        {/* Student List */}
        {isLoading ? (
          <div className="space-y-2 w-full">
            {(
              [
                "s1",
                "s2",
                "s3",
                "s4",
                "s5",
                "s6",
                "s7",
                "s8",
                "s9",
                "s10",
              ] as const
            ).map((k) => (
              <StudentListItemSkeleton key={k} />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center w-full">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No students found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasFilters
                ? "No students match your current filters. Try adjusting or clearing them."
                : "No students have been added yet."}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 w-full">
            {paginatedStudents.map((student) => (
              <StudentListItem
                key={student.studentId}
                student={student}
                onClick={() =>
                  navigate({
                    to: "/students/$studentId",
                    params: { studentId: student.studentId },
                  })
                }
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredStudents.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
