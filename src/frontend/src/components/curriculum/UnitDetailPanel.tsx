import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  BookmarkPlus,
  Check,
  Clock,
  FolderOpen,
  Layers,
  Loader2,
  Plus,
  Printer,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCreateAssignment,
  useCreateModule,
  useDeleteUnit,
  useGetAssignments,
  useGetCourses,
  useGetModules,
  useGetUnits,
  useUpdateUnit,
} from "../../hooks/useQueries";
import type { FrameworkFields, UnitTemplate } from "../../lib/curriculumTypes";
import type { CustomFramework } from "../../lib/customFrameworks";
import { getCustomFrameworks } from "../../lib/customFrameworks";
import { getTemplates, saveTemplate } from "../../lib/unitTemplates";
import StandardsPicker from "./StandardsPicker";

interface KeyResource {
  title: string;
  resourceType: string;
}

interface UnitDetailPanelProps {
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onModuleCreated?: (moduleId: number) => void;
  // Legacy compat
  onLessonCreated?: (lessonId: number) => void;
  boardMode?: boolean;
  onBack?: () => void;
}

// ─── Tag Input helper ─────────────────────────────────────────────────────────
function TagInputInline({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            const trimmed = input.trim().replace(/,$/, "");
            if (trimmed) {
              onChange([...values, trimmed]);
              setInput("");
            }
          }
        }}
        placeholder={placeholder ?? "Type and press Enter to add..."}
        className="text-sm"
      />
    </div>
  );
}

