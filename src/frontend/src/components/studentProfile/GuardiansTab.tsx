import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Check,
  Edit2,
  Globe,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { ContactMethod, GuardianContact, Student } from "../../backend";
import { ContactMethod as ContactMethodEnum } from "../../backend";
import {
  useAddGuardianContact,
  useDeleteGuardianContact,
  useUpdateGuardianContact,
} from "../../hooks/useQueries";
import { validateEmail } from "../../utils/emailValidator";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "../../utils/phoneFormatter";

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

interface GuardianFormState {
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

const emptyForm = (): GuardianFormState => ({
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

function guardianToForm(g: GuardianContact): GuardianFormState {
  const isCustom = !RELATIONSHIP_OPTIONS.slice(0, -1).includes(g.relationship);
  return {
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

interface GuardiansTabProps {
  student: Student;
}

export default function GuardiansTab({ student }: GuardiansTabProps) {
  const addGuardian = useAddGuardianContact();
  const updateGuardian = useUpdateGuardianContact();
  const deleteGuardian = useDeleteGuardianContact();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<GuardianFormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.relationship) newErrors.relationship = "Relationship is required";
    if (form.phone && !validatePhoneNumber(form.phone))
      newErrors.phone = "Invalid phone number";
    if (form.email && !validateEmail(form.email))
      newErrors.email = "Invalid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRelationshipValue = () =>
    form.relationship === "Other"
      ? form.customRelationship || "Other"
      : form.relationship;

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      studentId: student.studentId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      relationship: getRelationshipValue(),
      phone: form.phone,
      email: form.email,
      preferredContactMethod: form.preferredContactMethod,
      languagePreference: form.languagePreference,
      emergencyContact: form.emergencyContact,
    };

    try {
      if (editingId !== null) {
        await updateGuardian.mutateAsync({ ...payload, contactId: editingId });
      } else {
        await addGuardian.mutateAsync(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      setErrors({});
    } catch (err: any) {
      setErrors({ submit: err?.message ?? "Failed to save guardian" });
    }
  };

  const handleEdit = (guardian: GuardianContact) => {
    setForm(guardianToForm(guardian));
    setEditingId(guardian.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id: bigint) => {
    await deleteGuardian.mutateAsync({
      studentId: student.studentId,
      contactId: id,
    });
    setDeleteConfirmId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
  };

  const isSaving = addGuardian.isPending || updateGuardian.isPending;

  return (
    <div className="space-y-6">
      {/* Guardian Cards */}
      {student.guardianContacts.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No guardian contacts added yet</p>
          <p className="text-xs mt-1">
            Add a parent or guardian to keep contact info organized
          </p>
        </div>
      )}

      {student.guardianContacts.map((guardian) => (
        <div
          key={guardian.id.toString()}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h4 className="font-semibold text-foreground">
                  {guardian.firstName} {guardian.lastName}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {guardian.relationship}
                </Badge>
                {guardian.emergencyContact && (
                  <Badge
                    variant="outline"
                    className="text-xs border-red-300 text-red-700 bg-red-50"
                  >
                    Emergency Contact
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {guardian.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{guardian.phone}</span>
                  </div>
                )}
                {guardian.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{guardian.email}</span>
                  </div>
                )}
                {guardian.languagePreference &&
                  guardian.languagePreference !== "English" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{guardian.languagePreference}</span>
                    </div>
                  )}
                <div className="text-xs text-muted-foreground">
                  Preferred contact: {guardian.preferredContactMethod}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(guardian)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteConfirmId(guardian.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Guardian Button */}
      {!showForm && (
        <Button
          variant="outline"
          onClick={() => {
            setForm(emptyForm());
            setEditingId(null);
            setShowForm(true);
          }}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Guardian Contact
        </Button>
      )}

      {/* Guardian Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">
            {editingId !== null ? "Edit Guardian" : "Add Guardian Contact"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                placeholder="First name"
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
                placeholder="Last name"
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Relationship <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.relationship}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, relationship: v }))
                }
              >
                <SelectTrigger
                  className={errors.relationship ? "border-destructive" : ""}
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
              {errors.relationship && (
                <p className="text-xs text-destructive">
                  {errors.relationship}
                </p>
              )}
            </div>
            {form.relationship === "Other" && (
              <div className="space-y-1.5">
                <Label>Custom Relationship</Label>
                <Input
                  value={form.customRelationship}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customRelationship: e.target.value,
                    }))
                  }
                  placeholder="e.g. Family Friend"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phone: formatPhoneNumber(e.target.value),
                  }))
                }
                placeholder="(555) 555-5555"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="email@example.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Contact</Label>
              <Select
                value={form.preferredContactMethod}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    preferredContactMethod: v as ContactMethod,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value={ContactMethodEnum.phone}>Phone</SelectItem>
                  <SelectItem value={ContactMethodEnum.email}>Email</SelectItem>
                  <SelectItem value={ContactMethodEnum.either}>
                    Either
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language Preference</Label>
              <Input
                value={form.languagePreference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, languagePreference: e.target.value }))
                }
                placeholder="e.g. English, Spanish"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="emergencyContact"
              checked={form.emergencyContact}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, emergencyContact: checked }))
              }
            />
            <Label htmlFor="emergencyContact" className="cursor-pointer">
              Emergency Contact
            </Label>
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive">{errors.submit}</p>
          )}

          <div className="flex items-center gap-2 justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {editingId !== null ? "Save Changes" : "Add Guardian"}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guardian Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this guardian contact? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmId !== null && handleDelete(deleteConfirmId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteGuardian.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
