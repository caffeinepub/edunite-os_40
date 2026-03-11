import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import React from "react";
import type { Student } from "../../backend";
import { SENPlanType } from "../../backend";

interface OverviewTabProps {
  student: Student;
}

export function OverviewTab({ student }: OverviewTabProps) {
  const _fullName = `${student.givenNames} ${student.familyName}`;
  const hasPreferredName =
    student.preferredName && student.preferredName.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Name Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Name Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Given Name(s)
              </p>
              <p className="text-foreground mt-0.5">{student.givenNames}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Family Name
              </p>
              <p className="text-foreground mt-0.5">{student.familyName}</p>
            </div>
            {hasPreferredName && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Preferred Name
                </p>
                <p className="text-foreground mt-0.5">
                  {student.preferredName}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accommodations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Accommodations</CardTitle>
        </CardHeader>
        <CardContent>
          {student.accommodations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No accommodations on record.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {student.accommodations.map((acc) => (
                <Badge key={String(acc.id)} variant="secondary">
                  {acc.description}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEN / Support Plan Summary */}
      {student.senPlan && student.senPlan.planType !== SENPlanType.none && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Support Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Plan Type
                </p>
                <Badge variant="secondary" className="mt-0.5">
                  {student.senPlan.planType === SENPlanType.iep
                    ? "IEP"
                    : student.senPlan.planType === SENPlanType.plan504
                      ? "504 Plan"
                      : student.senPlan.planType === SENPlanType.sen
                        ? "SEN"
                        : "Other"}
                </Badge>
              </div>
              {student.senPlan.coordinator && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Coordinator
                  </p>
                  <p className="text-foreground mt-0.5">
                    {student.senPlan.coordinator}
                  </p>
                </div>
              )}
              {student.senPlan.reviewDate && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Review Date
                  </p>
                  <p className="text-foreground mt-0.5">
                    {student.senPlan.reviewDate}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergies */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          {student.allergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No allergies on record.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {student.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive">
                  {allergy}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Notes */}
      {student.medicalNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Medical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {student.medicalNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Teacher Notes */}
      {student.teacherNotes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Teacher Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {student.teacherNotes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Intervention Plans */}
      {student.interventionPlans && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Intervention Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {student.interventionPlans}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
