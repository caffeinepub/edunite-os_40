import type { Rubric, RubricTemplate } from "./curriculumTypes";

const STORAGE_KEY = "edunite_rubric_templates";

function generateId(): string {
  return `rtpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_TEMPLATES: RubricTemplate[] = [
  {
    id: "seed_essay_rubric",
    name: "Essay Rubric",
    description:
      "Standard analytic rubric for written essays covering thesis, evidence, analysis, and conventions.",
    rubric: {
      levels: [
        { name: "Exemplary", points: 4 },
        { name: "Proficient", points: 3 },
        { name: "Developing", points: 2 },
        { name: "Beginning", points: 1 },
      ],
      criteria: [
        {
          id: "seed_essay_c1",
          name: "Thesis / Claim",
          descriptions: {
            Exemplary:
              "Presents a clear, specific, and original thesis that takes a defensible position and anticipates counterarguments. The claim is consistently supported throughout the essay.",
            Proficient:
              "Presents a clear thesis with a identifiable position. The claim is generally supported throughout most of the essay.",
            Developing:
              "Presents a thesis but it is vague, overly broad, or does not fully take a position. Support for the claim is inconsistent.",
            Beginning:
              "Thesis is absent, unclear, or merely restates the prompt. No defensible position is established.",
          },
        },
        {
          id: "seed_essay_c2",
          name: "Evidence & Support",
          descriptions: {
            Exemplary:
              "Integrates varied, relevant, and credible evidence seamlessly. All evidence is properly cited and directly supports the argument. Quotations are smoothly embedded.",
            Proficient:
              "Uses relevant evidence to support claims. Most evidence is properly cited and connected to the argument. Minor issues with integration or citation.",
            Developing:
              "Uses some evidence but it may be insufficient, poorly cited, or weakly connected to the argument. Heavy paraphrasing without proper attribution.",
            Beginning:
              "Little to no evidence is presented, or evidence is irrelevant or unrelated to the argument. Citations are missing or entirely incorrect.",
          },
        },
        {
          id: "seed_essay_c3",
          name: "Analysis & Reasoning",
          descriptions: {
            Exemplary:
              "Demonstrates sophisticated, original analysis. Explains how and why evidence supports the thesis. Engages with complexity, nuance, and counterarguments persuasively.",
            Proficient:
              "Provides solid analysis connecting evidence to the argument. Shows clear reasoning with occasional gaps. Limited engagement with counterarguments.",
            Developing:
              "Analysis is superficial or relies heavily on summary. Connections between evidence and thesis are asserted rather than explained.",
            Beginning:
              "No meaningful analysis is present. The essay summarizes source material without explaining its relevance to the argument.",
          },
        },
        {
          id: "seed_essay_c4",
          name: "Writing Quality & Conventions",
          descriptions: {
            Exemplary:
              "Exceptionally clear, precise, and engaging prose. Sentence variety is sophisticated. Virtually free of grammatical, spelling, and punctuation errors. Consistent formal register.",
            Proficient:
              "Clear and readable prose with good sentence variety. A few minor grammatical or spelling errors that do not impede understanding. Appropriate formal register maintained.",
            Developing:
              "Some clarity issues due to awkward phrasing or sentence structure. Several grammatical or spelling errors that occasionally impede understanding.",
            Beginning:
              "Frequent errors in grammar, spelling, punctuation, and sentence structure significantly impede readability. Informal register used inappropriately.",
          },
        },
      ],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
  {
    id: "seed_lab_report_rubric",
    name: "Lab Report Rubric",
    description:
      "Science lab report rubric for evaluating hypothesis, methods, data analysis, and conclusions.",
    rubric: {
      levels: [
        { name: "Exemplary", points: 4 },
        { name: "Proficient", points: 3 },
        { name: "Developing", points: 2 },
        { name: "Beginning", points: 1 },
      ],
      criteria: [
        {
          id: "seed_lab_c1",
          name: "Hypothesis",
          descriptions: {
            Exemplary:
              "Hypothesis is clearly stated as a testable if/then prediction that identifies the independent and dependent variables. Demonstrates strong prior scientific knowledge as justification.",
            Proficient:
              "Hypothesis is testable and identifies the key variables. Includes a reasonable justification based on prior knowledge, with minor gaps in specificity.",
            Developing:
              "Hypothesis is present but may not be testable or clearly written as an if/then statement. Variables are implied but not explicitly stated.",
            Beginning:
              "Hypothesis is absent, not testable, or is simply a question. No connection to variables or prior scientific knowledge.",
          },
        },
        {
          id: "seed_lab_c2",
          name: "Methods & Procedure",
          descriptions: {
            Exemplary:
              "Procedure is clearly written in numbered steps with sufficient detail for complete replication. Materials list is precise and complete. Controls and variables are explicitly identified.",
            Proficient:
              "Procedure is mostly clear and replicable with minor omissions. Materials list is mostly complete. Controls are identified but may lack some detail.",
            Developing:
              "Procedure is present but lacks sufficient detail for full replication. Materials list is incomplete. Controls and variables are not clearly identified.",
            Beginning:
              "Procedure is incomplete, unclear, or missing. Materials are not listed. No evidence of experimental design thinking.",
          },
        },
        {
          id: "seed_lab_c3",
          name: "Data & Analysis",
          descriptions: {
            Exemplary:
              "Data is organized in a clearly labeled table or graph with correct units and titles. Calculations are accurate. Analysis identifies patterns, trends, and anomalies with reference to specific data points.",
            Proficient:
              "Data is organized with labels and mostly correct units. Calculations are mostly accurate. Analysis identifies major patterns but may miss some trends or anomalies.",
            Developing:
              "Data is present but organization, labels, or units are incomplete. Some calculation errors. Analysis is superficial and does not reference specific data.",
            Beginning:
              "Data is missing, disorganized, or unlabeled. Calculations are absent or incorrect. No analysis of results is provided.",
          },
        },
        {
          id: "seed_lab_c4",
          name: "Conclusion",
          descriptions: {
            Exemplary:
              "Conclusion clearly states whether the hypothesis was supported, references specific data as evidence, and explains the scientific reasoning. Addresses sources of error, limitations, and proposes meaningful extensions.",
            Proficient:
              "Conclusion addresses whether the hypothesis was supported and cites data. Mentions sources of error. Scientific explanation is present but may be incomplete.",
            Developing:
              "Conclusion states whether the hypothesis was supported but does not reference specific data. Errors are mentioned generally. Scientific explanation is weak.",
            Beginning:
              "Conclusion is absent or does not address the hypothesis. No data is referenced. No explanation of scientific concepts or sources of error.",
          },
        },
      ],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: "seed_presentation_rubric",
    name: "Presentation Rubric",
    description:
      "Oral presentation rubric covering content organization, delivery, visual aids, and audience engagement.",
    rubric: {
      levels: [
        { name: "Exemplary", points: 4 },
        { name: "Proficient", points: 3 },
        { name: "Developing", points: 2 },
        { name: "Beginning", points: 1 },
      ],
      criteria: [
        {
          id: "seed_pres_c1",
          name: "Content & Organization",
          descriptions: {
            Exemplary:
              "Presentation has a compelling introduction, logical sequence, and memorable conclusion. All information is accurate, relevant, and supports a clear central argument. Transitions are smooth.",
            Proficient:
              "Presentation has a clear introduction, organized body, and conclusion. Information is mostly accurate and relevant. Some transitions could be smoother.",
            Developing:
              "Presentation has a recognizable structure but organization is inconsistent. Some information may be irrelevant or loosely connected to the topic. Transitions are abrupt.",
            Beginning:
              "Presentation lacks clear structure. Information is disorganized, inaccurate, or insufficient. No recognizable introduction or conclusion.",
          },
        },
        {
          id: "seed_pres_c2",
          name: "Delivery & Clarity",
          descriptions: {
            Exemplary:
              "Speaks clearly at an effective pace with strong vocal projection and varied inflection. Maintains confident eye contact with the audience. Does not read from notes or slides.",
            Proficient:
              "Speaks clearly and at an appropriate pace. Eye contact is mostly maintained with occasional reference to notes. Vocal variety is present.",
            Developing:
              "Speech is sometimes unclear, too fast, or too soft. Frequently reads from notes. Eye contact with audience is limited.",
            Beginning:
              "Difficult to understand due to pace, volume, or lack of clarity. Reads directly from notes or slides throughout. No meaningful eye contact.",
          },
        },
        {
          id: "seed_pres_c3",
          name: "Visual Aids",
          descriptions: {
            Exemplary:
              "Visual aids are polished, purposeful, and enhance understanding. Slides are not text-heavy; images and graphics are high-quality. Design is consistent and professional.",
            Proficient:
              "Visual aids are relevant and mostly enhance the presentation. Some slides may have too much text or minor design inconsistencies.",
            Developing:
              "Visual aids are present but may distract from or not support the presentation. Slides are text-heavy or cluttered.",
            Beginning:
              "Visual aids are absent, difficult to read, or irrelevant to the presentation content.",
          },
        },
        {
          id: "seed_pres_c4",
          name: "Audience Engagement",
          descriptions: {
            Exemplary:
              "Actively engages the audience through questions, discussion, demonstrations, or interactive moments. Responds confidently and accurately to all audience questions.",
            Proficient:
              "Makes attempts to engage the audience and handles most questions accurately. Some engagement strategies are used effectively.",
            Developing:
              "Limited attempt to engage the audience. Struggles to answer audience questions fully or confidently.",
            Beginning:
              "No attempt to engage the audience. Unable to answer questions or deflects all inquiries.",
          },
        },
      ],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: "seed_project_rubric",
    name: "Project Rubric",
    description:
      "General project rubric for research accuracy, creativity, execution, and self-assessment reflection.",
    rubric: {
      levels: [
        { name: "Exemplary", points: 4 },
        { name: "Proficient", points: 3 },
        { name: "Developing", points: 2 },
        { name: "Beginning", points: 1 },
      ],
      criteria: [
        {
          id: "seed_proj_c1",
          name: "Research & Accuracy",
          descriptions: {
            Exemplary:
              "Information is thorough, accurate, and draws from multiple credible sources. All sources are properly cited. Content demonstrates deep understanding of the topic beyond surface-level facts.",
            Proficient:
              "Information is mostly accurate and draws from credible sources. Sources are cited with minor errors. Content shows solid understanding of the topic.",
            Developing:
              "Information is partially accurate with some errors or gaps. Sources may be insufficient or not fully credible. Understanding of topic is surface-level.",
            Beginning:
              "Information is inaccurate, missing, or unsupported by credible sources. No citations are present. Understanding of topic is unclear.",
          },
        },
        {
          id: "seed_proj_c2",
          name: "Creativity & Design",
          descriptions: {
            Exemplary:
              "Project demonstrates exceptional originality and creative thinking. Design choices are purposeful, enhance the content, and reflect a distinctive personal voice or vision.",
            Proficient:
              "Project shows creativity in approach or presentation. Design is generally effective and enhances the content with some originality.",
            Developing:
              "Project shows limited creativity. Design is functional but does not significantly enhance the content. Presentation is generic.",
            Beginning:
              "Project shows no original thinking. Design is incomplete, inappropriate, or detracts from the content.",
          },
        },
        {
          id: "seed_proj_c3",
          name: "Execution & Completeness",
          descriptions: {
            Exemplary:
              "All required components are present, polished, and clearly exceed minimum expectations. Project is thorough, well-crafted, and evidence of sustained effort is clear.",
            Proficient:
              "All required components are present and meet expectations. Project shows clear effort and is mostly complete with minor omissions.",
            Developing:
              "Most required components are present but some are incomplete or underdeveloped. Evidence of effort is inconsistent.",
            Beginning:
              "Several required components are missing or significantly incomplete. Minimal evidence of effort or sustained work.",
          },
        },
        {
          id: "seed_proj_c4",
          name: "Reflection & Self-Assessment",
          descriptions: {
            Exemplary:
              "Reflection is insightful and specific, honestly assessing both strengths and areas for growth. Identifies concrete next steps and connects learning to broader goals or future applications.",
            Proficient:
              "Reflection is thoughtful and addresses both what went well and what could improve. Some specificity in identifying growth areas and next steps.",
            Developing:
              "Reflection is present but superficial or overly positive. Limited analysis of what could be improved or what was learned.",
            Beginning:
              "Reflection is absent, minimal, or does not demonstrate self-awareness. No meaningful assessment of process or product quality.",
          },
        },
      ],
    },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  },
];

function loadTemplates(): RubricTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TEMPLATES));
      return SEED_TEMPLATES;
    }
    return JSON.parse(raw) as RubricTemplate[];
  } catch {
    return SEED_TEMPLATES;
  }
}

function persistTemplates(templates: RubricTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function getRubricTemplates(): RubricTemplate[] {
  return loadTemplates();
}

export function saveRubricTemplate(
  template: Omit<RubricTemplate, "id" | "createdAt" | "updatedAt"> & {
    rubric: Rubric;
  },
): RubricTemplate {
  const templates = loadTemplates();
  const now = Date.now();
  const newTemplate: RubricTemplate = {
    ...template,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  persistTemplates([...templates, newTemplate]);
  return newTemplate;
}

export function updateRubricTemplate(
  id: string,
  partial: Partial<Omit<RubricTemplate, "id" | "createdAt">>,
): RubricTemplate | null {
  const templates = loadTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: RubricTemplate = {
    ...templates[idx],
    ...partial,
    id,
    updatedAt: Date.now(),
  };
  const next = templates.map((t, i) => (i === idx ? updated : t));
  persistTemplates(next);
  return updated;
}

export function deleteRubricTemplate(id: string): boolean {
  const templates = loadTemplates();
  const next = templates.filter((t) => t.id !== id);
  if (next.length === templates.length) return false;
  persistTemplates(next);
  return true;
}
