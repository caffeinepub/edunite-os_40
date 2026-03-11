import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Accommodation,
  AttendanceRecord,
  BehaviorEntry,
  BehaviorLog,
  GuardianContact,
  Student,
} from "../backend";
import type {
  BehaviorCategory,
  BehaviorEntryType,
  BehaviorSeverity,
  ContactMethod,
} from "../backend";
import type {
  Assessment,
  Assignment,
  AssignmentType,
  Course,
  CurriculumFramework,
  Difficulty,
  FrameworkFields,
  Lesson,
  Module,
  Rubric,
  ScoringModel,
  Unit,
} from "../lib/curriculumTypes";
import { useActor } from "./useActor";

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { Student, GuardianContact, ContactMethod, BehaviorLog };
export type {
  Course,
  Unit,
  Lesson,
  Module,
  Assignment,
  Assessment,
  AssignmentType,
  CurriculumFramework,
  FrameworkFields,
  Rubric,
  Difficulty,
  ScoringModel,
};

// ─── Student Hooks ────────────────────────────────────────────────────────────

export function useGetAllStudents() {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStudents();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetStudentById(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Student>({
    queryKey: ["student", studentId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getStudentById(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

// Alias for backward compatibility
export function useGetStudent(studentId: string) {
  return useGetStudentById(studentId);
}

export function useGetStudentsByClass(className: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Student[]>({
    queryKey: ["students", "class", className],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStudentsByClass(className);
    },
    enabled: !!actor && !isFetching && !!className,
  });
}

export function useAddStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      givenNames: string;
      familyName: string;
      preferredName: string | null;
      gradeLevel: string;
      photo: string;
      accommodations: Accommodation[];
      allergies: string[];
      medicalNotes: string;
      attendanceRecords: AttendanceRecord[];
      guardianContacts: GuardianContact[];
      teacherNotes: string;
      interventionPlans: string;
      behaviorEntries: BehaviorEntry[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addStudent(
        params.studentId,
        params.givenNames,
        params.familyName,
        params.preferredName,
        params.gradeLevel,
        params.photo,
        params.accommodations,
        params.allergies,
        params.medicalNotes,
        params.attendanceRecords,
        params.guardianContacts,
        params.teacherNotes,
        params.interventionPlans,
        params.behaviorEntries,
        null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      givenNames: string;
      familyName: string;
      preferredName: string | null;
      gradeLevel: string;
      photo: string;
      accommodations: Accommodation[];
      allergies: string[];
      medicalNotes: string;
      attendanceRecords: AttendanceRecord[];
      guardianContacts: GuardianContact[];
      teacherNotes: string;
      interventionPlans: string;
      behaviorEntries: BehaviorEntry[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateStudent(
        params.studentId,
        params.givenNames,
        params.familyName,
        params.preferredName,
        params.gradeLevel,
        params.photo,
        params.accommodations,
        params.allergies,
        params.medicalNotes,
        params.attendanceRecords,
        params.guardianContacts,
        params.teacherNotes,
        params.interventionPlans,
        params.behaviorEntries,
        null,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
    },
  });
}

export function useDeleteStudent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteStudent(studentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ─── Guardian Contact Hooks ───────────────────────────────────────────────────

export function useGetGuardiansByStudent(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GuardianContact[]>({
    queryKey: ["guardians", studentId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGuardiansByStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useAddGuardianContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      firstName: string;
      lastName: string;
      relationship: string;
      phone: string;
      email: string;
      preferredContactMethod: ContactMethod;
      languagePreference: string;
      emergencyContact: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGuardianContact(
        params.studentId,
        params.firstName,
        params.lastName,
        params.relationship,
        params.phone,
        params.email,
        params.preferredContactMethod,
        params.languagePreference,
        params.emergencyContact,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guardians", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateGuardianContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      contactId: bigint;
      firstName: string;
      lastName: string;
      relationship: string;
      phone: string;
      email: string;
      preferredContactMethod: ContactMethod;
      languagePreference: string;
      emergencyContact: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateGuardianContact(
        params.studentId,
        params.contactId,
        params.firstName,
        params.lastName,
        params.relationship,
        params.phone,
        params.email,
        params.preferredContactMethod,
        params.languagePreference,
        params.emergencyContact,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guardians", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteGuardianContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { studentId: string; contactId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteGuardianContact(params.studentId, params.contactId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["guardians", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ─── Behavior Entry Hooks (legacy per-student) ────────────────────────────────

export function useGetBehaviorEntriesByStudent(studentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<BehaviorEntry[]>({
    queryKey: ["behaviorEntries", studentId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBehaviorEntriesByStudent(studentId);
    },
    enabled: !!actor && !isFetching && !!studentId,
  });
}

export function useAddBehaviorEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      date: string;
      description: string;
      consequence: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBehaviorEntry(
        params.studentId,
        params.date,
        params.description,
        params.consequence,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["behaviorEntries", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateBehaviorEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      entryId: bigint;
      date: string;
      description: string;
      consequence: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBehaviorEntry(
        params.studentId,
        params.entryId,
        params.date,
        params.description,
        params.consequence,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["behaviorEntries", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteBehaviorEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { studentId: string; entryId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBehaviorEntry(params.studentId, params.entryId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["behaviorEntries", variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student", variables.studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export function useSeedStudents() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.seedStudents();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

// ─── Behavior Log Hooks ───────────────────────────────────────────────────────

export function useBehaviorLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<BehaviorLog[]>({
    queryKey: ["behaviorLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBehaviorLogs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBehaviorLogsByStudent(studentName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<BehaviorLog[]>({
    queryKey: ["behaviorLogs", "student", studentName],
    queryFn: async () => {
      if (!actor) return [];
      if (!studentName) return [];
      return actor.getBehaviorLogsByStudent(studentName);
    },
    enabled: !!actor && !isFetching && !!studentName,
  });
}

export function useStudentRoster() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["studentRoster"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoster();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBehaviorLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentName: string;
      entryType: BehaviorEntryType;
      category: BehaviorCategory;
      context: string;
      description: string;
      severity: BehaviorSeverity | null;
      actionTaken: string | null;
      followUpNeeded: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addBehaviorLog(
        params.studentName,
        params.entryType,
        params.category,
        params.context,
        params.description,
        params.severity,
        params.actionTaken,
        params.followUpNeeded,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behaviorLogs"] });
      queryClient.invalidateQueries({ queryKey: ["studentRoster"] });
      toast.success("Behavior logged successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to log behavior: ${error.message}`);
    },
  });
}

export function useUpdateBehaviorLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      entryId: bigint;
      studentName: string;
      entryType: BehaviorEntryType;
      category: BehaviorCategory;
      context: string;
      description: string;
      severity: BehaviorSeverity | null;
      actionTaken: string | null;
      followUpNeeded: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBehaviorLog(
        params.entryId,
        params.studentName,
        params.entryType,
        params.category,
        params.context,
        params.description,
        params.severity,
        params.actionTaken,
        params.followUpNeeded,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behaviorLogs"] });
      toast.success("Behavior entry updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update behavior entry: ${error.message}`);
    },
  });
}

export function useDeleteBehaviorLog() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteBehaviorLog(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behaviorLogs"] });
      toast.success("Behavior entry deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete behavior entry: ${error.message}`);
    },
  });
}

// ─── Curriculum (client-side in-memory store) ────────────────────────────────

let courseStore: Course[] = [];
let unitStore: Unit[] = [];
let _lessonStore: Lesson[] = []; // legacy alias for moduleStore
let moduleStore: Module[] = [];
let assignmentStore: Assignment[] = [];
let assessmentStore: Assessment[] = [];
let nextCourseId = 1;
let nextUnitId = 1;
let _nextLessonId = 1;
let nextModuleId = 1;
let nextAssignmentId = 1;
let nextAssessmentId = 1;
let seedInitialized = false;

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function initSeedData() {
  if (seedInitialized) return;
  seedInitialized = true;

  // Course: English 10
  const course1: Course = {
    id: nextCourseId++,
    title: "English 10",
    subject: "English",
    gradeBand: "9-12",
    description:
      "A survey of American literature from colonial times to the present, with emphasis on close reading, analytical writing, and standards-based assessment.",
    framework: "ubd",
    frameworkFields: {
      ubd: {
        transferGoals: [
          "Craft arguments with evidence across contexts",
          "Evaluate complex texts independently",
        ],
        enduringUnderstandings: [
          "Literature reflects and shapes cultural identity",
          "Writers make purposeful choices that affect meaning",
        ],
        essentialQuestions: [
          "How does place shape identity?",
          "What makes a text worth reading?",
        ],
        knowledgeSkills: [
          "Close reading",
          "Textual evidence",
          "Argument construction",
          "Rhetorical analysis",
        ],
        performanceTasks: [
          "Argumentative essay on colonial identity",
          "Socratic seminar",
          "Literary analysis portfolio",
        ],
        learningActivities: [
          "Annotation workshops",
          "Collaborative discussions",
          "Writing conferences",
        ],
      },
    },
    standards: ["CCSS.ELA-LITERACY.RL.9-10.1", "CCSS.ELA-LITERACY.W.9-10.1"],
    tags: ["ELA", "American Literature", "Grade 10"],
    draftStatus: "published",
    version: 2,
    versionHistory: [
      {
        version: 1,
        savedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        snapshot: "{}",
      },
      {
        version: 2,
        savedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
        snapshot: "{}",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  };
  courseStore = [course1];

  // Unit 1: Colonial Literature
  const unit1: Unit = {
    id: nextUnitId++,
    courseId: course1.id,
    title: "Colonial Literature",
    description:
      "Exploring the writings of early American colonists including Puritan authors and Native American oral traditions.",
    essentialQuestion: "How does place shape identity?",
    durationValue: 3,
    durationUnit: "weeks",
    standards: ["CCSS.ELA-LITERACY.RL.9-10.1"],
    tags: ["Colonial", "Puritan", "American Literature"],
    frameworkFields: {},
    order: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  };

  // Unit 2: Romantic Literature
  const unit2: Unit = {
    id: nextUnitId++,
    courseId: course1.id,
    title: "Romantic Literature",
    description:
      "The American Romantic period, including Transcendentalism and the emergence of the American Dream.",
    essentialQuestion: "What is the American Dream?",
    durationValue: 4,
    durationUnit: "weeks",
    standards: ["CCSS.ELA-LITERACY.RL.9-10.3"],
    tags: ["Romanticism", "Transcendentalism"],
    frameworkFields: {},
    order: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  };
  unitStore = [unit1, unit2];

  // Module 1: Puritan Literature
  const mod1: Module = {
    id: nextModuleId++,
    unitId: unit1.id,
    courseId: course1.id,
    title: "Puritan Literature",
    description: "Reading and analyzing key texts from Puritan New England.",
    learningObjectives: [
      "Analyze Puritan themes of covenant and providence",
      "Close read Bradford's 'Of Plymouth Plantation'",
      "Identify rhetorical devices in colonial texts",
    ],
    vocabulary: [
      "providence",
      "covenant",
      "typology",
      "jeremiad",
      "predestination",
    ],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.1", "CCSS.ELA-LITERACY.RL.9-10.4"],
    tags: ["Puritan", "Bradford", "Close Reading"],
    frameworkFields: {},
    order: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  };

  // Module 2: Native American Voices
  const mod2: Module = {
    id: nextModuleId++,
    unitId: unit1.id,
    courseId: course1.id,
    title: "Native American Voices",
    description: "Examining oral traditions and written narratives.",
    learningObjectives: [
      "Identify elements of oral tradition",
      "Compare narrative perspectives across cultures",
    ],
    vocabulary: ["oral tradition", "myth", "trickster figure", "narrative"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.6"],
    tags: ["Native American", "Oral Tradition"],
    frameworkFields: {},
    order: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  };

  // Module 3: Transcendentalism
  const mod3: Module = {
    id: nextModuleId++,
    unitId: unit2.id,
    courseId: course1.id,
    title: "Transcendentalism",
    description:
      "Emerson, Thoreau, and the philosophy of self-reliance and nature.",
    learningObjectives: [
      "Define transcendentalist ideals",
      "Analyze 'Self-Reliance' and 'Walden' excerpts",
      "Connect transcendentalism to modern individualism",
    ],
    vocabulary: ["self-reliance", "oversoul", "civil disobedience", "nature"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.2", "CCSS.ELA-LITERACY.W.9-10.1"],
    tags: ["Emerson", "Thoreau", "Transcendentalism"],
    frameworkFields: {},
    order: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  };
  moduleStore = [mod1, mod2, mod3];
  _lessonStore = moduleStore;

  // Assignment 1: Bradford Essay
  const assign1: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod1.id,
    courseId: course1.id,
    title: "Bradford Essay",
    description: "Argumentative essay analyzing colonial identity in Bradford.",
    instructions:
      "Write a 4-5 paragraph essay analyzing how William Bradford uses narrative perspective to construct colonial identity. Use at least three specific textual examples and address the question: How does Bradford's Puritan worldview shape his account of events?",
    points: 100,
    assignmentType: "writing",
    dueDate: daysFromNow(14),
    standards: ["CCSS.ELA-LITERACY.W.9-10.1", "CCSS.ELA-LITERACY.RL.9-10.1"],
    tags: ["Essay", "Bradford", "Argumentative"],
    rubric: {
      levels: [
        { name: "Exemplary", points: 4 },
        { name: "Proficient", points: 3 },
        { name: "Developing", points: 2 },
        { name: "Beginning", points: 1 },
      ],
      criteria: [
        {
          id: "thesis",
          name: "Thesis",
          descriptions: {
            Exemplary:
              "Clear, arguable thesis that responds precisely to the prompt.",
            Proficient: "Clear thesis present but may be overly broad.",
            Developing: "Thesis is vague or does not address the prompt fully.",
            Beginning: "No discernible thesis.",
          },
        },
        {
          id: "evidence",
          name: "Evidence",
          descriptions: {
            Exemplary:
              "Three or more well-chosen quotes with insightful analysis.",
            Proficient: "Two or more quotes, analysis present but uneven.",
            Developing: "Quotes present but analysis is minimal.",
            Beginning: "No textual evidence or misquoted.",
          },
        },
      ],
    },
    frameworkFields: {},
    lessonId: mod1.id,
    pointsPossible: 100,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  };

  // Assignment 2: Reading Response
  const assign2: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod2.id,
    courseId: course1.id,
    title: "Reading Response",
    description: "Short formative response to assigned readings.",
    instructions:
      "In 150-200 words, respond to the following: What elements of oral tradition do you notice in the text, and how do they affect your reading experience?",
    points: 20,
    assignmentType: "formative",
    dueDate: daysFromNow(7),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.6"],
    tags: ["Formative", "Reading Response"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod2.id,
    pointsPossible: 20,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  // Assignment 3: Nature Journal
  const assign3: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod3.id,
    courseId: course1.id,
    title: "Nature Journal",
    description:
      "Two-week nature journal inspired by Thoreau's Walden practice.",
    instructions:
      "Over the next two weeks, keep a nature journal with at least 5 entries. Each entry should include observation, reflection, and connection to a transcendentalist idea from our readings. Final journal submitted with a 1-page reflection essay.",
    points: 75,
    assignmentType: "project",
    dueDate: daysFromNow(21),
    standards: ["CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Thoreau", "Project", "Nature"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod3.id,
    pointsPossible: 75,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  // Assignment 4: Weekly Reading
  const assign4: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod3.id,
    courseId: course1.id,
    title: "Weekly Reading",
    description: "Assigned reading for the week.",
    instructions:
      "Complete assigned Emerson and Thoreau readings. Annotate for key transcendentalist ideas.",
    points: 10,
    assignmentType: "homework",
    dueDate: daysFromNow(5),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.1"],
    tags: ["Homework", "Reading"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod3.id,
    pointsPossible: 10,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };
  assignmentStore = [assign1, assign2, assign3, assign4];

  // Assessment 1: Colonial Unit Quiz
  const assess1: Assessment = {
    id: nextAssessmentId++,
    moduleId: mod1.id,
    courseId: course1.id,
    title: "Colonial Unit Quiz",
    description: "Short quiz covering Puritan literature and key terms.",
    assessmentType: "Quiz",
    items: [
      "Identify the author of 'Of Plymouth Plantation'",
      "Define 'covenant theology' and explain its significance",
      "Analyze a short passage for rhetorical devices",
      "Explain the Puritan concept of providence with an example",
      "Short answer: How did Puritan beliefs shape colonial writing?",
    ],
    scoringModel: "points",
    totalPoints: 50,
    difficulty: "medium",
    dueDate: daysFromNow(10),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.1", "CCSS.ELA-LITERACY.RL.9-10.4"],
    tags: ["Quiz", "Colonial", "Formative"],
    frameworkFields: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  };

  // Assessment 2: Unit 2 Exam
  const assess2: Assessment = {
    id: nextAssessmentId++,
    moduleId: mod3.id,
    courseId: course1.id,
    title: "Unit 2 Exam",
    description: "Comprehensive end-of-unit exam on Romantic Literature.",
    assessmentType: "Exam",
    items: [
      "Multiple choice: Transcendentalist key concepts (20 items)",
      "Short answer: Compare Emerson and Thoreau (2 questions)",
      "Essay: Analyze how transcendentalist ideals challenge social norms",
    ],
    scoringModel: "rubric",
    totalPoints: 100,
    difficulty: "hard",
    dueDate: daysFromNow(35),
    standards: [
      "CCSS.ELA-LITERACY.RL.9-10.2",
      "CCSS.ELA-LITERACY.W.9-10.1",
      "CCSS.ELA-LITERACY.RL.9-10.3",
    ],
    tags: ["Exam", "Summative", "Romanticism"],
    frameworkFields: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };
  assessmentStore = [assess1, assess2];

  // ── Additional units, modules, assignments, and assessments ─────────────

  // Unit 3: Identity & Coming of Age
  const unit3: Unit = {
    id: nextUnitId++,
    courseId: course1.id,
    title: "Identity & Coming of Age",
    description:
      "Exploring how authors use narrative to examine the formation of identity through adolescence and cultural experience.",
    essentialQuestion: "How do our experiences shape who we become?",
    durationValue: 4,
    durationUnit: "weeks",
    standards: ["CCSS.ELA-LITERACY.RL.9-10.3", "CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Identity", "Coming of Age", "Narrative"],
    frameworkFields: {},
    order: 3,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  };

  // Unit 4: Power & Resistance
  const unit4: Unit = {
    id: nextUnitId++,
    courseId: course1.id,
    title: "Power & Resistance",
    description:
      "Analyzing texts that examine power structures and how individuals and communities resist oppression.",
    essentialQuestion: "What does it mean to resist?",
    durationValue: 3,
    durationUnit: "weeks",
    standards: ["CCSS.ELA-LITERACY.RL.9-10.6", "CCSS.ELA-LITERACY.W.9-10.1"],
    tags: ["Power", "Resistance", "Social Justice"],
    frameworkFields: {},
    order: 4,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  };

  unitStore.push(unit3, unit4);

  // Modules for Unit 3
  const mod4: Module = {
    id: nextModuleId++,
    unitId: unit3.id,
    courseId: course1.id,
    title: "The Outsider Narrative",
    description:
      "Texts featuring protagonists who feel alienated from society.",
    learningObjectives: [
      "Identify characteristics of the outsider archetype",
      "Analyze how setting reinforces themes of alienation",
      "Compare narrative voice across two texts",
    ],
    vocabulary: ["alienation", "archetype", "unreliable narrator", "motif"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.3"],
    tags: ["Outsider", "Archetype", "Narrative Voice"],
    frameworkFields: {},
    order: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 28,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
  };

  const mod5: Module = {
    id: nextModuleId++,
    unitId: unit3.id,
    courseId: course1.id,
    title: "Cultural Identity & Language",
    description:
      "How language shapes and reflects cultural identity in literary texts.",
    learningObjectives: [
      "Analyze code-switching as a literary device",
      "Evaluate how authors use dialect to convey character",
      "Write a personal narrative exploring cultural identity",
    ],
    vocabulary: ["dialect", "code-switching", "bilingualism", "vernacular"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.4", "CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Culture", "Language", "Identity"],
    frameworkFields: {},
    order: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  };

  const mod6: Module = {
    id: nextModuleId++,
    unitId: unit3.id,
    courseId: course1.id,
    title: "Rites of Passage",
    description: "Examining coming-of-age rituals and transformative moments.",
    learningObjectives: [
      "Define rite of passage in literary and cultural contexts",
      "Trace a protagonist's transformation across a narrative arc",
      "Compose a reflective essay on personal growth",
    ],
    vocabulary: ["bildungsroman", "epiphany", "initiation", "transformation"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.2", "CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Bildungsroman", "Coming of Age", "Reflection"],
    frameworkFields: {},
    order: 3,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  };

  // Modules for Unit 4
  const mod7: Module = {
    id: nextModuleId++,
    unitId: unit4.id,
    courseId: course1.id,
    title: "Voices of Protest",
    description:
      "Reading protest literature from the civil rights era and beyond.",
    learningObjectives: [
      "Analyze rhetorical strategies in protest speeches",
      "Evaluate the effectiveness of King's 'Letter from Birmingham Jail'",
      "Craft a persuasive letter addressing a contemporary issue",
    ],
    vocabulary: ["rhetoric", "pathos", "ethos", "logos", "anaphora"],
    standards: ["CCSS.ELA-LITERACY.RI.9-10.6", "CCSS.ELA-LITERACY.W.9-10.1"],
    tags: ["Civil Rights", "Rhetoric", "Protest"],
    frameworkFields: {},
    order: 1,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  };

  const mod8: Module = {
    id: nextModuleId++,
    unitId: unit4.id,
    courseId: course1.id,
    title: "Dystopia & Social Critique",
    description:
      "How dystopian fiction serves as a vehicle for social and political commentary.",
    learningObjectives: [
      "Identify dystopian conventions in fiction",
      "Analyze how authors critique real-world power structures",
      "Write a short dystopian narrative",
    ],
    vocabulary: ["dystopia", "utopia", "allegory", "totalitarianism", "satire"],
    standards: ["CCSS.ELA-LITERACY.RL.9-10.6", "CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Dystopia", "Social Critique", "Allegory"],
    frameworkFields: {},
    order: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  moduleStore.push(mod4, mod5, mod6, mod7, mod8);
  _lessonStore = moduleStore;

  // Assignments for new modules
  const assign5: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod4.id,
    courseId: course1.id,
    title: "Outsider Character Analysis",
    description:
      "Analytical essay examining the outsider protagonist in an assigned novel.",
    instructions:
      "In a 4-5 paragraph essay, analyze how the author develops the outsider protagonist. Discuss at least two literary devices used to convey alienation. Support all claims with textual evidence.",
    points: 100,
    assignmentType: "writing",
    dueDate: daysFromNow(-5),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.3"],
    tags: ["Essay", "Character Analysis"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod4.id,
    pointsPossible: 100,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 26,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  };

  const assign6: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod5.id,
    courseId: course1.id,
    title: "Personal Narrative: Cultural Identity",
    description:
      "Students write a personal narrative exploring a moment of cultural identity.",
    instructions:
      "Write a 2-3 page personal narrative about a time when your cultural identity played a significant role in an experience. Incorporate specific sensory details and reflection on what the experience taught you about yourself.",
    points: 80,
    assignmentType: "writing",
    dueDate: daysFromNow(3),
    standards: ["CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Personal Narrative", "Culture"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod5.id,
    pointsPossible: 80,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  };

  const assign7: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod6.id,
    courseId: course1.id,
    title: "Coming-of-Age Reflection Essay",
    description:
      "Reflective essay connecting a rite of passage in the text to a personal experience.",
    instructions:
      "Identify a key rite-of-passage moment in the novel and write a 3-4 paragraph reflective essay. In the first half, analyze the character's transformation. In the second half, connect this transformation to your own experience of growth.",
    points: 75,
    assignmentType: "writing",
    dueDate: daysFromNow(12),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.2", "CCSS.ELA-LITERACY.W.9-10.3"],
    tags: ["Reflection", "Coming of Age"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod6.id,
    pointsPossible: 75,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  const assign8: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod7.id,
    courseId: course1.id,
    title: "Persuasive Letter",
    description:
      "Students craft a persuasive letter modeled on King's 'Letter from Birmingham Jail'.",
    instructions:
      "Choose a contemporary injustice or issue you care about. Write a persuasive letter of 2-3 pages addressed to a specific audience. Incorporate at least two of the three rhetorical appeals (ethos, pathos, logos). Include evidence and a call to action.",
    points: 100,
    assignmentType: "writing",
    dueDate: daysFromNow(18),
    standards: ["CCSS.ELA-LITERACY.RI.9-10.6", "CCSS.ELA-LITERACY.W.9-10.1"],
    tags: ["Persuasion", "Rhetoric", "Letter"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod7.id,
    pointsPossible: 100,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  const assign9: Assignment = {
    id: nextAssignmentId++,
    moduleId: mod8.id,
    courseId: course1.id,
    title: "Dystopian Short Story",
    description:
      "Students write an original short dystopian story that critiques a real-world power structure.",
    instructions:
      "Write a 2-3 page original dystopian short story. Your story must include at least one dystopian convention (surveillance, oppressive government, controlled information), a protagonist who challenges the system, and an implicit critique of a real-world issue. Include a brief author's note explaining your social commentary.",
    points: 90,
    assignmentType: "project",
    dueDate: daysFromNow(25),
    standards: ["CCSS.ELA-LITERACY.W.9-10.3", "CCSS.ELA-LITERACY.RL.9-10.6"],
    tags: ["Creative Writing", "Dystopia", "Project"],
    rubric: null,
    frameworkFields: {},
    lessonId: mod8.id,
    pointsPossible: 90,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  assignmentStore.push(assign5, assign6, assign7, assign8, assign9);

  // Assessments for new modules
  const assess3: Assessment = {
    id: nextAssessmentId++,
    moduleId: mod3.id,
    courseId: course1.id,
    title: "Identity Unit Exam",
    description:
      "End-of-unit exam covering themes of identity, cultural language, and coming of age.",
    assessmentType: "Exam",
    items: [
      "Multiple choice: Literary terms and devices (15 items)",
      "Short answer: Explain how dialect functions in a given passage (2 questions)",
      "Extended response: How does the protagonist's cultural identity shape the narrative?",
    ],
    scoringModel: "rubric",
    totalPoints: 100,
    difficulty: "medium",
    dueDate: daysFromNow(20),
    standards: ["CCSS.ELA-LITERACY.RL.9-10.3", "CCSS.ELA-LITERACY.RL.9-10.4"],
    tags: ["Exam", "Identity", "Summative"],
    frameworkFields: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  const assess4: Assessment = {
    id: nextAssessmentId++,
    moduleId: mod7.id,
    courseId: course1.id,
    title: "Rhetoric & Resistance Quiz",
    description:
      "Short assessment on rhetorical devices and protest literature.",
    assessmentType: "Quiz",
    items: [
      "Identify the rhetorical appeal in each excerpt (ethos, pathos, logos)",
      "Explain how King uses anaphora in the Letter from Birmingham Jail",
      "Short response: What makes protest writing effective?",
    ],
    scoringModel: "points",
    totalPoints: 40,
    difficulty: "medium",
    dueDate: daysFromNow(8),
    standards: ["CCSS.ELA-LITERACY.RI.9-10.6"],
    tags: ["Quiz", "Rhetoric", "Formative"],
    frameworkFields: {},
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  };

  assessmentStore.push(assess3, assess4);

  // ── Seed gradebook data ────────────────────────────────────────────────────
  // Only seed if no gradebook data exists
  if (!localStorage.getItem("edunite_gradebook")) {
    const gradeData: Record<
      string,
      Record<string, Record<string, number | null>>
    > = {
      "1": {
        // course id 1 = English 10
        S001: {
          "assign-1": 88,
          "assign-2": 92,
          "assign-3": 76,
          "assign-4": 95,
          "assess-1": 82,
          "assess-2": 89,
        },
        S002: {
          "assign-1": 72,
          "assign-2": 68,
          "assign-3": 80,
          "assign-4": 85,
          "assess-1": 70,
          "assess-2": 74,
        },
        S003: {
          "assign-1": 95,
          "assign-2": 98,
          "assign-3": 91,
          "assign-4": 100,
          "assess-1": 94,
          "assess-2": 97,
        },
        S004: {
          "assign-1": 60,
          "assign-2": 55,
          "assign-3": 62,
          "assign-4": 70,
          "assess-1": 58,
          "assess-2": 65,
        },
        S005: {
          "assign-1": 84,
          "assign-2": 87,
          "assign-3": 79,
          "assign-4": 90,
          "assess-1": 83,
          "assess-2": 86,
        },
        S006: {
          "assign-1": 91,
          "assign-2": 94,
          "assign-3": 88,
          "assign-4": 92,
          "assess-1": 90,
          "assess-2": 93,
        },
        S007: {
          "assign-1": 78,
          "assign-2": 74,
          "assign-3": 82,
          "assign-4": 80,
          "assess-1": 76,
          "assess-2": 79,
        },
        S008: {
          "assign-1": 65,
          "assign-2": 70,
          "assign-3": 68,
          "assign-4": 72,
          "assess-1": 63,
          "assess-2": 67,
        },
        S009: {
          "assign-1": 87,
          "assign-2": 89,
          "assign-3": 85,
          "assign-4": 91,
          "assess-1": 88,
          "assess-2": 90,
        },
        S010: {
          "assign-1": 93,
          "assign-2": 91,
          "assign-3": 95,
          "assign-4": 98,
          "assess-1": 92,
          "assess-2": 94,
        },
        S011: {
          "assign-1": 55,
          "assign-2": 60,
          "assign-3": 52,
          "assign-4": 65,
          "assess-1": 54,
          "assess-2": 58,
        },
        S012: {
          "assign-1": 80,
          "assign-2": 83,
          "assign-3": 77,
          "assign-4": 85,
          "assess-1": 79,
          "assess-2": 82,
        },
        S013: {
          "assign-1": 74,
          "assign-2": 78,
          "assign-3": 72,
          "assign-4": 80,
          "assess-1": 73,
          "assess-2": 76,
        },
        S014: {
          "assign-1": 96,
          "assign-2": 99,
          "assign-3": 94,
          "assign-4": 100,
          "assess-1": 95,
          "assess-2": 98,
        },
        S015: {
          "assign-1": 69,
          "assign-2": 72,
          "assign-3": 66,
          "assign-4": 74,
          "assess-1": 68,
          "assess-2": 71,
        },
        S016: {
          "assign-1": 82,
          "assign-2": 80,
          "assign-3": 84,
          "assign-4": 88,
          "assess-1": 81,
          "assess-2": 83,
        },
        S017: {
          "assign-1": 77,
          "assign-2": 73,
          "assign-3": 79,
          "assign-4": 82,
          "assess-1": 75,
          "assess-2": 78,
        },
        S018: {
          "assign-1": 88,
          "assign-2": 90,
          "assign-3": 86,
          "assign-4": 92,
          "assess-1": 87,
          "assess-2": 89,
        },
      },
    };
    try {
      localStorage.setItem("edunite_gradebook", JSON.stringify(gradeData));
    } catch {
      /* ignore quota errors */
    }
  }

  _nextLessonId = nextModuleId;
}

export function useGetCourses() {
  initSeedData();
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => [...courseStore],
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Aliases
export const useCourses = useGetCourses;

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      subject: string;
      gradeLevel?: string;
      gradeBand?: string;
      description: string;
      framework?: CurriculumFramework;
    }): Promise<Course> => {
      const course: Course = {
        id: nextCourseId++,
        title: params.title,
        subject: params.subject,
        gradeBand: params.gradeBand ?? params.gradeLevel ?? "9-12",
        gradeLevel: params.gradeLevel,
        description: params.description,
        framework: params.framework ?? "ims",
        frameworkFields: {},
        standards: [],
        tags: [],
        draftStatus: "draft",
        version: 1,
        versionHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      courseStore = [...courseStore, course];
      return course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: number;
      title?: string;
      description?: string;
      subject?: string;
      gradeLevel?: string;
      gradeBand?: string;
      framework?: CurriculumFramework;
      frameworkFields?: FrameworkFields;
      standards?: string[];
      tags?: string[];
      draftStatus?: "draft" | "published";
    }): Promise<Course> => {
      courseStore = courseStore.map((c) =>
        c.id === params.id ? { ...c, ...params, updatedAt: Date.now() } : c,
      );
      return courseStore.find((c) => c.id === params.id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: number): Promise<Course> => {
      courseStore = courseStore.map((c) => {
        if (c.id !== courseId) return c;
        const newVersion = c.version + 1;
        return {
          ...c,
          draftStatus: "published",
          version: newVersion,
          versionHistory: [
            ...c.versionHistory,
            {
              version: newVersion,
              savedAt: Date.now(),
              snapshot: JSON.stringify(c),
            },
          ],
          updatedAt: Date.now(),
        };
      });
      return courseStore.find((c) => c.id === courseId)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course published successfully");
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: number): Promise<void> => {
      courseStore = courseStore.filter((c) => c.id !== courseId);
      const removedUnitIds = unitStore
        .filter((u) => u.courseId === courseId)
        .map((u) => u.id);
      unitStore = unitStore.filter((u) => u.courseId !== courseId);
      const removedModuleIds = moduleStore
        .filter((m) => !removedUnitIds.includes(m.unitId))
        .map((m) => m.id);
      moduleStore = moduleStore.filter(
        (m) => !removedUnitIds.includes(m.unitId),
      );
      _lessonStore = moduleStore;
      assignmentStore = assignmentStore.filter(
        (a) => !removedModuleIds.includes(a.moduleId ?? a.lessonId ?? 0),
      );
      assessmentStore = assessmentStore.filter((a) => a.courseId !== courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useGetUnits(courseId?: number) {
  initSeedData();
  return useQuery<Unit[]>({
    queryKey: ["units", courseId],
    queryFn: async () =>
      unitStore
        .filter((u) => courseId === undefined || u.courseId === courseId)
        .sort((a, b) => a.order - b.order),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Alias
export const useUnits = useGetUnits;

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      courseId: number;
      title: string;
      description: string;
      order?: number;
      essentialQuestion?: string;
      durationValue?: number;
      durationUnit?: "days" | "weeks";
    }): Promise<Unit> => {
      const unit: Unit = {
        id: nextUnitId++,
        courseId: params.courseId,
        title: params.title,
        description: params.description,
        essentialQuestion: params.essentialQuestion ?? "",
        durationValue: params.durationValue ?? 1,
        durationUnit: params.durationUnit ?? "weeks",
        standards: [],
        tags: [],
        frameworkFields: {},
        order:
          params.order ??
          unitStore.filter((u) => u.courseId === params.courseId).length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      unitStore = [...unitStore, unit];
      return unit;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["units", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: number;
      unitId?: number;
      courseId: number;
      title?: string;
      description?: string;
      order?: number;
      essentialQuestion?: string;
      durationValue?: number;
      durationUnit?: "days" | "weeks";
      standards?: string[];
      tags?: string[];
      frameworkFields?: FrameworkFields;
    }): Promise<Unit> => {
      const id = params.unitId ?? params.id!;
      unitStore = unitStore.map((u) =>
        u.id === id ? { ...u, ...params, id, updatedAt: Date.now() } : u,
      );
      return unitStore.find((u) => u.id === id)!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["units", variables.courseId],
      });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      unitId: number;
      courseId: number;
    }): Promise<void> => {
      unitStore = unitStore.filter((u) => u.id !== params.unitId);
      const removedModuleIds = moduleStore
        .filter((m) => m.unitId === params.unitId)
        .map((m) => m.id);
      moduleStore = moduleStore.filter((m) => m.unitId !== params.unitId);
      _lessonStore = moduleStore;
      assignmentStore = assignmentStore.filter(
        (a) => !removedModuleIds.includes(a.moduleId ?? a.lessonId ?? 0),
      );
      assessmentStore = assessmentStore.filter(
        (a) => !removedModuleIds.includes(a.moduleId),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["units", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useGetLessons(unitId?: number) {
  initSeedData();
  return useQuery<Module[]>({
    queryKey: ["lessons", unitId],
    queryFn: async () =>
      moduleStore
        .filter((m) => unitId === undefined || m.unitId === unitId)
        .sort((a, b) => a.order - b.order),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useGetModules(unitId?: number) {
  initSeedData();
  return useQuery<Module[]>({
    queryKey: ["modules", unitId],
    queryFn: async () =>
      moduleStore
        .filter((m) => unitId === undefined || m.unitId === unitId)
        .sort((a, b) => a.order - b.order),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Alias
export const useLessons = useGetLessons;

export function useCreateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      unitId: number;
      courseId?: number;
      title: string;
      description: string;
      order?: number;
      standards?: string[];
      duration?: number;
    }): Promise<Module> => {
      const mod: Module = {
        id: nextModuleId++,
        unitId: params.unitId,
        courseId: params.courseId ?? 0,
        title: params.title,
        description: params.description,
        learningObjectives: [],
        vocabulary: [],
        standards: params.standards ?? [],
        tags: [],
        frameworkFields: {},
        order:
          params.order ??
          moduleStore.filter((m) => m.unitId === params.unitId).length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      moduleStore = [...moduleStore, mod];
      _lessonStore = moduleStore;
      _nextLessonId = nextModuleId;
      return mod;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      unitId: number;
      courseId: number;
      title: string;
      description?: string;
    }): Promise<Module> => {
      const mod: Module = {
        id: nextModuleId++,
        unitId: params.unitId,
        courseId: params.courseId,
        title: params.title,
        description: params.description ?? "",
        learningObjectives: [],
        vocabulary: [],
        standards: [],
        tags: [],
        frameworkFields: {},
        order: moduleStore.filter((m) => m.unitId === params.unitId).length + 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      moduleStore = [...moduleStore, mod];
      _lessonStore = moduleStore;
      _nextLessonId = nextModuleId;
      return mod;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: number;
      lessonId?: number;
      unitId: number;
      courseId?: number;
      title?: string;
      description?: string;
      order?: number;
      standards?: string[];
      tags?: string[];
      learningObjectives?: string[];
      vocabulary?: string[];
      frameworkFields?: FrameworkFields;
      duration?: number;
    }): Promise<Module> => {
      const id = params.lessonId ?? params.id!;
      moduleStore = moduleStore.map((m) =>
        m.id === id ? { ...m, ...params, id, updatedAt: Date.now() } : m,
      );
      _lessonStore = moduleStore;
      return moduleStore.find((m) => m.id === id)!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: number;
      unitId: number;
      courseId?: number;
      title?: string;
      description?: string;
      learningObjectives?: string[];
      vocabulary?: string[];
      standards?: string[];
      tags?: string[];
      frameworkFields?: FrameworkFields;
      order?: number;
    }): Promise<Module> => {
      moduleStore = moduleStore.map((m) =>
        m.id === params.id ? { ...m, ...params, updatedAt: Date.now() } : m,
      );
      _lessonStore = moduleStore;
      return moduleStore.find((m) => m.id === params.id)!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      lessonId: number;
      unitId: number;
    }): Promise<void> => {
      moduleStore = moduleStore.filter((m) => m.id !== params.lessonId);
      _lessonStore = moduleStore;
      assignmentStore = assignmentStore.filter(
        (a) => (a.moduleId ?? a.lessonId) !== params.lessonId,
      );
      assessmentStore = assessmentStore.filter(
        (a) => a.moduleId !== params.lessonId,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      moduleId: number;
      unitId: number;
    }): Promise<void> => {
      moduleStore = moduleStore.filter((m) => m.id !== params.moduleId);
      _lessonStore = moduleStore;
      assignmentStore = assignmentStore.filter(
        (a) => (a.moduleId ?? a.lessonId) !== params.moduleId,
      );
      assessmentStore = assessmentStore.filter(
        (a) => a.moduleId !== params.moduleId,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["modules", variables.unitId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.unitId],
      });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useGetAssignments(moduleId?: number) {
  initSeedData();
  return useQuery<Assignment[]>({
    queryKey: ["assignments", moduleId],
    queryFn: async () =>
      assignmentStore.filter(
        (a) =>
          moduleId === undefined ||
          a.moduleId === moduleId ||
          a.lessonId === moduleId,
      ),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// Alias used by AssignmentsSection
export const useAssignments = useGetAssignments;

export function useAllAssignments() {
  initSeedData();
  return useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: async () => [...assignmentStore],
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      moduleId?: number;
      lessonId?: number;
      courseId?: number;
      title: string;
      description?: string;
      instructions?: string;
      dueDate: string;
      points?: number;
      pointsPossible?: number;
      assignmentType: AssignmentType;
      standards?: string[];
      tags?: string[];
      rubric?: Assignment["rubric"];
    }): Promise<Assignment> => {
      const modId = params.moduleId ?? params.lessonId ?? 0;
      const assignment: Assignment = {
        id: nextAssignmentId++,
        moduleId: modId,
        lessonId: modId,
        courseId: params.courseId ?? 0,
        title: params.title,
        description: params.description ?? "",
        instructions: params.instructions ?? "",
        points: params.points ?? params.pointsPossible ?? 100,
        pointsPossible: params.points ?? params.pointsPossible ?? 100,
        assignmentType: params.assignmentType,
        dueDate: params.dueDate,
        standards: params.standards ?? [],
        tags: params.tags ?? [],
        rubric: params.rubric ?? null,
        frameworkFields: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      assignmentStore = [...assignmentStore, assignment];
      return assignment;
    },
    onSuccess: (_data, variables) => {
      const modId = variables.moduleId ?? variables.lessonId ?? 0;
      queryClient.invalidateQueries({ queryKey: ["assignments", modId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: number;
      assignmentId?: number;
      moduleId?: number;
      lessonId?: number;
      courseId?: number;
      title?: string;
      description?: string;
      instructions?: string;
      dueDate?: string;
      points?: number;
      pointsPossible?: number;
      assignmentType?: AssignmentType;
      standards?: string[];
      tags?: string[];
      rubric?: Assignment["rubric"];
      frameworkFields?: FrameworkFields;
    }): Promise<Assignment> => {
      const id = params.assignmentId ?? params.id!;
      assignmentStore = assignmentStore.map((a) =>
        a.id === id
          ? {
              ...a,
              ...params,
              id,
              pointsPossible:
                params.points ?? params.pointsPossible ?? a.pointsPossible,
              updatedAt: Date.now(),
            }
          : a,
      );
      return assignmentStore.find((a) => a.id === id)!;
    },
    onSuccess: (_data, variables) => {
      const modId = variables.moduleId ?? variables.lessonId ?? 0;
      queryClient.invalidateQueries({ queryKey: ["assignments", modId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      assignmentId?: number;
      id?: number;
      moduleId?: number;
      lessonId?: number;
    }): Promise<void> => {
      const id = params.assignmentId ?? params.id!;
      assignmentStore = assignmentStore.filter((a) => a.id !== id);
    },
    onSuccess: (_data, variables) => {
      const modId = variables.moduleId ?? variables.lessonId ?? 0;
      queryClient.invalidateQueries({ queryKey: ["assignments", modId] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

export function useDuplicateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: number): Promise<Assignment> => {
      const original = assignmentStore.find((a) => a.id === assignmentId);
      if (!original) throw new Error("Assignment not found");
      const copy: Assignment = {
        ...original,
        id: nextAssignmentId++,
        title: `Copy of ${original.title}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      assignmentStore = [...assignmentStore, copy];
      return copy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}

// ─── Assessment Hooks ─────────────────────────────────────────────────────────

export function useGetAssessments(moduleId?: number) {
  initSeedData();
  return useQuery<Assessment[]>({
    queryKey: ["assessments", moduleId],
    queryFn: async () =>
      assessmentStore.filter(
        (a) => moduleId === undefined || a.moduleId === moduleId,
      ),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useAllAssessments() {
  initSeedData();
  return useQuery<Assessment[]>({
    queryKey: ["assessments"],
    queryFn: async () => [...assessmentStore],
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      moduleId: number;
      courseId: number;
      title: string;
      description?: string;
      assessmentType?: string;
      difficulty?: Difficulty;
      totalPoints?: number;
      scoringModel?: ScoringModel;
      dueDate?: string;
      standards?: string[];
      tags?: string[];
      items?: string[];
    }): Promise<Assessment> => {
      const assessment: Assessment = {
        id: nextAssessmentId++,
        moduleId: params.moduleId,
        courseId: params.courseId,
        title: params.title,
        description: params.description ?? "",
        assessmentType: params.assessmentType ?? "Quiz",
        items: params.items ?? [],
        scoringModel: params.scoringModel ?? "points",
        totalPoints: params.totalPoints ?? 100,
        difficulty: params.difficulty ?? "medium",
        dueDate: params.dueDate ?? "",
        standards: params.standards ?? [],
        tags: params.tags ?? [],
        frameworkFields: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      assessmentStore = [...assessmentStore, assessment];
      return assessment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assessments", variables.moduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: number;
      moduleId: number;
      title?: string;
      description?: string;
      assessmentType?: string;
      items?: string[];
      scoringModel?: ScoringModel;
      totalPoints?: number;
      difficulty?: Difficulty;
      dueDate?: string;
      standards?: string[];
      tags?: string[];
      frameworkFields?: FrameworkFields;
    }): Promise<Assessment> => {
      assessmentStore = assessmentStore.map((a) =>
        a.id === params.id ? { ...a, ...params, updatedAt: Date.now() } : a,
      );
      return assessmentStore.find((a) => a.id === params.id)!;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assessments", variables.moduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      assessmentId: number;
      moduleId: number;
    }): Promise<void> => {
      assessmentStore = assessmentStore.filter(
        (a) => a.id !== params.assessmentId,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["assessments", variables.moduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
