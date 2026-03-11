// Legacy compatibility shim — redirects to ModuleDetailPanel
import React from "react";
import ModuleDetailPanel from "./ModuleDetailPanel";

interface LessonDetailPanelProps {
  lessonId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
}

export default function LessonDetailPanel({
  lessonId,
  unitId,
  courseId,
  onDeleted,
}: LessonDetailPanelProps) {
  return (
    <ModuleDetailPanel
      moduleId={lessonId}
      unitId={unitId}
      courseId={courseId}
      onDeleted={onDeleted}
    />
  );
}
