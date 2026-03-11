import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileX,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { SENGoal, SENPlan, Student } from "../../backend";
import { SENGoalStatus, SENPlanType } from "../../backend";
import { useUpdateSENPlan } from "../../hooks/useSENPlanQueries";

interface SupportPlansTabProps {
  student: Student;
}

const PLAN_TYPE_OPTIONS: { value: SENPlanType; label: string }[] = [
  { value: SENPlanType.none, label: "None" },
  { value: SENPlanType.iep, label: "IEP" },
  { value: SENPlanType.plan504, label: "504 Plan" },
  { value: SENPlanType.sen, label: "SEN" },
  { value: SENPlanType.other, label: "Other" },
];

const PREDEFINED_SERVICES = [
  "Speech Therapy",
  "Occupational Therapy",
  "Physical Therapy",
  "Reading Support",
  "Math Support",
  "Counseling",
  "Behavioral Support",
  "Assistive Technology",
  "Extended Time",
  "Resource Room",
];

function getInitialPlan(student: Student): SENPlan {
  if (student.senPlan) return student.senPlan;
  return {
    planType: SENPlanType.none,
    startDate: "",
    reviewDate: "",
    expiryDate: "",
    coordinator: "",
    services: [],
    goals: [],
    notes: "",
  };
}

function GoalStatusBadge({
  status,
  onClick,
}: {
  status: SENGoalStatus;
  onClick: () => void;
}) {
  if (status === SENGoalStatus.met) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
        title="Click to change status"
      >
        <CheckCircle2 className="h-3 w-3" />
        Met
      </button>
    );
  }
  if (status === SENGoalStatus.inProgress) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
        title="Click to change status"
      >
        <Clock className="h-3 w-3" />
        In Progress
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
      title="Click to change status"
    >
      <Circle className="h-3 w-3" />
      Not Started
    </button>
  );
}

function cycleStatus(current: SENGoalStatus): SENGoalStatus {
  if (current === SENGoalStatus.notStarted) return SENGoalStatus.inProgress;
  if (current === SENGoalStatus.inProgress) return SENGoalStatus.met;
  return SENGoalStatus.notStarted;
}

