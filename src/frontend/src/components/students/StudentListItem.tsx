import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import React from "react";
import type { Student } from "../../backend";

interface StudentListItemProps {
  student: Student;
  onClick?: () => void;
}

function getGradeLabel(grade: string): string {
  if (grade === "K") return "Kindergarten";
  return `Grade ${grade}`;
}

export function StudentListItem({ student, onClick }: StudentListItemProps) {
  const fullName = `${student.givenNames} ${student.familyName}`;
  const hasPreferredName =
    student.preferredName && student.preferredName.trim().length > 0;

  return (
    <button
      type="button"
      className="w-full flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors shadow-sm text-left"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm select-none">
        {student.givenNames.charAt(0).toUpperCase()}
        {student.familyName.charAt(0).toUpperCase()}
      </div>

      {/* Name & ID */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">
            {hasPreferredName ? student.preferredName : fullName}
          </span>
          {hasPreferredName && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({fullName})
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          ID: {student.studentId}
        </div>
      </div>

      {/* Grade badge */}
      <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {getGradeLabel(student.gradeLevel)}
        </Badge>
      </div>

      {/* Accommodation / allergy indicators */}
      <div className="flex-shrink-0 hidden md:flex items-center gap-1.5">
        {student.accommodations.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
            IEP/504
          </span>
        )}
        {student.allergies.length > 0 && (
          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
            Allergy
          </span>
        )}
      </div>

      {/* Guardian count */}
      <div className="flex-shrink-0 hidden lg:block text-xs text-muted-foreground">
        {student.guardianContacts.length > 0
          ? `${student.guardianContacts.length} guardian${student.guardianContacts.length !== 1 ? "s" : ""}`
          : "No guardians"}
      </div>

      <ChevronRight className="flex-shrink-0 h-4 w-4 text-muted-foreground" />
    </button>
  );
}
