import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
// Legacy AssignmentsSection — now delegates to ModuleDetailPanel's assignment handling.
// This file is kept for backward compatibility with any code that imports it.
import React from "react";
import { useAssignments, useCreateAssignment } from "../../hooks/useQueries";
import { getAssignmentTypes } from "../../lib/assignmentTypes";

interface AssignmentsSectionProps {
  lessonId: number;
  courseId: number;
}

const BADGE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
];

function getTypeBadgeClass(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++)
    hash = (hash * 31 + type.charCodeAt(i)) & 0xffff;
  return BADGE_COLORS[hash % BADGE_COLORS.length];
}

export default function AssignmentsSection({
  lessonId,
  courseId,
}: AssignmentsSectionProps) {
  const { data: assignments = [] } = useAssignments(lessonId);
  const createAssignment = useCreateAssignment();

  const handleAdd = async () => {
    const defaultType = getAssignmentTypes()[0] ?? "Homework";
    await createAssignment.mutateAsync({
      moduleId: lessonId,
      lessonId,
      courseId,
      title: "New Assignment",
      assignmentType: defaultType,
      dueDate: new Date().toISOString().split("T")[0],
      points: 100,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Assignments ({assignments.length})
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={createAssignment.isPending}
          className="gap-1 h-7 text-xs"
        >
          {createAssignment.isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Plus size={11} />
          )}
          Add
        </Button>
      </div>
      <div className="space-y-1.5">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20"
          >
            <span
              className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${getTypeBadgeClass(a.assignmentType)}`}
            >
              {a.assignmentType}
            </span>
            <span className="text-sm flex-1 truncate">{a.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {a.points ?? a.pointsPossible ?? 0}pt
            </span>
          </div>
        ))}
        {assignments.length === 0 && (
          <p className="text-xs text-muted-foreground">No assignments yet</p>
        )}
      </div>
    </div>
  );
}