export default function SupportPlansTab({ student }: SupportPlansTabProps) {
  const [plan, setPlan] = useState<SENPlan>(() => getInitialPlan(student));
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const updateSENPlan = useUpdateSENPlan();

  function handlePlanTypeSelect(type: SENPlanType) {
    setPlan((prev) => ({ ...prev, planType: type }));
  }

  function handleFieldChange(
    field: keyof Omit<SENPlan, "goals" | "services" | "planType">,
    value: string,
  ) {
    setPlan((prev) => ({ ...prev, [field]: value }));
  }

  function handleServiceToggle(service: string, checked: boolean) {
    setPlan((prev) => ({
      ...prev,
      services: checked
        ? [...prev.services, service]
        : prev.services.filter((s) => s !== service),
    }));
  }

  function handleAddCustomService() {
    const trimmed = customServiceInput.trim();
    if (!trimmed) return;
    if (!plan.services.includes(trimmed)) {
      setPlan((prev) => ({ ...prev, services: [...prev.services, trimmed] }));
    }
    setCustomServiceInput("");
    setShowCustomServiceInput(false);
  }

  function handleRemoveCustomService(service: string) {
    // Only remove if it's a custom (not predefined) service
    setPlan((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== service),
    }));
  }

  function handleAddGoal() {
    const newGoal: SENGoal = {
      id: BigInt(Date.now()),
      description: "",
      targetDate: "",
      status: SENGoalStatus.notStarted,
    };
    setPlan((prev) => ({ ...prev, goals: [...prev.goals, newGoal] }));
  }

  function handleGoalChange(
    index: number,
    field: keyof Omit<SENGoal, "id" | "status">,
    value: string,
  ) {
    setPlan((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) =>
        i === index ? { ...g, [field]: value } : g,
      ),
    }));
  }

  function handleGoalStatusCycle(index: number) {
    setPlan((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) =>
        i === index ? { ...g, status: cycleStatus(g.status) } : g,
      ),
    }));
  }

  function handleDeleteGoal(index: number) {
    setPlan((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    await updateSENPlan.mutateAsync({
      studentId: student.studentId,
      senPlan: plan,
    });
  }

  const isNone = plan.planType === SENPlanType.none;
  const customServices = plan.services.filter(
    (s) => !PREDEFINED_SERVICES.includes(s),
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Plan Type Selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Plan Type
        </p>
        <div className="flex flex-wrap gap-2">
          {PLAN_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-ocid="support_plan.plan_type.tab"
              onClick={() => handlePlanTypeSelect(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                plan.planType === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State when None */}
      {isNone && (
        <div
          data-ocid="support_plan.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <FileX className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-base font-medium text-muted-foreground">
            No active support plan on file for this student.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Select a plan type above to create a new support plan.
          </p>
        </div>
      )}

      {/* Plan Form — only shown when type is not none */}
      {!isNone && (
        <>
          {/* Plan Details */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Plan Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="support-start-date"
                  className="text-xs font-medium"
                >
                  Start Date
                </Label>
                <Input
                  id="support-start-date"
                  type="date"
                  value={plan.startDate}
                  onChange={(e) =>
                    handleFieldChange("startDate", e.target.value)
                  }
                  data-ocid="support_plan.start_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="support-review-date"
                  className="text-xs font-medium"
                >
                  Review Date
                </Label>
                <Input
                  id="support-review-date"
                  type="date"
                  value={plan.reviewDate}
                  onChange={(e) =>
                    handleFieldChange("reviewDate", e.target.value)
                  }
                  data-ocid="support_plan.review_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="support-expiry-date"
                  className="text-xs font-medium"
                >
                  Expiry Date
                </Label>
                <Input
                  id="support-expiry-date"
                  type="date"
                  value={plan.expiryDate}
                  onChange={(e) =>
                    handleFieldChange("expiryDate", e.target.value)
                  }
                  data-ocid="support_plan.expiry_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="support-coordinator"
                  className="text-xs font-medium"
                >
                  Coordinator
                </Label>
                <Input
                  id="support-coordinator"
                  type="text"
                  placeholder="Plan coordinator or case manager"
                  value={plan.coordinator}
                  onChange={(e) =>
                    handleFieldChange("coordinator", e.target.value)
                  }
                  data-ocid="support_plan.coordinator.input"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREDEFINED_SERVICES.map((service, idx) => (
                <div
                  key={service}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    id={`service-${idx}`}
                    checked={plan.services.includes(service)}
                    onCheckedChange={(checked) =>
                      handleServiceToggle(service, checked === true)
                    }
                    data-ocid={`support_plan.services.checkbox.${idx + 1}`}
                  />
                  <Label
                    htmlFor={`service-${idx}`}
                    className="text-sm font-normal text-foreground group-hover:text-primary transition-colors cursor-pointer"
                  >
                    {service}
                  </Label>
                </div>
              ))}

              {/* Custom services */}
              {customServices.map((service) => (
                <div key={service} className="flex items-center gap-2.5">
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => handleRemoveCustomService(service)}
                  />
                  <span className="text-sm text-foreground flex-1">
                    {service}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomService(service)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove ${service}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Service */}
            <div className="mt-3">
              {showCustomServiceInput ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Custom service name..."
                    value={customServiceInput}
                    onChange={(e) => setCustomServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomService();
                      }
                      if (e.key === "Escape") {
                        setShowCustomServiceInput(false);
                        setCustomServiceInput("");
                      }
                    }}
                    className="h-8 text-sm max-w-xs"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomService}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCustomServiceInput(false);
                      setCustomServiceInput("");
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomServiceInput(true)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add custom service
                </button>
              )}
            </div>
          </div>

          {/* Goals */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Goals
            </p>

            {plan.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No goals added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {plan.goals.map((goal, idx) => (
                  <div
                    key={String(goal.id)}
                    data-ocid={`support_plan.goal.item.${idx + 1}`}
                    className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Goal description..."
                        value={goal.description}
                        onChange={(e) =>
                          handleGoalChange(idx, "description", e.target.value)
                        }
                        rows={2}
                        className="text-sm resize-none bg-background"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Target date
                          </Label>
                          <Input
                            type="date"
                            value={goal.targetDate}
                            onChange={(e) =>
                              handleGoalChange(
                                idx,
                                "targetDate",
                                e.target.value,
                              )
                            }
                            className="h-7 text-xs w-36"
                          />
                        </div>
                        <GoalStatusBadge
                          status={goal.status}
                          onClick={() => handleGoalStatusCycle(idx)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid={`support_plan.goal.delete_button.${idx + 1}`}
                      onClick={() => handleDeleteGoal(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 flex-shrink-0 mt-0.5"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddGoal}
              className="mt-3 gap-1.5 h-8 text-xs"
              data-ocid="support_plan.add_goal.button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Goal
            </Button>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Notes
            </p>
            <Textarea
              placeholder="Additional notes about this student's plan..."
              value={plan.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              rows={4}
              className="text-sm"
              data-ocid="support_plan.notes.textarea"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateSENPlan.isPending}
              className="gap-2"
              data-ocid="support_plan.save.button"
            >
              {updateSENPlan.isPending ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    data-ocid="support_plan.loading_state"
                  />
                  Saving...
                </>
              ) : (
                "Save Support Plan"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
