// Curated field library for the Custom Framework Builder
// Teachers can browse and add pre-made fields instead of typing from scratch.

import type { CustomFieldLevel, CustomFieldType } from "./customFrameworks";

export interface FieldLibraryEntry {
  label: string;
  type: CustomFieldType;
  level: CustomFieldLevel;
  placeholder?: string;
  description?: string;
}

export interface FieldLibraryGroup {
  group: string;
  fields: FieldLibraryEntry[];
}

export const FIELD_LIBRARY: FieldLibraryGroup[] = [
  {
    group: "Understanding by Design",
    fields: [
      {
        label: "Transfer Goals",
        type: "long-text",
        level: "course",
        placeholder: "What should students be able to do long-term?",
        description: "Long-term, transferable applications of learning",
      },
      {
        label: "Enduring Understandings",
        type: "long-text",
        level: "course",
        placeholder: "Big ideas students should retain",
        description: "Core ideas that outlast the unit",
      },
      {
        label: "Essential Questions",
        type: "long-text",
        level: "unit",
        placeholder: "Open-ended questions that drive inquiry",
        description: "Questions that frame the unit's inquiry",
      },
      {
        label: "Knowledge & Skills",
        type: "long-text",
        level: "unit",
        placeholder: "Specific content and skills to teach",
        description: "Declarative and procedural targets",
      },
      {
        label: "Performance Tasks",
        type: "long-text",
        level: "assignment",
        placeholder: "How students demonstrate understanding",
        description: "Authentic assessment tasks for transfer",
      },
      {
        label: "Learning Activities",
        type: "long-text",
        level: "module",
        placeholder: "Key instructional activities",
        description: "W-H-E-R-E-T-O sequence of experiences",
      },
    ],
  },
  {
    group: "Backwards Design",
    fields: [
      {
        label: "Goals",
        type: "long-text",
        level: "course",
        placeholder: "What do students need to know?",
        description: "Desired results — standards and objectives",
      },
      {
        label: "Assessment Evidence",
        type: "long-text",
        level: "unit",
        placeholder: "How will you know they've learned it?",
        description: "Evidence of learning before planning instruction",
      },
      {
        label: "Learning Experiences",
        type: "long-text",
        level: "module",
        placeholder: "Activities and instruction",
        description: "Planned learning sequence after evidence is defined",
      },
    ],
  },
  {
    group: "5E Model",
    fields: [
      {
        label: "Engage",
        type: "long-text",
        level: "module",
        placeholder: "Hook students and activate prior knowledge",
        description: "Opening hook that surfaces prior knowledge",
      },
      {
        label: "Explore",
        type: "long-text",
        level: "module",
        placeholder: "Hands-on investigation and discovery",
        description: "Student-led investigation before explanation",
      },
      {
        label: "Explain",
        type: "long-text",
        level: "module",
        placeholder: "Direct instruction and concept clarification",
        description: "Formal vocabulary and concept introduction",
      },
      {
        label: "Elaborate",
        type: "long-text",
        level: "module",
        placeholder: "Application to new contexts",
        description: "Deepen and extend understanding",
      },
      {
        label: "Evaluate",
        type: "long-text",
        level: "assignment",
        placeholder: "Formal and informal assessment",
        description: "Evidence of learning throughout the cycle",
      },
    ],
  },
  {
    group: "EdUnite Simple",
    fields: [
      {
        label: "Intent",
        type: "long-text",
        level: "course",
        placeholder: "What students will learn",
        description: "The purpose and goal of this course",
      },
      {
        label: "Method",
        type: "long-text",
        level: "unit",
        placeholder: "How they'll learn it",
        description: "Instructional approach and strategies",
      },
      {
        label: "Scope",
        type: "long-text",
        level: "unit",
        placeholder: "How deeply you'll cover this content",
        description: "Breadth and depth of coverage",
      },
    ],
  },
  {
    group: "General Planning",
    fields: [
      {
        label: "Driving Question",
        type: "text",
        level: "unit",
        placeholder: "Central question guiding the unit",
        description: "Open-ended question that anchors student inquiry",
      },
      {
        label: "Prerequisite Knowledge",
        type: "long-text",
        level: "unit",
        placeholder: "What students need to know first",
        description: "Prior knowledge students should bring",
      },
      {
        label: "Differentiation Notes",
        type: "long-text",
        level: "unit",
        placeholder: "Accommodations and extensions",
        description: "Support and challenge strategies",
      },
      {
        label: "Vocabulary List",
        type: "list",
        level: "module",
        placeholder: "Add a term and press Enter...",
        description: "Key terms and definitions for this module",
      },
      {
        label: "Materials Needed",
        type: "list",
        level: "module",
        placeholder: "Add a material and press Enter...",
        description: "Supplies, resources, or technology required",
      },
      {
        label: "Exit Reflection",
        type: "long-text",
        level: "assignment",
        placeholder: "Student reflection prompt",
        description: "End-of-lesson or end-of-unit reflection",
      },
      {
        label: "Rubric Criteria",
        type: "long-text",
        level: "assignment",
        placeholder: "What quality work looks like",
        description: "Criteria for evaluating student performance",
      },
      {
        label: "Success Criteria",
        type: "list",
        level: "unit",
        placeholder: "Add a success criterion and press Enter...",
        description: "Specific, observable indicators of success",
      },
      {
        label: "Cross-curricular Connections",
        type: "text",
        level: "unit",
        placeholder: "Links to other subject areas",
        description: "Connections to other disciplines",
      },
      {
        label: "Homework Description",
        type: "long-text",
        level: "assignment",
        placeholder: "Instructions for out-of-class work",
        description: "What students do independently at home",
      },
    ],
  },
];
