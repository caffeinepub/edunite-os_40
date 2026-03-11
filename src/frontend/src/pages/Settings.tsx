import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  GripVertical,
  HelpCircle,
  Layers,
  LayoutTemplate,
  Library,
  Percent,
  Plus,
  Save,
  Shield,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import RubricBuilder from "../components/curriculum/RubricBuilder";
import { useBehaviorLogs, useGetAllStudents } from "../hooks/useQueries";
import {
  addAssessmentType,
  deleteAssessmentType,
  getAssessmentTypes,
  reorderAssessmentTypes,
} from "../lib/assessmentTypes";
import {
  addType,
  deleteType,
  getAssignmentTypes,
  reorderTypes,
} from "../lib/assignmentTypes";
import {
  type CategoryWeights,
  autoBalanceWeights,
  getCategoryWeights,
  getWeightsForTypes,
  saveCategoryWeights,
  saveClassWeights,
} from "../lib/categoryWeights";
import type {
  Rubric,
  RubricTemplate,
  UnitTemplate,
} from "../lib/curriculumTypes";
import {
  FIELD_LIBRARY,
  type FieldLibraryEntry,
} from "../lib/customFrameworkFieldLibrary";
import type {
  CustomFieldLevel,
  CustomFieldType,
  CustomFramework,
  CustomFrameworkField,
} from "../lib/customFrameworks";
import {
  addFieldToFramework,
  deleteCustomFramework,
  getCustomFrameworks,
  removeFieldFromFramework,
  saveCustomFramework,
  updateFieldInFramework,
} from "../lib/customFrameworks";
import {
  type GradingPeriod,
  getGradingPeriods,
  saveGradingPeriods,
} from "../lib/gradingPeriods";
import {
  deleteRubricTemplate,
  getRubricTemplates,
  saveRubricTemplate,
  updateRubricTemplate,
} from "../lib/rubricTemplates";
import { deleteTemplate, getTemplates } from "../lib/unitTemplates";

// ─── useSettings hook ─────────────────────────────────────────────────────────

interface GradingScale {
  A: number;
  B: number;
  C: number;
  D: number;
}

interface Settings {
  teacherName: string;
  schoolName: string;
  schoolYear: string;
  gradingScale: GradingScale;
  defaultGradeLevel: string;
  defaultPeriod: string;
  dateFormat: string;
  reduceMotion: boolean;
  highContrast: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  teacherName: "",
  schoolName: "",
  schoolYear: "2025–2026",
  gradingScale: { A: 90, B: 80, C: 70, D: 60 },
  defaultGradeLevel: "",
  defaultPeriod: "Period 1",
  dateFormat: "MMM d, yyyy",
  reduceMotion: false,
  highContrast: false,
};

const STORAGE_KEY = "edunite_settings";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyAccessibilityPrefs(s: Settings): void {
  if (s.reduceMotion) {
    document.documentElement.setAttribute("data-reduce-motion", "true");
  } else {
    document.documentElement.removeAttribute("data-reduce-motion");
  }
  if (s.highContrast) {
    document.documentElement.classList.add("high-contrast");
  } else {
    document.documentElement.classList.remove("high-contrast");
  }
}

