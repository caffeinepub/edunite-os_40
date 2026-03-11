import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { ContactMethod, GuardianContact, Student } from "../../backend";
import { ContactMethod as ContactMethodEnum } from "../../backend";
import { useAddStudent, useUpdateStudent } from "../../hooks/useQueries";
import { validateEmail } from "../../utils/emailValidator";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "../../utils/phoneFormatter";
import DateOfBirthPicker from "./DateOfBirthPicker";
import TagSelector from "./TagSelector";

interface AddStudentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editStudent?: Student | null;
  /** When true, renders as an inline page section instead of a full-screen overlay */
  inline?: boolean;
}

const GRADE_LEVELS = [
  "K",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

const ACCOMMODATION_OPTIONS = [
  "Extended time",
  "Preferential seating",
  "Reduced assignments",
  "Assistive technology",
  "Frequent breaks",
  "Visual aids",
  "Modified assessments",
  "Small group instruction",
];

const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Wheat/Gluten",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Latex",
];

const RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Stepmother",
  "Stepfather",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Sibling",
  "Legal Guardian",
  "Foster Parent",
  "Other",
];

let _guardianKeyCounter = 0;

interface GuardianFormState {
  _key: number;
  firstName: string;
  lastName: string;
  relationship: string;
  customRelationship: string;
  phone: string;
  email: string;
  preferredContactMethod: ContactMethod;
  languagePreference: string;
  emergencyContact: boolean;
}

const emptyGuardian = (): GuardianFormState => ({
  _key: ++_guardianKeyCounter,
  firstName: "",
  lastName: "",
  relationship: "",
  customRelationship: "",
  phone: "",
  email: "",
  preferredContactMethod: ContactMethodEnum.either,
  languagePreference: "English",
  emergencyContact: false,
});

function guardianContactToForm(g: GuardianContact): GuardianFormState {
  const isCustom = !RELATIONSHIP_OPTIONS.slice(0, -1).includes(g.relationship);
  return {
    _key: ++_guardianKeyCounter,
    firstName: g.firstName,
    lastName: g.lastName,
    relationship: isCustom ? "Other" : g.relationship,
    customRelationship: isCustom ? g.relationship : "",
    phone: g.phone,
    email: g.email,
    preferredContactMethod: g.preferredContactMethod,
    languagePreference: g.languagePreference,
    emergencyContact: g.emergencyContact,
  };
}

