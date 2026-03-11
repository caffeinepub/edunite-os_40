import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookMarked,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import type { Rubric, RubricCriterion } from "../../lib/curriculumTypes";
import {
  getRubricTemplates,
  saveRubricTemplate,
} from "../../lib/rubricTemplates";

interface RubricBuilderProps {
  rubric: Rubric | null;
  onChange: (rubric: Rubric | null) => void;
}

const DEFAULT_LEVELS = [
  { name: "Exemplary", points: 4 },
  { name: "Proficient", points: 3 },
  { name: "Developing", points: 2 },
  { name: "Beginning", points: 1 },
];

const QUICK_TEMPLATES: Record<string, string[]> = {
  essay: ["Thesis", "Evidence", "Analysis", "Writing Quality"],
  presentation: ["Content", "Delivery", "Visual Aids", "Engagement"],
  lab_report: ["Hypothesis", "Methods", "Data", "Conclusion"],
  project: ["Research", "Creativity", "Execution", "Reflection"],
};

function createRubric(criteriaNames: string[]): Rubric {
  const criteria: RubricCriterion[] = criteriaNames.map((name, i) => ({
    id: `criterion-${Date.now()}-${i}`,
    name,
    descriptions: {
      Exemplary: "",
      Proficient: "",
      Developing: "",
      Beginning: "",
    },
  }));
  return { levels: DEFAULT_LEVELS, criteria };
}

function blankRubric(): Rubric {
  return {
    levels: DEFAULT_LEVELS,
    criteria: [
      {
        id: `criterion-${Date.now()}`,
        name: "Criterion 1",
        descriptions: {
          Exemplary: "",
          Proficient: "",
          Developing: "",
          Beginning: "",
        },
      },
    ],
  };
}

