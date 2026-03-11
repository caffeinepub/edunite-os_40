import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { AlertOctagon, ArrowLeft, Minus, Plus, Users } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  BehaviorCategory,
  BehaviorEntryType,
  BehaviorSeverity,
} from "../backend";
import ActionTakenMultiSelect, {
  serializeActionTaken,
} from "../components/behavior/ActionTakenMultiSelect";
import {
  BehaviorSearchSelect,
  type BehaviorSelection,
} from "../components/behavior/BehaviorSearchSelect";
import { useAppUI } from "../context/AppUIContext";
import { useAddBehaviorLog, useStudentRoster } from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTEXT_OPTIONS = [
  {
    group: "Period",
    options: [
      "Period 1",
      "Period 2",
      "Period 3",
      "Period 4",
      "Period 5",
      "Period 6",
      "Period 7",
      "Period 8",
    ],
  },
  {
    group: "Location",
    options: [
      "Hallway",
      "Cafeteria",
      "Playground",
      "Gym",
      "Library",
      "Office",
      "Bathroom",
      "Bus",
    ],
  },
  {
    group: "Event",
    options: [
      "Assembly",
      "Field Trip",
      "Recess",
      "Dismissal",
      "Arrival",
      "After School",
      "Athletic Event",
    ],
  },
];

const PARENT_CONTACT_METHODS = ["Phone", "Email", "In Person"] as const;