export function AddStudentForm({
  onSuccess,
  onCancel,
  editStudent,
  inline = false,
}: AddStudentFormProps) {
  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();

  // Student fields
  const [givenNames, setGivenNames] = useState(editStudent?.givenNames ?? "");
  const [familyName, setFamilyName] = useState(editStudent?.familyName ?? "");
  const [preferredName, setPreferredName] = useState(
    editStudent?.preferredName ?? "",
  );
  const [studentId, setStudentId] = useState(editStudent?.studentId ?? "");
  const [gradeLevel, setGradeLevel] = useState(editStudent?.gradeLevel ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [selectedAccommodations, setSelectedAccommodations] = useState<
    string[]
  >(editStudent?.accommodations.map((a) => a.description) ?? []);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    editStudent?.allergies ?? [],
  );
  const [medicalNotes, setMedicalNotes] = useState(
    editStudent?.medicalNotes ?? "",
  );
  const [teacherNotes, setTeacherNotes] = useState(
    editStudent?.teacherNotes ?? "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Guardian fields
  const [guardians, setGuardians] = useState<GuardianFormState[]>(
    editStudent?.guardianContacts.map(guardianContactToForm) ?? [
      emptyGuardian(),
    ],
  );
  const [guardianErrors, setGuardianErrors] = useState<
    Record<string, Record<string, string>>
  >({});

  const isEditing = !!editStudent;
  const isPending = addStudent.isPending || updateStudent.isPending;

  // dateOfBirth is stored locally but not yet sent to backend (no backend field)
  void dateOfBirth;

  function validateStudent() {
    const newErrors: Record<string, string> = {};
    if (!givenNames.trim())
      newErrors.givenNames = "Given name(s) are required.";
    if (!familyName.trim()) newErrors.familyName = "Family name is required.";
    if (!studentId.trim()) newErrors.studentId = "Student ID is required.";
    if (!gradeLevel) newErrors.gradeLevel = "Grade level is required.";
    return newErrors;
  }

  function validateGuardians(): boolean {
    const allErrors: Record<string, Record<string, string>> = {};
    let valid = true;

    guardians.forEach((g, idx) => {
      const errs: Record<string, string> = {};
      const hasData =
        g.firstName.trim() ||
        g.lastName.trim() ||
        g.relationship ||
        g.phone ||
        g.email;
      if (hasData) {
        if (!g.firstName.trim()) errs.firstName = "First name is required";
        if (!g.lastName.trim()) errs.lastName = "Last name is required";
        if (!g.relationship) errs.relationship = "Relationship is required";
        if (g.phone && !validatePhoneNumber(g.phone))
          errs.phone = "Invalid phone number";
        if (g.email && !validateEmail(g.email))
          errs.email = "Invalid email address";
      }
      if (Object.keys(errs).length > 0) {
        allErrors[idx] = errs;
        valid = false;
      }
    });

    setGuardianErrors(allErrors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const studentErrors = validateStudent();
    const guardiansValid = validateGuardians();

    if (Object.keys(studentErrors).length > 0 || !guardiansValid) {
      setErrors(studentErrors);
      return;
    }

    setErrors({});

    const accommodations = selectedAccommodations.map((desc, i) => ({
      id: BigInt(i + 1),
      description: desc,
    }));

    const guardianContacts = guardians
      .filter((g) => g.firstName.trim() || g.lastName.trim() || g.relationship)
      .map((g, i) => ({
        id: BigInt(i + 1),
        firstName: g.firstName,
        lastName: g.lastName,
        relationship:
          g.relationship === "Other"
            ? g.customRelationship || "Other"
            : g.relationship,
        phone: g.phone,
        email: g.email,
        preferredContactMethod: g.preferredContactMethod,
        languagePreference: g.languagePreference,
        emergencyContact: g.emergencyContact,
      }));

    try {
      if (isEditing && editStudent) {
        await updateStudent.mutateAsync({
          studentId: editStudent.studentId,
          givenNames,
          familyName,
          preferredName: preferredName.trim() || null,
          gradeLevel,
          photo: editStudent.photo,
          accommodations,
          allergies: selectedAllergies,
          medicalNotes,
          attendanceRecords: editStudent.attendanceRecords,
          guardianContacts,
          teacherNotes,
          interventionPlans: editStudent.interventionPlans,
          behaviorEntries: editStudent.behaviorEntries,
        });
      } else {
        await addStudent.mutateAsync({
          studentId,
          givenNames,
          familyName,
          preferredName: preferredName.trim() || null,
          gradeLevel,
          photo: "",
          accommodations,
          allergies: selectedAllergies,
          medicalNotes,
          attendanceRecords: [],
          guardianContacts,
          teacherNotes,
          interventionPlans: "",
          behaviorEntries: [],
        });
      }
      onSuccess?.();
    } catch (err) {
      console.error("Failed to save student:", err);
    }
  }

  function updateGuardian(
    idx: number,
    field: keyof GuardianFormState,
    value: string | boolean,
  ) {
    setGuardians((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)),
    );
    if (guardianErrors[idx]?.[field]) {
      setGuardianErrors((prev) => {
        const updated = { ...prev };
        if (updated[idx]) {
          updated[idx] = { ...updated[idx] };
          delete updated[idx][field as string];
        }
        return updated;
      });
    }
  }

  function addGuardian() {
    setGuardians((prev) => [...prev, emptyGuardian()]);
  }

  function removeGuardian(idx: number) {
    setGuardians((prev) => prev.filter((_, i) => i !== idx));
    setGuardianErrors((prev) => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
  }

  return (
    <div
      className={`${inline ? "w-full" : "h-full"} flex flex-col bg-background`}
    >
      {/* Action bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="shrink-0 h-8 w-8"
            aria-label="Back to students"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-sm"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            form="add-student-form"
            disabled={isPending}
            className="gap-2 rounded-sm"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Add Student"}
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className={`${inline ? "w-full" : "flex-1 overflow-y-auto"} bg-background`}
      >
        <form
          id="add-student-form"
          onSubmit={handleSubmit}
          className="w-full px-6 py-8 space-y-6"
        >
          {/* ── Section 1: Personal Information ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Given Names */}
                <div className="space-y-1.5">
                  <Label htmlFor="givenNames">
                    Given Name(s) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="givenNames"
                    value={givenNames}
                    onChange={(e) => {
                      setGivenNames(e.target.value);
                      if (errors.givenNames)
                        setErrors((prev) => {
                          const { givenNames: _g, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="e.g. Maria Elena"
                    className={`rounded-sm ${errors.givenNames ? "border-destructive" : ""}`}
                  />
                  {errors.givenNames && (
                    <p className="text-xs text-destructive">
                      {errors.givenNames}
                    </p>
                  )}
                </div>

                {/* Family Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="familyName">
                    Family Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="familyName"
                    value={familyName}
                    onChange={(e) => {
                      setFamilyName(e.target.value);
                      if (errors.familyName)
                        setErrors((prev) => {
                          const { familyName: _f, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="e.g. Rodriguez"
                    className={`rounded-sm ${errors.familyName ? "border-destructive" : ""}`}
                  />
                  {errors.familyName && (
                    <p className="text-xs text-destructive">
                      {errors.familyName}
                    </p>
                  )}
                </div>

                {/* Preferred Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="preferredName">
                    Preferred Name{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="preferredName"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="e.g. Ellie"
                    className="rounded-sm"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label>
                    Date of Birth{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <DateOfBirthPicker
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 2: Academic & Enrollment Details ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <GraduationCap className="h-4 w-4 text-primary" />
                Academic &amp; Enrollment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student ID */}
                <div className="space-y-1.5">
                  <Label htmlFor="studentId">
                    Student ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      if (errors.studentId)
                        setErrors((prev) => {
                          const { studentId: _s, ...rest } = prev;
                          return rest;
                        });
                    }}
                    placeholder="e.g. STU-001"
                    disabled={isEditing}
                    className={`rounded-sm ${errors.studentId ? "border-destructive" : ""}`}
                  />
                  {errors.studentId && (
                    <p className="text-xs text-destructive">
                      {errors.studentId}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Student ID cannot be changed.
                    </p>
                  )}
                </div>

                {/* Grade Level */}
                <div className="space-y-1.5">
                  <Label htmlFor="gradeLevel">
                    Grade Level <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={gradeLevel}
                    onValueChange={(val) => {
                      setGradeLevel(val);
                      if (errors.gradeLevel)
                        setErrors((prev) => {
                          const { gradeLevel: _gl, ...rest } = prev;
                          return rest;
                        });
                    }}
                  >
                    <SelectTrigger
                      id="gradeLevel"
                      className={`w-full rounded-sm ${errors.gradeLevel ? "border-destructive" : ""}`}
                    >
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g === "K" ? "Kindergarten" : `Grade ${g}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gradeLevel && (
                    <p className="text-xs text-destructive">
                      {errors.gradeLevel}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 3: Guardian & Contact Information ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Guardian &amp; Contact Information
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGuardian}
                  className="gap-1.5 rounded-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Guardian
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {guardians.map((guardian, idx) => (
                <div key={guardian._key}>
                  {idx > 0 && <Separator className="my-6" />}

                  {/* Guardian header row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">
                      Guardian {idx + 1}
                      {guardian.emergencyContact && (
                        <span className="ml-2 text-xs text-destructive font-normal">
                          (Emergency Contact)
                        </span>
                      )}
                    </span>
                    {guardians.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGuardian(idx)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove guardian ${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Guardian fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-firstName`}>
                          First Name
                        </Label>
                        <Input
                          id={`guardian-${idx}-firstName`}
                          value={guardian.firstName}
                          onChange={(e) =>
                            updateGuardian(idx, "firstName", e.target.value)
                          }
                          placeholder="First name"
                          className={`rounded-sm ${guardianErrors[idx]?.firstName ? "border-destructive" : ""}`}
                        />
                        {guardianErrors[idx]?.firstName && (
                          <p className="text-xs text-destructive">
                            {guardianErrors[idx].firstName}
                          </p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-lastName`}>
                          Last Name
                        </Label>
                        <Input
                          id={`guardian-${idx}-lastName`}
                          value={guardian.lastName}
                          onChange={(e) =>
                            updateGuardian(idx, "lastName", e.target.value)
                          }
                          placeholder="Last name"
                          className={`rounded-sm ${guardianErrors[idx]?.lastName ? "border-destructive" : ""}`}
                        />
                        {guardianErrors[idx]?.lastName && (
                          <p className="text-xs text-destructive">
                            {guardianErrors[idx].lastName}
                          </p>
                        )}
                      </div>

                      {/* Relationship */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-relationship`}>
                          Relationship
                        </Label>
                        <Select
                          value={guardian.relationship}
                          onValueChange={(val) =>
                            updateGuardian(idx, "relationship", val)
                          }
                        >
                          <SelectTrigger
                            id={`guardian-${idx}-relationship`}
                            className={`w-full rounded-sm ${guardianErrors[idx]?.relationship ? "border-destructive" : ""}`}
                          >
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {RELATIONSHIP_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {guardianErrors[idx]?.relationship && (
                          <p className="text-xs text-destructive">
                            {guardianErrors[idx].relationship}
                          </p>
                        )}
                      </div>

                      {/* Custom Relationship (shown when "Other" is selected) */}
                      {guardian.relationship === "Other" && (
                        <div className="space-y-1.5">
                          <Label htmlFor={`guardian-${idx}-customRelationship`}>
                            Specify Relationship
                          </Label>
                          <Input
                            id={`guardian-${idx}-customRelationship`}
                            value={guardian.customRelationship}
                            onChange={(e) =>
                              updateGuardian(
                                idx,
                                "customRelationship",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. Family friend"
                            className="rounded-sm"
                          />
                        </div>
                      )}

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-phone`}>Phone</Label>
                        <Input
                          id={`guardian-${idx}-phone`}
                          value={guardian.phone}
                          onChange={(e) =>
                            updateGuardian(
                              idx,
                              "phone",
                              formatPhoneNumber(e.target.value),
                            )
                          }
                          placeholder="(555) 000-0000"
                          className={`rounded-sm ${guardianErrors[idx]?.phone ? "border-destructive" : ""}`}
                        />
                        {guardianErrors[idx]?.phone && (
                          <p className="text-xs text-destructive">
                            {guardianErrors[idx].phone}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-email`}>Email</Label>
                        <Input
                          id={`guardian-${idx}-email`}
                          type="email"
                          value={guardian.email}
                          onChange={(e) =>
                            updateGuardian(idx, "email", e.target.value)
                          }
                          placeholder="email@example.com"
                          className={`rounded-sm ${guardianErrors[idx]?.email ? "border-destructive" : ""}`}
                        />
                        {guardianErrors[idx]?.email && (
                          <p className="text-xs text-destructive">
                            {guardianErrors[idx].email}
                          </p>
                        )}
                      </div>

                      {/* Preferred Contact Method */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-contactMethod`}>
                          Preferred Contact
                        </Label>
                        <Select
                          value={guardian.preferredContactMethod}
                          onValueChange={(val) =>
                            updateGuardian(
                              idx,
                              "preferredContactMethod",
                              val as ContactMethod,
                            )
                          }
                        >
                          <SelectTrigger
                            id={`guardian-${idx}-contactMethod`}
                            className="w-full rounded-sm"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value={ContactMethodEnum.phone}>
                              Phone
                            </SelectItem>
                            <SelectItem value={ContactMethodEnum.email}>
                              Email
                            </SelectItem>
                            <SelectItem value={ContactMethodEnum.either}>
                              Either
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Language Preference */}
                      <div className="space-y-1.5">
                        <Label htmlFor={`guardian-${idx}-language`}>
                          Language Preference
                        </Label>
                        <Input
                          id={`guardian-${idx}-language`}
                          value={guardian.languagePreference}
                          onChange={(e) =>
                            updateGuardian(
                              idx,
                              "languagePreference",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. English"
                          className="rounded-sm"
                        />
                      </div>
                    </div>

                    {/* Emergency Contact toggle */}
                    <div className="flex items-center gap-3 pt-1">
                      <Switch
                        id={`guardian-${idx}-emergency`}
                        checked={guardian.emergencyContact}
                        onCheckedChange={(val) =>
                          updateGuardian(idx, "emergencyContact", val)
                        }
                      />
                      <Label
                        htmlFor={`guardian-${idx}-emergency`}
                        className="cursor-pointer font-normal"
                      >
                        Emergency contact
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Section 4: Accommodations & Allergies ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Accommodations &amp; Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accommodations */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Accommodations</Label>
                <TagSelector
                  tags={ACCOMMODATION_OPTIONS}
                  selected={selectedAccommodations}
                  onChange={setSelectedAccommodations}
                />
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allergies</Label>
                <TagSelector
                  tags={ALLERGY_OPTIONS}
                  selected={selectedAllergies}
                  onChange={setSelectedAllergies}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Section 5: Medical & Teacher Notes ── */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Medical &amp; Teacher Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Medical Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="medicalNotes">
                  Medical Notes{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="medicalNotes"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  placeholder="Any medical conditions, medications, or health-related notes..."
                  rows={3}
                  className="rounded-sm resize-none"
                />
              </div>

              {/* Teacher Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="teacherNotes">
                  Teacher Notes{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="teacherNotes"
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="Observations, learning style notes, or other relevant information..."
                  rows={3}
                  className="rounded-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default AddStudentForm;
