// Curriculum CSV export utility for EdUnite OS
// Exports a full course hierarchy to CSV: Course → Units → Modules → Assignments/Assessments

import type {
  Assessment,
  Assignment,
  Course,
  FrameworkFields,
  Module,
  Unit,
} from "./curriculumTypes";
import type { CustomFramework } from "./customFrameworks";

const FRAMEWORK_LABELS: Record<string, string> = {
  ubd: "Understanding by Design",
  backwards: "Backwards Design",
  "5e": "5E Model",
  ims: "EdUnite Simple Planning",
  minimal: "Minimal",
  custom: "Custom",
};

/** Escape a CSV cell value: wrap in quotes if it contains comma, newline, or quote; double inner quotes. */
function escapeCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Join an array of strings with ` | ` separator, empty string if empty. */
function joinArray(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "";
  return arr.join(" | ");
}

const BASE_COLUMNS = [
  "Level",
  "Title",
  "Description",
  "Type",
  "Points",
  "Due Date",
  "Duration",
  "Standards",
  "Tags",
  "Framework",
  "Essential Question",
  "Learning Objectives",
  "Order",
] as const;

// Framework-specific columns added after base columns
const FRAMEWORK_COLUMNS = [
  // IMS
  "field_intent",
  "field_method",
  "field_scope",
  // UbD
  "field_transferGoals",
  "field_enduringUnderstandings",
  "field_essentialQuestions",
  "field_knowledgeSkills",
  "field_performanceTasks",
  "field_learningActivities",
  // Backwards
  "field_goals",
  "field_understandings",
  "field_assessmentEvidence",
  "field_learningExperiences",
  // 5E
  "field_engage",
  "field_explore",
  "field_explain",
  "field_elaborate",
  "field_evaluate",
  // Custom framework ID
  "custom_frameworkId",
] as const;

type BaseColumn = (typeof BASE_COLUMNS)[number];
type FrameworkColumn = (typeof FRAMEWORK_COLUMNS)[number];
type AllColumn = BaseColumn | FrameworkColumn | string;

function buildBaseRow(): Record<AllColumn, string | number | undefined | null> {
  return {
    Level: "",
    Title: "",
    Description: "",
    Type: "",
    Points: "",
    "Due Date": "",
    Duration: "",
    Standards: "",
    Tags: "",
    Framework: "",
    "Essential Question": "",
    "Learning Objectives": "",
    Order: "",
    // Framework fields
    field_intent: "",
    field_method: "",
    field_scope: "",
    field_transferGoals: "",
    field_enduringUnderstandings: "",
    field_essentialQuestions: "",
    field_knowledgeSkills: "",
    field_performanceTasks: "",
    field_learningActivities: "",
    field_goals: "",
    field_understandings: "",
    field_assessmentEvidence: "",
    field_learningExperiences: "",
    field_engage: "",
    field_explore: "",
    field_explain: "",
    field_elaborate: "",
    field_evaluate: "",
    custom_frameworkId: "",
  };
}

function serializeFrameworkFields(
  frameworkFields: FrameworkFields | undefined,
  customFrameworks: CustomFramework[],
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!frameworkFields) return result;

  const ff = frameworkFields;

  if (ff.ims) {
    result.field_intent = joinArray(ff.ims.intent);
    result.field_method = joinArray(ff.ims.method);
    result.field_scope = joinArray(ff.ims.scope);
  }

  if (ff.ubd) {
    result.field_transferGoals = joinArray(ff.ubd.transferGoals);
    result.field_enduringUnderstandings = joinArray(
      ff.ubd.enduringUnderstandings,
    );
    result.field_essentialQuestions = joinArray(ff.ubd.essentialQuestions);
    result.field_knowledgeSkills = joinArray(ff.ubd.knowledgeSkills);
    result.field_performanceTasks = joinArray(ff.ubd.performanceTasks);
    result.field_learningActivities = joinArray(ff.ubd.learningActivities);
  }

  if (ff.backwards) {
    result.field_goals = joinArray(ff.backwards.goals);
    result.field_understandings = joinArray(ff.backwards.understandings);
    // essentialQuestions exists on backwards too but we reuse field_essentialQuestions
    if (!result.field_essentialQuestions) {
      result.field_essentialQuestions = joinArray(
        ff.backwards.essentialQuestions,
      );
    }
    result.field_assessmentEvidence = joinArray(
      ff.backwards.assessmentEvidence,
    );
    result.field_learningExperiences = joinArray(
      ff.backwards.learningExperiences,
    );
  }

  if (ff.fiveE) {
    result.field_engage = joinArray(ff.fiveE.engage);
    result.field_explore = joinArray(ff.fiveE.explore);
    result.field_explain = joinArray(ff.fiveE.explain);
    result.field_elaborate = joinArray(ff.fiveE.elaborate);
    result.field_evaluate = joinArray(ff.fiveE.evaluate);
  }

  if (ff.custom) {
    result.custom_frameworkId = ff.custom.frameworkId ?? "";
    const fw = customFrameworks.find((f) => f.id === ff.custom?.frameworkId);
    if (fw && ff.custom.values) {
      for (const field of fw.fields) {
        const val = ff.custom.values[field.id];
        if (Array.isArray(val)) {
          result[`custom_${field.id}`] = joinArray(val);
        } else if (val != null) {
          result[`custom_${field.id}`] = String(val);
        } else {
          result[`custom_${field.id}`] = "";
        }
      }
    }
  }

  return result;
}

