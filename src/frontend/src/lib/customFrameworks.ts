// Custom Framework Builder — localStorage CRUD module for EdUnite OS

const STORAGE_KEY = "edunite_custom_frameworks";

export type CustomFieldType = "text" | "long-text" | "list" | "date" | "number";
export type CustomFieldLevel = "course" | "unit" | "module" | "assignment";

export interface CustomFrameworkField {
  id: string;
  label: string;
  type: CustomFieldType;
  level: CustomFieldLevel;
  required: boolean;
  placeholder?: string;
}

export interface CustomFramework {
  id: string;
  name: string;
  description?: string;
  fields: CustomFrameworkField[];
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return `fw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateFieldId(): string {
  return `fld_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_FRAMEWORKS: CustomFramework[] = [
  {
    id: "seed_pbl_framework",
    name: "Project-Based Learning",
    description:
      "A framework centered on authentic, real-world projects with community connections.",
    fields: [
      {
        id: "pbl_driving_question",
        label: "Driving Question",
        type: "long-text",
        level: "course",
        required: true,
        placeholder:
          "What open-ended question will drive student inquiry across this course?",
      },
      {
        id: "pbl_final_product",
        label: "Final Product",
        type: "text",
        level: "course",
        required: false,
        placeholder: "e.g. Documentary, Community Proposal, Museum Exhibit",
      },
      {
        id: "pbl_community_connection",
        label: "Community Connection",
        type: "long-text",
        level: "unit",
        required: false,
        placeholder:
          "How does this unit connect to the local community or a real-world need?",
      },
      {
        id: "pbl_milestones",
        label: "Milestones",
        type: "list",
        level: "unit",
        required: false,
        placeholder: "Add a milestone and press Enter...",
      },
      {
        id: "pbl_reflection_prompt",
        label: "Reflection Prompt",
        type: "long-text",
        level: "assignment",
        required: false,
        placeholder:
          "What should students reflect on after completing this assignment?",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "seed_socratic_framework",
    name: "Socratic Seminar Unit",
    description:
      "A discussion-based framework centered on close reading and structured dialogue.",
    fields: [
      {
        id: "soc_central_text",
        label: "Central Text",
        type: "text",
        level: "course",
        required: true,
        placeholder: "e.g. The Federalist Papers, Night by Elie Wiesel",
      },
      {
        id: "soc_discussion_norms",
        label: "Discussion Norms",
        type: "long-text",
        level: "course",
        required: false,
        placeholder: "What agreements will guide student discussions?",
      },
      {
        id: "soc_seminar_question",
        label: "Seminar Question",
        type: "text",
        level: "unit",
        required: true,
        placeholder:
          "What open-ended question will anchor the Socratic discussion?",
      },
      {
        id: "soc_speaking_goals",
        label: "Speaking Goals",
        type: "list",
        level: "unit",
        required: false,
        placeholder: "Add a speaking goal and press Enter...",
      },
      {
        id: "soc_exit_reflection",
        label: "Exit Reflection",
        type: "long-text",
        level: "assignment",
        required: false,
        placeholder: "What reflection question should students respond to?",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
];

function loadFrameworks(): CustomFramework[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_FRAMEWORKS));
      return SEED_FRAMEWORKS;
    }
    return JSON.parse(raw) as CustomFramework[];
  } catch {
    return SEED_FRAMEWORKS;
  }
}

function persistFrameworks(frameworks: CustomFramework[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks));
}

export function getCustomFrameworks(): CustomFramework[] {
  return loadFrameworks();
}

export function saveCustomFramework(
  partial: Omit<CustomFramework, "id" | "createdAt" | "updatedAt">,
): CustomFramework {
  const frameworks = loadFrameworks();
  const now = Date.now();
  const newFramework: CustomFramework = {
    ...partial,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  persistFrameworks([...frameworks, newFramework]);
  return newFramework;
}

export function updateCustomFramework(
  id: string,
  partial: Partial<Omit<CustomFramework, "id" | "createdAt">>,
): CustomFramework | null {
  const frameworks = loadFrameworks();
  const idx = frameworks.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const updated: CustomFramework = {
    ...frameworks[idx],
    ...partial,
    id,
    updatedAt: Date.now(),
  };
  persistFrameworks(frameworks.map((f, i) => (i === idx ? updated : f)));
  return updated;
}

export function deleteCustomFramework(id: string): boolean {
  const frameworks = loadFrameworks();
  const next = frameworks.filter((f) => f.id !== id);
  if (next.length === frameworks.length) return false;
  persistFrameworks(next);
  return true;
}

export function addFieldToFramework(
  frameworkId: string,
  field: Omit<CustomFrameworkField, "id">,
): CustomFramework | null {
  const frameworks = loadFrameworks();
  const idx = frameworks.findIndex((f) => f.id === frameworkId);
  if (idx === -1) return null;
  const newField: CustomFrameworkField = { ...field, id: generateFieldId() };
  const updated: CustomFramework = {
    ...frameworks[idx],
    fields: [...frameworks[idx].fields, newField],
    updatedAt: Date.now(),
  };
  persistFrameworks(frameworks.map((f, i) => (i === idx ? updated : f)));
  return updated;
}

export function updateFieldInFramework(
  frameworkId: string,
  fieldId: string,
  partial: Partial<Omit<CustomFrameworkField, "id">>,
): CustomFramework | null {
  const frameworks = loadFrameworks();
  const idx = frameworks.findIndex((f) => f.id === frameworkId);
  if (idx === -1) return null;
  const fw = frameworks[idx];
  const updated: CustomFramework = {
    ...fw,
    fields: fw.fields.map((fld) =>
      fld.id === fieldId ? { ...fld, ...partial } : fld,
    ),
    updatedAt: Date.now(),
  };
  persistFrameworks(frameworks.map((f, i) => (i === idx ? updated : f)));
  return updated;
}

export function removeFieldFromFramework(
  frameworkId: string,
  fieldId: string,
): CustomFramework | null {
  const frameworks = loadFrameworks();
  const idx = frameworks.findIndex((f) => f.id === frameworkId);
  if (idx === -1) return null;
  const updated: CustomFramework = {
    ...frameworks[idx],
    fields: frameworks[idx].fields.filter((fld) => fld.id !== fieldId),
    updatedAt: Date.now(),
  };
  persistFrameworks(frameworks.map((f, i) => (i === idx ? updated : f)));
  return updated;
}