// ─── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-5 space-y-4">{children}</CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeriousIncidentReport() {
  const navigate = useNavigate();
  const addBehaviorLog = useAddBehaviorLog();
  const { data: roster = [] } = useStudentRoster();
  const { setHideFAB, setModuleNameOverride } = useAppUI();

  // Set page title and hide FAB
  useEffect(() => {
    setHideFAB(true);
    setModuleNameOverride("Serious Incident Report");
    return () => {
      setHideFAB(false);
      setModuleNameOverride(null);
    };
  }, [setHideFAB, setModuleNameOverride]);

  // ── Section 1: Incident Overview ──
  const [studentName, setStudentName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [incidentDate, setIncidentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [incidentTime, setIncidentTime] = useState(format(new Date(), "HH:mm"));
  const [context, setContext] = useState("Period 1");
  const [description, setDescription] = useState("");

  // ── Section 2: Involved Parties ──
  const [otherStudents, setOtherStudents] = useState<string[]>([""]);
  const [staffWitness, setStaffWitness] = useState("");

  // ── Section 3: Incident Details ──
  const [category, setCategory] = useState<BehaviorCategory>(
    BehaviorCategory.safety,
  );
  const [selectedBehavior, setSelectedBehavior] = useState("");
  const [antecedent, setAntecedent] = useState("");
  const [actionTakenValues, setActionTakenValues] = useState<string[]>([]);
  const [actionTakenCustom, setActionTakenCustom] = useState("");

  // ── Section 4: Administrative ──
  const [parentNotified, setParentNotified] = useState<boolean | null>(null);
  const [parentNotifiedDate, setParentNotifiedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [parentNotifiedTime, setParentNotifiedTime] = useState(
    format(new Date(), "HH:mm"),
  );
  const [parentContactMethod, setParentContactMethod] = useState<
    (typeof PARENT_CONTACT_METHODS)[number] | ""
  >("");
  const [adminNotified, setAdminNotified] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState("");
  const [lawEnforcement, setLawEnforcement] = useState<boolean | null>(null);
  const [followUpPlan, setFollowUpPlan] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");

  const studentInputRef = useRef<HTMLInputElement>(null);

  const filteredRoster = roster.filter(
    (name) =>
      name.toLowerCase().includes(studentName.toLowerCase()) &&
      name !== studentName,
  );

  const handleBehaviorSelect = (selection: BehaviorSelection | null) => {
    if (!selection) {
      setSelectedBehavior("");
      return;
    }
    setSelectedBehavior(selection.behavior);
    setCategory(selection.category);
    if (selection.description) {
      // Only pre-fill description if it's empty
      if (!description.trim()) {
        setDescription(selection.description);
      }
    }
  };

  const addOtherStudent = () => {
    if (otherStudents.length < 3) {
      setOtherStudents([...otherStudents, ""]);
    }
  };

  const removeOtherStudent = (index: number) => {
    setOtherStudents(otherStudents.filter((_, i) => i !== index));
  };

  const updateOtherStudent = (index: number, value: string) => {
    setOtherStudents(otherStudents.map((s, i) => (i === index ? value : s)));
  };

  const buildComprehensiveDescription = (): string => {
    const parts: string[] = [description.trim()];

    if (antecedent.trim()) {
      parts.push(`\n\nAntecedent / What Led to This:\n${antecedent.trim()}`);
    }

    const involvedStudents = otherStudents.filter((s) => s.trim());
    if (involvedStudents.length > 0) {
      parts.push(
        `\n\nOther Students Involved:\n${involvedStudents.join(", ")}`,
      );
    }

    if (staffWitness.trim()) {
      parts.push(`\n\nStaff Witness: ${staffWitness.trim()}`);
    }

    if (parentNotified !== null) {
      if (parentNotified) {
        const methodStr = parentContactMethod
          ? ` via ${parentContactMethod}`
          : "";
        const dateStr = parentNotifiedDate
          ? ` on ${parentNotifiedDate} at ${parentNotifiedTime}`
          : "";
        parts.push(`\n\nParent/Guardian Notified: Yes${methodStr}${dateStr}`);
      } else {
        parts.push("\n\nParent/Guardian Notified: No");
      }
    }

    if (adminNotified !== null) {
      if (adminNotified) {
        const nameStr = adminName.trim() ? ` (${adminName.trim()})` : "";
        parts.push(`\n\nAdministration Notified: Yes${nameStr}`);
      } else {
        parts.push("\n\nAdministration Notified: No");
      }
    }

    if (lawEnforcement !== null) {
      parts.push(
        `\n\nLaw Enforcement Involved: ${lawEnforcement ? "Yes" : "No"}`,
      );
    }

    if (followUpPlan.trim()) {
      parts.push(`\n\nFollow-up Plan:\n${followUpPlan.trim()}`);
    }

    if (nextReviewDate) {
      parts.push(`\n\nNext Review Date: ${nextReviewDate}`);
    }

    return parts.join("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !description.trim() || !context) return;

    const resolvedAction = serializeActionTaken(
      BehaviorEntryType.incident,
      actionTakenValues,
      actionTakenCustom,
    );

    const fullDescription = buildComprehensiveDescription();

    await addBehaviorLog.mutateAsync({
      studentName: studentName.trim(),
      entryType: BehaviorEntryType.incident,
      category,
      context,
      description: fullDescription,
      severity: BehaviorSeverity.major,
      actionTaken: resolvedAction || null,
      followUpNeeded: followUpPlan.trim().length > 0,
    });

    navigate({ to: "/behavior" });
  };

  const isSubmittable =
    studentName.trim().length > 0 &&
    description.trim().length > 0 &&
    context.length > 0;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <div>
        <button
          type="button"
          onClick={() => navigate({ to: "/behavior" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="serious_incident.back_button"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Behavior
        </button>
      </div>

      {/* Serious incident warning banner */}
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertOctagon className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            Serious Incident Report
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This report will be logged as a Major severity incident. Complete
            all relevant sections thoroughly for documentation purposes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Incident Overview ── */}
        <SectionCard
          title="Incident Overview"
          icon={<AlertOctagon className="h-4 w-4 text-destructive" />}
        >
          {/* Student */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="sir-student" className="text-sm font-medium">
              Student <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={studentInputRef}
              id="sir-student"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type student name..."
              required
              autoComplete="off"
              data-ocid="serious_incident.student_input"
            />
            {showSuggestions && filteredRoster.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredRoster.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => {
                      setStudentName(name);
                      setShowSuggestions(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date / Time / Context */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sir-date" className="text-sm font-medium">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sir-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
                data-ocid="serious_incident.date_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sir-time" className="text-sm font-medium">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sir-time"
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                required
                data-ocid="serious_incident.time_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sir-context" className="text-sm font-medium">
                Where / When <span className="text-destructive">*</span>
              </Label>
              <Select value={context} onValueChange={setContext} required>
                <SelectTrigger
                  id="sir-context"
                  data-ocid="serious_incident.context_select"
                >
                  <SelectValue placeholder="Where?" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {CONTEXT_OPTIONS.map((group) => (
                    <React.Fragment key={group.group}>
                      <SelectItem
                        value={`__group_${group.group}`}
                        disabled
                        className="font-semibold text-xs text-muted-foreground uppercase tracking-wide"
                      >
                        {group.group}
                      </SelectItem>
                      {group.options.map((opt) => (
                        <SelectItem key={opt} value={opt} className="pl-4">
                          {opt}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="sir-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail. Include the sequence of events, what was said or done, and the immediate impact..."
              rows={5}
              required
              data-ocid="serious_incident.description_textarea"
            />
          </div>
        </SectionCard>

        {/* ── Section 2: Involved Parties ── */}
        <SectionCard
          title="Involved Parties"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        >
          {/* Other students */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Other Students Involved{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (up to 3)
              </span>
            </Label>
            {otherStudents.map((student, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list is positional (max 3 stable slots)
              <div key={`other-student-${index}`} className="flex gap-2">
                <Input
                  value={student}
                  onChange={(e) => updateOtherStudent(index, e.target.value)}
                  placeholder={`Student name ${index + 1}`}
                  className="flex-1"
                  data-ocid={`serious_incident.other_student_input.${index + 1}`}
                />
                {otherStudents.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOtherStudent(index)}
                    className="flex-shrink-0 px-2"
                    data-ocid={`serious_incident.remove_student.button.${index + 1}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {otherStudents.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOtherStudent}
                className="gap-1.5 text-muted-foreground"
                data-ocid="serious_incident.add_student.button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Another Student
              </Button>
            )}
          </div>

          {/* Staff witness */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-staff-witness" className="text-sm font-medium">
              Staff Witness Name{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Input
              id="sir-staff-witness"
              value={staffWitness}
              onChange={(e) => setStaffWitness(e.target.value)}
              placeholder="Name of staff member who witnessed the incident"
              data-ocid="serious_incident.staff_witness_input"
            />
          </div>
        </SectionCard>

        {/* ── Section 3: Incident Details ── */}
        <SectionCard
          title="Incident Details"
          icon={
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30"
            >
              Major
            </Badge>
          }
        >
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-category" className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BehaviorCategory)}
            >
              <SelectTrigger
                id="sir-category"
                data-ocid="serious_incident.category_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="respect">Respect</SelectItem>
                <SelectItem value="responsibility">Responsibility</SelectItem>
                <SelectItem value="emotional_regulation">
                  Emotional Regulation
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Behavior search */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Specific Behavior{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (search — category auto-assigned)
              </span>
            </Label>
            <BehaviorSearchSelect
              entryType={BehaviorEntryType.incident}
              value={selectedBehavior}
              onSelect={handleBehaviorSelect}
              placeholder="Search incident behaviors..."
              dataOcid="serious_incident.behavior_select"
            />
          </div>

          {/* Antecedent */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-antecedent" className="text-sm font-medium">
              Antecedent — What Led to This?{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Textarea
              id="sir-antecedent"
              value={antecedent}
              onChange={(e) => setAntecedent(e.target.value)}
              placeholder="What happened before the incident? What may have triggered it? Any known context or history..."
              rows={3}
              data-ocid="serious_incident.antecedent_textarea"
            />
          </div>

          {/* Immediate actions taken */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              Immediate Actions Taken
              {actionTakenValues.filter((v) => v !== "custom").length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs font-normal px-1.5 py-0"
                >
                  {actionTakenValues.filter((v) => v !== "custom").length}
                </Badge>
              )}
            </Label>
            {/* No max-height cap for Serious Incident Report — show full list */}
            <div className="border border-border rounded-md p-3 bg-background space-y-1">
              <ActionTakenMultiSelect
                entryType={BehaviorEntryType.incident}
                selectedValues={actionTakenValues}
                onChange={setActionTakenValues}
                customText={actionTakenCustom}
                onCustomTextChange={setActionTakenCustom}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Section 4: Administrative ── */}
        <SectionCard
          title="Administrative"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              role="img"
              aria-label="Administrative"
            >
              <title>Administrative</title>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        >
          {/* Parent notified */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Parent / Guardian Notified?
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setParentNotified(parentNotified === true ? null : true)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  parentNotified === true
                    ? "bg-success/10 border-success/40 text-success"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.parent_notified_yes.button"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setParentNotified(parentNotified === false ? null : false)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  parentNotified === false
                    ? "bg-muted border-border text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.parent_notified_no.button"
              >
                No
              </button>
            </div>
            {parentNotified === true && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date</Label>
                  <Input
                    type="date"
                    value={parentNotifiedDate}
                    onChange={(e) => setParentNotifiedDate(e.target.value)}
                    className="h-8 text-sm"
                    data-ocid="serious_incident.parent_date_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Time</Label>
                  <Input
                    type="time"
                    value={parentNotifiedTime}
                    onChange={(e) => setParentNotifiedTime(e.target.value)}
                    className="h-8 text-sm"
                    data-ocid="serious_incident.parent_time_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Contact Method</Label>
                  <Select
                    value={parentContactMethod}
                    onValueChange={(v) =>
                      setParentContactMethod(
                        v as (typeof PARENT_CONTACT_METHODS)[number],
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="serious_incident.parent_contact_method_select"
                    >
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENT_CONTACT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Admin notified */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Administration Notified?
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setAdminNotified(adminNotified === true ? null : true)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  adminNotified === true
                    ? "bg-success/10 border-success/40 text-success"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.admin_notified_yes.button"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setAdminNotified(adminNotified === false ? null : false)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  adminNotified === false
                    ? "bg-muted border-border text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.admin_notified_no.button"
              >
                No
              </button>
            </div>
            {adminNotified === true && (
              <div className="mt-2">
                <Label className="text-xs font-medium">Admin Name</Label>
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Name of administrator notified"
                  className="mt-1.5 h-8 text-sm"
                  data-ocid="serious_incident.admin_name_input"
                />
              </div>
            )}
          </div>

          {/* Law enforcement */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Law Enforcement Involved?
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setLawEnforcement(lawEnforcement === true ? null : true)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  lawEnforcement === true
                    ? "bg-destructive/10 border-destructive/40 text-destructive"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.law_enforcement_yes.button"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() =>
                  setLawEnforcement(lawEnforcement === false ? null : false)
                }
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                  lawEnforcement === false
                    ? "bg-muted border-border text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-ocid="serious_incident.law_enforcement_no.button"
              >
                No
              </button>
            </div>
          </div>

          {/* Follow-up plan */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-followup" className="text-sm font-medium">
              Follow-up Plan{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional — checking this will flag the entry for follow-up)
              </span>
            </Label>
            <Textarea
              id="sir-followup"
              value={followUpPlan}
              onChange={(e) => setFollowUpPlan(e.target.value)}
              placeholder="What are the next steps? Who is responsible? What will be monitored going forward?"
              rows={3}
              data-ocid="serious_incident.followup_textarea"
            />
          </div>

          {/* Next review date */}
          <div className="space-y-1.5">
            <Label htmlFor="sir-review-date" className="text-sm font-medium">
              Next Review Date{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Input
              id="sir-review-date"
              type="date"
              value={nextReviewDate}
              onChange={(e) => setNextReviewDate(e.target.value)}
              data-ocid="serious_incident.review_date_input"
            />
          </div>
        </SectionCard>

        {/* Submit actions */}
        <div className="flex items-center gap-3 pb-4">
          <Button
            type="submit"
            size="sm"
            disabled={addBehaviorLog.isPending || !isSubmittable}
            className="gap-2"
            data-ocid="serious_incident.submit_button"
          >
            <AlertOctagon className="h-4 w-4" />
            {addBehaviorLog.isPending
              ? "Submitting..."
              : "Submit Serious Incident Report"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/behavior" })}
            data-ocid="serious_incident.cancel_button"
          >
            Cancel
          </Button>
          {!isSubmittable && (
            <p className="text-xs text-muted-foreground">
              Student, description, and location are required.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
