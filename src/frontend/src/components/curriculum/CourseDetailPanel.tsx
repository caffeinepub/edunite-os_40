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
  BarChart2,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  useAllAssessments,
  useAllAssignments,
  useCreateUnit,
  useDeleteCourse,
  useGetCourses,
  useGetModules,
  useGetUnits,
  usePublishCourse,
  useUpdateCourse,
} from "../../hooks/useQueries";
import type {
  BackwardsFields,
  Course,
  CurriculumFramework,
  FiveEFields,
  FrameworkFields,
  ImsFields,
  UbdFields,
} from "../../lib/curriculumTypes";
import type { CustomFramework } from "../../lib/customFrameworks";
import { getCustomFrameworks } from "../../lib/customFrameworks";
import CurriculumImportExport from "./CurriculumImportExport";
import StandardsCoverageMap from "./StandardsCoverageMap";

interface CourseDetailPanelProps {
  courseId: number;
  onDeleted: () => void;
  onUnitCreated: (unitId: number) => void;
  defaultTab?: "settings" | "structure" | "standards";
}

const SUBJECTS = [
  "Math",
  "English",
  "Science",
  "History",
  "Arts",
  "PE",
  "Languages",
  "Career/Tech",
  "Other",
];

const GRADE_BANDS = ["K-2", "3-5", "6-8", "9-12"];

const FRAMEWORKS: Array<{
  value: CurriculumFramework;
  label: string;
  desc: string;
}> = [
  {
    value: "ubd",
    label: "Understanding by Design",
    desc: "Backward design focusing on transfer goals and enduring understandings",
  },
  {
    value: "backwards",
    label: "Backwards Design",
    desc: "Start with goals, identify evidence, then plan learning experiences",
  },
  {
    value: "5e",
    label: "5E Model",
    desc: "Engage, Explore, Explain, Elaborate, Evaluate — ideal for science",
  },
  {
    value: "ims",
    label: "EdUnite Simple Planning",
    desc: "EdUnite's streamlined approach — Intent, Method, Scope structure",
  },
  {
    value: "minimal",
    label: "Minimal",
    desc: "Title, description, and standards only — no planning framework",
  },
  {
    value: "custom",
    label: "Custom",
    desc: "Define your own fields in Settings",
  },
];

