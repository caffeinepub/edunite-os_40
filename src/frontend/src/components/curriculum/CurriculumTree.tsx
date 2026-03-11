import {
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useCreateAssessment,
  useCreateAssignment,
  useCreateModule,
  useCreateUnit,
  useDeleteModule,
  useDeleteUnit,
  useGetAssessments,
  useGetAssignments,
  useGetModules,
  useGetUnits,
  useUpdateModule,
  useUpdateUnit,
} from "../../hooks/useQueries";
import type {
  Assessment,
  Assignment,
  Course,
  Module,
  Unit,
} from "../../lib/curriculumTypes";
import type { SelectedNode } from "../../pages/Curriculum";

interface CurriculumTreeProps {
  courses: Course[];
  selectedNode: SelectedNode;
  onSelectNode: (node: SelectedNode) => void;
  targetLessonId?: number | null;
  onTargetConsumed?: () => void;
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface ContextMenuData {
  nodeType: string;
  nodeId: number;
  nodeTitle?: string;
  parentId?: number;
  courseId?: number;
}

type ContextMenuState = ContextMenuData & {
  x: number;
  y: number;
  confirmingDelete?: boolean;
};

// Level accent colors (4px left border on selected items)
// Course = purple, Unit = blue, Module = green, Assignment/Assessment = amber
const LEVEL_COLORS = {
  course: "#6D28D9",
  unit: "#2563EB",
  module: "#059669",
  assignment: "#D97706",
  assessment: "#D97706",
} as const;

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({
  assignment,
  isSelected,
  onSelect,
}: {
  assignment: Assignment;
  moduleId: number;
  unitId: number;
  courseId: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-selected={isSelected}
      style={
        isSelected ? { borderLeftColor: LEVEL_COLORS.assignment } : undefined
      }
      className={`w-full flex items-center gap-1.5 pr-2 py-1 text-left transition-colors ${
        isSelected
          ? "border-l-[3px] pl-[calc(3rem-3px)] bg-primary/5 text-foreground font-medium"
          : "pl-12 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <FileText size={12} className="flex-shrink-0 text-amber-500/70" />
      <span
        className={`${isSelected ? "text-xs font-medium" : "text-[11px]"} flex-1 leading-snug truncate min-w-0`}
      >
        {assignment.title}
      </span>
      {/* Inline summary chips */}
      <span
        className={`text-[10px] shrink-0 px-1.5 py-0 rounded-full font-medium leading-5 ${
          isSelected
            ? "bg-muted text-muted-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {assignment.assignmentType}
      </span>
      {assignment.dueDate && (
        <span className="text-[10px] shrink-0 text-muted-foreground tabular-nums">
          {new Date(assignment.dueDate).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
          })}
        </span>
      )}
      {assignment.points > 0 && (
        <span className="text-[10px] shrink-0 font-medium text-muted-foreground tabular-nums">
          {assignment.points}pt
        </span>
      )}
    </button>
  );
}

// ─── Assessment Row ───────────────────────────────────────────────────────────

function AssessmentRow({
  assessment,
  isSelected,
  onSelect,
}: {
  assessment: Assessment;
  moduleId: number;
  unitId: number;
  courseId: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-selected={isSelected}
      style={
        isSelected ? { borderLeftColor: LEVEL_COLORS.assessment } : undefined
      }
      className={`w-full flex items-center gap-1.5 pr-2 py-1 text-left transition-colors ${
        isSelected
          ? "border-l-[3px] pl-[calc(3rem-3px)] bg-primary/5 text-foreground font-medium"
          : "pl-12 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      }`}
    >
      <ClipboardCheck size={12} className="flex-shrink-0 text-amber-500" />
      <span
        className={`${isSelected ? "text-xs font-medium" : "text-[11px]"} flex-1 leading-snug truncate min-w-0`}
      >
        {assessment.title}
      </span>
      {/* Assessment chip */}
      <span
        className={`text-[10px] shrink-0 px-1.5 py-0 rounded-full font-medium leading-5 ${
          isSelected
            ? "bg-muted text-muted-foreground"
            : "bg-amber-50 text-amber-600 border border-amber-200/60"
        }`}
      >
        Assess
      </span>
    </button>
  );
}

// ─── Module Row ───────────────────────────────────────────────────────────────

function ModuleRow({
  mod,
  unitId,
  courseId,
  isExpanded,
  isSelected,
  selectedNode,
  onToggle,
  onSelect,
  onSelectNode,
  onContextMenu,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  mod: Module;
  unitId: number;
  courseId: number;
  isExpanded: boolean;
  isSelected: boolean;
  selectedNode: SelectedNode;
  onToggle: () => void;
  onSelect: () => void;
  onSelectNode: (node: SelectedNode) => void;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuData) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const { data: assignments = [] } = useGetAssignments(mod.id);
  const { data: assessments = [] } = useGetAssessments(mod.id);
  const createAssignment = useCreateAssignment();
  const createAssessment = useCreateAssessment();

  const handleAddAssignment = async (e: React.MouseEvent) => {
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

  const handleAddAssessment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = await createAssessment.mutateAsync({
      moduleId: mod.id,
      courseId,
      title: "New Assessment",
    });
    onSelectNode({
      type: "assessment",
      id: a.id,
      moduleId: mod.id,
      unitId,
      courseId,
    });
  };

  const childCount = assignments.length + assessments.length;

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`transition-opacity ${isDragging ? "opacity-40" : "opacity-100"} ${isDragOver ? "border-t-2 border-primary" : ""}`}
    >
      {/* Module row */}
      <div
        className="flex items-center gap-0.5 group ml-8"
        onContextMenu={(e) =>
          onContextMenu(e, {
            nodeType: "module",
            nodeId: mod.id,
            nodeTitle: mod.title,
            parentId: unitId,
            courseId,
          })
        }
      >
        {/* Drag handle */}
        {onDragStart && (
          <span className="flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity ml-0.5 mr-0.5">
            <GripVertical size={10} className="text-muted-foreground" />
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1"
        >
          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-selected={isSelected}
          aria-expanded={isExpanded}
          className={`flex-1 flex items-center gap-2 pr-2 py-2 text-left transition-colors min-w-0 pl-1 rounded-sm ${
            isSelected
              ? "bg-primary/8 text-foreground font-medium border-l-[3px] border-emerald-500 pl-[calc(0.25rem-3px)]"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <BookMarked
            size={12}
            className={`flex-shrink-0 ${isSelected ? "text-emerald-600" : "text-emerald-500/60"}`}
          />
          <span className="text-xs flex-1 leading-snug truncate">
            {mod.title}
          </span>
          {childCount > 0 && (
            <span className="text-[10px] shrink-0 font-medium text-muted-foreground tabular-nums">
              {childCount}
            </span>
          )}
        </button>
        {/* Add button — visible on row hover only */}
        <button
          type="button"
          onClick={handleAddAssignment}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
          title="Add Assignment"
        >
          <Plus size={11} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-0">
          {assignments.map((a) => (
            <AssignmentRow
              key={`assign-${a.id}`}
              assignment={a}
              moduleId={mod.id}
              unitId={unitId}
              courseId={courseId}
              isSelected={
                selectedNode?.type === "assignment" && selectedNode.id === a.id
              }
              onSelect={() =>
                onSelectNode({
                  type: "assignment",
                  id: a.id,
                  moduleId: mod.id,
                  unitId,
                  courseId,
                })
              }
            />
          ))}
          {assessments.map((a) => (
            <AssessmentRow
              key={`assess-${a.id}`}
              assessment={a}
              moduleId={mod.id}
              unitId={unitId}
              courseId={courseId}
              isSelected={
                selectedNode?.type === "assessment" && selectedNode.id === a.id
              }
              onSelect={() =>
                onSelectNode({
                  type: "assessment",
                  id: a.id,
                  moduleId: mod.id,
                  unitId,
                  courseId,
                })
              }
            />
          ))}
          {childCount === 0 && (
            <p className="text-[11px] text-muted-foreground/50 py-1 pl-14 italic">
              No items yet
            </p>
          )}
          <div className="flex items-center gap-3 pt-1 pb-1.5 pl-14">
            <button
              type="button"
              onClick={handleAddAssignment}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
            >
              <Plus size={10} /> Assignment
            </button>
            <button
              type="button"
              onClick={handleAddAssessment}
              className="text-[11px] text-muted-foreground hover:text-amber-600 transition-colors flex items-center gap-0.5"
            >
              <Plus size={10} /> Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unit accent colors (left border track, always visible) ──────────────────
// Dot indicators removed — level color track replaces them

// ─── Unit Row ─────────────────────────────────────────────────────────────────

function UnitRow({
  unit,
  unitIndex: _unitIndex,
  courseId,
  isExpanded,
  isSelected,
  selectedNode,
  onToggle,
  onSelect,
  onSelectNode,
  onContextMenu,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  unit: Unit;
  unitIndex: number;
  courseId: number;
  isExpanded: boolean;
  isSelected: boolean;
  selectedNode: SelectedNode;
  onToggle: () => void;
  onSelect: () => void;
  onSelectNode: (node: SelectedNode) => void;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuData) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const { data: modules = [], isLoading } = useGetModules(unit.id);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(
    new Set(),
  );
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  // ── Module drag state ────────────────────────────────────────────────────
  const [draggingModuleId, setDraggingModuleId] = useState<number | null>(null);
  const [moduleDragOverId, setModuleDragOverId] = useState<number | null>(null);

  const toggleModule = useCallback((moduleId: number) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  const handleAddModule = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const m = await createModule.mutateAsync({
      unitId: unit.id,
      courseId,
      title: "New Module",
    });
    setExpandedModuleIds((prev) => new Set([...prev, m.id]));
    onSelectNode({
      type: "module",
      id: m.id,
      unitId: unit.id,
      courseId,
    });
  };

  const handleModuleDrop = async (targetModuleId: number) => {
    if (draggingModuleId === null || draggingModuleId === targetModuleId) {
      setDraggingModuleId(null);
      setModuleDragOverId(null);
      return;
    }
    const sorted = [...modules];
    const fromIdx = sorted.findIndex((m) => m.id === draggingModuleId);
    const toIdx = sorted.findIndex((m) => m.id === targetModuleId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingModuleId(null);
      setModuleDragOverId(null);
      return;
    }
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    // Persist new order only for modules that changed
    const updates = sorted
      .map((m, idx) => ({ id: m.id, newOrder: idx + 1, oldOrder: m.order }))
      .filter((x) => x.newOrder !== x.oldOrder);
    await Promise.all(
      updates.map((x) =>
        updateModule.mutateAsync({
          id: x.id,
          unitId: unit.id,
          courseId,
          order: x.newOrder,
        }),
      ),
    );
    setDraggingModuleId(null);
    setModuleDragOverId(null);
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`transition-opacity ${isDragging ? "opacity-40" : "opacity-100"} ${isDragOver ? "border-t-2 border-primary" : ""}`}
    >
      {/* Unit row */}
      <div
        className="flex items-center gap-0.5 group ml-4"
        onContextMenu={(e) =>
          onContextMenu(e, {
            nodeType: "unit",
            nodeId: unit.id,
            nodeTitle: unit.title,
            parentId: courseId,
            courseId,
          })
        }
      >
        {/* Drag handle for unit */}
        {onDragStart && (
          <span className="flex-shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing transition-opacity ml-0.5 mr-0.5">
            <GripVertical size={11} className="text-muted-foreground" />
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-selected={isSelected}
          aria-expanded={isExpanded}
          className={`flex-1 flex items-center gap-2 pr-2 py-2 text-left transition-colors min-w-0 pl-1 rounded-sm ${
            isSelected
              ? "bg-primary/8 text-foreground font-medium border-l-[3px] border-primary pl-[calc(0.25rem-3px)]"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Layers
            size={12}
            className={`flex-shrink-0 ${isSelected ? "text-blue-600" : "text-blue-400/70"}`}
          />
          <span className="text-xs flex-1 leading-snug truncate">
            {unit.title}
          </span>

          {modules.length > 0 && (
            <span className="text-[10px] shrink-0 font-medium text-muted-foreground tabular-nums">
              {modules.length}
            </span>
          )}
        </button>
        {/* Add button — visible on row hover only */}
        <button
          type="button"
          onClick={handleAddModule}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
          title="Add Module"
        >
          <Plus size={11} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-0.5">
          {isLoading ? (
            <div className="flex items-center gap-2 pl-16 py-1.5">
              <Loader2
                size={11}
                className="animate-spin text-muted-foreground"
              />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : modules.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50 pl-16 py-1.5 italic">
              No modules yet
            </p>
          ) : (
            modules.map((mod) => (
              <ModuleRow
                key={mod.id}
                mod={mod}
                unitId={unit.id}
                courseId={courseId}
                isExpanded={expandedModuleIds.has(mod.id)}
                isSelected={
                  selectedNode?.type === "module" && selectedNode.id === mod.id
                }
                selectedNode={selectedNode}
                onToggle={() => toggleModule(mod.id)}
                onSelect={() =>
                  onSelectNode({
                    type: "module",
                    id: mod.id,
                    unitId: unit.id,
                    courseId,
                  })
                }
                onSelectNode={onSelectNode}
                onContextMenu={onContextMenu}
                isDragging={draggingModuleId === mod.id}
                isDragOver={
                  moduleDragOverId === mod.id && draggingModuleId !== mod.id
                }
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingModuleId(mod.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setModuleDragOverId(mod.id);
                }}
                onDragEnd={() => {
                  setDraggingModuleId(null);
                  setModuleDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleModuleDrop(mod.id);
                }}
              />
            ))
          )}
          {/* Add Module subtle inline button */}
          <div className="pl-16 py-0.5">
            <button
              type="button"
              onClick={handleAddModule}
              disabled={createModule.isPending}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors py-1"
            >
              {createModule.isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Plus size={10} />
              )}
              Add Module
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Course Row ───────────────────────────────────────────────────────────────

function CourseRow({
  course,
  isExpanded,
  isSelected,
  selectedNode,
  onToggle,
  onSelect,
  onSelectNode,
  onContextMenu,
}: {
  course: Course;
  isExpanded: boolean;
  isSelected: boolean;
  selectedNode: SelectedNode;
  onToggle: () => void;
  onSelect: () => void;
  onSelectNode: (node: SelectedNode) => void;
  onContextMenu: (e: React.MouseEvent, state: ContextMenuData) => void;
}) {
  const { data: units = [], isLoading } = useGetUnits(course.id);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<number>>(
    new Set(),
  );
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();

  // ── Unit drag state ──────────────────────────────────────────────────────
  const [draggingUnitId, setDraggingUnitId] = useState<number | null>(null);
  const [unitDragOverId, setUnitDragOverId] = useState<number | null>(null);

  const toggleUnit = useCallback((unitId: number) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const handleAddUnit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const u = await createUnit.mutateAsync({
      courseId: course.id,
      title: "New Unit",
      description: "",
    });
    setExpandedUnitIds((prev) => new Set([...prev, u.id]));
    onSelectNode({ type: "unit", id: u.id, courseId: course.id });
  };

  const handleUnitDrop = async (targetUnitId: number) => {
    if (draggingUnitId === null || draggingUnitId === targetUnitId) {
      setDraggingUnitId(null);
      setUnitDragOverId(null);
      return;
    }
    const sorted = [...units];
    const fromIdx = sorted.findIndex((u) => u.id === draggingUnitId);
    const toIdx = sorted.findIndex((u) => u.id === targetUnitId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggingUnitId(null);
      setUnitDragOverId(null);
      return;
    }
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    const updates = sorted
      .map((u, idx) => ({ id: u.id, newOrder: idx + 1, oldOrder: u.order }))
      .filter((x) => x.newOrder !== x.oldOrder);
    await Promise.all(
      updates.map((x) =>
        updateUnit.mutateAsync({
          id: x.id,
          courseId: course.id,
          order: x.newOrder,
        }),
      ),
    );
    setDraggingUnitId(null);
    setUnitDragOverId(null);
  };

  return (
    <div className="border-b border-border/15 last:border-b-0">
      {/* Course row — persistent violet-500 left border track, always visible */}
      <div
        className={`flex items-center gap-0.5 group border-l-[3px] ${isSelected ? "border-l-violet-500" : "border-l-transparent"}`}
        onContextMenu={(e) =>
          onContextMenu(e, {
            nodeType: "course",
            nodeId: course.id,
            nodeTitle: course.title,
            courseId: course.id,
          })
        }
      >
        <button
          type="button"
          onClick={onToggle}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-1"
        >
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button
          type="button"
          onClick={onSelect}
          aria-selected={isSelected}
          aria-expanded={isExpanded}
          className={`flex-1 flex items-center gap-2 pr-2 py-2 text-left transition-colors min-w-0 pl-2 ${
            isSelected
              ? "bg-primary/8 text-foreground font-medium"
              : "text-foreground hover:bg-muted/40"
          }`}
        >
          <BookOpen
            size={14}
            className={`flex-shrink-0 ${isSelected ? "text-violet-600" : "text-violet-500/70"}`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-snug truncate">
              {course.title}
            </div>
            <div className="text-[11px] truncate text-muted-foreground">
              {course.subject} • {course.gradeBand}
            </div>
          </div>
          {course.draftStatus === "draft" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 bg-amber-50 text-amber-600 border border-amber-200/60">
              Draft
            </span>
          )}
        </button>
        {/* Add button — visible on row hover only */}
        <button
          type="button"
          onClick={handleAddUnit}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
          title="Add Unit"
        >
          <Plus size={12} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1">
          {isLoading ? (
            <div className="flex items-center gap-2 pl-10 py-1.5">
              <Loader2
                size={11}
                className="animate-spin text-muted-foreground"
              />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          ) : units.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/50 pl-10 py-1.5 italic">
              No units yet
            </p>
          ) : (
            units.map((unit, unitIdx) => (
              <UnitRow
                key={unit.id}
                unit={unit}
                unitIndex={unitIdx}
                courseId={course.id}
                isExpanded={expandedUnitIds.has(unit.id)}
                isSelected={
                  selectedNode?.type === "unit" && selectedNode.id === unit.id
                }
                selectedNode={selectedNode}
                onToggle={() => toggleUnit(unit.id)}
                onSelect={() =>
                  onSelectNode({
                    type: "unit",
                    id: unit.id,
                    courseId: course.id,
                  })
                }
                onSelectNode={onSelectNode}
                onContextMenu={onContextMenu}
                isDragging={draggingUnitId === unit.id}
                isDragOver={
                  unitDragOverId === unit.id && draggingUnitId !== unit.id
                }
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingUnitId(unit.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setUnitDragOverId(unit.id);
                }}
                onDragEnd={() => {
                  setDraggingUnitId(null);
                  setUnitDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleUnitDrop(unit.id);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Tree ────────────────────────────────────────────────────────────────

export default function CurriculumTree({
  courses,
  selectedNode,
  onSelectNode,
}: CurriculumTreeProps) {
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(
    () => new Set(courses.map((c) => c.id)), // expand all by default
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const deleteUnit = useDeleteUnit();
  const deleteModule = useDeleteModule();
  const createUnit = useCreateUnit();
  const createModule = useCreateModule();

  const toggleCourse = (courseId: number) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  // Auto-expand when new courses are added
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when length changes
  useEffect(() => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      for (const c of courses) next.add(c.id);
      return next;
    });
  }, [courses.length]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, state: ContextMenuData) => {
    e.preventDefault();
    setContextMenu({
      ...state,
      x: e.clientX,
      y: e.clientY,
      confirmingDelete: false,
    });
  };

  const handleDuplicate = async () => {
    if (!contextMenu) return;
    const title = `Copy of ${contextMenu.nodeTitle ?? contextMenu.nodeType}`;
    if (contextMenu.nodeType === "unit" && contextMenu.courseId) {
      await createUnit.mutateAsync({
        courseId: contextMenu.courseId,
        title,
        description: "",
      });
    } else if (
      contextMenu.nodeType === "module" &&
      contextMenu.parentId &&
      contextMenu.courseId
    ) {
      await createModule.mutateAsync({
        unitId: contextMenu.parentId,
        courseId: contextMenu.courseId,
        title,
      });
    }
    setContextMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!contextMenu) return;
    if (contextMenu.nodeType === "unit" && contextMenu.courseId) {
      await deleteUnit.mutateAsync({
        unitId: contextMenu.nodeId,
        courseId: contextMenu.courseId,
      });
      if (
        selectedNode?.type === "unit" &&
        selectedNode.id === contextMenu.nodeId
      ) {
        onSelectNode(null);
      }
    } else if (
      contextMenu.nodeType === "module" &&
      contextMenu.parentId &&
      contextMenu.courseId
    ) {
      await deleteModule.mutateAsync({
        moduleId: contextMenu.nodeId,
        unitId: contextMenu.parentId,
      });
      if (
        (selectedNode?.type === "module" || selectedNode?.type === "lesson") &&
        selectedNode.id === contextMenu.nodeId
      ) {
        onSelectNode(null);
      }
    }
    setContextMenu(null);
  };

  const nodeTypeLabel =
    contextMenu?.nodeType === "course"
      ? "Course"
      : contextMenu?.nodeType === "unit"
        ? "Unit"
        : "Module";

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center px-4">
        <BookOpen size={28} className="text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No courses yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Create a course to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div role="tree" aria-label="Curriculum structure" className="py-1.5">
        {courses.map((course) => (
          <CourseRow
            key={course.id}
            course={course}
            isExpanded={expandedCourseIds.has(course.id)}
            isSelected={
              selectedNode?.type === "course" && selectedNode.id === course.id
            }
            selectedNode={selectedNode}
            onToggle={() => toggleCourse(course.id)}
            onSelect={() => onSelectNode({ type: "course", id: course.id })}
            onSelectNode={onSelectNode}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y, minWidth: "200px" }}
          data-ocid="curriculum.tree.dropdown_menu"
        >
          {contextMenu.confirmingDelete ? (
            /* Delete confirmation state */
            <div className="p-3">
              <p className="text-xs font-medium text-foreground mb-1">
                Delete {nodeTypeLabel}?
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteUnit.isPending || deleteModule.isPending}
                  className="flex-1 px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors disabled:opacity-50"
                  data-ocid="curriculum.tree.delete_button"
                >
                  {deleteUnit.isPending || deleteModule.isPending
                    ? "Deleting…"
                    : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setContextMenu((prev) =>
                      prev ? { ...prev, confirmingDelete: false } : null,
                    )
                  }
                  className="flex-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent transition-colors"
                  data-ocid="curriculum.tree.cancel_button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Default context menu */
            <div className="py-1">
              {/* Duplicate (not for courses — would need more logic) */}
              {contextMenu.nodeType !== "course" && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                  onClick={handleDuplicate}
                  disabled={createUnit.isPending || createModule.isPending}
                  data-ocid="curriculum.tree.secondary_button"
                >
                  <Copy size={13} className="text-muted-foreground" />
                  Duplicate
                </button>
              )}
              {/* Separator */}
              {contextMenu.nodeType !== "course" && (
                <div className="my-1 border-t border-border" />
              )}
              {/* Delete */}
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                onClick={() =>
                  setContextMenu((prev) =>
                    prev ? { ...prev, confirmingDelete: true } : null,
                  )
                }
                data-ocid="curriculum.tree.delete_button"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
