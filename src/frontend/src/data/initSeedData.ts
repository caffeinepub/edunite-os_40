import {
  SEED_ANNOUNCEMENTS,
  SEED_ATTENDANCE,
  SEED_ENROLLMENT,
  SEED_GRADEBOOK,
  SEED_MESSAGES,
  SEED_PARENT_CORRESPONDENCE,
  SEED_TIMETABLE,
} from "./seedData";

const SEED_VERSION_KEY = "edunite_seeded_v3";

export function initSeedData(): void {
  if (localStorage.getItem(SEED_VERSION_KEY)) return;

  try {
    // ── Gradebook ──────────────────────────────────────────────────────────────
    const existingGradebook = localStorage.getItem("edunite_gradebook");
    if (!existingGradebook) {
      localStorage.setItem("edunite_gradebook", JSON.stringify(SEED_GRADEBOOK));
    } else {
      // Merge: add new courses without overwriting existing data
      const existing = JSON.parse(existingGradebook) as Record<string, unknown>;
      const merged = { ...SEED_GRADEBOOK, ...existing };
      localStorage.setItem("edunite_gradebook", JSON.stringify(merged));
    }

    // ── Enrollment ─────────────────────────────────────────────────────────────
    const existingEnroll = localStorage.getItem("edunite_enrollment");
    if (!existingEnroll) {
      localStorage.setItem(
        "edunite_enrollment",
        JSON.stringify(SEED_ENROLLMENT),
      );
    } else {
      const existing = JSON.parse(existingEnroll) as Record<string, string[]>;
      const merged = { ...SEED_ENROLLMENT, ...existing };
      localStorage.setItem("edunite_enrollment", JSON.stringify(merged));
    }

    // ── Attendance ─────────────────────────────────────────────────────────────
    const existingAttendance = localStorage.getItem("edunite_attendance");
    if (!existingAttendance) {
      localStorage.setItem(
        "edunite_attendance",
        JSON.stringify(SEED_ATTENDANCE),
      );
    }

    // ── Timetable ──────────────────────────────────────────────────────────────
    const existingTimetable = localStorage.getItem("edunite_timetable");
    if (!existingTimetable) {
      localStorage.setItem("edunite_timetable", JSON.stringify(SEED_TIMETABLE));
    }

    // ── Announcements ──────────────────────────────────────────────────────────
    const existingAnnouncements = localStorage.getItem("edunite_announcements");
    if (!existingAnnouncements) {
      localStorage.setItem(
        "edunite_announcements",
        JSON.stringify(SEED_ANNOUNCEMENTS),
      );
    }

    // ── Sent Messages ──────────────────────────────────────────────────────────
    const existingMessages = localStorage.getItem("edunite_sent_messages");
    if (!existingMessages) {
      localStorage.setItem(
        "edunite_sent_messages",
        JSON.stringify(SEED_MESSAGES),
      );
    }

    // ── Parent Correspondence (stored per student in interventionPlans) ────────
    // We can't write directly to the ICP backend here, so we cache correspondence
    // in a dedicated localStorage key that CommunicationTab can pick up on mount
    const existingCorr = localStorage.getItem(
      "edunite_parent_correspondence_seed",
    );
    if (!existingCorr) {
      const corrMap: Record<string, string> = {};
      for (const { studentId, entries } of SEED_PARENT_CORRESPONDENCE) {
        corrMap[studentId] = JSON.stringify({
          interventions: "",
          parentCorrespondence: entries,
        });
      }
      localStorage.setItem(
        "edunite_parent_correspondence_seed",
        JSON.stringify(corrMap),
      );
    }

    // ── Mark as seeded ─────────────────────────────────────────────────────────
    localStorage.setItem(SEED_VERSION_KEY, "true");
  } catch (err) {
    console.warn("EdUnite seed data initialization failed:", err);
  }
}
