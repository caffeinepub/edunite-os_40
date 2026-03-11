import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Layout,
  LayoutDashboard,
  List,
  Plus,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import CourseDetailPanel from "../components/curriculum/CourseDetailPanel";
import CourseMapView from "../components/curriculum/CourseMapView";
import CurriculumBoardView from "../components/curriculum/CurriculumBoardView";
import CurriculumTimelineView from "../components/curriculum/CurriculumTimelineView";
import CurriculumTree from "../components/curriculum/CurriculumTree";
import ModuleDetailPanel from "../components/curriculum/ModuleDetailPanel";
import UnitDetailPanel from "../components/curriculum/UnitDetailPanel";
import { useAppUI } from "../context/AppUIContext";
import {
  useCreateAssignment,
  useCreateCourse,
  useCreateModule,
  useCreateUnit,
  useGetCourses,
  useGetModules,
  useGetUnits,
} from "../hooks/useQueries";
import type { Course, CurriculumFramework } from "../lib/curriculumTypes";

const FRAMEWORK_OPTIONS: { value: CurriculumFramework; label: string }[] = [
  { value: "ubd", label: "Understanding by Design" },
  { value: "backwards", label: "Backwards Design" },
  { value: "5e", label: "5E Model" },
  { value: "ims", label: "EdUnite Simple Planning" },
  { value: "minimal", label: "Minimal" },
  { value: "custom", label: "Custom" },
];

export type SelectedNode =
  | { type: "course"; id: number }
  | { type: "unit"; id: number; courseId: number }
  | { type: "module"; id: number; unitId: number; courseId: number }
  | {
      type: "assignment";
      id: number;
      moduleId: number;
      unitId: number;
      courseId: number;
    }
  | {
      type: "assessment";
      id: number;
      moduleId: number;
      unitId: number;
      courseId: number;
    }
  // Legacy compat
  | { type: "lesson"; id: number; unitId: number; courseId: number }
  | null;