export default function UnitDetailPanel({
  unitId,
  courseId,
  onDeleted,
  onModuleCreated,
  onLessonCreated,
  boardMode = false,
  onBack,
}: UnitDetailPanelProps) {
  const { data: units = [] } = useGetUnits(courseId);
  const unit = units.find((u) => u.id === unitId);

  // Look up the parent course to check for custom framework
  const { data: courses = [] } = useGetCourses();
  const parentCourse = courses.find((c) => c.id === courseId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [essentialQuestion, setEssentialQuestion] = useState("");
  const [durationValue, setDurationValue] = useState("1");
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks">("weeks");
  const [standards, setStandards] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleError, setTitleError] = useState("");

  // New unit planning fields
  const [enduringUnderstandings, setEnduringUnderstandings] = useState("");
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [keyResources, setKeyResources] = useState<KeyResource[]>([]);
  const [pacingNotes, setPacingNotes] = useState("");
  const [newObjectiveInput, setNewObjectiveInput] = useState("");

  // Custom framework field values (for unit-level fields)
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string | string[]>
  >({});

  // Board mode: status field
  const [status, setStatus] = useState<"active" | "draft" | "archived">(
    "active",
  );

  // Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templates, setTemplates] = useState<UnitTemplate[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
    null,
  );
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createModule = useCreateModule();
  const createAssignment = useCreateAssignment();

  // Load modules for this unit (needed for template snapshot + load)
  const { data: unitModules = [] } = useGetModules(unitId);
  // Load assignments for all modules in this unit (used to snapshot template)
  const { data: allAssignments = [] } = useGetAssignments(undefined);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when unitId changes to reset form
  useEffect(() => {
    if (unit) {
      setTitle(unit.title);
      setDescription(unit.description);
      setEssentialQuestion(unit.essentialQuestion ?? "");
      setDurationValue(String(unit.durationValue ?? 1));
      setDurationUnit(unit.durationUnit ?? "weeks");
      setStandards(unit.standards ?? []);
      setTags(unit.tags ?? []);

      // Load status from frameworkFields or default to active
      const storedStatus = (unit.frameworkFields as Record<string, unknown>)
        ?.status as string | undefined;
      setStatus((storedStatus as "active" | "draft" | "archived") ?? "active");

      // Load unit planning fields from frameworkFields
      const up = (unit.frameworkFields as Record<string, unknown>)
        ?.unitPlanning as
        | {
            enduringUnderstandings?: string;
            learningObjectives?: string[];
            keyResources?: KeyResource[];
            pacingNotes?: string;
          }
        | undefined;
      setEnduringUnderstandings(up?.enduringUnderstandings ?? "");
      setLearningObjectives(up?.learningObjectives ?? []);
      setKeyResources(up?.keyResources ?? []);
      setPacingNotes(up?.pacingNotes ?? "");

      // Load custom field values
      const customData = unit.frameworkFields?.custom;
      setCustomFieldValues(customData?.values ?? {});

      isFirstLoad.current = true;
    }
  }, [unitId]);

  const buildFrameworkFields = (
    eu: string,
    lo: string[],
    kr: KeyResource[],
    pn: string,
    customValues?: Record<string, string | string[]>,
  ): FrameworkFields => {
    const existing = unit?.frameworkFields ?? {};
    const customFrameworkId = existing.custom?.frameworkId;
    const result = {
      ...existing,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unitPlanning: {
        enduringUnderstandings: eu,
        learningObjectives: lo,
        keyResources: kr,
        pacingNotes: pn,
      },
    } as FrameworkFields;

    // Merge custom field values if applicable
    if (customFrameworkId !== undefined) {
      result.custom = {
        frameworkId: customFrameworkId,
        values: customValues ?? customFieldValues,
      };
    }

    return result;
  };

  const triggerSave = (
    t: string,
    d: string,
    eq: string,
    dv: string,
    du: "days" | "weeks",
    std: string[],
    tg: string[],
    eu: string,
    lo: string[],
    kr: KeyResource[],
    pn: string,
    fwf?: FrameworkFields,
  ) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const frameworkFieldsToSave =
          fwf ?? buildFrameworkFields(eu, lo, kr, pn);
        await updateUnit.mutateAsync({
          id: unitId,
          courseId,
          title: t,
          description: d,
          essentialQuestion: eq,
          durationValue: Number.parseInt(dv) || 1,
          durationUnit: du,
          standards: std,
          tags: tg,
          frameworkFields: frameworkFieldsToSave,
        });
        setSavedAt(new Date());
      } catch {}
      setSaving(false);
    }, 800);
  };

  const update = (patch: {
    title?: string;
    description?: string;
    essentialQuestion?: string;
    durationValue?: string;
    durationUnit?: "days" | "weeks";
    standards?: string[];
    tags?: string[];
    enduringUnderstandings?: string;
    learningObjectives?: string[];
    keyResources?: KeyResource[];
    pacingNotes?: string;
    customFieldValues?: Record<string, string | string[]>;
  }) => {
    const t = patch.title ?? title;
    const d = patch.description ?? description;
    const eq = patch.essentialQuestion ?? essentialQuestion;
    const dv = patch.durationValue ?? durationValue;
    const du = patch.durationUnit ?? durationUnit;
    const std = patch.standards ?? standards;
    const tg = patch.tags ?? tags;
    const eu = patch.enduringUnderstandings ?? enduringUnderstandings;
    const lo = patch.learningObjectives ?? learningObjectives;
    const kr = patch.keyResources ?? keyResources;
    const pn = patch.pacingNotes ?? pacingNotes;
    const cfv = patch.customFieldValues ?? customFieldValues;

    if ("title" in patch) setTitle(t);
    if ("description" in patch) setDescription(d);
    if ("essentialQuestion" in patch) setEssentialQuestion(eq);
    if ("durationValue" in patch) setDurationValue(dv);
    if ("durationUnit" in patch) setDurationUnit(du);
    if ("standards" in patch) setStandards(std);
    if ("tags" in patch) setTags(tg);
    if ("enduringUnderstandings" in patch) setEnduringUnderstandings(eu);
    if ("learningObjectives" in patch) setLearningObjectives(lo);
    if ("keyResources" in patch) setKeyResources(kr);
    if ("pacingNotes" in patch) setPacingNotes(pn);
    if ("customFieldValues" in patch) setCustomFieldValues(cfv);

    const fwf = buildFrameworkFields(eu, lo, kr, pn, cfv);
    triggerSave(t, d, eq, dv, du, std, tg, eu, lo, kr, pn, fwf);
  };

  const addTag = (val: string) => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      update({ tags: [...tags, trimmed] });
    }
    setTagInput("");
  };

  const addLearningObjective = () => {
    const trimmed = newObjectiveInput.trim();
    if (trimmed) {
      update({ learningObjectives: [...learningObjectives, trimmed] });
      setNewObjectiveInput("");
    }
  };

  const removeLearningObjective = (idx: number) => {
    update({
      learningObjectives: learningObjectives.filter((_, i) => i !== idx),
    });
  };

  const addKeyResource = () => {
    update({
      keyResources: [...keyResources, { title: "", resourceType: "Text" }],
    });
  };

  const updateKeyResource = (
    idx: number,
    field: keyof KeyResource,
    value: string,
  ) => {
    const updated = keyResources.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r,
    );
    update({ keyResources: updated });
  };

  const removeKeyResource = (idx: number) => {
    update({ keyResources: keyResources.filter((_, i) => i !== idx) });
  };

  const handleSaveTemplate = () => {
    const name = templateName.trim() || title || "Untitled Template";
    // Snapshot current unit's modules and their assignments
    const snapshotModules = unitModules.map((mod) => {
      const modAssignments = allAssignments
        .filter((a) => a.moduleId === mod.id || a.lessonId === mod.id)
        .map((a) => ({
          title: a.title,
          assignmentType: a.assignmentType,
          points: a.points,
          description: a.description,
        }));
      return {
        title: mod.title,
        description: mod.description,
        learningObjectives: mod.learningObjectives ?? [],
        assignments: modAssignments,
      };
    });

    saveTemplate({
      name,
      description: templateDescription.trim(),
      durationValue: Number.parseInt(durationValue) || 1,
      durationUnit,
      essentialQuestion,
      enduringUnderstandings,
      learningObjectives,
      pacingNotes,
      modules: snapshotModules,
    });

    setTemplates(getTemplates());
    setShowSaveTemplate(false);
    setTemplateName("");
    setTemplateDescription("");
    toast.success("Template saved");
  };

  const handleOpenLoadTemplate = () => {
    setTemplates(getTemplates());
    setShowLoadTemplate((v) => !v);
    setShowSaveTemplate(false);
    setConfirmOverwrite(null);
  };

  const handleOpenSaveTemplate = () => {
    setTemplateName(title || "");
    setShowSaveTemplate((v) => !v);
    setShowLoadTemplate(false);
  };

  const applyTemplate = async (tpl: UnitTemplate) => {
    setLoadingTemplate(true);
    setPendingTemplateId(tpl.id);
    try {
      // Update unit fields from template
      const newFrameworkFields = buildFrameworkFields(
        tpl.enduringUnderstandings,
        tpl.learningObjectives,
        keyResources,
        tpl.pacingNotes,
      );
      setEssentialQuestion(tpl.essentialQuestion);
      setEnduringUnderstandings(tpl.enduringUnderstandings);
      setLearningObjectives(tpl.learningObjectives);
      setPacingNotes(tpl.pacingNotes);
      setDurationValue(String(tpl.durationValue));
      setDurationUnit(tpl.durationUnit);

      await updateUnit.mutateAsync({
        id: unitId,
        courseId,
        essentialQuestion: tpl.essentialQuestion,
        durationValue: tpl.durationValue,
        durationUnit: tpl.durationUnit,
        frameworkFields: newFrameworkFields,
      });

      // Create modules from template
      for (const modTemplate of tpl.modules) {
        const mod = await createModule.mutateAsync({
          unitId,
          courseId,
          title: modTemplate.title,
          description: modTemplate.description,
        });
        // Create assignments for each module
        for (const asgn of modTemplate.assignments) {
          await createAssignment.mutateAsync({
            moduleId: mod.id,
            courseId,
            title: asgn.title,
            assignmentType: asgn.assignmentType as
              | "practice"
              | "graded"
              | "writing"
              | "project"
              | "formative"
              | "summative"
              | "homework"
              | "classwork"
              | "lab"
              | "presentation",
            points: asgn.points,
            description: asgn.description,
            dueDate: "",
          });
        }
      }

      toast.success(`Template "${tpl.name}" applied`);
      setShowLoadTemplate(false);
      setConfirmOverwrite(null);
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setLoadingTemplate(false);
      setPendingTemplateId(null);
    }
  };

  const handleUseTemplate = (tpl: UnitTemplate) => {
    const hasContent = title.trim() !== "" || unitModules.length > 0;
    if (hasContent) {
      setConfirmOverwrite(tpl.id);
    } else {
      applyTemplate(tpl);
    }
  };

  const handleDelete = async () => {
    await deleteUnit.mutateAsync({ unitId, courseId });
    onDeleted();
  };

  const handleAddModule = async () => {
    const mod = await createModule.mutateAsync({
      unitId,
      courseId,
      title: "New Module",
    });
    if (onModuleCreated) onModuleCreated(mod.id);
    if (onLessonCreated) onLessonCreated(mod.id);
  };

  // Board mode: discard — reset all local state to unit data
  const handleDiscard = () => {
    if (!unit) return;
    setTitle(unit.title);
    setDescription(unit.description);
    setEssentialQuestion(unit.essentialQuestion ?? "");
    setDurationValue(String(unit.durationValue ?? 1));
    setDurationUnit(unit.durationUnit ?? "weeks");
    setStandards(unit.standards ?? []);
    setTags(unit.tags ?? []);
    const storedStatus = (unit.frameworkFields as Record<string, unknown>)
      ?.status as string | undefined;
    setStatus((storedStatus as "active" | "draft" | "archived") ?? "active");
    const up = (unit.frameworkFields as Record<string, unknown>)
      ?.unitPlanning as
      | {
          enduringUnderstandings?: string;
          learningObjectives?: string[];
          keyResources?: KeyResource[];
          pacingNotes?: string;
        }
      | undefined;
    setEnduringUnderstandings(up?.enduringUnderstandings ?? "");
    setLearningObjectives(up?.learningObjectives ?? []);
    setKeyResources(up?.keyResources ?? []);
    setPacingNotes(up?.pacingNotes ?? "");
    const customData = unit.frameworkFields?.custom;
    setCustomFieldValues(customData?.values ?? {});
    isFirstLoad.current = true;
    toast.success("Changes discarded");
  };

  // Board mode: immediate save
  const handleManualSave = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    setTitleError("");
    setSaving(true);
    try {
      const fwf = buildFrameworkFields(
        enduringUnderstandings,
        learningObjectives,
        keyResources,
        pacingNotes,
      );
      const fwfWithStatus = { ...fwf, status };
      await updateUnit.mutateAsync({
        id: unitId,
        courseId,
        title,
        description,
        essentialQuestion,
        durationValue: Number.parseInt(durationValue) || 1,
        durationUnit,
        standards,
        tags,
        frameworkFields: fwfWithStatus,
      });
      setSavedAt(new Date());
      toast.success("Unit saved");
    } catch {
      toast.error("Failed to save unit");
    }
    setSaving(false);
  };

  if (!unit) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Board mode render ──────────────────────────────────────────────────────
  if (boardMode) {
    return (
      <div
        className="flex flex-col h-full"
        data-ocid="curriculum.unit_detail.panel"
      >
        {/* Board mode: flat header with chips + back button */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
              UNIT
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                status === "active"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : status === "draft"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              ●{" "}
              {status === "active"
                ? "Active"
                : status === "draft"
                  ? "Draft"
                  : "Archived"}
            </span>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="curriculum.board_detail.back.button"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>

        {/* Title + duration sub-header */}
        <div className="px-6 pb-5 border-b border-border flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">
            {title || "Untitled Unit"}
          </h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Clock size={13} />
            <span>
              {durationValue} {durationUnit}
            </span>
          </div>
        </div>

        {/* Apply Preset inline picker */}
        {showPresetPicker && (
          <div
            className="border-b border-border/40 px-6 py-4 bg-muted/30 flex-shrink-0"
            data-ocid="curriculum.unit.preset.panel"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Apply Preset
            </p>
            <div className="space-y-1">
              {(
                [
                  {
                    id: "ubd",
                    label: "Full UbD",
                    desc: "Enduring Understanding + Essential Questions + Learning Objectives",
                  },
                  {
                    id: "minimal",
                    label: "Minimal Planning",
                    desc: "1 Learning Objective, all other framework fields cleared",
                  },
                  {
                    id: "assessment",
                    label: "Assessment-Focused",
                    desc: "Essential Question + Summative Assessment objective",
                  },
                ] as Array<{ id: string; label: string; desc: string }>
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.id === "ubd") {
                      update({
                        enduringUnderstandings:
                          "Students will understand that skilled readers analyze how authors use language, structure, and perspective to construct meaning and shape audience response.",
                        essentialQuestion:
                          "How do authors use craft and structure to persuade, inform, and inspire?",
                        learningObjectives: [
                          "Analyze rhetorical strategies in nonfiction texts",
                          "Evaluate how an author’s choices affect meaning and tone",
                          "Construct evidence-based arguments about a text’s effectiveness",
                        ],
                      });
                    } else if (p.id === "minimal") {
                      update({
                        enduringUnderstandings: "",
                        essentialQuestion: "",
                        learningObjectives: [
                          "Students will be able to demonstrate mastery of unit concepts through structured tasks.",
                        ],
                      });
                    } else if (p.id === "assessment") {
                      update({
                        essentialQuestion:
                          "How will students demonstrate deep understanding of this unit’s core concepts?",
                        learningObjectives: [
                          "Summative Assessment: Students will produce a culminating project or exam demonstrating mastery of unit standards.",
                        ],
                      });
                    }
                    setShowPresetPicker(false);
                    toast.success(`Applied “${p.label}” preset`);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all group"
                  data-ocid={`curriculum.unit.preset.${p.id}.button`}
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {p.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPresetPicker(false)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="curriculum.unit.preset.close_button"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Flat form fields — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Apply Preset button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPresetPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              data-ocid="curriculum.unit.preset.button"
            >
              <Wand2 size={12} />
              Apply Preset
            </button>
          </div>
          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="board-unit-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              TITLE
            </Label>
            <Input
              id="board-unit-title"
              value={title}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={() => {
                if (!title.trim()) setTitleError("Title is required");
                else setTitleError("");
              }}
              placeholder="Unit title"
              className={titleError ? "border-destructive" : ""}
              data-ocid="curriculum.unit.input"
            />
            {titleError && (
              <p
                className="text-xs text-destructive"
                data-ocid="curriculum.unit.error_state"
              >
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="board-unit-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              DESCRIPTION
            </Label>
            <Textarea
              id="board-unit-desc"
              value={description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Describe this unit..."
              rows={3}
              data-ocid="curriculum.unit.textarea"
            />
          </div>

          {/* Status + Duration side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                STATUS
              </Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "active" | "draft" | "archived")
                }
              >
                <SelectTrigger data-ocid="curriculum.unit.duration.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                DURATION
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={durationValue}
                  onChange={(e) => update({ durationValue: e.target.value })}
                  className="w-full"
                  data-ocid="curriculum.unit.duration_input"
                />
                <Select
                  value={durationUnit}
                  onValueChange={(v) =>
                    update({ durationUnit: v as "days" | "weeks" })
                  }
                >
                  <SelectTrigger className="w-24 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Standards */}
          <StandardsPicker
            selected={standards}
            onChange={(ids) => update({ standards: ids })}
          />

          {/* Essential Question */}
          <div className="space-y-1.5">
            <Label
              htmlFor="board-unit-eq"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              ESSENTIAL QUESTION
            </Label>
            <Input
              id="board-unit-eq"
              value={essentialQuestion}
              onChange={(e) => update({ essentialQuestion: e.target.value })}
              placeholder="What open-ended question drives this unit?"
              data-ocid="curriculum.unit.eq_input"
            />
          </div>

          {/* Enduring Understandings */}
          <div className="space-y-1.5">
            <Label
              htmlFor="board-unit-eu"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              ENDURING UNDERSTANDINGS
            </Label>
            <Textarea
              id="board-unit-eu"
              value={enduringUnderstandings}
              onChange={(e) =>
                update({ enduringUnderstandings: e.target.value })
              }
              placeholder="Big ideas students should carry beyond this unit..."
              rows={2}
              data-ocid="curriculum.unit.eu_textarea"
            />
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LEARNING OBJECTIVES
            </Label>
            {learningObjectives.length > 0 && (
              <div className="space-y-1">
                {learningObjectives.map((obj, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered list by index
                  <div key={idx} className="flex items-start gap-2 group">
                    <span className="text-xs text-muted-foreground font-medium mt-2 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-sm text-foreground py-1.5 px-2 rounded bg-muted/40 leading-snug">
                      {obj}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLearningObjective(idx)}
                      className="mt-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      aria-label={`Remove objective ${idx + 1}`}
                      data-ocid={`curriculum.unit.objective.delete_button.${idx + 1}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newObjectiveInput}
                onChange={(e) => setNewObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newObjectiveInput.trim()) {
                    e.preventDefault();
                    addLearningObjective();
                  }
                }}
                placeholder="Add a learning objective..."
                className="text-sm"
                data-ocid="curriculum.unit.objective_input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLearningObjective}
                disabled={!newObjectiveInput.trim()}
                className="shrink-0"
                data-ocid="curriculum.unit.objective_add.button"
              >
                <Plus size={13} />
              </Button>
            </div>
          </div>

          {/* Key Resources */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KEY RESOURCES
            </Label>
            {keyResources.length > 0 && (
              <div className="space-y-2">
                {keyResources.map((resource, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={resource.title}
                      onChange={(e) =>
                        updateKeyResource(idx, "title", e.target.value)
                      }
                      placeholder="Resource title"
                      className="flex-1 text-sm"
                      data-ocid={`curriculum.unit.resource.input.${idx + 1}`}
                    />
                    <Select
                      value={resource.resourceType}
                      onValueChange={(v) =>
                        updateKeyResource(idx, "resourceType", v)
                      }
                    >
                      <SelectTrigger
                        className="w-32 shrink-0"
                        data-ocid={`curriculum.unit.resource.select.${idx + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Handout">Handout</SelectItem>
                        <SelectItem value="Manipulative">
                          Manipulative
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeKeyResource(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      aria-label={`Remove resource ${idx + 1}`}
                      data-ocid={`curriculum.unit.resource.delete_button.${idx + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyResource}
              className="gap-1.5 text-xs"
              data-ocid="curriculum.unit.resource_add.button"
            >
              <Plus size={12} />
              Add Resource
            </Button>
          </div>

          {/* Pacing Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="board-unit-pacing"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              PACING NOTES
            </Label>
            <Textarea
              id="board-unit-pacing"
              value={pacingNotes}
              onChange={(e) => update({ pacingNotes: e.target.value })}
              placeholder="Notes on timing, scheduling, or sequencing..."
              rows={2}
              data-ocid="curriculum.unit.pacing_textarea"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              TAGS
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() =>
                      update({ tags: tags.filter((x) => x !== t) })
                    }
                    aria-label={`Remove tag ${t}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Type a tag and press Enter..."
              className="text-sm"
              data-ocid="curriculum.unit.tags_input"
            />
          </div>

          {/* Custom Framework Fields (unit-level) */}
          {(() => {
            if (parentCourse?.framework !== "custom") return null;
            const frameworkId =
              parentCourse.frameworkFields?.custom?.frameworkId;
            if (!frameworkId) return null;
            const allFrameworks: CustomFramework[] = getCustomFrameworks();
            const fw = allFrameworks.find((f) => f.id === frameworkId);
            if (!fw) return null;
            const unitFields = fw.fields.filter((f) => f.level === "unit");
            if (unitFields.length === 0) return null;
            return (
              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CUSTOM FIELDS
                </Label>
                {unitFields.map((f) => {
                  const rawVal = customFieldValues[f.id];
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <Label
                        htmlFor={`board-custom-unit-${f.id}`}
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {f.label.toUpperCase()}
                        {f.required && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </Label>
                      {f.type === "long-text" ? (
                        <Textarea
                          id={`board-custom-unit-${f.id}`}
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                          rows={2}
                        />
                      ) : f.type === "list" ? (
                        <TagInputInline
                          values={Array.isArray(rawVal) ? rawVal : []}
                          onChange={(vals) => {
                            const next = { ...customFieldValues, [f.id]: vals };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                        />
                      ) : f.type === "date" ? (
                        <input
                          id={`board-custom-unit-${f.id}`}
                          type="date"
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                      ) : f.type === "number" ? (
                        <input
                          id={`board-custom-unit-${f.id}`}
                          type="number"
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                          className="h-9 w-40 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                      ) : (
                        <Input
                          id={`board-custom-unit-${f.id}`}
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Pinned bottom action bar */}
        <div className="flex-shrink-0 sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 text-sm"
            onClick={handleDiscard}
            data-ocid="curriculum.board_detail.discard.button"
          >
            Discard
          </Button>
          <Button
            type="button"
            className="h-9 px-4 text-sm bg-violet-700 text-white hover:bg-violet-800"
            onClick={handleManualSave}
            disabled={saving}
            data-ocid="curriculum.board_detail.save.button"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  // ── Standard (non-board) render ──────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full"
      data-ocid="curriculum.unit_detail.panel"
    >
      {/* Print styles — print the full unit detail panel */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-ocid="curriculum.unit_detail.panel"],
          [data-ocid="curriculum.unit_detail.panel"] * { visibility: visible; }
          [data-ocid="curriculum.unit_detail.panel"] {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
          }
          [data-ocid="curriculum.unit_overview.print_button"] { display: none !important; }
        }
      `}</style>

      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Layers size={13} className="text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
              Unit
            </span>
          </div>
          <h2 className="font-bold text-base text-foreground">
            {title || "Untitled Unit"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {!saving && savedAt && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check size={12} /> Saved at{" "}
              {savedAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs h-7 text-muted-foreground"
            data-ocid="curriculum.unit_overview.print_button"
          >
            <Printer size={12} />
            Print
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenSaveTemplate}
            className="gap-1.5 text-xs h-7"
            data-ocid="unit.save_template.button"
          >
            <BookmarkPlus size={12} />
            Save as Template
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenLoadTemplate}
            className="gap-1.5 text-xs h-7"
            data-ocid="unit.load_template.button"
          >
            <FolderOpen size={12} />
            Load Template
          </Button>
        </div>
      </div>

      {/* Save as Template inline panel */}
      {showSaveTemplate && (
        <div className="border-b border-border/40 px-6 py-4 space-y-3 bg-background">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Save as Template
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="template-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. UbD ELA Unit, 5E Biology Unit..."
              data-ocid="unit.template_name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="template-desc">Description (optional)</Label>
            <Textarea
              id="template-desc"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Snapshots current unit fields and {unitModules.length} module
            {unitModules.length !== 1 ? "s" : ""}.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() && !title.trim()}
              className="gap-1.5"
              data-ocid="unit.template_save.submit_button"
            >
              <BookmarkPlus size={13} />
              Save Template
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveTemplate(false)}
              data-ocid="unit.template_save.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Load Template inline panel */}
      {showLoadTemplate && (
        <div className="border-b border-border/40 px-6 py-4 space-y-3 bg-background">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Load Template
          </p>
          {templates.length === 0 ? (
            <div className="text-center py-6">
              <FolderOpen
                size={28}
                className="mx-auto mb-2 text-muted-foreground/40"
              />
              <p className="text-sm text-muted-foreground">
                No templates saved yet.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Build a unit, then click "Save as Template."
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl, idx) => {
                const assignmentCount = tpl.modules.reduce(
                  (sum, m) => sum + m.assignments.length,
                  0,
                );
                const isConfirming = confirmOverwrite === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="border border-border rounded-lg p-3 space-y-2"
                    data-ocid={`unit.template_list.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {tpl.name}
                        </p>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tpl.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge variant="secondary" className="text-xs py-0">
                            {tpl.modules.length} module
                            {tpl.modules.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="secondary" className="text-xs py-0">
                            {assignmentCount} assignment
                            {assignmentCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                      {!isConfirming && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseTemplate(tpl)}
                          disabled={
                            loadingTemplate && pendingTemplateId === tpl.id
                          }
                          className="shrink-0 text-xs h-7 gap-1"
                          data-ocid={`unit.template.use_button.${idx + 1}`}
                        >
                          {loadingTemplate && pendingTemplateId === tpl.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : null}
                          Use Template
                        </Button>
                      )}
                    </div>
                    {isConfirming && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle
                          size={13}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                          This will add template modules to the current unit.
                          Continue?
                        </span>
                        <button
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          disabled={loadingTemplate}
                          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors shrink-0"
                          data-ocid="unit.template.confirm_button"
                        >
                          {loadingTemplate ? "Applying..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmOverwrite(null)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          data-ocid="unit.template.cancel_button"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLoadTemplate(false)}
              className="text-xs"
            >
              <X size={12} className="mr-1" />
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Apply Preset — Structure view inline picker */}
      {showPresetPicker && (
        <div
          className="border-b border-border/40 px-6 py-4 bg-muted/30 flex-shrink-0"
          data-ocid="curriculum.structure.unit.preset.panel"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Apply Preset
          </p>
          <div className="space-y-1">
            {(
              [
                {
                  id: "ubd",
                  label: "Full UbD",
                  desc: "Enduring Understanding + Essential Questions + Learning Objectives",
                },
                {
                  id: "minimal",
                  label: "Minimal Planning",
                  desc: "1 Learning Objective, all other framework fields cleared",
                },
                {
                  id: "assessment",
                  label: "Assessment-Focused",
                  desc: "Essential Question + Summative Assessment objective",
                },
              ] as Array<{ id: string; label: string; desc: string }>
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.id === "ubd") {
                    update({
                      enduringUnderstandings:
                        "Students will understand that skilled readers analyze how authors use language, structure, and perspective to construct meaning and shape audience response.",
                      essentialQuestion:
                        "How do authors use craft and structure to persuade, inform, and inspire?",
                      learningObjectives: [
                        "Analyze rhetorical strategies in nonfiction texts",
                        "Evaluate how an author's choices affect meaning and tone",
                        "Construct evidence-based arguments about a text's effectiveness",
                      ],
                    });
                  } else if (p.id === "minimal") {
                    update({
                      enduringUnderstandings: "",
                      essentialQuestion: "",
                      learningObjectives: [
                        "Students will be able to demonstrate mastery of unit concepts through structured tasks.",
                      ],
                    });
                  } else if (p.id === "assessment") {
                    update({
                      essentialQuestion:
                        "How will students demonstrate deep understanding of this unit's core concepts?",
                      learningObjectives: [
                        "Summative Assessment: Students will produce a culminating project or exam demonstrating mastery of unit standards.",
                      ],
                    });
                  }
                  setShowPresetPicker(false);
                  toast.success(`Applied "${p.label}" preset`);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all group"
                data-ocid={`curriculum.structure.unit.preset.${p.id}.button`}
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {p.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowPresetPicker(false)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="curriculum.structure.unit.preset.close_button"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Form */}
      <div className="p-6 divide-y divide-border/40 flex-1">
        {/* Basic Info */}
        <div className="space-y-4 py-6 first:pt-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Basic Information
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="unit-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="unit-title"
              value={title}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={() => {
                if (!title.trim()) setTitleError("Title is required");
                else setTitleError("");
              }}
              placeholder="Unit title"
              className={titleError ? "border-destructive" : ""}
              data-ocid="curriculum.unit.input"
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-desc">Description</Label>
            <Textarea
              id="unit-desc"
              value={description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Describe this unit..."
              rows={3}
              data-ocid="curriculum.unit.textarea"
            />
          </div>
        </div>

        {/* Unit Planning */}
        <div className="space-y-4 py-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Unit Planning
          </h3>

          {/* Essential Question */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-eq">Essential Question</Label>
            <Input
              id="unit-eq"
              value={essentialQuestion}
              onChange={(e) => update({ essentialQuestion: e.target.value })}
              placeholder="What open-ended question drives this unit?"
              data-ocid="curriculum.unit.eq_input"
            />
          </div>

          {/* Enduring Understandings */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-eu">Enduring Understandings</Label>
            <Textarea
              id="unit-eu"
              value={enduringUnderstandings}
              onChange={(e) =>
                update({ enduringUnderstandings: e.target.value })
              }
              placeholder="Big ideas students should carry beyond this unit..."
              rows={2}
              data-ocid="curriculum.unit.eu_textarea"
            />
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            {learningObjectives.length > 0 && (
              <ol className="space-y-1.5">
                {learningObjectives.map((obj, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered list by index
                  <li key={idx} className="flex items-start gap-2 group">
                    <span className="text-xs text-muted-foreground font-medium mt-1 w-5 text-right shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-sm text-foreground leading-snug py-1">
                      {obj}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLearningObjective(idx)}
                      className="mt-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      aria-label={`Remove objective ${idx + 1}`}
                      data-ocid={`curriculum.unit.objective.delete_button.${idx + 1}`}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex gap-2">
              <Input
                value={newObjectiveInput}
                onChange={(e) => setNewObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newObjectiveInput.trim()) {
                    e.preventDefault();
                    addLearningObjective();
                  }
                }}
                placeholder="Add a learning objective..."
                className="text-sm"
                data-ocid="curriculum.unit.objective_input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLearningObjective}
                disabled={!newObjectiveInput.trim()}
                className="shrink-0"
                data-ocid="curriculum.unit.objective_add.button"
              >
                <Plus size={13} />
              </Button>
            </div>
          </div>

          {/* Key Resources */}
          <div className="space-y-2">
            <Label>Key Resources</Label>
            {keyResources.length > 0 && (
              <div className="space-y-2">
                {keyResources.map((resource, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={resource.title}
                      onChange={(e) =>
                        updateKeyResource(idx, "title", e.target.value)
                      }
                      placeholder="Resource title"
                      className="flex-1 text-sm"
                      data-ocid={`curriculum.unit.resource.input.${idx + 1}`}
                    />
                    <Select
                      value={resource.resourceType}
                      onValueChange={(v) =>
                        updateKeyResource(idx, "resourceType", v)
                      }
                    >
                      <SelectTrigger
                        className="w-32 shrink-0"
                        data-ocid={`curriculum.unit.resource.select.${idx + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Handout">Handout</SelectItem>
                        <SelectItem value="Manipulative">
                          Manipulative
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeKeyResource(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      aria-label={`Remove resource ${idx + 1}`}
                      data-ocid={`curriculum.unit.resource.delete_button.${idx + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyResource}
              className="gap-1.5 text-xs"
              data-ocid="curriculum.unit.resource_add.button"
            >
              <Plus size={12} />
              Add Resource
            </Button>
          </div>

          {/* Pacing Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-pacing">Pacing Notes</Label>
            <Textarea
              id="unit-pacing"
              value={pacingNotes}
              onChange={(e) => update({ pacingNotes: e.target.value })}
              placeholder="Notes on timing, scheduling, or sequencing..."
              rows={2}
              data-ocid="curriculum.unit.pacing_textarea"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => update({ durationValue: e.target.value })}
                className="w-24"
                data-ocid="curriculum.unit.duration_input"
              />
              <Select
                value={durationUnit}
                onValueChange={(v) =>
                  update({ durationUnit: v as "days" | "weeks" })
                }
              >
                <SelectTrigger
                  className="w-28"
                  data-ocid="curriculum.unit.duration.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Custom Framework Fields (unit-level) */}
        {(() => {
          if (parentCourse?.framework !== "custom") return null;
          const frameworkId = parentCourse.frameworkFields?.custom?.frameworkId;
          if (!frameworkId) return null;
          const allFrameworks: CustomFramework[] = getCustomFrameworks();
          const fw = allFrameworks.find((f) => f.id === frameworkId);
          if (!fw) return null;
          const unitFields = fw.fields.filter((f) => f.level === "unit");
          if (unitFields.length === 0) return null;
          return (
            <div className="space-y-4 py-6">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Custom Fields
                </h3>
              </div>
              {unitFields.map((f) => {
                const rawVal = customFieldValues[f.id];
                return (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={`custom-unit-${f.id}`}>
                      {f.label}
                      {f.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </Label>
                    {f.type === "long-text" ? (
                      <Textarea
                        id={`custom-unit-${f.id}`}
                        value={typeof rawVal === "string" ? rawVal : ""}
                        onChange={(e) => {
                          const next = {
                            ...customFieldValues,
                            [f.id]: e.target.value,
                          };
                          update({ customFieldValues: next });
                        }}
                        placeholder={f.placeholder}
                        rows={2}
                      />
                    ) : f.type === "list" ? (
                      <TagInputInline
                        values={Array.isArray(rawVal) ? rawVal : []}
                        onChange={(vals) => {
                          const next = {
                            ...customFieldValues,
                            [f.id]: vals,
                          };
                          update({ customFieldValues: next });
                        }}
                        placeholder={f.placeholder}
                      />
                    ) : f.type === "date" ? (
                      <input
                        id={`custom-unit-${f.id}`}
                        type="date"
                        value={typeof rawVal === "string" ? rawVal : ""}
                        onChange={(e) => {
                          const next = {
                            ...customFieldValues,
                            [f.id]: e.target.value,
                          };
                          update({ customFieldValues: next });
                        }}
                        className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                    ) : f.type === "number" ? (
                      <input
                        id={`custom-unit-${f.id}`}
                        type="number"
                        value={typeof rawVal === "string" ? rawVal : ""}
                        onChange={(e) => {
                          const next = {
                            ...customFieldValues,
                            [f.id]: e.target.value,
                          };
                          update({ customFieldValues: next });
                        }}
                        placeholder={f.placeholder}
                        className="h-9 w-40 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                    ) : (
                      <Input
                        id={`custom-unit-${f.id}`}
                        value={typeof rawVal === "string" ? rawVal : ""}
                        onChange={(e) => {
                          const next = {
                            ...customFieldValues,
                            [f.id]: e.target.value,
                          };
                          update({ customFieldValues: next });
                        }}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Standards & Tags */}
        <div className="space-y-4 py-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Standards & Tags
          </h3>
          <div className="space-y-3">
            <StandardsPicker
              selected={standards}
              onChange={(ids) => update({ standards: ids })}
              label="Standards"
            />
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        update({ tags: tags.filter((x) => x !== t) })
                      }
                      aria-label={`Remove tag ${t}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Type a tag and press Enter..."
                className="text-sm"
                data-ocid="curriculum.unit.tags_input"
              />
            </div>
          </div>
        </div>

        {/* Add Module */}
        <div className="py-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddModule}
            disabled={createModule.isPending}
            className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
            data-ocid="curriculum.unit.add_module.button"
          >
            {createModule.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Add Module to this Unit
          </Button>
        </div>

        {/* Delete Section */}
        <div className="py-6 border-t border-border">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
              data-ocid="curriculum.unit.delete_button"
            >
              <Trash2 size={14} />
              Delete Unit
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-sm text-destructive flex-1">
                Delete this unit and all its modules?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteUnit.isPending}
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                data-ocid="curriculum.unit.confirm_button"
              >
                {deleteUnit.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="curriculum.unit.cancel_button"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
