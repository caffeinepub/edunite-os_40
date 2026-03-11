import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { SENPlanType } from "../backend";
import CommunicationTab from "../components/studentProfile/CommunicationTab";
import DataTab from "../components/studentProfile/DataTab";
import GuardiansTab from "../components/studentProfile/GuardiansTab";
import { OverviewTab } from "../components/studentProfile/OverviewTab";
import SupportPlansTab from "../components/studentProfile/SupportPlansTab";
import { AddStudentForm } from "../components/students/AddStudentForm";
import { useDeleteStudent, useGetStudentById } from "../hooks/useQueries";

export default function StudentProfile() {
  const { studentId } = useParams({ from: "/students/$studentId" });
  const navigate = useNavigate();
  const { data: student, isLoading } = useGetStudentById(studentId);
  const deleteStudent = useDeleteStudent();
  const [editMode, setEditMode] = useState(false);

  async function handleDelete() {
    await deleteStudent.mutateAsync(studentId);
    navigate({ to: "/students" });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Student not found.
      </div>
    );
  }

  const fullName = `${student.givenNames} ${student.familyName}`;
  const hasPreferredName = !!(
    student.preferredName && student.preferredName.trim().length > 0
  );
  const displayName = hasPreferredName ? student.preferredName! : fullName;

  // Inline edit mode — replaces profile view with the form inline
  if (editMode) {
    return (
      <div className="space-y-6">
        <AddStudentForm
          editStudent={student}
          onSuccess={() => setEditMode(false)}
          onCancel={() => setEditMode(false)}
          inline
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/students" })}
        className="gap-1.5 -ml-2"
        data-ocid="student.profile.link"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold select-none flex-shrink-0">
            {student.givenNames.charAt(0).toUpperCase()}
            {student.familyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {displayName}
            </h1>
            {hasPreferredName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Legal name: {fullName}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              ID: {student.studentId} &middot;{" "}
              {student.gradeLevel === "K"
                ? "Kindergarten"
                : `Grade ${student.gradeLevel}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
            className="gap-1.5"
            data-ocid="student.profile.edit_button"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                data-ocid="student.profile.delete_button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="student.profile.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {displayName}? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="student.profile.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-ocid="student.profile.confirm_button"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-ocid="student.overview.tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="data" data-ocid="student.data.tab">
            Data
          </TabsTrigger>
          <TabsTrigger value="guardians" data-ocid="student.guardians.tab">
            Guardians
          </TabsTrigger>
          <TabsTrigger value="support" data-ocid="student.support.tab">
            Support Plans
            {student.senPlan &&
              student.senPlan.planType !== SENPlanType.none && (
                <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {student.senPlan.planType === SENPlanType.iep
                    ? "IEP"
                    : student.senPlan.planType === SENPlanType.plan504
                      ? "504"
                      : student.senPlan.planType === SENPlanType.sen
                        ? "SEN"
                        : "Plan"}
                </span>
              )}
          </TabsTrigger>
          <TabsTrigger
            value="communication"
            data-ocid="student.communication.tab"
          >
            Communication
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab student={student} />
        </TabsContent>
        <TabsContent value="data" className="mt-4">
          <DataTab student={student} />
        </TabsContent>
        <TabsContent value="guardians" className="mt-4">
          <GuardiansTab student={student} />
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <SupportPlansTab student={student} />
        </TabsContent>
        <TabsContent value="communication" className="mt-4">
          <CommunicationTab student={student} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
