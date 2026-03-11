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
import { Textarea } from "@/components/ui/textarea";
import {
  Edit2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { Student } from "../../backend";
import { useUpdateStudent } from "../../hooks/useQueries";

interface CommunicationTabProps {
  student: Student;
}

interface NoteEntry {
  id: string;
  date: string;
  content: string;
}

interface ParentCorrespondenceEntry {
  id: string;
  date: string;
  guardianName: string;
  method: "phone" | "email" | "in-person" | "note-home";
  summary: string;
  outcome: string;
}

interface InterventionData {
  interventions: string;
  parentCorrespondence: ParentCorrespondenceEntry[];
}

// ── Notes ────────────────────────────────────────────────────────────────────

function parseNotes(raw: string): NoteEntry[] {
  if (!raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.trim()) {
      return [
        { id: "1", date: new Date().toISOString().split("T")[0], content: raw },
      ];
    }
    return [];
  }
}

function serializeNotes(notes: NoteEntry[]): string {
  return JSON.stringify(notes);
}

// ── Intervention Plans (contains correspondence) ──────────────────────────────

function parseInterventionPlans(raw: string): InterventionData {
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "parentCorrespondence" in parsed
    ) {
      return {
        interventions: parsed.interventions ?? "",
        parentCorrespondence: parsed.parentCorrespondence ?? [],
      };
    }
  } catch {
    // legacy plain text
  }
  return { interventions: raw, parentCorrespondence: [] };
}

function serializeInterventionPlans(data: InterventionData): string {
  return JSON.stringify(data);
}

// ── Method helpers ────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<ParentCorrespondenceEntry["method"], string> = {
  phone: "Phone Call",
  email: "Email",
  "in-person": "In-Person Meeting",
  "note-home": "Note Home",
};