/** Derive the union of all custom field column IDs across all passed custom frameworks */
function getCustomFieldColumns(customFrameworks: CustomFramework[]): string[] {
  const seen = new Set<string>();
  for (const fw of customFrameworks) {
    for (const field of fw.fields) {
      seen.add(`custom_${field.id}`);
    }
  }
  return Array.from(seen);
}

export function exportCourseToCsv(
  course: Course,
  units: Unit[],
  modules: Module[],
  assignments: Assignment[],
  assessments: Assessment[],
  customFrameworks: CustomFramework[] = [],
): void {
  const customFieldCols = getCustomFieldColumns(customFrameworks);
  const allColumns: string[] = [
    ...BASE_COLUMNS,
    ...FRAMEWORK_COLUMNS,
    ...customFieldCols,
  ];

  function buildRow(
    overrides: Record<string, string | number | undefined | null>,
  ): Record<string, string | number | undefined | null> {
    const base = buildBaseRow();
    // Initialize custom field cols to empty
    for (const col of customFieldCols) {
      base[col] = "";
    }
    return { ...base, ...overrides };
  }

  function rowToLine(
    row: Record<string, string | number | undefined | null>,
  ): string {
    return allColumns.map((col) => escapeCell(row[col])).join(",");
  }

  const lines: string[] = [];

  // Header row
  lines.push(allColumns.map((c) => escapeCell(c)).join(","));

  // Course row
  const courseFrameworkData = serializeFrameworkFields(
    course.frameworkFields,
    customFrameworks,
  );
  lines.push(
    rowToLine(
      buildRow({
        Level: "Course",
        Title: course.title,
        Description: course.description,
        Type: FRAMEWORK_LABELS[course.framework] ?? course.framework,
        Standards: joinArray(course.standards),
        Tags: joinArray(course.tags),
        Framework: FRAMEWORK_LABELS[course.framework] ?? course.framework,
        ...courseFrameworkData,
      }),
    ),
  );

  // Units sorted by order
  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  for (const unit of sortedUnits) {
    const unitFrameworkData = serializeFrameworkFields(
      unit.frameworkFields,
      customFrameworks,
    );
    lines.push(
      rowToLine(
        buildRow({
          Level: "Unit",
          Title: unit.title,
          Description: unit.description,
          Duration:
            unit.durationValue != null && unit.durationUnit
              ? `${unit.durationValue} ${unit.durationUnit}`
              : "",
          Standards: joinArray(unit.standards),
          Tags: joinArray(unit.tags),
          "Essential Question": unit.essentialQuestion ?? "",
          Order: unit.order,
          ...unitFrameworkData,
        }),
      ),
    );

    // Modules for this unit, sorted by order
    const unitModules = modules
      .filter((m) => m.unitId === unit.id)
      .sort((a, b) => a.order - b.order);

    for (const mod of unitModules) {
      const modFrameworkData = serializeFrameworkFields(
        mod.frameworkFields,
        customFrameworks,
      );
      lines.push(
        rowToLine(
          buildRow({
            Level: "Module",
            Title: mod.title,
            Description: mod.description,
            Standards: joinArray(mod.standards),
            Tags: joinArray(mod.tags),
            "Learning Objectives": joinArray(mod.learningObjectives),
            Order: mod.order,
            ...modFrameworkData,
          }),
        ),
      );

      // Assignments for this module
      const modAssignments = assignments.filter(
        (a) => a.moduleId === mod.id || a.lessonId === mod.id,
      );
      for (const a of modAssignments) {
        const assignFrameworkData = serializeFrameworkFields(
          a.frameworkFields,
          customFrameworks,
        );
        lines.push(
          rowToLine(
            buildRow({
              Level: "Assignment",
              Title: a.title,
              Description: a.description,
              Type: a.assignmentType,
              Points: a.points,
              "Due Date": a.dueDate,
              Standards: joinArray(a.standards),
              Tags: joinArray(a.tags),
              ...assignFrameworkData,
            }),
          ),
        );
      }

      // Assessments for this module
      const modAssessments = assessments.filter((a) => a.moduleId === mod.id);
      for (const a of modAssessments) {
        const assessFrameworkData = serializeFrameworkFields(
          a.frameworkFields,
          customFrameworks,
        );
        lines.push(
          rowToLine(
            buildRow({
              Level: "Assessment",
              Title: a.title,
              Description: a.description,
              Type: a.assessmentType,
              Points: a.totalPoints,
              "Due Date": a.dueDate,
              Standards: joinArray(a.standards),
              Tags: joinArray(a.tags),
              ...assessFrameworkData,
            }),
          ),
        );
      }
    }
  }

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `${course.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}-curriculum.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
