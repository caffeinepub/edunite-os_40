import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import React, { useState, useEffect } from "react";
import {
  type BehaviorCategory,
  BehaviorEntryType,
  type BehaviorLog,
  type BehaviorSeverity,
} from "../../backend";
import { useUpdateBehaviorLog } from "../../hooks/useQueries";
import ActionTakenMultiSelect, {
  serializeActionTaken,
  parseActionTaken,
} from "./ActionTakenMultiSelect";
import {
  BehaviorSearchSelect,
  type BehaviorSelection,
} from "./BehaviorSearchSelect";

interface Props {
  log: BehaviorLog;
  onClose: () => void;
}

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

/** Lightweight section divider with an uppercase label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">
        {children}
      </span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

export default function EditBehaviorLogInlineForm({ log, onClose }: Props) {
  const updateBehaviorLog = useUpdateBehaviorLog();

  const [studentName, setStudentName] = useState(log.studentName);
  const [entryType, setEntryType] = useState<BehaviorEntryType>(log.entryType);
  const [category, setCategory] = useState<BehaviorCategory>(log.category);
  const [selectedBehavior, setSelectedBehavior] = useState<string>("");
  const [context, setContext] = useState(log.context);
  const [description, setDescription] = useState(log.description);
  const [severity, setSeverity] = useState<BehaviorSeverity | "">(
    log.severity ?? "",
  );
  const [actionTakenValues, setActionTakenValues] = useState<string[]>(
    () => parseActionTaken(log.actionTaken).values,
  );
  const [actionTakenCustom, setActionTakenCustom] = useState(
    () => parseActionTaken(log.actionTaken).customText,
  );
  const [followUpNeeded, setFollowUpNeeded] = useState(log.followUpNeeded);

  useEffect(() => {
    setStudentName(log.studentName);
    setEntryType(log.entryType);
    setCategory(log.category);
    setSelectedBehavior("");
    setContext(log.context);
    setDescription(log.description);
    setSeverity(log.severity ?? "");
    const parsed = parseActionTaken(log.actionTaken);
    setActionTakenValues(parsed.values);
    setActionTakenCustom(parsed.customText);
    setFollowUpNeeded(log.followUpNeeded);
  }, [log]);

  const handleBehaviorSelect = (selection: BehaviorSelection | null) => {
    if (!selection) {
      setSelectedBehavior("");
      return;
    }
    setSelectedBehavior(selection.behavior);
    setCategory(selection.category);
    if (selection.description) {
      setDescription(selection.description);
    }
    if (
      entryType === BehaviorEntryType.incident &&
      selection.severity !== undefined
    ) {
      setSeverity(selection.severity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !studentName.trim()) return;

    const resolvedAction = serializeActionTaken(
      entryType,
      actionTakenValues,
      actionTakenCustom,
    );

    await updateBehaviorLog.mutateAsync({
      entryId: log.entryId,
      studentName: studentName.trim(),
      entryType,
      category,
      context,
      description: description.trim(),
      severity:
        entryType === BehaviorEntryType.incident && severity
          ? (severity as BehaviorSeverity)
          : null,
      actionTaken: resolvedAction || null,
      followUpNeeded:
        entryType === BehaviorEntryType.incident ? followUpNeeded : false,
    });
    onClose();
  };

  return (
    <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Who & When ── */}
        <div>
          <SectionLabel>Who &amp; When</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Student Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Student <span className="text-destructive">*</span>
              </Label>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name"
                required
                className="h-8 text-sm"
                data-ocid="behavior.edit.student_input"
              />
            </div>

            {/* Entry Type */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Type <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType(BehaviorEntryType.incident);
                    setSelectedBehavior("");
                  }}
                  className={`flex-1 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
                    entryType === BehaviorEntryType.incident
                      ? "bg-destructive/10 border-destructive/40 text-destructive"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-ocid="behavior.edit.type_incident.button"
                >
                  Incident
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType(BehaviorEntryType.praise);
                    setSelectedBehavior("");
                  }}
                  className={`flex-1 h-8 px-3 rounded-md border text-xs font-medium transition-colors ${
                    entryType === BehaviorEntryType.praise
                      ? "bg-success/10 border-success/40 text-success"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-ocid="behavior.edit.type_praise.button"
                >
                  Praise
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: What Happened ── */}
        <div>
          <SectionLabel>What Happened</SectionLabel>
          <div className="space-y-3">
            {/* Behavior search — behavior-first */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Behavior{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (search to change — category auto-assigns)
                </span>
              </Label>
              <BehaviorSearchSelect
                entryType={entryType}
                value={selectedBehavior}
                onSelect={handleBehaviorSelect}
                placeholder="Search to update behavior..."
                dataOcid="behavior.edit.behavior_select"
              />
              {/* Show auto-assigned category as compact inline row */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Category:</span>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as BehaviorCategory)}
                >
                  <SelectTrigger
                    className="h-6 text-xs px-2 py-0 w-auto min-w-[140px] border-primary/30 bg-primary/5 text-primary"
                    data-ocid="behavior.edit.category_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="respect">Respect</SelectItem>
                    <SelectItem value="responsibility">
                      Responsibility
                    </SelectItem>
                    <SelectItem value="emotional_regulation">
                      Emotional Regulation
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Where / When */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Where / When <span className="text-destructive">*</span>
              </Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="behavior.edit.context_select"
                >
                  <SelectValue placeholder="Where / when did this happen?" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {CONTEXT_OPTIONS.map((group) => (
                    <React.Fragment key={group.group}>
                      <SelectItem
                        value={`__group_${group.group}`}
                        disabled
                        className="font-semibold text-xs text-muted-foreground"
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

            {/* Description — full width */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened?"
                rows={3}
                required
                className="text-sm"
                data-ocid="behavior.edit.description_textarea"
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Incident Details (conditional) ── */}
        {entryType === BehaviorEntryType.incident && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-4">
            <SectionLabel>Incident Details</SectionLabel>
            <div className="space-y-3">
              {/* Severity — single row */}
              <div className="space-y-1.5 max-w-[200px]">
                <Label className="text-xs">
                  Severity
                  {selectedBehavior && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      (auto-suggested)
                    </span>
                  )}
                </Label>
                <Select
                  value={severity || "minor"}
                  onValueChange={(v) => setSeverity(v as BehaviorSeverity)}
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="behavior.edit.severity_select"
                  >
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Taken — full-width multi-select */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  Action Taken
                  {actionTakenValues.filter((v) => v !== "custom").length >
                    0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal px-1.5 py-0"
                    >
                      {actionTakenValues.filter((v) => v !== "custom").length}
                    </Badge>
                  )}
                </Label>
                <ActionTakenMultiSelect
                  entryType={entryType}
                  selectedValues={actionTakenValues}
                  onChange={setActionTakenValues}
                  customText={actionTakenCustom}
                  onCustomTextChange={setActionTakenCustom}
                />
              </div>

              {/* Follow-up */}
              <div className="flex items-center gap-2 pt-0.5">
                <Checkbox
                  id="edit-followup"
                  checked={followUpNeeded}
                  onCheckedChange={(v) => setFollowUpNeeded(!!v)}
                  data-ocid="behavior.edit.followup_checkbox"
                />
                <Label
                  htmlFor="edit-followup"
                  className="cursor-pointer text-sm"
                >
                  Follow-up needed
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={updateBehaviorLog.isPending}
            data-ocid="behavior.edit.save_button"
          >
            {updateBehaviorLog.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            data-ocid="behavior.edit.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