export default function Curriculum() {
  const { setHideFAB } = useAppUI();

  // Hide the Behavior Quick Log FAB on the Curriculum page — it doesn't belong here
  useEffect(() => {
    setHideFAB(true);
    return () => setHideFAB(false);
  }, [setHideFAB]);

  const [viewMode, setViewMode] = useState<
    "tree" | "timeline" | "course-map" | "board"
  >("tree");
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [courseDefaultTab, setCourseDefaultTab] = useState<
    "settings" | "structure"
  >("structure");
  const [courseFormState, setCourseFormState] = useState<"idle" | "creating">(
    "idle",
  );
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseFramework, setNewCourseFramework] =
    useState<CurriculumFramework>("ims");

  const [newCourseGradeBand, setNewCourseGradeBand] = useState<
    "K-2" | "3-5" | "6-8" | "9-12"
  >("9-12");

  const { data: courses = [], isLoading } = useGetCourses();
  const { data: allUnits = [] } = useGetUnits(undefined);
  const { data: allModules = [] } = useGetModules(undefined);
  const createCourse = useCreateCourse();
  const createUnit = useCreateUnit();
  const createModule = useCreateModule();
  const createAssignment = useCreateAssignment();

  const handleAddCourse = () => {
    setNewCourseTitle("");
    setNewCourseFramework("ims");
    setNewCourseGradeBand("9-12");
    setCourseFormState("creating");
    setSelectedNode(null);
  };

  const handleConfirmCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const course = await createCourse.mutateAsync({
      title: newCourseTitle.trim(),
      subject: "",
      gradeBand: newCourseGradeBand,
      description: "",
      framework: newCourseFramework,
    });
    setCourseFormState("idle");
    setCourseDefaultTab("settings");
    setSelectedNode({ type: "course", id: course.id });
  };

  const handleSelectNode = (node: SelectedNode) => {
    setSelectedNode(node);
    if (node?.type === "course") {
      setCourseDefaultTab("structure");
    }
  };

  const handleCancelCreateCourse = () => {
    setCourseFormState("idle");
  };

  // Context-sensitive top-right CTA for tree view
  const getContextCTA = () => {
    if (!selectedNode) {
      return {
        label: "+ Add Course",
        action: handleAddCourse,
        isPending: createCourse.isPending,
      };
    }
    if (selectedNode.type === "course") {
      return {
        label: "+ Add Unit",
        action: async () => {
          const u = await createUnit.mutateAsync({
            courseId: selectedNode.id,
            title: "New Unit",
            description: "",
          });
          setSelectedNode({
            type: "unit",
            id: u.id,
            courseId: selectedNode.id,
          });
        },
        isPending: createUnit.isPending,
      };
    }
    if (selectedNode.type === "unit") {
      return {
        label: "+ Add Module",
        action: async () => {
          const m = await createModule.mutateAsync({
            unitId: selectedNode.id,
            courseId: selectedNode.courseId,
            title: "New Module",
          });
          setSelectedNode({
            type: "module",
            id: m.id,
            unitId: selectedNode.id,
            courseId: selectedNode.courseId,
          });
        },
        isPending: createModule.isPending,
      };
    }
    if (selectedNode.type === "module" || selectedNode.type === "lesson") {
      return {
        label: "+ Add Item",
        action: async () => {
          const a = await createAssignment.mutateAsync({
            moduleId: selectedNode.id,
            courseId: selectedNode.courseId,
            title: "New Assignment",
            assignmentType: "homework",
            dueDate: "",
            points: 100,
          });
          setSelectedNode({
            type: "assignment",
            id: a.id,
            moduleId: selectedNode.id,
            unitId: selectedNode.unitId,
            courseId: selectedNode.courseId,
          });
        },
        isPending: createAssignment.isPending,
      };
    }
    if (
      selectedNode.type === "assignment" ||
      selectedNode.type === "assessment"
    ) {
      return {
        label: "+ Add Item",
        action: async () => {
          const a = await createAssignment.mutateAsync({
            moduleId: selectedNode.moduleId,
            courseId: selectedNode.courseId,
            title: "New Assignment",
            assignmentType: "homework",
            dueDate: "",
            points: 100,
          });
          setSelectedNode({
            type: "assignment",
            id: a.id,
            moduleId: selectedNode.moduleId,
            unitId: selectedNode.unitId,
            courseId: selectedNode.courseId,
          });
        },
        isPending: createAssignment.isPending,
      };
    }
    return {
      label: "+ Add Course",
      action: handleAddCourse,
      isPending: createCourse.isPending,
    };
  };

  // Build breadcrumb from selectedNode using actual item names
  const getBreadcrumb = (): Array<{ label: string; node: SelectedNode }> => {
    if (!selectedNode) return [];
    const crumbs: Array<{ label: string; node: SelectedNode }> = [];
    if (selectedNode.type === "course") {
      const course = courses.find((c) => c.id === selectedNode.id);
      crumbs.push({
        label: course?.title ?? "Course",
        node: selectedNode,
      });
    } else if (selectedNode.type === "unit") {
      const course = courses.find((c) => c.id === selectedNode.courseId);
      const unit = allUnits.find((u) => u.id === selectedNode.id);
      crumbs.push({
        label: course?.title ?? "Course",
        node: { type: "course", id: selectedNode.courseId },
      });
      crumbs.push({ label: unit?.title ?? "Unit", node: selectedNode });
    } else if (
      selectedNode.type === "module" ||
      selectedNode.type === "lesson"
    ) {
      const course = courses.find((c) => c.id === selectedNode.courseId);
      const unit = allUnits.find((u) => u.id === selectedNode.unitId);
      const mod = allModules.find((m) => m.id === selectedNode.id);
      crumbs.push({
        label: course?.title ?? "Course",
        node: { type: "course", id: selectedNode.courseId },
      });
      crumbs.push({
        label: unit?.title ?? "Unit",
        node: {
          type: "unit",
          id: selectedNode.unitId,
          courseId: selectedNode.courseId,
        },
      });
      crumbs.push({ label: mod?.title ?? "Module", node: selectedNode });
    } else if (
      selectedNode.type === "assignment" ||
      selectedNode.type === "assessment"
    ) {
      const course = courses.find((c) => c.id === selectedNode.courseId);
      const unit = allUnits.find((u) => u.id === selectedNode.unitId);
      const mod = allModules.find((m) => m.id === selectedNode.moduleId);
      crumbs.push({
        label: course?.title ?? "Course",
        node: { type: "course", id: selectedNode.courseId },
      });
      crumbs.push({
        label: unit?.title ?? "Unit",
        node: {
          type: "unit",
          id: selectedNode.unitId,
          courseId: selectedNode.courseId,
        },
      });
      crumbs.push({
        label: mod?.title ?? "Module",
        node: {
          type: "module",
          id: selectedNode.moduleId,
          unitId: selectedNode.unitId,
          courseId: selectedNode.courseId,
        },
      });
      crumbs.push({
        label: selectedNode.type === "assignment" ? "Assignment" : "Assessment",
        node: selectedNode,
      });
    }
    return crumbs;
  };

  const breadcrumb = getBreadcrumb();

  // Determine which detail panel to show
  const renderDetailPanel = () => {
    // New course creation inline form
    if (courseFormState === "creating") {
      return (
        <div className="p-6">
          <div className="max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                New Course
              </h2>
              <button
                type="button"
                onClick={handleCancelCreateCourse}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Cancel"
                data-ocid="curriculum.course_form.cancel_button"
              >
                <X size={16} />
              </button>
            </div>

            {/* Course Title */}
            <div className="mb-3">
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="new-course-title"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block"
                  >
                    Course Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-course-title"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. English 10, AP Biology, World History"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmCreateCourse();
                      if (e.key === "Escape") handleCancelCreateCourse();
                    }}
                    data-ocid="curriculum.course_form.input"
                  />
                </div>
              </div>
            </div>

            {/* Framework + Grade Band */}
            <div className="mb-4">
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="new-course-framework"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block"
                  >
                    Planning Framework
                  </Label>
                  <Select
                    value={newCourseFramework}
                    onValueChange={(v) =>
                      setNewCourseFramework(v as CurriculumFramework)
                    }
                  >
                    <SelectTrigger
                      id="new-course-framework"
                      data-ocid="curriculum.course_form.framework.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRAMEWORK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {newCourseFramework === "ubd" &&
                      "Backward design: Transfer Goals → Evidence → Learning Plan"}
                    {newCourseFramework === "backwards" &&
                      "Start with end goals, plan assessments, then instruction"}
                    {newCourseFramework === "5e" &&
                      "Engage → Explore → Explain → Elaborate → Evaluate (STEM)"}
                    {newCourseFramework === "ims" &&
                      "EdUnite's streamlined approach — Intent, Method, Scope structure"}
                    {newCourseFramework === "minimal" &&
                      "Title and description only — maximum simplicity"}
                    {newCourseFramework === "custom" &&
                      "Define your own planning fields"}
                  </p>
                </div>
                <div>
                  <Label
                    htmlFor="new-course-grade"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block"
                  >
                    Grade Band
                  </Label>
                  <Select
                    value={newCourseGradeBand}
                    onValueChange={(v) =>
                      setNewCourseGradeBand(v as "K-2" | "3-5" | "6-8" | "9-12")
                    }
                  >
                    <SelectTrigger
                      id="new-course-grade"
                      data-ocid="curriculum.course_form.grade.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="K-2">K–2</SelectItem>
                      <SelectItem value="3-5">3–5</SelectItem>
                      <SelectItem value="6-8">6–8</SelectItem>
                      <SelectItem value="9-12">9–12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleConfirmCreateCourse}
                disabled={!newCourseTitle.trim() || createCourse.isPending}
                className="gap-1.5"
                data-ocid="curriculum.course_form.submit_button"
              >
                <Plus size={15} />
                {createCourse.isPending ? "Creating…" : "Create Course"}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCancelCreateCourse}
                data-ocid="curriculum.course_form.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedNode) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <BookOpen size={32} className="text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            Select a course, unit, module, or item
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {courses.length === 0
              ? "Start by adding a course using the button above"
              : "Choose an item from the tree to view and edit its details"}
          </p>
          {courses.length === 0 && (
            <Button
              size="sm"
              onClick={handleAddCourse}
              disabled={createCourse.isPending}
              className="mt-4 gap-1.5"
            >
              <Plus size={15} />
              Add Your First Course
            </Button>
          )}
        </div>
      );
    }

    if (selectedNode.type === "course") {
      return (
        <CourseDetailPanel
          courseId={selectedNode.id}
          defaultTab={courseDefaultTab}
          onDeleted={() => setSelectedNode(null)}
          onUnitCreated={(unitId) =>
            setSelectedNode({
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
          onDeleted={() => setSelectedNode(null)}
          onModuleCreated={(moduleId) =>
            setSelectedNode({
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
          onDeleted={() => setSelectedNode(null)}
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
  };

  const contextCTA = getContextCTA();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* View Toggle Bar — inline in page content, NOT in header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === "tree"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="curriculum.structure.tab"
          >
            <List size={15} />
            Structure
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === "board"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="curriculum.board.tab"
          >
            <LayoutDashboard size={15} />
            Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === "timeline"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="curriculum.timeline.tab"
          >
            <CalendarDays size={15} />
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode("course-map")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === "course-map"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="curriculum.course_map.tab"
          >
            <Layout size={15} />
            Course Map
          </button>
        </div>

        {/* Context-sensitive CTA — only in Structure view */}
        {viewMode === "tree" && (
          <Button
            size="sm"
            onClick={contextCTA.action}
            disabled={contextCTA.isPending}
            className="gap-1.5"
            data-ocid="curriculum.context_cta.button"
          >
            <Plus size={15} />
            {contextCTA.label.replace("+ ", "")}
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === "course-map" ? (
          <CourseMapView courses={courses as Course[]} />
        ) : viewMode === "timeline" ? (
          <CurriculumTimelineView
            courses={courses as Course[]}
            onAssignmentClick={() => setViewMode("tree")}
          />
        ) : viewMode === "board" ? (
          <CurriculumBoardView
            courses={courses as Course[]}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex h-full min-h-0 gap-4 overflow-hidden">
            {/* Tree Panel — separate card */}
            <div
              className="flex-shrink-0 flex flex-col min-h-0 rounded-lg border border-border/30 bg-card overflow-hidden"
              style={{ width: "280px" }}
              data-ocid="curriculum.tree.panel"
            >
              <div className="flex items-center justify-between px-4 border-b border-border/20 flex-shrink-0 bg-muted/10 h-11">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Courses
                </span>
                <button
                  type="button"
                  onClick={handleAddCourse}
                  disabled={createCourse.isPending}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/8"
                  data-ocid="curriculum.tree.add_new.button"
                >
                  <Plus size={11} />
                  New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CurriculumTree
                  courses={courses as Course[]}
                  selectedNode={selectedNode}
                  onSelectNode={handleSelectNode}
                />
              </div>
            </div>

            {/* Detail Panel — separate card */}
            <div
              className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-lg border border-border/30 bg-card"
              data-ocid="curriculum.editor.panel"
            >
              {/* Sticky Breadcrumb Bar — flat strip inside card */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/30 flex-shrink-0 flex items-center gap-1 px-5 h-11">
                {breadcrumb.length === 0 ? (
                  <span className="text-xs text-muted-foreground/50">
                    Select an item to view details
                  </span>
                ) : (
                  breadcrumb.map((crumb, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: breadcrumb is positional
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <ChevronRight
                          size={13}
                          className="text-muted-foreground/40 flex-shrink-0"
                        />
                      )}
                      {i === breadcrumb.length - 1 ? (
                        <span className="text-sm font-semibold text-foreground">
                          {crumb.label}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectNode(crumb.node)}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {crumb.label}
                        </button>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {renderDetailPanel()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
