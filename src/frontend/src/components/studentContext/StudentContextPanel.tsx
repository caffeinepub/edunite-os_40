import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  AlertTriangle,
  BookOpen,
  Heart,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import React from "react";
import { BehaviorEntryType } from "../../backend";
import { useStudentContext } from "../../context/StudentContextProvider";
import {
  useBehaviorLogsByStudent,
  useGetStudentById,
} from "../../hooks/useQueries";

function formatShortDate(ts: bigint): string {
  return format(new Date(Number(ts) / 1_000_000), "MMM d");
}

export default function StudentContextPanel() {
  const { selectedStudentId, isOpen, closeStudentContext } =
    useStudentContext();
  const { data: student } = useGetStudentById(selectedStudentId ?? "");

  const studentDisplayName = student
    ? student.preferredName
      ? `${student.preferredName} ${student.familyName}`
      : `${student.givenNames} ${student.familyName}`
    : "";

  const { data: behaviorLogs = [] } =
    useBehaviorLogsByStudent(studentDisplayName);

  const recentBehavior = [...behaviorLogs]
    .sort((a, b) => Number(b.loggedAt) - Number(a.loggedAt))
    .slice(0, 5);

  if (!isOpen || !student) return null;

  const primaryGuardian =
    student.guardianContacts.find((g) => g.emergencyContact) ??
    student.guardianContacts[0];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={closeStudentContext}
        onKeyDown={(e) => e.key === "Escape" && closeStudentContext()}
        role="presentation"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 z-50 bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">
                {student.preferredName ? (
                  <>
                    {student.preferredName} {student.familyName}
                    <span className="block text-xs text-muted-foreground font-normal">
                      {student.givenNames} {student.familyName}
                    </span>
                  </>
                ) : (
                  `${student.givenNames} ${student.familyName}`
                )}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  Grade {student.gradeLevel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {student.studentId}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeStudentContext}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Accommodations */}
          {student.accommodations.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Accommodations
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {student.accommodations.map((a) => (
                  <Badge
                    key={String(a.id)}
                    variant="secondary"
                    className="text-xs"
                  >
                    {a.description}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Allergies */}
          {student.allergies.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" /> Allergies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {student.allergies.map((a) => (
                  <Badge
                    key={a}
                    variant="outline"
                    className="text-xs border-warning/40 text-warning bg-warning/5"
                  >
                    {a}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Guardian */}
          {primaryGuardian && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" /> Guardian Contact
              </h3>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  {primaryGuardian.firstName} {primaryGuardian.lastName}
                  <span className="text-xs text-muted-foreground ml-1.5">
                    ({primaryGuardian.relationship})
                  </span>
                </p>
                {primaryGuardian.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{primaryGuardian.phone}</span>
                  </div>
                )}
                {primaryGuardian.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{primaryGuardian.email}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Teacher Notes */}
          {student.teacherNotes && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Teacher Notes
              </h3>
              <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">
                {student.teacherNotes}
              </p>
            </section>
          )}

          <Separator />

          {/* Recent Behavior */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Behavior
              </h3>
            </div>

            {recentBehavior.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No behavior entries yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentBehavior.map((log) => (
                  <div
                    key={String(log.entryId)}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/30"
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 py-0 flex-shrink-0 mt-0.5 ${
                        log.entryType === BehaviorEntryType.incident
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-success/10 text-success border-success/30"
                      }`}
                    >
                      {log.entryType === BehaviorEntryType.incident
                        ? "Inc"
                        : "Praise"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {log.description.slice(0, 50)}
                        {log.description.length > 50 ? "…" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatShortDate(log.loggedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