function saveSettings(s: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Grading Scale Section (configurable) ────────────────────────────────────

interface GradeBand {
  id: string;
  letter: string;
  minPct: number;
  maxPct: number;
  gpa: number;
  passFail: "pass" | "fail";
}

const DEFAULT_GRADE_BANDS: GradeBand[] = [
  {
    id: "gb-A",
    letter: "A",
    minPct: 90,
    maxPct: 100,
    gpa: 4.0,
    passFail: "pass",
  },
  {
    id: "gb-B",
    letter: "B",
    minPct: 80,
    maxPct: 89,
    gpa: 3.0,
    passFail: "pass",
  },
  {
    id: "gb-C",
    letter: "C",
    minPct: 70,
    maxPct: 79,
    gpa: 2.0,
    passFail: "pass",
  },
  {
    id: "gb-D",
    letter: "D",
    minPct: 60,
    maxPct: 69,
    gpa: 1.0,
    passFail: "pass",
  },
  {
    id: "gb-F",
    letter: "F",
    minPct: 0,
    maxPct: 59,
    gpa: 0.0,
    passFail: "fail",
  },
];

const GRADING_SCALE_KEY = "edunite_grading_scale";

function loadGradeBands(): GradeBand[] {
  try {
    const raw = localStorage.getItem(GRADING_SCALE_KEY);
    if (!raw) return DEFAULT_GRADE_BANDS;
    const parsed: GradeBand[] = JSON.parse(raw);
    return parsed.map((b, i) => ({ ...b, id: b.id ?? `gb-legacy-${i}` }));
  } catch {
    return DEFAULT_GRADE_BANDS;
  }
}

function saveGradeBands(bands: GradeBand[]) {
  localStorage.setItem(GRADING_SCALE_KEY, JSON.stringify(bands));
}

function detectGaps(bands: GradeBand[]): string[] {
  const sorted = [...bands].sort((a, b) => b.minPct - a.minPct);
  const gaps: string[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const upper = sorted[i];
    const lower = sorted[i + 1];
    if (upper.minPct - 1 > lower.maxPct) {
      gaps.push(`Gap between ${lower.maxPct + 1}% and ${upper.minPct - 1}%`);
    }
  }
  return gaps;
}

function GradingScaleSection() {
  const [bands, setBands] = useState<GradeBand[]>(() => loadGradeBands());

  function updateBand(
    index: number,
    field: keyof GradeBand,
    value: string | number,
  ) {
    setBands((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      saveGradeBands(next);
      return next;
    });
  }

  function addBand() {
    setBands((prev) => {
      const newBand: GradeBand = {
        id: `gb-new-${Date.now()}`,
        letter: "",
        minPct: 0,
        maxPct: 0,
        gpa: 0.0,
        passFail: "pass",
      };
      const next = [...prev, newBand];
      saveGradeBands(next);
      return next;
    });
  }

  function deleteBand(index: number) {
    if (bands.length <= 1) return;
    setBands((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveGradeBands(next);
      return next;
    });
  }

  const gaps = detectGaps(bands);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure letter grades, percentage ranges, GPA points, and pass/fail
        status. Changes are saved automatically.
      </p>

      {/* Warning for gaps */}
      {gaps.length > 0 && (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1"
          data-ocid="settings.grading_scale.error_state"
        >
          <p className="font-semibold flex items-center gap-2">
            ⚠ Grade range gaps detected
          </p>
          {gaps.map((g) => (
            <p key={g} className="text-xs opacity-80">
              {g}
            </p>
          ))}
        </div>
      )}

      {/* Header row */}
      <div className="grid grid-cols-[80px_1fr_1fr_80px_72px_36px] gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
        <span>Letter</span>
        <span>Min %</span>
        <span>Max %</span>
        <span>GPA</span>
        <span>Pass/Fail</span>
        <span />
      </div>

      {/* Band rows */}
      <div className="space-y-2">
        {bands.map((band, idx) => (
          <div
            key={band.id}
            className="grid grid-cols-[80px_1fr_1fr_80px_72px_36px] gap-2 items-center"
            data-ocid={`settings.grade_band.row.${idx + 1}`}
          >
            <input
              type="text"
              value={band.letter}
              maxLength={3}
              onChange={(e) =>
                updateBand(idx, "letter", e.target.value.toUpperCase())
              }
              placeholder="A"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-semibold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid={`settings.grade_band.letter.input.${idx + 1}`}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={band.minPct}
              onChange={(e) =>
                updateBand(idx, "minPct", Number(e.target.value))
              }
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid={`settings.grade_band.min.input.${idx + 1}`}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={band.maxPct}
              onChange={(e) =>
                updateBand(idx, "maxPct", Number(e.target.value))
              }
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid={`settings.grade_band.max.input.${idx + 1}`}
            />
            <input
              type="number"
              min={0}
              max={4}
              step={0.1}
              value={band.gpa}
              onChange={(e) => updateBand(idx, "gpa", Number(e.target.value))}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid={`settings.grade_band.gpa.input.${idx + 1}`}
            />
            <button
              type="button"
              onClick={() =>
                updateBand(
                  idx,
                  "passFail",
                  band.passFail === "pass" ? "fail" : "pass",
                )
              }
              className={`h-9 rounded-lg text-xs font-semibold border transition-colors ${
                band.passFail === "pass"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
              }`}
              data-ocid={`settings.grade_band.passfail.toggle.${idx + 1}`}
            >
              {band.passFail === "pass" ? "Pass" : "Fail"}
            </button>
            <button
              type="button"
              onClick={() => deleteBand(idx)}
              disabled={bands.length <= 1}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-destructive/20"
              data-ocid={`settings.grade_band.delete_button.${idx + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add row button */}
      <button
        type="button"
        onClick={addBand}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors mt-1"
        data-ocid="settings.grade_band.add_button"
      >
        <Plus size={15} />
        Add Grade Band
      </button>
    </div>
  );
}

// ─── Assignment Types Section ─────────────────────────────────────────────────

function AssignmentTypesSection() {
  const [types, setTypes] = useState<string[]>(() => getAssignmentTypes());
  const [newTypeName, setNewTypeName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  // ── Category weights state ─────────────────────────────────────────────────
  const [weights, setWeights] = useState<CategoryWeights>(() =>
    getCategoryWeights(),
  );

  const totalWeight = useMemo(
    () => types.reduce((sum, t) => sum + (weights[t] ?? 0), 0),
    [types, weights],
  );

  const handleWeightChange = (type: string, value: string) => {
    const num = Number.parseInt(value, 10);
    const clamped = Number.isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    const updated = { ...weights, [type]: clamped };
    setWeights(updated);
    saveCategoryWeights(updated);
  };

  const handleAutoBalance = () => {
    const balanced = autoBalanceWeights(types);
    setWeights(balanced);
    saveCategoryWeights(balanced);
    toast.success("Weights auto-balanced");
  };

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const next = addType(trimmed);
    setTypes(next);
    setNewTypeName("");
    toast.success(`"${trimmed}" added`);
  };

  const handleDeleteType = (idx: number) => {
    const name = types[idx];
    const next = deleteType(name);
    setTypes(next);
    // Remove weight for deleted type
    const updatedWeights = { ...weights };
    delete updatedWeights[name];
    setWeights(updatedWeights);
    saveCategoryWeights(updatedWeights);
    setDeletingIndex(null);
    toast.success(`"${name}" removed`);
  };

  const handleEditSave = (idx: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed || trimmed === types[idx]) {
      setEditingIndex(null);
      return;
    }
    const oldName = types[idx];
    const next = types.map((t, i) => (i === idx ? trimmed : t));
    setTypes(next);
    reorderTypes(next);
    // Migrate weight from old name to new name
    if (oldName !== trimmed) {
      const updatedWeights = { ...weights };
      updatedWeights[trimmed] = updatedWeights[oldName] ?? 0;
      delete updatedWeights[oldName];
      setWeights(updatedWeights);
      saveCategoryWeights(updatedWeights);
    }
    setEditingIndex(null);
    toast.success("Type updated");
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
    dragRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    const from = dragRef.current;
    if (from === null || from === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...types];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setTypes(next);
    reorderTypes(next);
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  return (
    <SectionCard title="Assignment Types">
      <p className="text-xs text-muted-foreground mb-4">
        Customize the types available when creating assignments. Drag to
        reorder. Weights set here act as global defaults — configure per-class
        weights in the Gradebook for each individual class.
      </p>
      <div
        className="space-y-1 mb-3"
        data-ocid="settings.assignment_types.section"
      >
        {types.map((type, idx) => (
          <div
            key={type}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            data-ocid={`settings.type.item.${idx + 1}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              dragOverIndex === idx && dragIndex !== idx
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            } ${dragIndex === idx ? "opacity-40" : ""}`}
          >
            <span
              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
              data-ocid={`settings.type.drag_handle.${idx + 1}`}
            >
              <GripVertical size={14} />
            </span>
            {editingIndex === idx ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleEditSave(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave(idx);
                  if (e.key === "Escape") setEditingIndex(null);
                }}
                className="flex-1 text-sm bg-transparent border-b border-primary outline-none text-foreground"
              />
            ) : (
              <button
                type="button"
                className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors"
                onClick={() => {
                  setEditingIndex(idx);
                  setEditingValue(type);
                }}
                title="Click to edit"
              >
                {type}
              </button>
            )}

            {/* Weight input */}
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={0}
                max={100}
                value={weights[type] ?? 0}
                onChange={(e) => handleWeightChange(type, e.target.value)}
                onBlur={(e) => handleWeightChange(type, e.target.value)}
                className="w-14 h-7 text-center text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                aria-label={`Weight for ${type}`}
                data-ocid={`settings.weights.input.${idx + 1}`}
              />
              <Percent size={11} className="text-muted-foreground shrink-0" />
            </div>

            {deletingIndex === idx ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Remove?</span>
                <button
                  type="button"
                  onClick={() => handleDeleteType(idx)}
                  className="font-medium text-destructive hover:text-destructive/80 transition-colors"
                  data-ocid={`settings.type.delete_button.${idx + 1}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingIndex(null)}
                  className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeletingIndex(idx)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                aria-label={`Delete ${type}`}
                data-ocid={`settings.type.delete_button.${idx + 1}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Weight total + auto-balance */}
      {types.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <span
            className={`text-xs font-semibold ${
              totalWeight === 100 ? "text-success" : "text-warning"
            }`}
            data-ocid="settings.weights.total"
          >
            Total: {totalWeight}%
            {totalWeight === 100
              ? " ✓"
              : totalWeight > 0
                ? " (should be 100%)"
                : ""}
          </span>
          <button
            type="button"
            onClick={handleAutoBalance}
            disabled={types.length === 0}
            data-ocid="settings.weights.autobalance_button"
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Percent size={11} />
            Auto-balance
          </button>
          {totalWeight === 0 && (
            <span className="text-xs text-muted-foreground/70 italic">
              Set weights to enable weighted grade calculations
            </span>
          )}
        </div>
      )}

      {/* Add new type */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTypeName.trim()) handleAddType();
          }}
          placeholder="Add a new type..."
          data-ocid="settings.type.add.input"
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <button
          type="button"
          onClick={handleAddType}
          disabled={!newTypeName.trim()}
          data-ocid="settings.type.add.button"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Assessment Types Section ─────────────────────────────────────────────────

function AssessmentTypesSection() {
  const [types, setTypes] = useState<string[]>(() => getAssessmentTypes());
  const [newTypeName, setNewTypeName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const next = addAssessmentType(trimmed);
    setTypes(next);
    setNewTypeName("");
    toast.success(`"${trimmed}" added`);
  };

  const handleDeleteType = (idx: number) => {
    const name = types[idx];
    const next = deleteAssessmentType(name);
    setTypes(next);
    setDeletingIndex(null);
    toast.success(`"${name}" removed`);
  };

  const handleEditSave = (idx: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed || trimmed === types[idx]) {
      setEditingIndex(null);
      return;
    }
    const next = types.map((t, i) => (i === idx ? trimmed : t));
    setTypes(next);
    reorderAssessmentTypes(next);
    setEditingIndex(null);
    toast.success("Type updated");
  };

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
    dragRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    const from = dragRef.current;
    if (from === null || from === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...types];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setTypes(next);
    reorderAssessmentTypes(next);
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  };

  return (
    <SectionCard title="Assessment Types">
      <p className="text-xs text-muted-foreground mb-4">
        Customize the types available when creating assessments. Drag to
        reorder.
      </p>
      <div
        className="space-y-1 mb-3"
        data-ocid="settings.assessment_types.section"
      >
        {types.map((type, idx) => (
          <div
            key={type}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            data-ocid={`settings.assessment_type.item.${idx + 1}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              dragOverIndex === idx && dragIndex !== idx
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            } ${dragIndex === idx ? "opacity-40" : ""}`}
          >
            <span
              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
              data-ocid={`settings.assessment_type.drag_handle.${idx + 1}`}
            >
              <GripVertical size={14} />
            </span>
            {editingIndex === idx ? (
              <input
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleEditSave(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave(idx);
                  if (e.key === "Escape") setEditingIndex(null);
                }}
                className="flex-1 text-sm bg-transparent border-b border-primary outline-none text-foreground"
              />
            ) : (
              <button
                type="button"
                className="flex-1 text-left text-sm text-foreground hover:text-primary transition-colors"
                onClick={() => {
                  setEditingIndex(idx);
                  setEditingValue(type);
                }}
                title="Click to edit"
              >
                {type}
              </button>
            )}
            {deletingIndex === idx ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Remove?</span>
                <button
                  type="button"
                  onClick={() => handleDeleteType(idx)}
                  className="font-medium text-destructive hover:text-destructive/80 transition-colors"
                  data-ocid={`settings.assessment_type.delete_button.${idx + 1}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingIndex(null)}
                  className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeletingIndex(idx)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                aria-label={`Delete ${type}`}
                data-ocid={`settings.assessment_type.delete_button.${idx + 1}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new type */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTypeName.trim()) handleAddType();
          }}
          placeholder="Add a new assessment type..."
          data-ocid="settings.assessment_type.add.input"
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <button
          type="button"
          onClick={handleAddType}
          disabled={!newTypeName.trim()}
          data-ocid="settings.assessment_type.add.button"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Unit Templates Section ───────────────────────────────────────────────────

function UnitTemplatesSection() {
  const [templates, setTemplates] = useState<UnitTemplate[]>(() =>
    getTemplates(),
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
    setDeletingId(null);
    toast.success("Template deleted");
  };

  return (
    <SectionCard title="Unit Templates">
      <p className="text-xs text-muted-foreground mb-4">
        Saved unit templates for quick reuse. Create templates from any unit
        editor using "Save as Template."
      </p>
      <div className="space-y-2" data-ocid="settings.unit_templates.section">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <BookOpen size={28} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No templates saved yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Open a unit and click "Save as Template" to create one.
            </p>
          </div>
        ) : (
          templates.map((tpl, idx) => {
            const assignmentCount = tpl.modules.reduce(
              (sum, m) => sum + m.assignments.length,
              0,
            );
            const isDeleting = deletingId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background"
                data-ocid={`settings.template.item.${idx + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tpl.name}
                  </p>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {tpl.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {tpl.modules.length} module
                      {tpl.modules.length !== 1 ? "s" : ""} · {assignmentCount}{" "}
                      assignment{assignmentCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tpl.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {isDeleting ? (
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    <span className="text-muted-foreground">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl.id)}
                      className="font-medium text-destructive hover:text-destructive/80 transition-colors"
                      data-ocid={`settings.template.delete_button.${idx + 1}`}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(tpl.id)}
                    className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                    aria-label={`Delete template ${tpl.name}`}
                    data-ocid={`settings.template.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

// ─── Rubric Templates Section ─────────────────────────────────────────────────

function RubricTemplateRow({
  template,
  index,
  onUpdate,
  onDelete,
}: {
  template: RubricTemplate;
  index: number;
  onUpdate: (updated: RubricTemplate) => void;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editName, setEditName] = useState(template.name);
  const [editDescription, setEditDescription] = useState(template.description);
  const [editRubric, setEditRubric] = useState<Rubric | null>(template.rubric);

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    const updated = updateRubricTemplate(template.id, {
      name: trimmedName,
      description: editDescription.trim(),
      rubric: editRubric ?? template.rubric,
    });
    if (updated) {
      onUpdate(updated);
      toast.success("Template updated");
    }
    setShowEditor(false);
  };

  const handleCancelEdit = () => {
    setEditName(template.name);
    setEditDescription(template.description);
    setEditRubric(template.rubric);
    setShowEditor(false);
  };

  const handleDelete = () => {
    deleteRubricTemplate(template.id);
    onDelete();
    toast.success(`"${template.name}" deleted`);
  };

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      data-ocid={`settings.rubric_template.item.${index + 1}`}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {template.name}
          </p>
          {template.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
              {template.rubric.criteria.length} criteria
            </span>
            <span className="text-xs text-muted-foreground/60">
              {template.rubric.levels.map((l) => l.name).join(" · ")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {showDeleteConfirm ? null : (
            <button
              type="button"
              data-ocid={`settings.rubric_template.edit_button.${index + 1}`}
              onClick={() => {
                setShowEditor((v) => !v);
                setShowDeleteConfirm(false);
              }}
              className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-md transition-colors"
            >
              {showEditor ? "Close" : "Edit"}
            </button>
          )}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                data-ocid={`settings.rubric_template.delete_button.${index + 1}`}
                className="font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-ocid={`settings.rubric_template.delete_button.${index + 1}`}
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowEditor(false);
              }}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive transition-colors rounded-md hover:bg-destructive/5"
              aria-label={`Delete template ${template.name}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Inline editor */}
      {showEditor && (
        <div className="border-t border-border bg-muted/10 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name <span className="text-destructive">*</span>
              </span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-ocid="settings.rubric_template.name_input"
                placeholder="Template name"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </span>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                data-ocid="settings.rubric_template.description_input"
                placeholder="Brief description..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          {/* RubricBuilder inline */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
              Rubric
            </span>
            <RubricBuilder rubric={editRubric} onChange={setEditRubric} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              data-ocid="settings.rubric_template.save_button"
              onClick={handleSave}
              disabled={!editName.trim()}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={12} />
              Save Changes
            </button>
            <button
              type="button"
              data-ocid="settings.rubric_template.cancel_button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RubricTemplatesSection() {
  const [templates, setTemplates] = useState<RubricTemplate[]>(() =>
    getRubricTemplates(),
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRubric, setNewRubric] = useState<Rubric | null>(null);

  const handleCreate = () => {
    const trimmedName = newName.trim();
    if (!trimmedName || !newRubric) return;
    saveRubricTemplate({
      name: trimmedName,
      description: newDescription.trim(),
      rubric: newRubric,
    });
    setTemplates(getRubricTemplates());
    setNewName("");
    setNewDescription("");
    setNewRubric(null);
    setShowNewForm(false);
    toast.success(`"${trimmedName}" template created`);
  };

  const handleUpdate = (updated: RubricTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
  };

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SectionCard title="Rubric Templates">
      <p className="text-xs text-muted-foreground mb-4">
        Reusable rubric templates that can be loaded into any assignment. Create
        a rubric once, use it everywhere.
      </p>

      {/* New template inline form */}
      {showNewForm && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            New Rubric Template
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name <span className="text-destructive">*</span>
              </span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Argumentative Essay Rubric"
                data-ocid="settings.rubric_template.name_input"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowNewForm(false);
                }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description (optional)
              </span>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description..."
                data-ocid="settings.rubric_template.description_input"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          {/* Rubric builder */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
              Rubric <span className="text-destructive">*</span>
            </span>
            <RubricBuilder rubric={newRubric} onChange={setNewRubric} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || !newRubric}
              data-ocid="settings.rubric_template.save_button"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={13} />
              Create Template
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setNewName("");
                setNewDescription("");
                setNewRubric(null);
              }}
              data-ocid="settings.rubric_template.cancel_button"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      <div
        className="space-y-2 mb-3"
        data-ocid="settings.rubric_templates.section"
      >
        {templates.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-center"
            data-ocid="settings.rubric_template.empty_state"
          >
            <LayoutTemplate
              size={28}
              className="text-muted-foreground/30 mb-2"
            />
            <p className="text-sm text-muted-foreground font-medium">
              No rubric templates yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Create your first template to reuse rubrics across assignments.
            </p>
            {!showNewForm && (
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="mt-3 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
                data-ocid="settings.rubric_template.new_button"
              >
                <Plus size={13} />
                Create your first template
              </button>
            )}
          </div>
        ) : (
          templates.map((tpl, idx) => (
            <RubricTemplateRow
              key={tpl.id}
              template={tpl}
              index={idx}
              onUpdate={handleUpdate}
              onDelete={() => handleDelete(tpl.id)}
            />
          ))
        )}
      </div>

      {/* New template button (when templates exist) */}
      {templates.length > 0 && !showNewForm && (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          data-ocid="settings.rubric_template.new_button"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Plus size={13} />
          New Rubric Template
        </button>
      )}
    </SectionCard>
  );
}

// ─── Custom Frameworks Section ────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Short Text",
  "long-text": "Long Text",
  list: "List",
  date: "Date",
  number: "Number",
};

const FIELD_LEVEL_LABELS: Record<CustomFieldLevel, string> = {
  course: "Course",
  unit: "Unit",
  module: "Module",
  assignment: "Assignment",
};

const FIELD_LEVEL_COLORS: Record<CustomFieldLevel, string> = {
  course: "bg-violet-100 text-violet-700",
  unit: "bg-blue-100 text-blue-700",
  module: "bg-teal-100 text-teal-700",
  assignment: "bg-orange-100 text-orange-700",
};

function FieldEditor({
  frameworkId,
  field,
  index,
  onUpdate,
  onRemove,
}: {
  frameworkId: string;
  field: CustomFrameworkField;
  index: number;
  onUpdate: (fw: CustomFramework) => void;
  onRemove: (fw: CustomFramework) => void;
}) {
  const [deletingField, setDeletingField] = useState(false);

  const handleFieldChange = (
    key: keyof Omit<CustomFrameworkField, "id">,
    value: string | boolean,
  ) => {
    const updated = updateFieldInFramework(frameworkId, field.id, {
      [key]: value,
    });
    if (updated) onUpdate(updated);
  };

  const handleRemove = () => {
    const updated = removeFieldFromFramework(frameworkId, field.id);
    if (updated) onRemove(updated);
    toast.success("Field removed");
  };

  return (
    <div
      className="p-3 rounded-lg border border-border bg-background space-y-3"
      data-ocid={`settings.framework.field.item.${index + 1}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Label */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Field Label
          </span>
          <input
            type="text"
            value={field.label}
            onChange={(e) => handleFieldChange("label", e.target.value)}
            placeholder="Field label"
            data-ocid={`settings.framework.field.input.${index + 1}`}
            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
        {/* Placeholder */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Placeholder / Hint
          </span>
          <input
            type="text"
            value={field.placeholder ?? ""}
            onChange={(e) => handleFieldChange("placeholder", e.target.value)}
            placeholder="Optional helper text"
            className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Type */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Type
          </span>
          <select
            value={field.type}
            onChange={(e) =>
              handleFieldChange("type", e.target.value as CustomFieldType)
            }
            data-ocid={`settings.framework.field.select.${index + 1}`}
            className="h-8 px-2.5 pr-7 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            {(
              Object.entries(FIELD_TYPE_LABELS) as [CustomFieldType, string][]
            ).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Appears On
          </span>
          <select
            value={field.level}
            onChange={(e) =>
              handleFieldChange("level", e.target.value as CustomFieldLevel)
            }
            data-ocid={`settings.framework.field.level.select.${index + 1}`}
            className="h-8 px-2.5 pr-7 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            {(
              Object.entries(FIELD_LEVEL_LABELS) as [CustomFieldLevel, string][]
            ).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Required */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Required
          </span>
          <label className="flex items-center gap-2 h-8 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => handleFieldChange("required", e.target.checked)}
              data-ocid={`settings.framework.field.checkbox.${index + 1}`}
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-sm text-foreground">Required</span>
          </label>
        </div>

        {/* Delete */}
        <div className="space-y-1 ml-auto self-end">
          {deletingField ? (
            <div className="flex items-center gap-1.5 text-xs h-8">
              <span className="text-muted-foreground">Remove?</span>
              <button
                type="button"
                onClick={handleRemove}
                className="font-medium text-destructive hover:text-destructive/80 transition-colors"
                data-ocid={`settings.framework.field.delete_button.${index + 1}`}
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setDeletingField(false)}
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeletingField(true)}
              className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              aria-label="Remove field"
              data-ocid={`settings.framework.field.delete_button.${index + 1}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Field Library Panel ─────────────────────────────────────────────────────

function FieldLibraryPanel({
  frameworkId,
  existingFields,
  onFieldAdded,
  onClose,
}: {
  frameworkId: string;
  existingFields: CustomFrameworkField[];
  onFieldAdded: (fw: CustomFramework) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const existingLabels = useMemo(
    () => new Set(existingFields.map((f) => f.label.toLowerCase())),
    [existingFields],
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FIELD_LIBRARY;
    return FIELD_LIBRARY.map((g) => ({
      ...g,
      fields: g.fields.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          g.group.toLowerCase().includes(q) ||
          (f.description ?? "").toLowerCase().includes(q),
      ),
    })).filter((g) => g.fields.length > 0);
  }, [search]);

  // Flat list of all visible entries for index-based data-ocid
  const flatEntries = useMemo<
    Array<{ entry: FieldLibraryEntry; globalIdx: number }>
  >(() => {
    let idx = 0;
    const result: Array<{ entry: FieldLibraryEntry; globalIdx: number }> = [];
    for (const g of filteredGroups) {
      for (const f of g.fields) {
        result.push({ entry: f, globalIdx: idx });
        idx++;
      }
    }
    return result;
  }, [filteredGroups]);

  const handleAdd = (entry: FieldLibraryEntry) => {
    const updated = addFieldToFramework(frameworkId, {
      label: entry.label,
      type: entry.type,
      level: entry.level,
      required: false,
      placeholder: entry.placeholder ?? "",
    });
    if (updated) {
      onFieldAdded(updated);
      toast.success(`"${entry.label}" added`);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Library size={14} className="text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-foreground">
          Field Library
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          Click a field to add it to your framework
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fields..."
        data-ocid="settings.framework.library.search_input"
        className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      />

      {/* Groups */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {filteredGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No fields match "{search}"
          </p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.fields.map((entry) => {
                  const alreadyAdded = existingLabels.has(
                    entry.label.toLowerCase(),
                  );
                  // Find globalIdx for this entry
                  const globalEntry = flatEntries.find(
                    (fe) =>
                      fe.entry.label === entry.label &&
                      fe.entry.level === entry.level,
                  );
                  const globalIdx = globalEntry?.globalIdx ?? 0;
                  return (
                    <div
                      key={`${group.group}-${entry.label}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-background transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-foreground">
                            {entry.label}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${FIELD_LEVEL_COLORS[entry.level]}`}
                          >
                            {FIELD_LEVEL_LABELS[entry.level]}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {FIELD_TYPE_LABELS[entry.type]}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug truncate">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      {alreadyAdded ? (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Check size={11} className="text-success" />
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(entry)}
                          data-ocid={`settings.framework.library.field_add.button.${globalIdx + 1}`}
                          className="shrink-0 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/5"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Close */}
      <div className="pt-1 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          data-ocid="settings.framework.library.close_button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Close library
        </button>
      </div>
    </div>
  );
}

// ─── Framework Row ────────────────────────────────────────────────────────────

function FrameworkRow({
  framework,
  index,
  onUpdate,
  onDelete,
}: {
  framework: CustomFramework;
  index: number;
  onUpdate: (fw: CustomFramework) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deletingFw, setDeletingFw] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [localFw, setLocalFw] = useState(framework);

  // Sync prop changes into local state
  useEffect(() => {
    setLocalFw(framework);
  }, [framework]);

  const levelsUsed = Array.from(
    new Set(localFw.fields.map((f) => f.level)),
  ) as CustomFieldLevel[];

  const handleDelete = () => {
    deleteCustomFramework(localFw.id);
    onDelete();
    toast.success(`"${localFw.name}" deleted`);
  };

  const handleAddField = () => {
    const updated = addFieldToFramework(localFw.id, {
      label: "New Field",
      type: "text",
      level: "unit",
      required: false,
      placeholder: "",
    });
    if (updated) {
      setLocalFw(updated);
      onUpdate(updated);
    }
  };

  const handleFieldUpdate = (updated: CustomFramework) => {
    setLocalFw(updated);
    onUpdate(updated);
  };

  const handleLibraryFieldAdded = (updated: CustomFramework) => {
    setLocalFw(updated);
    onUpdate(updated);
  };

  return (
    <div
      className="border border-border rounded-lg overflow-hidden"
      data-ocid={`settings.framework.item.${index + 1}`}
    >
      {/* Framework header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/40 transition-colors text-left"
        data-ocid={`settings.framework.toggle.${index + 1}`}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {localFw.name}
          </p>
          {localFw.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {localFw.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {localFw.fields.length} field
            {localFw.fields.length !== 1 ? "s" : ""}
          </span>
          {levelsUsed.map((lvl) => (
            <span
              key={lvl}
              className={`text-xs px-1.5 py-0.5 rounded-full hidden sm:inline-block ${FIELD_LEVEL_COLORS[lvl]}`}
            >
              {FIELD_LEVEL_LABELS[lvl]}
            </span>
          ))}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border bg-muted/10 p-4 space-y-4">
          {/* Delete framework */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {localFw.fields.length === 0
                ? "No fields defined yet. Add fields below."
                : `${localFw.fields.length} custom field${localFw.fields.length !== 1 ? "s" : ""}`}
            </p>
            {deletingFw ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">
                  Delete this framework?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="font-medium text-destructive hover:text-destructive/80 transition-colors"
                  data-ocid={`settings.framework.delete_button.${index + 1}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingFw(false)}
                  className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid={`settings.framework.cancel_button.${index + 1}`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeletingFw(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                data-ocid={`settings.framework.delete_button.${index + 1}`}
              >
                <Trash2 size={12} />
                Delete Framework
              </button>
            )}
          </div>

          {/* Fields */}
          {localFw.fields.length > 0 && (
            <div className="space-y-2">
              {localFw.fields.map((field, fi) => (
                <FieldEditor
                  key={field.id}
                  frameworkId={localFw.id}
                  field={field}
                  index={fi}
                  onUpdate={handleFieldUpdate}
                  onRemove={handleFieldUpdate}
                />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleAddField}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              data-ocid={`settings.framework.add_field.button.${index + 1}`}
            >
              <Plus size={13} />
              Add Field
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                showLibrary
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="settings.framework.add_from_library.button"
            >
              <Library size={13} />
              {showLibrary ? "Hide Library" : "Add from Library"}
            </button>
          </div>

          {/* Field Library Panel */}
          {showLibrary && (
            <FieldLibraryPanel
              frameworkId={localFw.id}
              existingFields={localFw.fields}
              onFieldAdded={handleLibraryFieldAdded}
              onClose={() => setShowLibrary(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CustomFrameworksSection() {
  const [frameworks, setFrameworks] = useState<CustomFramework[]>(() =>
    getCustomFrameworks(),
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const fw = saveCustomFramework({
      name: trimmed,
      description: newDescription.trim() || undefined,
      fields: [],
    });
    setFrameworks((prev) => [...prev, fw]);
    setNewName("");
    setNewDescription("");
    setShowNewForm(false);
    toast.success(`"${fw.name}" created`);
  };

  const handleUpdate = (updated: CustomFramework) => {
    setFrameworks((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f)),
    );
  };

  const handleDelete = (id: string) => {
    setFrameworks((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <SectionCard title="Custom Frameworks">
      <p className="text-xs text-muted-foreground mb-4">
        Define custom planning fields that appear in the Curriculum editor when
        a course uses the "Custom" framework.
      </p>

      {/* New Framework form */}
      {showNewForm && (
        <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            New Framework
          </h4>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Name <span className="text-destructive">*</span>
            </span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) handleCreate();
                if (e.key === "Escape") setShowNewForm(false);
              }}
              placeholder="e.g. Inquiry-Based Learning"
              data-ocid="settings.new_framework.input"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description (optional)
            </span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description of this framework..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              data-ocid="settings.new_framework.submit_button"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={13} />
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setNewName("");
                setNewDescription("");
              }}
              data-ocid="settings.new_framework.cancel_button"
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Framework list */}
      <div
        className="space-y-2 mb-3"
        data-ocid="settings.custom_frameworks.section"
      >
        {frameworks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-center"
            data-ocid="settings.custom_frameworks.empty_state"
          >
            <Layers size={28} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No custom frameworks yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Create your first framework to define custom planning fields.
            </p>
          </div>
        ) : (
          frameworks.map((fw, idx) => (
            <FrameworkRow
              key={fw.id}
              framework={fw}
              index={idx}
              onUpdate={handleUpdate}
              onDelete={() => handleDelete(fw.id)}
            />
          ))
        )}
      </div>

      {/* New Framework button */}
      {!showNewForm && (
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          data-ocid="settings.new_framework.button"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Plus size={13} />
          New Framework
        </button>
      )}
    </SectionCard>
  );
}

// ─── Grading Periods Section ─────────────────────────────────────────────────

function GradingPeriodsSection() {
  const [periods, setPeriods] = useState<GradingPeriod[]>(() =>
    getGradingPeriods(),
  );
  const today = new Date();

  const isCurrentPeriod = (period: GradingPeriod): boolean => {
    if (!period.startDate || !period.endDate) return false;
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return today >= start && today <= end;
  };

  const handleChange = (
    index: number,
    field: keyof GradingPeriod,
    value: string,
  ) => {
    const updated = periods.map((p, i) =>
      i === index ? { ...p, [field]: value } : p,
    );
    setPeriods(updated);
    saveGradingPeriods(updated);
    toast.success("Grading periods saved", { duration: 1200 });
  };

  const handleAdd = () => {
    const newId = `period_${Date.now()}`;
    const newPeriod: GradingPeriod = {
      id: newId,
      label: `P${periods.length + 1}`,
      startDate: "",
      endDate: "",
    };
    const updated = [...periods, newPeriod];
    setPeriods(updated);
    saveGradingPeriods(updated);
    toast.success("Grading periods saved", { duration: 1200 });
  };

  const handleDelete = (index: number) => {
    if (periods.length <= 1) return;
    const updated = periods.filter((_, i) => i !== index);
    setPeriods(updated);
    saveGradingPeriods(updated);
    toast.success("Grading periods saved", { duration: 1200 });
  };

  const ocidIndex = (i: number) => i + 1;

  return (
    <SectionCard title="Grading Periods">
      <p className="text-xs text-muted-foreground mb-4">
        Define your school year's grading periods. These determine how the
        gradebook filters assignments.
      </p>
      <div className="space-y-1">
        {periods.map((period, i) => (
          <div
            key={period.id}
            className="flex items-center gap-3 py-2"
            data-ocid={`settings.grading_periods.item.${ocidIndex(i)}`}
          >
            <div className="flex items-center gap-2 flex-none">
              <input
                type="text"
                value={period.label}
                onChange={(e) => handleChange(i, "label", e.target.value)}
                placeholder="Q1"
                data-ocid={`settings.grading_period_label.input.${ocidIndex(i)}`}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-24"
              />
              {isCurrentPeriod(period) && (
                <Badge className="h-5 px-1.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
                  Current
                </Badge>
              )}
            </div>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => handleChange(i, "startDate", e.target.value)}
              data-ocid={`settings.grading_period_start.input.${ocidIndex(i)}`}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-[145px]"
            />
            <span className="text-muted-foreground text-xs flex-none">to</span>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => handleChange(i, "endDate", e.target.value)}
              data-ocid={`settings.grading_period_end.input.${ocidIndex(i)}`}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-[145px]"
            />
            <button
              type="button"
              onClick={() => handleDelete(i)}
              disabled={periods.length <= 1}
              data-ocid={`settings.grading_period.delete_button.${ocidIndex(i)}`}
              aria-label={`Delete ${period.label}`}
              className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        data-ocid="settings.grading_periods.button"
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Period
      </button>
    </SectionCard>
  );
}

// ─── Per-Class Weights Section ───────────────────────────────────────────────

const CLASSES_LIST = [
  "Period 1 — Biology",
  "Period 2 — Chemistry",
  "Period 3 — Physics",
  "Period 4 — Earth Science",
];

const DROP_LOWEST_KEY = (className: string) =>
  `edunite_drop_lowest_${className}`;

function loadDropLowest(className: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(DROP_LOWEST_KEY(className));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveDropLowest(
  className: string,
  drops: Record<string, number>,
): void {
  localStorage.setItem(DROP_LOWEST_KEY(className), JSON.stringify(drops));
}

function PerClassWeightsSection() {
  const [selectedClass, setSelectedClass] = useState(CLASSES_LIST[0]);
  // Snapshot assignment types once per render cycle (stable — won't change without a re-mount)
  const types = useMemo(() => getAssignmentTypes(), []);

  const [weights, setWeights] = useState<CategoryWeights>(() =>
    getWeightsForTypes(types, selectedClass),
  );
  const [dropLowest, setDropLowest] = useState<Record<string, number>>(() =>
    loadDropLowest(selectedClass),
  );

  // Reload when class changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: types is stable (memoized on mount) and selectedClass drives the refresh
  useEffect(() => {
    setWeights(getWeightsForTypes(types, selectedClass));
    setDropLowest(loadDropLowest(selectedClass));
  }, [selectedClass]);

  const totalWeight = types.reduce((sum, t) => sum + (weights[t] ?? 0), 0);

  const handleWeightChange = (type: string, value: string) => {
    const num = Number.parseInt(value, 10);
    const clamped = Number.isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    const updated = { ...weights, [type]: clamped };
    setWeights(updated);
    saveClassWeights(selectedClass, updated);
  };

  const handleAutoBalance = () => {
    const balanced = autoBalanceWeights(types);
    setWeights(balanced);
    saveClassWeights(selectedClass, balanced);
    toast.success("Weights auto-balanced");
  };

  const handleDropChange = (type: string, value: number) => {
    const updated = { ...dropLowest, [type]: value };
    setDropLowest(updated);
    saveDropLowest(selectedClass, updated);
    toast.success("Drop setting saved", { duration: 1200 });
  };

  return (
    <SectionCard title="Per-Class Category Weights">
      <p className="text-xs text-muted-foreground mb-4">
        Configure grade calculation weights and drop-lowest settings for each
        class. These override the global defaults in the Gradebook.
      </p>

      {/* Class selector */}
      <div className="mb-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
          Class
        </span>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          data-ocid="settings.per_class_weights.select"
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors max-w-xs"
        >
          {CLASSES_LIST.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      {types.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          No assignment types configured yet. Add types in{" "}
          <span className="font-medium text-foreground">Assignment Types</span>{" "}
          below.
        </div>
      ) : (
        <>
          {/* Weight + Drop table */}
          <div
            className="space-y-1 mb-4"
            data-ocid="settings.per_class_weights.section"
          >
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Assignment Type</span>
              <span className="text-center">Weight (%)</span>
              <span className="text-center">Drop Lowest</span>
            </div>
            {types.map((type, idx) => {
              const drop = dropLowest[type] ?? 0;
              return (
                <div
                  key={type}
                  className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-3 py-2 rounded-lg border border-border bg-background"
                  data-ocid={`settings.per_class_weights.item.${idx + 1}`}
                >
                  <span className="text-sm font-medium text-foreground truncate">
                    {type}
                  </span>
                  {/* Weight input */}
                  <div className="flex items-center gap-1 justify-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={weights[type] ?? 0}
                      onChange={(e) => handleWeightChange(type, e.target.value)}
                      onBlur={(e) => handleWeightChange(type, e.target.value)}
                      className="w-14 h-7 text-center text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      aria-label={`Weight for ${type}`}
                      data-ocid={`settings.per_class_weights.weight.input.${idx + 1}`}
                    />
                    <Percent
                      size={11}
                      className="text-muted-foreground flex-shrink-0"
                    />
                  </div>
                  {/* Drop lowest selector */}
                  <div className="flex items-center gap-0.5 justify-center">
                    {[0, 1, 2].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleDropChange(type, v)}
                        className={`w-7 h-6 rounded text-xs font-semibold border transition-colors ${
                          drop === v
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                        aria-label={`Drop ${v} lowest ${type}`}
                        data-ocid={`settings.per_class_weights.drop.toggle.${idx + 1}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total + Auto-balance */}
          {totalWeight === 100 ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20"
              data-ocid="settings.per_class_weights.total"
            >
              <span className="text-xs font-semibold text-success">
                ✓ Weights balance to 100%
              </span>
            </div>
          ) : totalWeight > 0 ? (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20"
              data-ocid="settings.per_class_weights.total"
            >
              <span className="text-xs font-semibold text-warning-foreground">
                Weights total {totalWeight}% — must equal 100%
              </span>
              <button
                type="button"
                onClick={handleAutoBalance}
                disabled={types.length === 0}
                data-ocid="settings.per_class_weights.autobalance_button"
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-warning/40 bg-warning/20 text-xs font-medium text-warning-foreground hover:bg-warning/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={11} />
                Auto-balance
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1">
              <span
                className="text-xs text-muted-foreground/70 italic"
                data-ocid="settings.per_class_weights.total"
              >
                0% = total-points grading (no weighting)
              </span>
              <button
                type="button"
                onClick={handleAutoBalance}
                disabled={types.length === 0}
                data-ocid="settings.per_class_weights.autobalance_button"
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={11} />
                Auto-balance
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3 italic">
            <span className="font-medium text-foreground">Drop Lowest</span>:
            the number of lowest-scoring graded items to exclude per type when
            calculating the final grade.
          </p>
        </>
      )}
    </SectionCard>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const GRADE_LEVELS = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

const PERIODS = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);

const DATE_FORMATS = [
  { value: "MMM d, yyyy", label: "Jan 5, 2026" },
  { value: "MM/dd/yyyy", label: "01/05/2026" },
  { value: "dd/MM/yyyy", label: "05/01/2026" },
  { value: "yyyy-MM-dd", label: "2026-01-05" },
];

export default function Settings() {
  const { settings, update } = useSettings();
  const { data: students = [] } = useGetAllStudents();
  const { data: behaviorLogs = [] } = useBehaviorLogs();

  // Apply accessibility preferences on initial load
  const { reduceMotion, highContrast } = settings;
  useEffect(() => {
    applyAccessibilityPrefs({
      ...DEFAULT_SETTINGS,
      reduceMotion,
      highContrast,
    });
  }, [reduceMotion, highContrast]);

  const handleReduceMotionToggle = useCallback(
    (checked: boolean) => {
      update({ reduceMotion: checked });
      applyAccessibilityPrefs({ ...settings, reduceMotion: checked });
      toast.success("Settings saved", { duration: 1200 });
    },
    [settings, update],
  );

  const handleHighContrastToggle = useCallback(
    (checked: boolean) => {
      update({ highContrast: checked });
      applyAccessibilityPrefs({ ...settings, highContrast: checked });
      toast.success("Settings saved", { duration: 1200 });
    },
    [settings, update],
  );

  const handleProfileBlur = useCallback(
    (
      field: keyof Pick<Settings, "teacherName" | "schoolName" | "schoolYear">,
    ) =>
      (e: React.FocusEvent<HTMLInputElement>) => {
        update({ [field]: e.target.value });
        toast.success("Settings saved", { duration: 1200 });
      },
    [update],
  );

  // Export students CSV
  const exportStudentsCSV = useCallback(() => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }
    const headers = [
      "Student ID",
      "Given Names",
      "Family Name",
      "Preferred Name",
      "Grade Level",
      "Accommodations",
      "Allergies",
      "Medical Notes",
    ];
    const rows = students.map((s) => [
      s.studentId,
      s.givenNames,
      s.familyName,
      s.preferredName ?? "",
      s.gradeLevel,
      s.accommodations.map((a) => a.description).join("; "),
      s.allergies.join("; "),
      s.medicalNotes,
    ]);
    downloadCSV("edunite-students.csv", [headers, ...rows]);
    toast.success(`Exported ${students.length} students`);
  }, [students]);

  // Export behavior log CSV
  const exportBehaviorCSV = useCallback(() => {
    if (behaviorLogs.length === 0) {
      toast.error("No behavior entries to export");
      return;
    }
    const headers = [
      "Entry ID",
      "Student Name",
      "Type",
      "Category",
      "Context",
      "Description",
      "Severity",
      "Action Taken",
      "Follow-up Needed",
      "Logged At",
    ];
    const rows = behaviorLogs.map((l) => [
      String(l.entryId),
      l.studentName,
      l.entryType,
      l.category,
      l.context,
      l.description,
      l.severity ?? "",
      l.actionTaken ?? "",
      l.followUpNeeded ? "Yes" : "No",
      new Date(Number(l.loggedAt) / 1_000_000).toLocaleString(),
    ]);
    downloadCSV("edunite-behavior-log.csv", [headers, ...rows]);
    toast.success(`Exported ${behaviorLogs.length} behavior entries`);
  }, [behaviorLogs]);

  return (
    <div className="w-full space-y-5">
      {/* ── Profile ──────────────────────────────────────────────────────────── */}
      <SectionCard title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Teacher Name">
            <input
              type="text"
              defaultValue={settings.teacherName}
              onBlur={handleProfileBlur("teacherName")}
              placeholder="Your full name"
              data-ocid="settings.teacher_name.input"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </Field>
          <Field label="School Name">
            <input
              type="text"
              defaultValue={settings.schoolName}
              onBlur={handleProfileBlur("schoolName")}
              placeholder="Your school name"
              data-ocid="settings.school_name.input"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </Field>
          <Field label="School Year">
            <input
              type="text"
              defaultValue={settings.schoolYear}
              onBlur={handleProfileBlur("schoolYear")}
              placeholder="e.g. 2025–2026"
              data-ocid="settings.school_year.input"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Grading Scale ─────────────────────────────────────────────────────── */}
      <SectionCard title="Grading Scale & GPA">
        <GradingScaleSection />
      </SectionCard>

      {/* ── Grading Periods ───────────────────────────────────────────────────── */}
      <GradingPeriodsSection />

      {/* ── Per-Class Category Weights ─────────────────────────────────────────── */}
      <PerClassWeightsSection />

      {/* ── Preferences ───────────────────────────────────────────────────────── */}
      <SectionCard title="Preferences">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Default Grade Level">
            <select
              value={settings.defaultGradeLevel}
              onChange={(e) => {
                update({ defaultGradeLevel: e.target.value });
                toast.success("Settings saved", { duration: 1200 });
              }}
              data-ocid="settings.default_grade_level.select"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            >
              <option value="">— None —</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Default Period">
            <select
              value={settings.defaultPeriod}
              onChange={(e) => {
                update({ defaultPeriod: e.target.value });
                toast.success("Settings saved", { duration: 1200 });
              }}
              data-ocid="settings.default_period.select"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date Format">
            <select
              value={settings.dateFormat}
              onChange={(e) => {
                update({ dateFormat: e.target.value });
                toast.success("Settings saved", { duration: 1200 });
              }}
              data-ocid="settings.date_format.select"
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            >
              {DATE_FORMATS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SectionCard>

      {/* ── Accessibility ─────────────────────────────────────────────────────── */}
      <SectionCard title="Accessibility">
        <div className="space-y-5">
          {/* Reduce Motion */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Reduce Motion
              </span>
              <span className="text-xs text-muted-foreground">
                Minimizes animations and transitions throughout the app
              </span>
            </div>
            <Switch
              checked={settings.reduceMotion}
              onCheckedChange={handleReduceMotionToggle}
              data-ocid="settings.reduce_motion.switch"
              aria-label="Reduce motion"
            />
          </div>

          <div className="border-t border-border" />

          {/* High Contrast */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                High Contrast
              </span>
              <span className="text-xs text-muted-foreground">
                Increases color contrast for improved readability
              </span>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={handleHighContrastToggle}
              data-ocid="settings.high_contrast.switch"
              aria-label="High contrast"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Data Management ───────────────────────────────────────────────────── */}
      <SectionCard title="Data Management">
        <p className="text-xs text-muted-foreground mb-4">
          Export your data to CSV format for use in other tools. All exports
          include full records.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-ocid="settings.export_students.button"
            onClick={exportStudentsCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Download size={15} />
            Export Students CSV
            <span className="text-xs text-muted-foreground ml-1">
              ({students.length})
            </span>
          </button>
          <button
            type="button"
            data-ocid="settings.export_behavior.button"
            onClick={exportBehaviorCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Download size={15} />
            Export Behavior Log CSV
            <span className="text-xs text-muted-foreground ml-1">
              ({behaviorLogs.length})
            </span>
          </button>
        </div>
      </SectionCard>

      {/* ── Assignment Types ──────────────────────────────────────────────────── */}
      <AssignmentTypesSection />

      {/* ── Assessment Types ──────────────────────────────────────────────────── */}
      <AssessmentTypesSection />

      {/* ── Unit Templates ────────────────────────────────────────────────────── */}
      <UnitTemplatesSection />

      {/* ── Rubric Templates ──────────────────────────────────────────────────── */}
      <RubricTemplatesSection />

      {/* ── Custom Frameworks ─────────────────────────────────────────────────── */}
      <CustomFrameworksSection />

      {/* ── Coming Soon Sections ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {[
          {
            icon: Bell,
            title: "Notifications",
            desc: "Alert preferences and notification settings",
          },
          {
            icon: Shield,
            title: "Privacy & Security",
            desc: "Account security, data privacy settings",
          },
          {
            icon: HelpCircle,
            title: "Help & Support",
            desc: "Documentation, tutorials, contact support",
          },
        ].map(({ icon: Icon, title, desc }, i, arr) => (
          <div
            key={title}
            className={`flex items-center gap-4 px-5 py-4 cursor-not-allowed opacity-60 ${
              i < arr.length - 1 ? "border-b border-border" : ""
            }`}
            aria-disabled="true"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "oklch(0.48 0.22 293 / 0.08)" }}
            >
              <Icon size={16} style={{ color: "oklch(0.48 0.22 293)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
                <Badge variant="secondary" className="text-[10px] py-0">
                  Coming Soon
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground/40 flex-shrink-0"
            />
          </div>
        ))}
      </div>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-xl border border-border shadow-sm p-5"
        data-ocid="settings.about.card"
      >
        <h3 className="font-semibold text-sm text-foreground mb-3">About</h3>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-foreground font-medium">
            EdUnite OS - Class Edition
          </span>
          <span className="text-xs text-muted-foreground">
            Version 112 · Built on Internet Computer
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground/60">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || "edunite-os")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground"
          >
            caffeine.ai
          </a>{" "}
          · © {new Date().getFullYear()} EdUnite OS
        </p>
      </div>
    </div>
  );
}