const METHOD_BADGE_CLASS: Record<ParentCorrespondenceEntry["method"], string> =
  {
    phone:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
    email:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700",
    "in-person":
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
    "note-home":
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
  };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommunicationTab({ student }: CommunicationTabProps) {
  const updateStudent = useUpdateStudent();

  // ── Notes state ────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<NoteEntry[]>(() =>
    parseNotes(student.teacherNotes),
  );
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // ── Correspondence state ───────────────────────────────────────────────────
  const [corrData, setCorrData] = useState<InterventionData>(() =>
    parseInterventionPlans(student.interventionPlans),
  );
  const [isAddingCorr, setIsAddingCorr] = useState(false);
  const [corrGuardian, setCorrGuardian] = useState("");
  const [corrMethod, setCorrMethod] =
    useState<ParentCorrespondenceEntry["method"]>("phone");
  const [corrSummary, setCorrSummary] = useState("");
  const [corrOutcome, setCorrOutcome] = useState("");

  const isSaving = updateStudent.isPending;

  // ── Save helpers ───────────────────────────────────────────────────────────

  const saveNotes = async (updatedNotes: NoteEntry[]) => {
    await updateStudent.mutateAsync({
      studentId: student.studentId,
      givenNames: student.givenNames,
      familyName: student.familyName,
      preferredName: student.preferredName ?? null,
      gradeLevel: student.gradeLevel,
      photo: student.photo,
      accommodations: student.accommodations,
      allergies: student.allergies,
      medicalNotes: student.medicalNotes,
      attendanceRecords: student.attendanceRecords,
      guardianContacts: student.guardianContacts,
      teacherNotes: serializeNotes(updatedNotes),
      interventionPlans: serializeInterventionPlans(corrData),
      behaviorEntries: student.behaviorEntries,
    });
    setNotes(updatedNotes);
  };

  const saveCorrespondence = async (updatedCorr: InterventionData) => {
    await updateStudent.mutateAsync({
      studentId: student.studentId,
      givenNames: student.givenNames,
      familyName: student.familyName,
      preferredName: student.preferredName ?? null,
      gradeLevel: student.gradeLevel,
      photo: student.photo,
      accommodations: student.accommodations,
      allergies: student.allergies,
      medicalNotes: student.medicalNotes,
      attendanceRecords: student.attendanceRecords,
      guardianContacts: student.guardianContacts,
      teacherNotes: serializeNotes(notes),
      interventionPlans: serializeInterventionPlans(updatedCorr),
      behaviorEntries: student.behaviorEntries,
    });
    setCorrData(updatedCorr);
  };

  // ── Notes handlers ─────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    const newNote: NoteEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      content: newNoteContent.trim(),
    };
    await saveNotes([newNote, ...notes]);
    setNewNoteContent("");
    setIsAddingNote(false);
  };

  const handleEditNote = async (id: string) => {
    if (!editingContent.trim()) return;
    const updated = notes.map((n) =>
      n.id === id ? { ...n, content: editingContent.trim() } : n,
    );
    await saveNotes(updated);
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    await saveNotes(updated);
  };

  // ── Correspondence handlers ────────────────────────────────────────────────

  const resetCorrForm = () => {
    setCorrGuardian("");
    setCorrMethod("phone");
    setCorrSummary("");
    setCorrOutcome("");
    setIsAddingCorr(false);
  };

  const handleAddCorrespondence = async () => {
    if (!corrGuardian.trim() || !corrSummary.trim()) return;
    const entry: ParentCorrespondenceEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      guardianName: corrGuardian.trim(),
      method: corrMethod,
      summary: corrSummary.trim(),
      outcome: corrOutcome.trim(),
    };
    const updated: InterventionData = {
      ...corrData,
      parentCorrespondence: [entry, ...corrData.parentCorrespondence],
    };
    await saveCorrespondence(updated);
    resetCorrForm();
  };

  const handleDeleteCorrespondence = async (id: string) => {
    const updated: InterventionData = {
      ...corrData,
      parentCorrespondence: corrData.parentCorrespondence.filter(
        (e) => e.id !== id,
      ),
    };
    await saveCorrespondence(updated);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Guardian Contact Cards */}
      {student.guardianContacts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">
            Guardian Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {student.guardianContacts.map((guardian) => (
              <div
                key={String(guardian.id)}
                className="p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {guardian.firstName} {guardian.lastName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {guardian.relationship}
                  </Badge>
                </div>
                {guardian.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    {guardian.phone}
                  </div>
                )}
                {guardian.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    {guardian.email}
                  </div>
                )}
                {guardian.emergencyContact && (
                  <Badge
                    variant="outline"
                    className="text-xs mt-2 border-red-300 text-red-700 bg-red-50"
                  >
                    Emergency Contact
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Parent Correspondence ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Parent Correspondence
            </h3>
            {corrData.parentCorrespondence.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({corrData.parentCorrespondence.length})
              </span>
            )}
          </div>
          {!isAddingCorr && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCorr(true)}
              className="gap-1.5"
              data-ocid="communication.correspondence.add_button"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact Log
            </Button>
          )}
        </div>

        {/* Add Correspondence Form */}
        {isAddingCorr && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Guardian Name */}
              <div className="space-y-1.5">
                <Label className="text-xs">Guardian Name</Label>
                <Input
                  value={corrGuardian}
                  onChange={(e) => setCorrGuardian(e.target.value)}
                  placeholder="Guardian name..."
                  className="h-9 text-sm"
                  autoFocus
                  data-ocid="communication.correspondence.guardian_input"
                />
              </div>
              {/* Method */}
              <div className="space-y-1.5">
                <Label className="text-xs">Contact Method</Label>
                <Select
                  value={corrMethod}
                  onValueChange={(v) =>
                    setCorrMethod(v as ParentCorrespondenceEntry["method"])
                  }
                >
                  <SelectTrigger
                    className="h-9 text-sm"
                    data-ocid="communication.correspondence.method_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in-person">In-Person Meeting</SelectItem>
                    <SelectItem value="note-home">Note Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date — auto-filled, read-only */}
            <p className="text-xs text-muted-foreground">
              Date: Today, {todayFormatted()}
            </p>

            {/* Summary */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={corrSummary}
                onChange={(e) => setCorrSummary(e.target.value)}
                placeholder="Brief summary of the conversation..."
                rows={2}
                className="text-sm"
                data-ocid="communication.correspondence.summary_textarea"
              />
            </div>

            {/* Outcome */}
            <div className="space-y-1.5">
              <Label className="text-xs">Outcome / Next Steps</Label>
              <Textarea
                value={corrOutcome}
                onChange={(e) => setCorrOutcome(e.target.value)}
                placeholder="Next steps or outcome (optional)..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCorrForm}
                disabled={isSaving}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddCorrespondence}
                disabled={
                  isSaving || !corrGuardian.trim() || !corrSummary.trim()
                }
                className="gap-1.5"
                data-ocid="communication.correspondence.save_button"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Log
              </Button>
            </div>
          </div>
        )}

        {/* Correspondence List */}
        {corrData.parentCorrespondence.length === 0 && !isAddingCorr ? (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="communication.correspondence.empty_state"
          >
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No parent contact logged yet.</p>
            <p className="text-xs mt-0.5">
              Use "Add Contact Log" to record calls, emails, and meetings.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {corrData.parentCorrespondence.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-4 bg-muted/50 rounded-lg"
                data-ocid={`communication.correspondence.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-medium text-sm text-foreground">
                      {entry.guardianName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0 ${METHOD_BADGE_CLASS[entry.method]}`}
                    >
                      {METHOD_LABELS[entry.method]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCorrespondence(entry.id)}
                    disabled={isSaving}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    aria-label="Delete log entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground">{entry.summary}</p>
                {entry.outcome && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">
                    Outcome: {entry.outcome}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Teacher Notes ──────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Teacher Notes
            </h3>
            {notes.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({notes.length})
              </span>
            )}
          </div>
          {!isAddingNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Button>
          )}
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write a note about this student..."
              rows={3}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent("");
                }}
                disabled={isSaving}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={isSaving || !newNoteContent.trim()}
                className="gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 && !isAddingNote ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notes yet. Add your first note above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-muted/50 rounded-lg">
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingContent("");
                        }}
                        disabled={isSaving}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditNote(note.id)}
                        disabled={isSaving || !editingContent.trim()}
                        className="gap-1.5"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                        {note.content}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingContent(note.content);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isSaving}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {note.date}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Contact Info — when no guardian contacts on file */}
      {student.guardianContacts.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">
            Parent Contact
          </h3>
          <p className="text-sm text-muted-foreground">
            No guardian contacts on file. Add contacts in the Guardians tab.
          </p>
        </div>
      )}
    </div>
  );
}
