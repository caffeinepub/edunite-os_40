import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Layers,
  Loader2,
  Plus,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  useCreateAssignment,
  useCreateModule,
  useGetAssessments,
  useGetAssignments,
  useGetModules,
  useGetUnits,
} from "../../hooks/useQueries";
import type {
  Assessment,
  Assignment,
  Course,
  Module,
  Unit,
} from "../../lib/curriculumTypes";
import type { SelectedNode } from "../../pages/Curriculum";
import CourseDetailPanel from "./CourseDetailPanel";
import ModuleDetailPanel from "./ModuleDetailPanel";
import UnitDetailPanel from "./UnitDetailPanel";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CurriculumBoardViewProps {
  courses: Course[];
  selectedNode: SelectedNode;
  onSelectNode: (node: SelectedNode) => void;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (status === "draft") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 bg-amber-50 text-amber-700 border-amber-200">
        Draft
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 bg-green-50 text-green-700 border-green-200">
      Active
    </span>
  );
}

// ─── Assignment Item Row (used in drilled-in module section) ─────────────────

function AssignmentItemRow({ assignment }: { assignment: Assignment }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 hover:bg-accent/40 rounded transition-colors group">
      <FileText size={12} className="text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-foreground flex-1 truncate">
        {assignment.title}
      </span>
      {assignment.dueDate && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(assignment.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}

function AssessmentItemRow({ assessment }: { assessment: Assessment }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 hover:bg-accent/40 rounded transition-colors group">
      <ClipboardCheck size={12} className="text-amber-500 flex-shrink-0" />
      <span className="text-xs text-foreground flex-1 truncate">
        {assessment.title}
      </span>
      {assessment.dueDate && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(assessment.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}

// ─── Flat Module Section in DrillInLeftPanel ──────────────────────────────────

function DrillInModuleSection({
  mod,
  unitId,
  courseId,
  isSelected,
  onSelect,
  onSelectNode,
}: {
  mod: Module;
  unitId: number;
  courseId: number;
  isSelected: boolean;
  onSelect: () => void;
  onSelectNode: (node: SelectedNode) => void;
}) {
  const { data: assignments = [] } = useGetAssignments(mod.id);
  const { data: assessments = [] } = useGetAssessments(mod.id);
  const createAssignment = useCreateAssignment();
  const itemCount = assignments.length + assessments.length;

  const handleAddItem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = await createAssignment.mutateAsync({
      moduleId: mod.id,
      courseId,
      title: "New Assignment",
      assignmentType: "homework",
      dueDate: "",
      points: 100,
    });
    onSelectNode({
      type: "assignment",
      id: a.id,
      moduleId: mod.id,
      unitId,
      courseId,
    });
  };

  return (
    <div
      className={`border-b border-border/20 last:border-b-0 ${isSelected ? "bg-primary/5" : ""}`}
      data-ocid={`curriculum.board.module_row.${mod.id}`}
    >
      {/* Module header row — flat, no inner card */}
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
          isSelected
            ? "border-l-[3px] border-l-emerald-500 pl-[calc(1rem-3px)]"
            : ""
        }`}
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {mod.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {/* Items list — flat, no inner card */}
      <div className="px-4 pb-2">
        {assignments.map((a) => (
          <AssignmentItemRow key={`assign-${a.id}`} assignment={a} />
        ))}
        {assessments.map((a) => (
          <AssessmentItemRow key={`assess-${a.id}`} assessment={a} />
        ))}
        {/* Add item row */}
        <button
          type="button"
          onClick={handleAddItem}
          disabled={createAssignment.isPending}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-1 py-1"
          data-ocid={`curriculum.board.add_item.button.${mod.id}`}
        >
          {createAssignment.isPending ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Plus size={10} />
          )}
          Add item
        </button>
      </div>
    </div>
  );
}

// ─── Unit accent color palette (board cards) ─────────────────────────────────

const UNIT_ACCENT_COLORS = [
  {
    border: "#7C3AED",
    bg: "rgba(124,58,237,0.04)",
    separatorColor: "#7C3AED",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    border: "#2563EB",
    bg: "rgba(37,99,235,0.04)",
    separatorColor: "#2563EB",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    border: "#059669",
    bg: "rgba(5,150,105,0.04)",
    separatorColor: "#059669",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    border: "#0D9488",
    bg: "rgba(13,148,136,0.04)",
    separatorColor: "#0D9488",
    badge: "bg-teal-100 text-teal-700",
  },
  {
    border: "#EA580C",
    bg: "rgba(234,88,12,0.04)",
    separatorColor: "#EA580C",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    border: "#DB2777",
    bg: "rgba(219,39,119,0.04)",
    separatorColor: "#DB2777",
    badge: "bg-pink-100 text-pink-700",
  },
];

// ─── Module sub-row in all-units board card ───────────────────────────────────

function ModuleSubRow({
  mod,
  rowIndex,
  onClickDrillIn,
}: {
  mod: Module;
  rowIndex: number;
  onClickDrillIn: () => void;
}) {
  const { data: assignments = [] } = useGetAssignments(mod.id);
  const { data: assessments = [] } = useGetAssessments(mod.id);
  const itemCount = assignments.length + assessments.length;

  return (
    <button
      type="button"
      onClick={onClickDrillIn}
      className="w-full text-left flex items-center justify-between pl-6 pr-4 py-2.5 hover:bg-muted/40 transition-colors group border-l-2 border-l-transparent hover:border-l-emerald-300"
      data-ocid={`curriculum.board.module_row.${rowIndex}`}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-2">
        <span className="text-sm font-medium text-foreground truncate">
          {mod.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>
      <ChevronRight
        size={12}
        className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      />
    </button>
  );
}

// ─── Unit card in all-units board grid ────────────────────────────────────────

function UnitCard({
  unit,
  unitIndex,
  courseId,
  onDrillIn,
  onSelectNode,
}: {
  unit: Unit;
  unitIndex: number;
  courseId: number;
  onDrillIn: (unitId: number, moduleId?: number) => void;
  onSelectNode: (node: SelectedNode) => void;
}) {
  const { data: modules = [], isLoading } = useGetModules(unit.id);
  const createModule = useCreateModule();

  const accent = UNIT_ACCENT_COLORS[unitIndex % UNIT_ACCENT_COLORS.length];

  const handleAddModule = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const m = await createModule.mutateAsync({
      unitId: unit.id,
      courseId,
      title: "New Module",
    });
    onDrillIn(unit.id, m.id);
    onSelectNode({
      type: "module",
      id: m.id,
      unitId: unit.id,
      courseId,
    });
  };

  return (
    <div
      className="bg-card rounded-xl overflow-hidden flex flex-col min-h-[260px] max-h-[400px]"
      data-ocid={`curriculum.board.unit_card.${unitIndex + 1}`}
    >
      {/* Unit card header — bold top-bar accent */}
      <div className="flex-shrink-0" style={{ backgroundColor: accent.bg }}>
        {/* Bold top-bar accent */}
        <div
          className="h-[4px] w-full"
          style={{ backgroundColor: accent.border }}
        />
        <div className="px-4 pt-3 pb-4">
          {/* Unit badge + status row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${accent.badge}`}
            >
              Unit {unitIndex + 1}
            </span>
            <StatusBadge />
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-foreground leading-snug mb-2">
            {unit.title}
          </h3>

          {/* Stats row */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
            <Clock size={11} />
            <span>
              {unit.durationValue ?? 0} {unit.durationUnit ?? "weeks"}
              {" · "}
              {isLoading ? "…" : modules.length}
              {" module"}
              {modules.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Open unit link */}
          <button
            type="button"
            onClick={() => onDrillIn(unit.id)}
            className="text-[13px] font-semibold transition-colors flex items-center gap-0.5 hover:underline"
            style={{ color: accent.border }}
            data-ocid={`curriculum.board.open_unit.button.${unitIndex + 1}`}
          >
            Open unit <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Module flat rows — lightweight, no inner card nesting */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/25">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4 px-4 italic">
            No modules yet
          </p>
        ) : (
          modules.map((mod, modIdx) => (
            <ModuleSubRow
              key={mod.id}
              mod={mod}
              rowIndex={modIdx + 1}
              onClickDrillIn={() => {
                onDrillIn(unit.id, mod.id);
                onSelectNode({
                  type: "module",
                  id: mod.id,
                  unitId: unit.id,
                  courseId,
                });
              }}
            />
          ))
        )}
      </div>

      {/* Add Module row */}
      <div className="flex-shrink-0 border-t border-border/20">
        <button
          type="button"
          onClick={handleAddModule}
          disabled={createModule.isPending}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          data-ocid={`curriculum.board.add_module.button.${unitIndex + 1}`}
        >
          {createModule.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Add Module
        </button>
      </div>
    </div>
  );
}

// ─── Drilled-in left panel: unit + modules ────────────────────────────────────

function DrillInLeftPanel({
  unit,
  courseId,
  selectedNode,
  onSelectNode,
  onBack,
}: {
  unit: Unit;
  courseId: number;
  selectedNode: SelectedNode;
  onSelectNode: (node: SelectedNode) => void;
  onBack: () => void;
}) {
  const { data: modules = [], isLoading } = useGetModules(unit.id);
  const createModule = useCreateModule();

  const handleAddModule = async () => {
    const m = await createModule.mutateAsync({
      unitId: unit.id,
      courseId,
      title: "New Module",
    });
    onSelectNode({
      type: "module",
      id: m.id,
      unitId: unit.id,
      courseId,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Back link */}
      <div className="flex-shrink-0 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="curriculum.board.back.button"
        >
          <ArrowLeft size={14} />
          All Units
        </button>
      </div>

      {/* Unit identity section — subtle background for visual grounding */}
      <div className="flex-shrink-0 px-4 py-4 bg-muted/15 border-b border-border/20">
        {/* Title + status */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-base font-semibold text-foreground flex-1 min-w-0 truncate">
            {unit.title}
          </h2>
          <StatusBadge />
        </div>
        {/* Duration */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 mb-3">
          <Clock size={12} />
          <span>
            {unit.durationValue ?? 0} {unit.durationUnit ?? "weeks"}
          </span>
        </div>
        {/* Edit Unit Details button */}
        <button
          type="button"
          onClick={() => onSelectNode({ type: "unit", id: unit.id, courseId })}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-primary/20 bg-primary/5 text-sm text-primary hover:bg-primary/10 transition-colors"
          data-ocid="curriculum.board.edit_unit.button"
        >
          <span>Edit Unit Details</span>
          <ChevronRight size={14} className="text-primary/60" />
        </button>
      </div>

      {/* Module flat sections */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <p className="text-xs text-muted-foreground">No modules yet</p>
          </div>
        ) : (
          modules.map((mod) => {
            const isThisModSelected =
              selectedNode?.type === "module" && selectedNode.id === mod.id;

            return (
              <DrillInModuleSection
                key={mod.id}
                mod={mod}
                unitId={unit.id}
                courseId={courseId}
                isSelected={isThisModSelected}
                onSelect={() =>
                  onSelectNode({
                    type: "module",
                    id: mod.id,
                    unitId: unit.id,
                    courseId,
                  })
                }
                onSelectNode={onSelectNode}
              />
            );
          })
        )}
      </div>

      {/* Add Module dashed row */}
      <div className="flex-shrink-0 border-t border-border/15">
        <button
          type="button"
          onClick={handleAddModule}
          disabled={createModule.isPending}
          className="w-full flex items-center justify-center gap-1.5 py-3 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
        >
          {createModule.isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
          Add Module
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel renderer (reuses existing panels) ──────────────────────────

function BoardDetailPanel({
  selectedNode,
  onSelectNode,
  onBack,
}: {
  selectedNode: SelectedNode;
  onSelectNode: (node: SelectedNode) => void;
  onBack?: () => void;
}) {
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Layers size={32} className="text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">
          Select a module to edit
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click a module section on the left to view and edit its details
        </p>
      </div>
    );
  }

  if (selectedNode.type === "course") {
    return (
      <CourseDetailPanel
        courseId={selectedNode.id}
        onDeleted={() => onSelectNode(null)}
        onUnitCreated={(unitId) =>
          onSelectNode({
            type: "unit",
            id: unitId,
            courseId: selectedNode.id,
          })
        }
      />
    );
  }

  if (selectedNode.type === "unit") {
    return (
      <UnitDetailPanel
        unitId={selectedNode.id}
        courseId={selectedNode.courseId}
        onDeleted={() => onSelectNode(null)}
        boardMode={true}
        onBack={onBack}
        onModuleCreated={(moduleId) =>
          onSelectNode({
            type: "module",
            id: moduleId,
            unitId: selectedNode.id,
            courseId: selectedNode.courseId,
          })
        }
      />
    );
  }

  if (
    selectedNode.type === "module" ||
    selectedNode.type === "lesson" ||
    selectedNode.type === "assignment" ||
    selectedNode.type === "assessment"
  ) {
    const moduleId =
      selectedNode.type === "module" || selectedNode.type === "lesson"
        ? selectedNode.id
        : selectedNode.moduleId;
    return (
      <ModuleDetailPanel
        moduleId={moduleId}
        unitId={selectedNode.unitId}
        courseId={selectedNode.courseId}
        onDeleted={() => onSelectNode(null)}
        initialExpandedItemId={
          selectedNode.type === "assignment" ||
          selectedNode.type === "assessment"
            ? { type: selectedNode.type, id: selectedNode.id }
            : undefined
        }
      />
    );
  }

  return null;
}

// ─── All Units Board (grid layout) ───────────────────────────────────────────

function AllUnitsBoard({
  courseId,
  onDrillIn,
  onSelectNode,
}: {
  courseId: number;
  onDrillIn: (unitId: number, moduleId?: number) => void;
  onSelectNode: (node: SelectedNode) => void;
}) {
  const { data: units = [], isLoading } = useGetUnits(courseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-8"
        data-ocid="curriculum.board.empty_state"
      >
        <Layers size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-base font-medium text-muted-foreground">
          No units yet
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Create your first unit in the course details
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 p-5 pb-8 overflow-y-auto h-full content-start"
      data-ocid="curriculum.board.all_units.panel"
    >
      {units.map((unit, idx) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          unitIndex={idx}
          courseId={courseId}
          onDrillIn={onDrillIn}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

// ─── Main Board View ──────────────────────────────────────────────────────────

export default function CurriculumBoardView({
  courses,
  selectedNode,
  onSelectNode,
}: CurriculumBoardViewProps) {
  // drilledUnitId: which unit is currently drilled into (null = all units view)
  const [drilledUnitId, setDrilledUnitId] = useState<number | null>(null);
  // activeCourseId: course currently shown in board (null falls back to first course)
  const [activeCourseId, setActiveCourseId] = useState<number | null>(
    courses[0]?.id ?? null,
  );

  const activeCourse =
    courses.find((c) => c.id === activeCourseId) ?? courses[0] ?? null;

  if (!activeCourse) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <BookOpen size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-base font-medium text-muted-foreground">
          No courses yet
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Create a course to get started
        </p>
      </div>
    );
  }

  const handleDrillIn = (unitId: number, moduleId?: number) => {
    setDrilledUnitId(unitId);
    if (moduleId !== undefined) {
      onSelectNode({
        type: "module",
        id: moduleId,
        unitId,
        courseId: activeCourse.id,
      });
    } else {
      // Default: show the unit editor in the right panel
      onSelectNode({
        type: "unit",
        id: unitId,
        courseId: activeCourse.id,
      });
    }
  };

  const handleBack = () => {
    setDrilledUnitId(null);
  };

  const handleCourseSwitch = (courseId: number) => {
    setActiveCourseId(courseId);
    // Reset drill-in when switching courses
    setDrilledUnitId(null);
    onSelectNode(null);
  };

  // Course filter pills (multiple courses) or plain title (single course)
  const coursePills =
    courses.length > 1 ? (
      <div className="flex items-center gap-1.5 flex-wrap px-5 pt-4 pb-0 flex-shrink-0">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCourseSwitch(c.id)}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-colors border ${
              activeCourse.id === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
            data-ocid="curriculum.board.course_filter.tab"
          >
            {c.title}
          </button>
        ))}
      </div>
    ) : (
      <h2 className="px-5 pt-4 pb-0 text-base font-semibold text-foreground flex-shrink-0">
        {activeCourse.title}
      </h2>
    );

  // ── State A: All units board ───────────────────────────────────────────────
  if (!drilledUnitId) {
    return (
      <div className="h-full min-h-0 overflow-hidden flex flex-col">
        {coursePills}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AllUnitsBoard
            courseId={activeCourse.id}
            onDrillIn={handleDrillIn}
            onSelectNode={onSelectNode}
          />
        </div>
      </div>
    );
  }

  // ── State B: Drilled-in unit view ─────────────────────────────────────────
  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col">
      {coursePills}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DrillInBoardView
          courseId={activeCourse.id}
          drilledUnitId={drilledUnitId}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

// ─── DrillInBoardView: fetches units to find the drilled unit ─────────────────

function DrillInBoardView({
  courseId,
  drilledUnitId,
  selectedNode,
  onSelectNode,
  onBack,
}: {
  courseId: number;
  drilledUnitId: number;
  selectedNode: SelectedNode;
  onSelectNode: (node: SelectedNode) => void;
  onBack: () => void;
}) {
  const { data: units = [], isLoading } = useGetUnits(courseId);

  if (isLoading) {
    return (
      <div className="h-full min-h-0 overflow-hidden flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unit = units.find((u) => u.id === drilledUnitId) ?? null;

  if (!unit) {
    return (
      <div className="h-full min-h-0 overflow-hidden flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Unit not found</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex rounded-lg border border-border/30 overflow-hidden bg-card">
      {/* Left panel — drill-in, flat background */}
      <div
        className="flex-shrink-0 border-r border-border/30 flex flex-col min-h-0 overflow-hidden bg-background"
        style={{ width: "280px" }}
      >
        <DrillInLeftPanel
          unit={unit}
          courseId={courseId}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          onBack={onBack}
        />
      </div>

      {/* Right panel — detail editor */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <BoardDetailPanel
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          onBack={onBack}
        />
      </div>
    </div>
  );
}
