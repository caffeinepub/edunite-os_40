import type { UnitTemplate } from "./curriculumTypes";

const STORAGE_KEY = "edunite_unit_templates";

function generateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_TEMPLATES: UnitTemplate[] = [
  {
    id: "seed_ubd_unit",
    name: "UbD Unit Template",
    description:
      "Understanding by Design structure with diagnostic pre-assessment and core instruction modules.",
    durationValue: 3,
    durationUnit: "weeks",
    essentialQuestion: "How does this topic connect to real-world problems?",
    enduringUnderstandings:
      "Students will understand that content mastery requires both knowledge and transferable application.",
    learningObjectives: [
      "Students will be able to identify key concepts and vocabulary",
      "Students will be able to apply knowledge to novel situations",
      "Students will be able to evaluate evidence and construct arguments",
    ],
    pacingNotes:
      "Week 1: Diagnostic + pre-assessment. Weeks 2–3: Core instruction and summative task.",
    modules: [
      {
        title: "Diagnostic & Activation",
        description:
          "Pre-assess prior knowledge and activate student curiosity.",
        learningObjectives: [
          "Identify prior knowledge and misconceptions",
          "Connect new learning to prior experience",
        ],
        assignments: [
          {
            title: "Pre-Assessment",
            assignmentType: "Formative",
            points: 0,
            description:
              "Low-stakes diagnostic to gauge prior knowledge before instruction begins.",
          },
          {
            title: "KWL Chart",
            assignmentType: "Classwork",
            points: 10,
            description:
              "Students record what they Know, Want to know, and will Learn.",
          },
        ],
      },
      {
        title: "Core Instruction",
        description:
          "Primary instruction, practice, and formative assessment sequence.",
        learningObjectives: [
          "Demonstrate understanding of core content",
          "Apply skills in guided and independent practice",
        ],
        assignments: [
          {
            title: "Guided Practice",
            assignmentType: "Classwork",
            points: 20,
            description: "Structured practice with teacher support.",
          },
          {
            title: "Summative Performance Task",
            assignmentType: "Summative",
            points: 100,
            description:
              "Transfer task demonstrating enduring understanding from the unit.",
          },
        ],
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: "seed_5e_unit",
    name: "5E Science Unit Template",
    description:
      "Engage → Explore → Explain → Elaborate → Evaluate framework for science inquiry.",
    durationValue: 2,
    durationUnit: "weeks",
    essentialQuestion: "How do scientists investigate natural phenomena?",
    enduringUnderstandings:
      "Scientific understanding is built through systematic inquiry, evidence, and revision of ideas.",
    learningObjectives: [
      "Design and conduct a controlled investigation",
      "Analyze and interpret data to draw conclusions",
      "Communicate scientific findings with evidence",
    ],
    pacingNotes:
      "Days 1–2: Engage/Explore. Days 3–5: Explain/Elaborate. Days 6–8: Evaluate. Day 9–10: Reflection.",
    modules: [
      {
        title: "Engage & Explore",
        description:
          "Hook students with a phenomenon and allow hands-on exploration.",
        learningObjectives: [
          "Observe and question a natural phenomenon",
          "Design a simple investigation to explore the phenomenon",
        ],
        assignments: [
          {
            title: "Phenomenon Observation",
            assignmentType: "Classwork",
            points: 15,
            description:
              "Observe and record questions about the opening phenomenon.",
          },
        ],
      },
      {
        title: "Explain & Elaborate",
        description:
          "Direct instruction on concepts and application to new contexts.",
        learningObjectives: [
          "Explain the science concept using evidence from exploration",
          "Apply the concept to a new situation",
        ],
        assignments: [
          {
            title: "Concept Application",
            assignmentType: "Practice",
            points: 25,
            description:
              "Apply the concept to a real-world extension scenario.",
          },
          {
            title: "Lab Report",
            assignmentType: "Lab",
            points: 50,
            description:
              "Formal lab report documenting investigation design, data, and conclusions.",
          },
        ],
      },
      {
        title: "Evaluate",
        description: "Formal summative assessment and student reflection.",
        learningObjectives: [
          "Demonstrate understanding through a performance task",
          "Reflect on learning growth across the unit",
        ],
        assignments: [
          {
            title: "Unit Assessment",
            assignmentType: "Summative",
            points: 100,
            description: "Comprehensive assessment of 5E unit concepts.",
          },
        ],
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: "seed_writing_workshop",
    name: "Writing Workshop Unit",
    description:
      "Mentor text study → drafting → revision & publishing process for any writing genre.",
    durationValue: 4,
    durationUnit: "weeks",
    essentialQuestion:
      "What choices do writers make to craft meaning for their readers?",
    enduringUnderstandings:
      "Effective writers study mentor texts, draft iteratively, and revise with intention.",
    learningObjectives: [
      "Analyze mentor texts for craft moves and structural choices",
      "Draft an original piece using workshop techniques",
      "Revise for clarity, voice, and audience awareness",
      "Publish a polished final piece",
    ],
    pacingNotes:
      "Week 1: Mentor text study and immersion. Weeks 2–3: Drafting and conferencing. Week 4: Revision, editing, publishing.",
    modules: [
      {
        title: "Mentor Text Study",
        description:
          "Read and analyze published examples to identify craft moves.",
        learningObjectives: [
          "Identify structural and stylistic moves in mentor texts",
          "Generate ideas for own writing from mentor texts",
        ],
        assignments: [
          {
            title: "Mentor Text Analysis",
            assignmentType: "Writing",
            points: 20,
            description:
              "Annotate a mentor text for craft moves and write a short response.",
          },
          {
            title: "Writer's Notebook Entry",
            assignmentType: "Classwork",
            points: 10,
            description:
              "Collect ideas, snippets, and observations in writer's notebook.",
          },
        ],
      },
      {
        title: "Drafting",
        description: "Students generate first drafts using notebook entries.",
        learningObjectives: [
          "Develop a rough draft using a mentor text structure",
          "Participate in peer and teacher writing conferences",
        ],
        assignments: [
          {
            title: "First Draft",
            assignmentType: "Writing",
            points: 30,
            description: "Complete first draft submitted for peer conference.",
          },
          {
            title: "Conference Notes",
            assignmentType: "Classwork",
            points: 10,
            description:
              "Record feedback received and goals set during writing conference.",
          },
        ],
      },
      {
        title: "Revision & Publishing",
        description:
          "Targeted revision based on feedback, editing, and final publication.",
        learningObjectives: [
          "Revise draft with specific craft goals from conference feedback",
          "Edit for conventions and publish a polished final piece",
        ],
        assignments: [
          {
            title: "Revision Reflection",
            assignmentType: "Writing",
            points: 20,
            description:
              "Short reflection explaining the revisions made and why.",
          },
          {
            title: "Published Final Piece",
            assignmentType: "Summative",
            points: 100,
            description: "Final published writing piece scored with rubric.",
          },
        ],
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
];

function loadTemplates(): UnitTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with default templates on first load
      const seeded = SEED_TEMPLATES;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as UnitTemplate[];
  } catch {
    return SEED_TEMPLATES;
  }
}

function persistTemplates(templates: UnitTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function getTemplates(): UnitTemplate[] {
  return loadTemplates();
}

export function saveTemplate(
  template: Omit<UnitTemplate, "id" | "createdAt" | "updatedAt">,
): UnitTemplate {
  const templates = loadTemplates();
  const now = Date.now();
  const newTemplate: UnitTemplate = {
    ...template,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  persistTemplates([...templates, newTemplate]);
  return newTemplate;
}

export function updateTemplate(
  id: string,
  partial: Partial<Omit<UnitTemplate, "id" | "createdAt">>,
): UnitTemplate | null {
  const templates = loadTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: UnitTemplate = {
    ...templates[idx],
    ...partial,
    id,
    updatedAt: Date.now(),
  };
  const next = templates.map((t, i) => (i === idx ? updated : t));
  persistTemplates(next);
  return updated;
}

export function deleteTemplate(id: string): boolean {
  const templates = loadTemplates();
  const next = templates.filter((t) => t.id !== id);
  if (next.length === templates.length) return false;
  persistTemplates(next);
  return true;
}
