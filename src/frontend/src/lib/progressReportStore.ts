import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  GradeSummaryEntry,
  ProgressReport,
  ReportPeriod,
  ReportStatus,
} from "./progressReportTypes";

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = "edunite_progress_reports";
const NEXT_ID_KEY = "edunite_progress_reports_next_id";

function loadStore(): ProgressReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProgressReport[];
  } catch {
    // ignore
  }
  return [];
}

function saveStore(reports: ProgressReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore
  }
}

function getNextId(): number {
  try {
    const raw = localStorage.getItem(NEXT_ID_KEY);
    if (raw) return Number(raw);
  } catch {
    // ignore
  }
  return 1;
}

function bumpNextId(id: number): void {
  try {
    localStorage.setItem(NEXT_ID_KEY, String(id + 1));
  } catch {
    // ignore
  }
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

let seeded = false;

function daysAgoMs(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

function initSeedData(): void {
  if (seeded) return;
  seeded = true;
  const existing = loadStore();
  if (existing.length > 0) return; // already have data

  let nextId = getNextId();

  const seed: ProgressReport[] = [
    {
      id: nextId++,
      studentId: "emma-johnson",
      studentName: "Emma Johnson",
      gradeLevel: "10th",
      period: "Q1",
      status: "final",
      includeSections: {
        attendance: true,
        behavior: true,
        academic: true,
        standards: true,
        comments: true,
      },
      comments: {
        attendance:
          "Emma has maintained excellent attendance throughout Q1 with only two excused absences. Her punctuality is commendable and sets a positive example for her peers.",
        behavior:
          "Emma consistently demonstrates respectful behavior and a strong work ethic. She actively participates in class discussions and supports her classmates during collaborative activities.",
        academic:
          "Emma has shown impressive growth in analytical writing this quarter. Her Bradford Essay demonstrated sophisticated argument construction and nuanced textual analysis well beyond grade-level expectations.",
        standards:
          "Emma has mastered all Q1 ELA standards, showing particular strength in CCSS.ELA-LITERACY.RL.9-10.1 (citing textual evidence) and W.9-10.1 (writing arguments). She is ready for enrichment work in literary analysis.",
        general:
          "Emma is a dedicated and thoughtful student. Her curiosity and willingness to revise her work reflect a growth mindset. I encourage her to continue building on her strong foundation in the coming quarter.",
      },
      generatedAt: daysAgoMs(30),
      updatedAt: daysAgoMs(30),
    },
    {
      id: nextId++,
      studentId: "liam-chen",
      studentName: "Liam Chen",
      gradeLevel: "10th",
      period: "Q2",
      status: "draft",
      includeSections: {
        attendance: true,
        behavior: true,
        academic: true,
        standards: true,
        comments: true,
      },
      comments: {
        attendance:
          "Liam has had three unexcused absences and two tardies this quarter. A conversation with his family was scheduled to discuss the importance of consistent attendance.",
        behavior:
          "Liam is generally respectful in class. He occasionally loses focus during longer reading sessions but responds positively to redirection. No behavioral incidents on record.",
        academic:
          "Liam demonstrates strong comprehension skills and contributes thoughtful insights during Socratic seminars. His written work shows potential but inconsistent follow-through on revision cycles.",
        standards:
          "Liam has achieved proficiency on most Q2 standards. He needs continued support on CCSS.ELA-LITERACY.W.9-10.1 (constructing written arguments) — his reading comprehension consistently outpaces his writing fluency.",
        general:
          "Liam is bright and capable. With more consistent effort on written assignments and improved attendance, he has the potential to excel. I am happy to discuss strategies at our next parent conference.",
      },
      generatedAt: daysAgoMs(7),
      updatedAt: daysAgoMs(7),
    },
    {
      id: nextId++,
      studentId: "sofia-martinez",
      studentName: "Sofia Martinez",
      gradeLevel: "10th",
      period: "Semester 1",
      status: "final",
      includeSections: {
        attendance: true,
        behavior: true,
        academic: true,
        standards: true,
        comments: true,
      },
      comments: {
        attendance:
          "Sofia had perfect attendance for Semester 1 — a remarkable achievement. Her consistent presence has allowed her to build strong relationships with her peers and stay fully engaged with the curriculum.",
        behavior:
          "Sofia is an exemplary student in terms of conduct. She contributes to a positive classroom environment through her enthusiasm, empathy, and collaborative spirit. She was recognized as a peer mentor in November.",
        academic:
          "Sofia has delivered outstanding academic performance throughout the semester. Her Nature Journal was selected as a model for the department showcase. Her reading fluency and writing voice are both exceptional.",
        standards:
          "Sofia has exceeded grade-level standards across all ELA domains. She has demonstrated mastery of every Semester 1 standard and is prepared for advanced coursework. I have recommended her for AP Literature consideration.",
        general:
          "Sofia is one of the most engaged and self-directed learners I have had the privilege of teaching. Her intellectual curiosity and collaborative spirit make her a joy in the classroom. I look forward to seeing her continue to thrive.",
      },
      generatedAt: daysAgoMs(14),
      updatedAt: daysAgoMs(14),
    },
  ];

  bumpNextId(nextId - 1);
  saveStore(seed);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetReports() {
  initSeedData();
  return useQuery<ProgressReport[]>({
    queryKey: ["progressReports"],
    queryFn: async () => loadStore(),
    staleTime: 0,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      studentId: string;
      studentName: string;
      gradeLevel: string;
      period: ReportPeriod;
      customStartDate?: string;
      customEndDate?: string;
      status: ReportStatus;
      includeSections: ProgressReport["includeSections"];
    }): Promise<ProgressReport> => {
      const id = getNextId();
      bumpNextId(id);
      const report: ProgressReport = {
        id,
        studentId: params.studentId,
        studentName: params.studentName,
        gradeLevel: params.gradeLevel,
        period: params.period,
        customStartDate: params.customStartDate,
        customEndDate: params.customEndDate,
        status: params.status,
        includeSections: params.includeSections,
        comments: {
          attendance: "",
          behavior: "",
          academic: "",
          standards: "",
          general: "",
        },
        generatedAt: Date.now(),
        updatedAt: Date.now(),
      };
      const store = loadStore();
      saveStore([...store, report]);
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressReports"] });
      toast.success("Progress report created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create report: ${error.message}`);
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: number;
      status?: ReportStatus;
      comments?: Partial<ProgressReport["comments"]>;
      includeSections?: Partial<ProgressReport["includeSections"]>;
      gradeSummary?: GradeSummaryEntry[];
    }): Promise<ProgressReport> => {
      const store = loadStore();
      const updated = store.map((r) => {
        if (r.id !== params.id) return r;
        return {
          ...r,
          ...(params.status !== undefined ? { status: params.status } : {}),
          ...(params.includeSections
            ? {
                includeSections: {
                  ...r.includeSections,
                  ...params.includeSections,
                },
              }
            : {}),
          ...(params.comments
            ? { comments: { ...r.comments, ...params.comments } }
            : {}),
          ...(params.gradeSummary !== undefined
            ? { gradeSummary: params.gradeSummary }
            : {}),
          updatedAt: Date.now(),
        };
      });
      saveStore(updated);
      const result = updated.find((r) => r.id === params.id);
      if (!result) throw new Error("Report not found");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressReports"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: number): Promise<void> => {
      const store = loadStore();
      saveStore(store.filter((r) => r.id !== reportId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressReports"] });
      toast.success("Report deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });
}
