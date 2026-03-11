// Full-fidelity JSON export of a course for EdUnite OS
// Preserves the complete hierarchy and all framework fields for lossless round-trip import

import type {
  Assessment,
  Assignment,
  Course,
  Module,
  Unit,
} from "./curriculumTypes";
import type { CustomFramework } from "./customFrameworks";

export interface CurriculumExportManifest {
  version: "1.0";
  exportedAt: number;
  appVersion: "EdUnite OS Class Edition";
  customFrameworkDefinitions: CustomFramework[];
}

export interface CurriculumExportData {
  manifest: CurriculumExportManifest;
  course: Course;
  units: Unit[];
  modules: Module[];
  assignments: Assignment[];
  assessments: Assessment[];
}

export function exportCourseToJson(
  course: Course,
  units: Unit[],
  modules: Module[],
  assignments: Assignment[],
  assessments: Assessment[],
  customFrameworks: CustomFramework[],
): void {
  // Only include custom frameworks referenced by this course's content
  const referencedFwIds = new Set<string>();
  const allItems = [
    course,
    ...units,
    ...modules,
    ...assignments,
    ...assessments,
  ];
  for (const item of allItems) {
    const ff = (
      item as { frameworkFields?: { custom?: { frameworkId?: string } } }
    ).frameworkFields;
    if (ff?.custom?.frameworkId) {
      referencedFwIds.add(ff.custom.frameworkId);
    }
  }
  const relevantFrameworks = customFrameworks.filter((fw) =>
    referencedFwIds.has(fw.id),
  );

  const exportData: CurriculumExportData = {
    manifest: {
      version: "1.0",
      exportedAt: Date.now(),
      appVersion: "EdUnite OS Class Edition",
      customFrameworkDefinitions: relevantFrameworks,
    },
    course,
    units: [...units].sort((a, b) => a.order - b.order),
    modules: [...modules].sort((a, b) => a.order - b.order),
    assignments,
    assessments,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `${course.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim()}-curriculum.json`;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Validate that a parsed object looks like a CurriculumExportData */
export function validateCurriculumExport(
  data: unknown,
): data is CurriculumExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!d.manifest || typeof d.manifest !== "object") return false;
  const manifest = d.manifest as Record<string, unknown>;
  if (manifest.version !== "1.0") return false;
  if (!d.course || typeof d.course !== "object") return false;
  const course = d.course as Record<string, unknown>;
  if (typeof course.title !== "string") return false;
  if (!Array.isArray(d.units)) return false;
  if (!Array.isArray(d.modules)) return false;
  if (!Array.isArray(d.assignments)) return false;
  if (!Array.isArray(d.assessments)) return false;
  return true;
}
