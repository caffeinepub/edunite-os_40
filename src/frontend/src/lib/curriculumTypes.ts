// Curriculum type definitions for EdUnite OS
// 5-level hierarchy: Course → Unit → Module → Assignment / Assessment

// ─── Planning Frameworks ──────────────────────────────────────────────────────

export type CurriculumFramework =
  | "ubd"
  | "backwards"
  | "5e"
  | "ims"
  | "minimal"
  | "custom";

export interface ImsFields {
  intent: string[];
  method: string[];
  scope: string[];
}

export interface UbdFields {
  transferGoals: string[];
  enduringUnderstandings: string[];
  essentialQuestions: string[];
  knowledgeSkills: string[];
  performanceTasks: string[];
  learningActivities: string[];
}

export interface BackwardsFields {
  goals: string[];
  understandings: string[];
  essentialQuestions: string[];
  assessmentEvidence: string[];
  learningExperiences: string[];
}

export interface FiveEFields {
  engage: string[];
  explore: string[];
  explain: string[];
  elaborate: string[];
  evaluate: string[];
}

export interface FrameworkFields {
  ims?: ImsFields;
  ubd?: UbdFields;
  backwards?: BackwardsFields;
  fiveE?: FiveEFields;
  custom?: {
    frameworkId: string;
    values: Record<string, string | string[]>;
  };
}

// ─── Rubric ───────────────────────────────────────────────────────────────────

export interface RubricLevel {
  name: string;
  points: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  descriptions: Record<string, string>;
}

export interface Rubric {
  levels: RubricLevel[];
  criteria: RubricCriterion[];
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  title: string;
  subject: string;
  gradeBand: string;
  description: string;
  framework: CurriculumFramework;
  frameworkFields: FrameworkFields;
  standards: string[];
  tags: string[];
  draftStatus: "draft" | "published";
  version: number;
  versionHistory: Array<{
    version: number;
    savedAt: number;
    snapshot: string;
  }>;
  createdAt: number;
  updatedAt: number;
  // Legacy field kept for backward compat
  gradeLevel?: string;
  units?: unknown[];
}

// ─── Unit ─────────────────────────────────────────────────────────────────────

export interface Unit {
  id: number;
  courseId: number;
  title: string;
  description: string;
  essentialQuestion: string;
  durationValue: number;
  durationUnit: "days" | "weeks";
  standards: string[];
  tags: string[];
  frameworkFields: FrameworkFields;
  order: number;
  createdAt: number;
  updatedAt: number;
  // Legacy field kept for backward compat
  lessons?: unknown[];
}

// ─── Module ───────────────────────────────────────────────────────────────────

export interface Module {
  id: number;
  unitId: number;
  courseId: number;
  title: string;
  description: string;
  learningObjectives: string[];
  vocabulary: string[];
  standards: string[];
  tags: string[];
  frameworkFields: FrameworkFields;
  order: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

// Keep as deprecated alias for backward compatibility — type is now open (string)
export type AssignmentType = string;

export interface Assignment {
  id: number;
  moduleId: number;
  courseId: number;
  title: string;
  description: string;
  instructions: string;
  points: number;
  assignmentType: string;
  dueDate: string;
  standards: string[];
  tags: string[];
  rubric: Rubric | null;
  frameworkFields: FrameworkFields;
  createdAt: number;
  updatedAt: number;
  // Legacy compat fields
  lessonId?: number;
  pointsPossible?: number;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export type ScoringModel = "points" | "rubric";
export type Difficulty = "easy" | "medium" | "hard";

export interface Assessment {
  id: number;
  moduleId: number;
  courseId: number;
  title: string;
  description: string;
  assessmentType: string;
  items: string[];
  scoringModel: ScoringModel;
  totalPoints: number;
  difficulty: Difficulty;
  dueDate: string;
  standards: string[];
  tags: string[];
  frameworkFields: FrameworkFields;
  createdAt: number;
  updatedAt: number;
}

// ─── Unit Templates ───────────────────────────────────────────────────────────

export interface UnitTemplateModule {
  title: string;
  description: string;
  learningObjectives: string[];
  assignments: Array<{
    title: string;
    assignmentType: string;
    points: number;
    description: string;
  }>;
}

export interface UnitTemplate {
  id: string;
  name: string;
  description: string;
  durationValue: number;
  durationUnit: "days" | "weeks";
  essentialQuestion: string;
  enduringUnderstandings: string;
  learningObjectives: string[];
  pacingNotes: string;
  modules: UnitTemplateModule[];
  createdAt: number;
  updatedAt: number;
}

// ─── Rubric Templates ─────────────────────────────────────────────────────────

export interface RubricTemplate {
  id: string;
  name: string;
  description: string;
  rubric: Rubric;
  createdAt: number;
  updatedAt: number;
}

// ─── Legacy alias for old code paths ─────────────────────────────────────────

export type Lesson = Module;