/** Deep-copy a rubric with fresh criterion IDs so edits don't mutate the template */
function deepCopyRubric(rubric: Rubric): Rubric {
  return {
    levels: rubric.levels.map((l) => ({ ...l })),
    criteria: rubric.criteria.map((c) => ({
      ...c,
      id: `criterion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      descriptions: { ...c.descriptions },
    })),
  };
}

export default function RubricBuilder({
  rubric,
  onChange,
}: RubricBuilderProps) {
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  // ── Empty state (no rubric) ────────────────────────────────────────────────
  if (!rubric) {
    const savedTemplates = getRubricTemplates();

    return (
      <div
        className="border border-dashed border-border rounded-lg p-4"
        data-ocid="curriculum.rubric_builder.panel"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">No rubric attached</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowTemplateLibrary((v) => !v);
                setShowQuickTemplates(false);
              }}
              data-ocid="rubric_builder.load_template_button"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <BookMarked size={11} />
              Load from Template
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQuickTemplates((v) => !v);
                setShowTemplateLibrary(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Quick start
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(blankRubric())}
              className="gap-1 text-xs h-7"
            >
              <Plus size={11} />
              Add Rubric
            </Button>
          </div>
        </div>

        {/* Quick-start templates */}
        {showQuickTemplates && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
            <p className="w-full text-xs text-muted-foreground mb-1">
              Start from a quick template:
            </p>
            {Object.entries(QUICK_TEMPLATES).map(([key, criteria]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(createRubric(criteria));
                  setShowQuickTemplates(false);
                }}
                className="px-3 py-1 text-xs rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors capitalize"
              >
                {key.replace("_", " ")}
              </button>
            ))}
          </div>
        )}

        {/* Template library picker */}
        {showTemplateLibrary && (
          <div
            className="mt-2 pt-2 border-t border-border space-y-2"
            data-ocid="rubric_builder.template_picker.panel"
          >
            <p className="text-xs text-muted-foreground font-medium">
              Saved rubric templates:
            </p>
            {savedTemplates.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No rubric templates saved yet. Create one in Settings → Rubric
                Templates.
              </p>
            ) : (
              <div className="space-y-1">
                {savedTemplates.map((tpl, idx) => (
                  <div
                    key={tpl.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {tpl.name}
                      </p>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {tpl.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {tpl.rubric.criteria.length} criteria ·{" "}
                        {tpl.rubric.levels.length} levels
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`rubric_builder.template_picker.use_button.${idx + 1}`}
                      onClick={() => {
                        onChange(deepCopyRubric(tpl.rubric));
                        setShowTemplateLibrary(false);
                      }}
                      className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2.5 py-1 rounded border border-primary/30 hover:bg-primary/5"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowTemplateLibrary(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Rubric editing helpers ─────────────────────────────────────────────────

  const updateCriterionName = (id: string, name: string) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria.map((c) => (c.id === id ? { ...c, name } : c)),
    });
  };

  const updateDescription = (
    criterionId: string,
    levelName: string,
    desc: string,
  ) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria.map((c) =>
        c.id === criterionId
          ? {
              ...c,
              descriptions: { ...c.descriptions, [levelName]: desc },
            }
          : c,
      ),
    });
  };

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion-${Date.now()}`,
      name: `Criterion ${rubric.criteria.length + 1}`,
      descriptions: Object.fromEntries(rubric.levels.map((l) => [l.name, ""])),
    };
    onChange({ ...rubric, criteria: [...rubric.criteria, newCriterion] });
  };

  const removeCriterion = (id: string) => {
    onChange({
      ...rubric,
      criteria: rubric.criteria.filter((c) => c.id !== id),
    });
  };

  const handleSaveTemplate = () => {
    const trimmedName = saveName.trim();
    if (!trimmedName) return;
    saveRubricTemplate({
      name: trimmedName,
      description: saveDescription.trim(),
      rubric,
    });
    toast.success(`Rubric template "${trimmedName}" saved`);
    setSaveName("");
    setSaveDescription("");
    setShowSaveForm(false);
  };

  // ── Rubric attached ────────────────────────────────────────────────────────

  return (
    <div className="space-y-3" data-ocid="curriculum.rubric_builder.panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Rubric</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="rubric_builder.save_as_template_button"
            onClick={() => setShowSaveForm((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Save size={11} />
            Save as Template
            {showSaveForm ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
          >
            <Trash2 size={11} />
            Remove Rubric
          </button>
        </div>
      </div>

      {/* Inline save-as-template form */}
      {showSaveForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
          <p className="text-xs font-semibold text-foreground">
            Save as Template
          </p>
          <div className="space-y-2">
            <div>
              <label
                htmlFor="save-template-name"
                className="text-xs text-muted-foreground block mb-1"
              >
                Template Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="save-template-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. Persuasive Essay Rubric"
                data-ocid="rubric_builder.save_template.name_input"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveName.trim())
                    handleSaveTemplate();
                  if (e.key === "Escape") setShowSaveForm(false);
                }}
              />
            </div>
            <div>
              <label
                htmlFor="save-template-desc"
                className="text-xs text-muted-foreground block mb-1"
              >
                Description (optional)
              </label>
              <Input
                id="save-template-desc"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Brief description of this rubric..."
                data-ocid="rubric_builder.save_template.description_input"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-ocid="rubric_builder.save_template.submit_button"
              onClick={handleSaveTemplate}
              disabled={!saveName.trim()}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={10} />
              Save Template
            </button>
            <button
              type="button"
              data-ocid="rubric_builder.save_template.cancel_button"
              onClick={() => {
                setShowSaveForm(false);
                setSaveName("");
                setSaveDescription("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rubric Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-r border-border w-32">
                Criterion
              </th>
              {rubric.levels.map((level) => (
                <th
                  key={level.name}
                  className="text-left p-2 font-medium text-muted-foreground border-b border-r border-border last:border-r-0"
                >
                  {level.name}
                  <span className="text-muted-foreground/60 ml-1">
                    ({level.points}pt)
                  </span>
                </th>
              ))}
              <th className="w-8 border-b border-border bg-muted/40" />
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((criterion, i) => (
              <tr
                key={criterion.id}
                className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="p-2 border-r border-border align-top">
                  <Input
                    value={criterion.name}
                    onChange={(e) =>
                      updateCriterionName(criterion.id, e.target.value)
                    }
                    className="h-7 text-xs font-medium"
                    placeholder="Criterion name"
                  />
                </td>
                {rubric.levels.map((level) => (
                  <td
                    key={level.name}
                    className="p-2 border-r border-border last:border-r-0 align-top"
                  >
                    <Textarea
                      value={criterion.descriptions[level.name] ?? ""}
                      onChange={(e) =>
                        updateDescription(
                          criterion.id,
                          level.name,
                          e.target.value,
                        )
                      }
                      placeholder={`Describe ${level.name.toLowerCase()} performance...`}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </td>
                ))}
                <td className="p-2 align-top">
                  <button
                    type="button"
                    onClick={() => removeCriterion(criterion.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove criterion"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addCriterion}
        className="gap-1 text-xs h-7"
      >
        <Plus size={11} />
        Add Criterion
      </Button>
    </div>
  );
}