// ─── TagInput ─────────────────────────────────────────────────────────────────

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim().replace(/,$/, "");
    if (trimmed) {
      onChange([...values, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-sm font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="text-violet-500 hover:text-violet-800 transition-colors leading-none"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && input.trim()) {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder ?? "Add item..."}
          className="text-sm flex-1"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!input.trim()}
          aria-label="Add item"
          className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-violet-50 hover:border-violet-300 text-muted-foreground hover:text-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
// Replaced by inline flat labels; kept unused as reference

// ─── Custom Framework Fields Card ────────────────────────────────────────────

function CustomFrameworkFieldsCard({
  fields,
  onChange,
}: {
  fields: FrameworkFields;
  onChange: (fields: FrameworkFields) => void;
}) {
  const availableFrameworks: CustomFramework[] = getCustomFrameworks();

  const selectedId = fields.custom?.frameworkId ?? "";
  const values = fields.custom?.values ?? {};

  const selectedFramework = availableFrameworks.find(
    (f) => f.id === selectedId,
  );

  const courseFields =
    selectedFramework?.fields.filter((f) => f.level === "course") ?? [];

  const handleFrameworkChange = (fwId: string) => {
    onChange({
      ...fields,
      custom: fwId ? { frameworkId: fwId, values: {} } : undefined,
    });
  };

  const handleValueChange = (fieldId: string, value: string | string[]) => {
    onChange({
      ...fields,
      custom: {
        frameworkId: selectedId,
        values: { ...values, [fieldId]: value },
      },
    });
  };

  if (availableFrameworks.length === 0) {
    return (
      <div className="space-y-4 pt-2 border-t border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
          Custom Framework Fields
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertTriangle size={22} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            No custom frameworks defined.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Go to Settings → Custom Frameworks to create one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border/40">
      <div className="flex items-center gap-2 mt-4">
        <Layers size={16} className="text-violet-600" />
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Custom Framework Fields
        </div>
      </div>

      {/* Framework picker */}
      <div className="space-y-1.5">
        <Label htmlFor="custom-fw-select">Framework</Label>
        <Select value={selectedId} onValueChange={handleFrameworkChange}>
          <SelectTrigger id="custom-fw-select">
            <SelectValue placeholder="Select a custom framework..." />
          </SelectTrigger>
          <SelectContent>
            {availableFrameworks.map((fw) => (
              <SelectItem key={fw.id} value={fw.id}>
                {fw.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFramework?.description && (
          <p className="text-xs text-muted-foreground">
            {selectedFramework.description}
          </p>
        )}
      </div>

      {/* Course-level fields */}
      {selectedId && courseFields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          This framework has no course-level fields. Unit, module, and
          assignment fields will appear in their respective editors.
        </p>
      )}

      {selectedId &&
        courseFields.map((f) => {
          const rawVal = values[f.id];
          return (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={`custom-course-${f.id}`}>
                {f.label}
                {f.required && (
                  <span className="text-destructive ml-0.5">*</span>
                )}
              </Label>
              {f.type === "long-text" ? (
                <Textarea
                  id={`custom-course-${f.id}`}
                  value={typeof rawVal === "string" ? rawVal : ""}
                  onChange={(e) => handleValueChange(f.id, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                />
              ) : f.type === "list" ? (
                <TagInput
                  values={Array.isArray(rawVal) ? rawVal : []}
                  onChange={(vals) => handleValueChange(f.id, vals)}
                  placeholder={f.placeholder}
                />
              ) : f.type === "date" ? (
                <input
                  id={`custom-course-${f.id}`}
                  type="date"
                  value={typeof rawVal === "string" ? rawVal : ""}
                  onChange={(e) => handleValueChange(f.id, e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              ) : f.type === "number" ? (
                <input
                  id={`custom-course-${f.id}`}
                  type="number"
                  value={typeof rawVal === "string" ? rawVal : ""}
                  onChange={(e) => handleValueChange(f.id, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 w-40 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              ) : (
                <Input
                  id={`custom-course-${f.id}`}
                  value={typeof rawVal === "string" ? rawVal : ""}
                  onChange={(e) => handleValueChange(f.id, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          );
        })}
    </div>
  );
}

// ─── Standard Framework Fields Card ──────────────────────────────────────────

function FrameworkFieldsCard({
  framework,
  fields,
  onChange,
}: {
  framework: CurriculumFramework;
  fields: FrameworkFields;
  onChange: (fields: FrameworkFields) => void;
}) {
  if (framework === "minimal") return null;

  if (framework === "custom") {
    return <CustomFrameworkFieldsCard fields={fields} onChange={onChange} />;
  }

  if (framework === "ims") {
    const ims = fields.ims ?? { intent: [], method: [], scope: [] };
    const update = (patch: Partial<ImsFields>) => {
      onChange({ ...fields, ims: { ...ims, ...patch } });
    };
    return (
      <div className="space-y-4 pt-2 border-t border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
          Planning Framework (IMS)
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ims-intent">Intent</Label>
            <p className="text-xs text-muted-foreground">
              What students will learn
            </p>
            <TagInput
              values={Array.isArray(ims.intent) ? ims.intent : []}
              onChange={(v) => update({ intent: v })}
              placeholder="Add item..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ims-method">Method</Label>
            <p className="text-xs text-muted-foreground">
              How they'll learn it
            </p>
            <TagInput
              values={Array.isArray(ims.method) ? ims.method : []}
              onChange={(v) => update({ method: v })}
              placeholder="Add item..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ims-scope">Scope</Label>
            <p className="text-xs text-muted-foreground">How deep you'll go</p>
            <TagInput
              values={Array.isArray(ims.scope) ? ims.scope : []}
              onChange={(v) => update({ scope: v })}
              placeholder="Add item..."
            />
          </div>
        </div>
      </div>
    );
  }

  if (framework === "ubd") {
    const ubd = fields.ubd ?? {
      transferGoals: [],
      enduringUnderstandings: [],
      essentialQuestions: [],
      knowledgeSkills: [],
      performanceTasks: [],
      learningActivities: [],
    };
    const update = (patch: Partial<UbdFields>) =>
      onChange({ ...fields, ubd: { ...ubd, ...patch } });
    return (
      <div className="space-y-4 pt-2 border-t border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
          Understanding by Design
        </div>
        <div className="space-y-4">
          {(
            [
              [
                "transferGoals",
                "Transfer Goals",
                "What students will do long-term",
              ],
              [
                "enduringUnderstandings",
                "Enduring Understandings",
                "Big ideas students should retain",
              ],
              [
                "essentialQuestions",
                "Essential Questions",
                "Open-ended questions that drive inquiry",
              ],
              [
                "knowledgeSkills",
                "Knowledge & Skills",
                "Specific content and skills to be taught",
              ],
              [
                "performanceTasks",
                "Performance Tasks",
                "How students will demonstrate understanding",
              ],
              [
                "learningActivities",
                "Learning Activities",
                "Key instructional activities",
              ],
            ] as [keyof UbdFields, string, string][]
          ).map(([key, label, hint]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`ubd-${key}`}>{label}</Label>
              <p className="text-xs text-muted-foreground">{hint}</p>
              <TagInput
                values={Array.isArray(ubd[key]) ? ubd[key] : []}
                onChange={(v) => update({ [key]: v })}
                placeholder="Add item..."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (framework === "backwards") {
    const bk = fields.backwards ?? {
      goals: [],
      understandings: [],
      essentialQuestions: [],
      assessmentEvidence: [],
      learningExperiences: [],
    };
    const update = (patch: Partial<BackwardsFields>) =>
      onChange({ ...fields, backwards: { ...bk, ...patch } });
    return (
      <div className="space-y-4 pt-2 border-t border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
          Backwards Design
        </div>
        <div className="space-y-4">
          {(
            [
              ["goals", "Goals", "What do students need to know?"],
              ["understandings", "Understandings", "Big ideas to internalize"],
              [
                "essentialQuestions",
                "Essential Questions",
                "Questions that guide inquiry",
              ],
              [
                "assessmentEvidence",
                "Assessment Evidence",
                "How will you know they've learned it?",
              ],
              [
                "learningExperiences",
                "Learning Experiences",
                "Activities and instruction",
              ],
            ] as [keyof BackwardsFields, string, string][]
          ).map(([key, label, hint]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`bk-${key}`}>{label}</Label>
              <p className="text-xs text-muted-foreground">{hint}</p>
              <TagInput
                values={Array.isArray(bk[key]) ? bk[key] : []}
                onChange={(v) => update({ [key]: v })}
                placeholder="Add item..."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (framework === "5e") {
    const fe = fields.fiveE ?? {
      engage: [],
      explore: [],
      explain: [],
      elaborate: [],
      evaluate: [],
    };
    const update = (patch: Partial<FiveEFields>) =>
      onChange({ ...fields, fiveE: { ...fe, ...patch } });
    return (
      <div className="space-y-4 pt-2 border-t border-border/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
          5E Model
        </div>
        <div className="space-y-4">
          {(
            [
              [
                "engage",
                "Engage",
                "Hook students and activate prior knowledge",
              ],
              ["explore", "Explore", "Hands-on investigation and discovery"],
              [
                "explain",
                "Explain",
                "Direct instruction and concept clarification",
              ],
              ["elaborate", "Elaborate", "Application to new contexts"],
              ["evaluate", "Evaluate", "Formal and informal assessment"],
            ] as [keyof FiveEFields, string, string][]
          ).map(([key, label, hint]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`5e-${key}`}>{label}</Label>
              <p className="text-xs text-muted-foreground">{hint}</p>
              <TagInput
                values={Array.isArray(fe[key]) ? fe[key] : []}
                onChange={(v) => update({ [key]: v })}
                placeholder="Add item..."
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function CourseDetailPanel({
  courseId,
  onDeleted,
  onUnitCreated,
  defaultTab = "structure",
}: CourseDetailPanelProps) {
  const { data: courses = [] } = useGetCourses();
  const course = courses.find((c) => c.id === courseId);
  const { data: courseUnits = [] } = useGetUnits(courseId);
  const { data: allModules = [] } = useGetModules(undefined);
  const { data: allAssignments = [] } = useAllAssignments();
  const { data: allAssessments = [] } = useAllAssessments();

  const [activeTab, setActiveTab] = useState<
    "settings" | "structure" | "standards"
  >(defaultTab);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeBand, setGradeBand] = useState("9-12");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState<CurriculumFramework>("ims");
  const [frameworkFields, setFrameworkFields] = useState<FrameworkFields>({});
  const [standards, setStandards] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [standardInput, setStandardInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [quickUnitTitle, setQuickUnitTitle] = useState("");

  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const publishCourse = usePublishCourse();
  const createUnit = useCreateUnit();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when courseId changes to reset form
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setSubject(course.subject);
      setGradeBand(course.gradeBand ?? "9-12");
      setDescription(course.description);
      setFramework(course.framework ?? "ims");
      setFrameworkFields(course.frameworkFields ?? {});
      setStandards(course.standards ?? []);
      setTags(course.tags ?? []);
      isFirstLoad.current = true;
    }
    setActiveTab(defaultTab);
  }, [courseId]);

  const triggerSave = (
    t: string,
    s: string,
    g: string,
    d: string,
    fw: CurriculumFramework,
    fwf: FrameworkFields,
    std: string[],
    tg: string[],
  ) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateCourse.mutateAsync({
          id: courseId,
          title: t,
          subject: s,
          gradeBand: g,
          description: d,
          framework: fw,
          frameworkFields: fwf,
          standards: std,
          tags: tg,
        });
        setSavedAt(new Date());
      } catch {}
      setSaving(false);
    }, 800);
  };

  const update = (patch: {
    title?: string;
    subject?: string;
    gradeBand?: string;
    description?: string;
    framework?: CurriculumFramework;
    frameworkFields?: FrameworkFields;
    standards?: string[];
    tags?: string[];
  }) => {
    const t = patch.title ?? title;
    const s = patch.subject ?? subject;
    const g = patch.gradeBand ?? gradeBand;
    const d = patch.description ?? description;
    const fw = patch.framework ?? framework;
    const fwf = patch.frameworkFields ?? frameworkFields;
    const std = patch.standards ?? standards;
    const tg = patch.tags ?? tags;
    if ("title" in patch) setTitle(t);
    if ("subject" in patch) setSubject(s);
    if ("gradeBand" in patch) setGradeBand(g);
    if ("description" in patch) setDescription(d);
    if ("framework" in patch) setFramework(fw);
    if ("frameworkFields" in patch) setFrameworkFields(fwf);
    if ("standards" in patch) setStandards(std);
    if ("tags" in patch) setTags(tg);
    triggerSave(t, s, g, d, fw, fwf, std, tg);
  };

  const addStandard = (val: string) => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && !standards.includes(trimmed)) {
      update({ standards: [...standards, trimmed] });
    }
    setStandardInput("");
  };

  const addTag = (val: string) => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      update({ tags: [...tags, trimmed] });
    }
    setTagInput("");
  };

  const handleDelete = async () => {
    await deleteCourse.mutateAsync(courseId);
    onDeleted();
  };

  const handlePublish = async () => {
    await publishCourse.mutateAsync(courseId);
  };

  const handleQuickAddUnit = async () => {
    const trimmed = quickUnitTitle.trim();
    if (!trimmed) return;
    setQuickUnitTitle("");
    const unit = await createUnit.mutateAsync({
      courseId,
      title: trimmed,
      description: "",
    });
    onUnitCreated(unit.id);
  };

  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      data-ocid="curriculum.course_detail.panel"
    >
      {/* Panel Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between flex-shrink-0 bg-card z-10">
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={14} className="text-violet-600" />
          <span className="text-xs font-semibold bg-violet-600 text-white px-2.5 py-1 rounded-full">
            Course
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {!saving && savedAt && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check size={12} /> Saved{" "}
              {savedAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          {/* Vertical divider */}
          <div className="w-px h-6 bg-border" />
          {course.draftStatus === "published" ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-semibold gap-1">
              <Check size={11} />
              Published
            </Badge>
          ) : (
            <>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs font-semibold">
                Draft
              </Badge>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={publishCourse.isPending}
                data-ocid="curriculum.publish.button"
                className="gap-1"
              >
                {publishCourse.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : null}
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex-shrink-0 border-b border-border px-6">
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            data-ocid="curriculum.course.settings.tab"
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Settings size={13} />
            Course Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            data-ocid="curriculum.course.structure.tab"
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "structure"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Layers size={13} />
            Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("standards")}
            data-ocid="curriculum.course.standards.tab"
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "standards"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <BarChart2 size={13} />
            Standards
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "structure" && (
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Units
            </span>
          </div>

          {courseUnits.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-ocid="curriculum.course.units.empty_state"
            >
              <Layers size={28} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No units yet
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Type a unit title below and press Enter to get started
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {courseUnits.map((unit, idx) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => onUnitCreated(unit.id)}
                  data-ocid={`curriculum.course.unit.item.${idx + 1}`}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-violet-50/40 transition-colors group"
                >
                  <Layers
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">
                    {unit.title}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground group-hover:text-violet-600 transition-colors"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Quick-add unit input */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={quickUnitTitle}
              onChange={(e) => setQuickUnitTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAddUnit();
                if (e.key === "Escape") setQuickUnitTitle("");
              }}
              placeholder="Add unit title... (press Enter)"
              data-ocid="curriculum.course.quick_add_unit.input"
              className="flex-1 h-9 px-3 rounded-lg border border-dashed border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>
      )}

      {activeTab === "standards" && (
        <div className="flex-1 overflow-y-auto">
          <StandardsCoverageMap courseId={courseId} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Basic Information
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course-title"
                value={title}
                onChange={(e) => update({ title: e.target.value })}
                onBlur={() => {
                  if (!title.trim()) setTitleError("Title is required");
                  else setTitleError("");
                }}
                placeholder="Course title"
                className={titleError ? "border-destructive" : ""}
                data-ocid="curriculum.course.title.input"
              />
              {titleError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="curriculum.course.title.error_state"
                >
                  {titleError}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="course-subject">Subject</Label>
                <Select
                  value={subject}
                  onValueChange={(v) => update({ subject: v })}
                >
                  <SelectTrigger
                    id="course-subject"
                    data-ocid="curriculum.course.subject.select"
                  >
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="course-gradeband">Grade Band</Label>
                <Select
                  value={gradeBand}
                  onValueChange={(v) => update({ gradeBand: v })}
                >
                  <SelectTrigger
                    id="course-gradeband"
                    data-ocid="curriculum.course.gradeband.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_BANDS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea
                id="course-desc"
                value={description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Describe this course..."
                rows={3}
                data-ocid="curriculum.course.description.textarea"
              />
            </div>
          </div>

          {/* Planning Framework */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
              Planning Framework
            </div>
            <div className="space-y-1.5">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.value}
                  type="button"
                  onClick={() => update({ framework: fw.value })}
                  data-ocid={`curriculum.framework.${fw.value}.toggle`}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 transition-all ${
                    framework === fw.value
                      ? "bg-violet-50 border border-violet-200"
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  {/* Radio indicator */}
                  <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 border-violet-400 flex items-center justify-center">
                    {framework === fw.value && (
                      <div className="w-2 h-2 rounded-full bg-violet-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium ${
                        framework === fw.value
                          ? "text-violet-900"
                          : "text-foreground"
                      }`}
                    >
                      {fw.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fw.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Framework Fields */}
          <FrameworkFieldsCard
            framework={framework}
            fields={frameworkFields}
            onChange={(fwf) => update({ frameworkFields: fwf })}
          />

          {/* Standards & Tags */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
              Standards & Tags
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Standards</Label>
                {standards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {standards.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-sm font-medium"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() =>
                            update({
                              standards: standards.filter((x) => x !== s),
                            })
                          }
                          aria-label={`Remove ${s}`}
                          className="text-violet-500 hover:text-violet-800 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Input
                    value={standardInput}
                    onChange={(e) => setStandardInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === ",") &&
                        standardInput.trim()
                      ) {
                        e.preventDefault();
                        addStandard(standardInput);
                      }
                    }}
                    placeholder="Add item..."
                    className="text-sm flex-1"
                    data-ocid="curriculum.course.standards.input"
                  />
                  <button
                    type="button"
                    onClick={() => addStandard(standardInput)}
                    disabled={!standardInput.trim()}
                    aria-label="Add standard"
                    className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-violet-50 hover:border-violet-300 text-muted-foreground hover:text-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            update({ tags: tags.filter((x) => x !== t) })
                          }
                          aria-label={`Remove tag ${t}`}
                          className="hover:text-foreground transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === ",") &&
                        tagInput.trim()
                      ) {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add item..."
                    className="text-sm flex-1"
                    data-ocid="curriculum.course.tags.input"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    aria-label="Add tag"
                    className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-violet-50 hover:border-violet-300 text-muted-foreground hover:text-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version History */}
          <div className="border border-border/40 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVersionHistory((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              data-ocid="curriculum.version_history.panel"
            >
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Version History
                </span>
                <Badge variant="secondary" className="text-xs">
                  v{course.version}
                </Badge>
              </div>
              {showVersionHistory ? (
                <ChevronDown size={15} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={15} className="text-muted-foreground" />
              )}
            </button>
            {showVersionHistory && (
              <div className="px-5 pb-4 space-y-2 border-t border-border">
                {course.versionHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No published versions yet
                  </p>
                ) : (
                  [...course.versionHistory].reverse().map((v) => (
                    <div
                      key={v.version}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          v{v.version}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(v.savedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                        onClick={() => {
                          /* Restore would create new version */
                        }}
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Import / Export */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 mt-4">
              Import &amp; Export
            </div>
            <CurriculumImportExport
              course={course as Course}
              units={courseUnits}
              modules={allModules.filter((m) => m.courseId === courseId)}
              assignments={allAssignments.filter(
                (a) => a.courseId === courseId,
              )}
              assessments={allAssessments.filter(
                (a) => a.courseId === courseId,
              )}
              onImportComplete={() => {
                // Invalidation handled inside CurriculumImportExport via mutation hooks
              }}
            />
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-destructive mb-3">
              Danger Zone
            </h3>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
                data-ocid="curriculum.course.delete_button"
              >
                <Trash2 size={14} />
                Delete Course
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="text-sm text-destructive flex-1">
                  Delete this course and all its content?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteCourse.isPending}
                  className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                  data-ocid="curriculum.course.confirm_button"
                >
                  {deleteCourse.isPending ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="curriculum.course.cancel_button"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
