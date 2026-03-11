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
import { X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import {
  BehaviorCategory,
  BehaviorEntryType,
  BehaviorSeverity,
} from "../../backend";
import { useAddBehaviorLog, useStudentRoster } from "../../hooks/useQueries";
import ActionTakenMultiSelect, {
  serializeActionTaken,
} from "./ActionTakenMultiSelect";
import {
  BehaviorSearchSelect,
  type BehaviorSelection,
} from "./BehaviorSearchSelect";

interface Props {
  open: boolean;
  onClose: () => void;
  prefillStudentName?: string;
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

function getCurrentPeriodFromTimetable(): string {
  try {
    const raw = localStorage.getItem("edunite_timetable");
    if (!raw) return "Period 1";
    const timetable = JSON.parse(raw);
    if (!timetable?.periods?.length) return "Period 1";
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][now.getDay()];
    const assignments = timetable.assignments || [];
    const todayAssignments = assignments.filter(
      (a: { day: string }) => a.day === today,
    );
    const todayPeriodIds = new Set(
      todayAssignments.map((a: { periodId: string }) => a.periodId),
    );
    const activePeriod = timetable.periods.find(
      (p: { id: string; startTime: string; endTime: string }) => {
        if (todayPeriodIds.size > 0 && !todayPeriodIds.has(p.id)) return false;
        const [sh, sm] = p.startTime.split(":").map(Number);
        const [eh, em] = p.endTime.split(":").map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        return currentMinutes >= start && currentMinutes <= end;
      },
    );
    return activePeriod ? activePeriod.name : "Period 1";
  } catch {
    return "Period 1";
  }
}

export default function QuickLogBehaviorForm({
  open,
  onClose,
  prefillStudentName,
}: Props) {
  const addBehaviorLog = useAddBehaviorLog();
  const { data: roster = [] } = useStudentRoster();

  const [studentName, setStudentName] = useState(prefillStudentName ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entryType, setEntryType] = useState<BehaviorEntryType>(
    BehaviorEntryType.incident,
  );

  // Behavior selection (behavior-first)
  const [selectedBehavior, setSelectedBehavior] = useState<string>("");
  const [category, setCategory] = useState<BehaviorCategory>(
    BehaviorCategory.academic,
  );
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);

  const [context, setContext] = useState(() => getCurrentPeriodFromTimetable());
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BehaviorSeverity>(
    BehaviorSeverity.minor,
  );
  const [actionTakenValues, setActionTakenValues] = useState<string[]>([]);
  const [actionTakenCustom, setActionTakenCustom] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleBehaviorSelect = (selection: BehaviorSelection | null) => {
    if (!selection) {
      setSelectedBehavior("");
      if (!categoryManuallySet) setCategory(BehaviorCategory.academic);
      return;
    }
    setSelectedBehavior(selection.behavior);
    // Auto-assign category from selection (unless user manually overrode it)
    setCategory(selection.category);
    setCategoryManuallySet(false);
    // Pre-fill description
    if (selection.description) {
      setDescription(selection.description);
    }
    // Auto-suggest severity for incidents
    if (
      entryType === BehaviorEntryType.incident &&
      selection.severity !== undefined
    ) {
      setSeverity(selection.severity);
    }
  };

  useEffect(() => {
    if (open) {
      setStudentName(prefillStudentName ?? "");
      setEntryType(BehaviorEntryType.incident);
      setCategory(BehaviorCategory.academic);
      setCategoryManuallySet(false);
      setSelectedBehavior("");
      setContext(getCurrentPeriodFromTimetable());
      setDescription("");
      setSeverity(BehaviorSeverity.minor);
      setActionTakenValues([]);
      setActionTakenCustom("");
      setFollowUpNeeded(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, prefillStudentName]);

  const filteredRoster = roster.filter(
    (name) =>
      name.toLowerCase().includes(studentName.toLowerCase()) &&
      name !== studentName,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !description.trim() || !context) return;

    const resolvedAction = serializeActionTaken(
      entryType,
      actionTakenValues,
      actionTakenCustom,
    );

    await addBehaviorLog.mutateAsync({
      studentName: studentName.trim(),
      entryType,
      category,
      context,
      description: description.trim(),
      severity: entryType === BehaviorEntryType.incident ? severity : null,
      actionTaken: resolvedAction || null,
      followUpNeeded:
        entryType === BehaviorEntryType.incident ? followUpNeeded : false,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          Log Behavior Entry
          <Badge variant="secondary" className="text-xs font-normal">
            ~15 sec
          </Badge>
        </CardTitle>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent className="pt-0 pb-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Section 1: Who & When ── */}
          <div>
            <SectionLabel>Who &amp; When</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Name with autocomplete */}
              <div className="space-y-1.5 relative">
                <Label>
                  Student <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={inputRef}
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  placeholder="Type student name..."
                  required
                  autoComplete="off"
                  data-ocid="behavior.quicklog.input"
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

              {/* Entry Type toggle buttons */}
              <div className="space-y-1.5">
                <Label>
                  Type <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType(BehaviorEntryType.incident);
                      setSelectedBehavior("");
                      setDescription("");
                    }}
                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                      entryType === BehaviorEntryType.incident
                        ? "bg-destructive/10 border-destructive/40 text-destructive"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-ocid="behavior.quicklog.type_incident.button"
                  >
                    Incident
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType(BehaviorEntryType.praise);
                      setSelectedBehavior("");
                      setDescription("");
                    }}
                    className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                      entryType === BehaviorEntryType.praise
                        ? "bg-success/10 border-success/40 text-success"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-ocid="behavior.quicklog.type_praise.button"
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
            <div className="space-y-4">
              {/* Behavior Search — behavior-first, category auto-assigned */}
              <div className="space-y-1.5">
                <Label>
                  Behavior{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (search or browse — category is auto-assigned)
                  </span>
                </Label>
                <BehaviorSearchSelect
                  entryType={entryType}
                  value={selectedBehavior}
                  onSelect={handleBehaviorSelect}
                  placeholder={`Search ${entryType === BehaviorEntryType.incident ? "incident" : "praise"} behaviors...`}
                  dataOcid="behavior.quicklog.behavior_select"
                />
                {/* Show auto-assigned category as badge with optional override */}
                {selectedBehavior && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Category:
                    </span>
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v as BehaviorCategory);
                        setCategoryManuallySet(true);
                      }}
                    >
                      <SelectTrigger
                        className="h-6 text-xs px-2 py-0 w-auto min-w-[140px] border-primary/30 bg-primary/5 text-primary"
                        data-ocid="behavior.quicklog.category_select"
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
                    <span className="text-xs text-muted-foreground">
                      (tap to override)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Where / When */}
                <div className="space-y-1.5">
                  <Label>
                    Where / When <span className="text-destructive">*</span>
                  </Label>
                  <Select value={context} onValueChange={setContext} required>
                    <SelectTrigger data-ocid="behavior.quicklog.context_select">
                      <SelectValue placeholder="Where / when did this happen?" />
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

                {/* Category override — shown only when no behavior selected yet */}
                {!selectedBehavior && (
                  <div className="space-y-1.5">
                    <Label>
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v as BehaviorCategory);
                        setCategoryManuallySet(true);
                      }}
                    >
                      <SelectTrigger data-ocid="behavior.quicklog.category_select">
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
                )}
              </div>

              {/* Description — full width */}
              <div className="space-y-1.5">
                <Label>
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? Be specific..."
                  rows={3}
                  required
                  data-ocid="behavior.quicklog.description_textarea"
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Incident Details (conditional) ── */}
          {entryType === BehaviorEntryType.incident && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-4">
              <SectionLabel>Incident Details</SectionLabel>
              <div className="space-y-4">
                {/* Severity — single row */}
                <div className="space-y-1.5 max-w-[200px]">
                  <Label>
                    Severity
                    {selectedBehavior && (
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        (auto-suggested)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v as BehaviorSeverity)}
                  >
                    <SelectTrigger data-ocid="behavior.quicklog.severity_select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Taken — full width multi-select panel */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
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
                    id="quicklog-followup"
                    checked={followUpNeeded}
                    onCheckedChange={(v) => setFollowUpNeeded(!!v)}
                    data-ocid="behavior.quicklog.followup_checkbox"
                  />
                  <Label
                    htmlFor="quicklog-followup"
                    className="cursor-pointer text-sm"
                  >
                    Follow-up needed
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                addBehaviorLog.isPending ||
                !studentName.trim() ||
                !description.trim() ||
                !context
              }
              data-ocid="behavior.quicklog.submit_button"
            >
              {addBehaviorLog.isPending ? "Saving..." : "Log Behavior"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
