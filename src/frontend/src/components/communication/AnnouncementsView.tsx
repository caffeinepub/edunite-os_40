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
import { format } from "date-fns";
import {
  Archive,
  ChevronDown,
  Eye,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGetAllStudents } from "../../hooks/useQueries";
import {
  type Announcement,
  addAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  togglePin,
} from "../../lib/communicationStore";

const VISIBILITY_OPTIONS = [
  { value: "all", label: "All Classes" },
  { value: "period_1", label: "Period 1 — Biology" },
  { value: "period_2", label: "Period 2 — Chemistry" },
  { value: "period_3", label: "Period 3 — Physics" },
  { value: "period_4", label: "Period 4 — Earth Science" },
];

type AudienceType =
  | "all_students"
  | "failing"
  | "at_risk"
  | "iep_504"
  | "custom";

const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: "all_students", label: "All Students" },
  { value: "failing", label: "Failing Students (grade < 70%)" },
  { value: "at_risk", label: "At-Risk Students" },
  { value: "iep_504", label: "Students with IEP/504" },
  { value: "custom", label: "Custom Selection…" },
];

function getAudienceBadgeLabel(
  audienceType: AudienceType,
  customCount?: number,
): string {
  switch (audienceType) {
    case "all_students":
      return "All Students";
    case "failing":
      return "Failing Students";
    case "at_risk":
      return "At-Risk Students";
    case "iep_504":
      return "IEP/504 Students";
    case "custom":
      return customCount !== undefined
        ? `Custom (${customCount} students)`
        : "Custom";
  }
}

function getVisibilityLabel(value: string): string {
  return VISIBILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function getVisibilityBadgeClass(value: string): string {
  if (value === "all") return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
}

/** Stable simulated view percentage derived from announcement id */
function getViewedPercent(id: number): number {
  return (id % 31) + 60;
}

/** Simulated parent count */
function getSentCount(visibility: string): number {
  return visibility === "all" ? 30 : 25;
}

export default function AnnouncementsView() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [pinned, setPinned] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  // Audience targeting
  const [audienceType, setAudienceType] =
    useState<AudienceType>("all_students");
  const [customStudentIds, setCustomStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [studentSearch, setStudentSearch] = useState("");
  const { data: allStudents = [] } = useGetAllStudents();

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return allStudents;
    const q = studentSearch.toLowerCase();
    return allStudents.filter(
      (s) =>
        `${s.givenNames} ${s.familyName}`.toLowerCase().includes(q) ||
        s.preferredName?.toLowerCase().includes(q),
    );
  }, [allStudents, studentSearch]);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    return getAnnouncements()
      .filter((a) => !a.archived)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  function refreshList() {
    setAnnouncements(
      getAnnouncements()
        .filter((a) => !a.archived)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.createdAt - a.createdAt;
        }),
    );
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!body.trim()) newErrors.body = "Body is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsPosting(true);
    await new Promise((r) => setTimeout(r, 300));

    addAnnouncement(
      title.trim(),
      body.trim(),
      visibility,
      pinned,
      audienceType,
      audienceType === "custom" ? customStudentIds.size : undefined,
    );
    setTitle("");
    setBody("");
    setVisibility("all");
    setPinned(false);
    setAudienceType("all_students");
    setCustomStudentIds(new Set());
    setStudentSearch("");
    setErrors({});
    setIsPosting(false);
    refreshList();

    const audienceLabel = getAudienceBadgeLabel(
      audienceType,
      customStudentIds.size,
    );
    toast.success(`Announcement posted — sent to: ${audienceLabel}`);
  }

  function handleTogglePin(id: number) {
    togglePin(id);
    refreshList();
  }

  function handleArchive(id: number) {
    archiveAnnouncement(id);
    refreshList();
    toast.success("Announcement archived");
  }

  function handleDelete(id: number) {
    deleteAnnouncement(id);
    setConfirmDeleteId(null);
    refreshList();
    toast.success("Announcement deleted");
  }

  return (
    <div className="space-y-6">
      {/* Compose Form */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              New Announcement
            </h3>
          </div>
        </div>
        <form onSubmit={handlePost} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Title
            </Label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="e.g. School carnival this Friday!"
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid="communication.announcements.title.input"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((p) => ({ ...p, body: undefined }));
              }}
              placeholder="Write your announcement..."
              rows={3}
              className="text-sm resize-none"
              data-ocid="communication.announcements.body.textarea"
            />
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body}</p>
            )}
          </div>

          {/* Audience targeting */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Audience
            </Label>
            <Select
              value={audienceType}
              onValueChange={(v) => {
                setAudienceType(v as AudienceType);
                setCustomStudentIds(new Set());
              }}
            >
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="communication.announcements.audience.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom student multi-select */}
            {audienceType === "custom" && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {customStudentIds.size > 0
                      ? `${customStudentIds.size} student${customStudentIds.size !== 1 ? "s" : ""} selected`
                      : "Select students"}
                  </span>
                  {customStudentIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomStudentIds(new Set())}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                <div className="px-3 py-2 border-b border-border">
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-7 text-xs"
                    data-ocid="communication.announcements.audience.search_input"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto p-1.5 space-y-0.5">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No students found
                    </p>
                  ) : (
                    filteredStudents.map((student) => {
                      const id = student.studentId;
                      const checked = customStudentIds.has(id);
                      const checkId2 = `audience-student-${id}`;
                      const name = `${student.givenNames}${student.preferredName ? ` "${student.preferredName}"` : ""} ${student.familyName}`;
                      return (
                        <label
                          key={id}
                          htmlFor={checkId2}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            id={checkId2}
                            checked={checked}
                            onCheckedChange={(v) => {
                              setCustomStudentIds((prev) => {
                                const next = new Set(prev);
                                if (v) next.add(id);
                                else next.delete(id);
                                return next;
                              });
                            }}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm text-foreground">
                            {name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visibility + Pinned row */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Visibility
              </Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label
              htmlFor="pinned-checkbox"
              className="flex items-center gap-2 cursor-pointer pb-2"
            >
              <Checkbox
                id="pinned-checkbox"
                checked={pinned}
                onCheckedChange={(v) => setPinned(!!v)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm text-foreground">Pin to top</span>
            </label>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={isPosting}
              className="gap-1.5"
              data-ocid="communication.announcements.post.button"
            >
              {isPosting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Posting…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Post Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Announcement List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Active Announcements
          </h3>
          {announcements.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {announcements.length}
            </Badge>
          )}
        </div>

        {announcements.length === 0 ? (
          <div
            className="py-10 text-center text-muted-foreground"
            data-ocid="communication.announcements.list.empty_state"
          >
            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm font-medium">No announcements yet</p>
            <p className="text-xs mt-1 opacity-70">
              Post an announcement above — it will appear on the dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((ann, i) => {
              const sentCount = getSentCount(ann.visibility);
              const viewedPct = getViewedPercent(ann.id);
              return (
                <div
                  key={ann.id}
                  className={`bg-card border rounded-lg px-4 py-3.5 transition-colors ${
                    ann.pinned
                      ? "border-primary/30 bg-primary/5"
                      : "border-border"
                  }`}
                  data-ocid={`communication.announcements.list.item.${i + 1}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Pin indicator */}
                    {ann.pinned && (
                      <Pin className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title + visibility + date row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {ann.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0 ${getVisibilityBadgeClass(ann.visibility)}`}
                        >
                          {getVisibilityLabel(ann.visibility)}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                          {format(new Date(ann.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>

                      {/* Delivery stat chips */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 border border-border rounded-full px-2 py-0.5">
                          <Send className="h-2.5 w-2.5" />
                          Sent to {sentCount} parents
                        </span>
                        {ann.audienceType &&
                          ann.audienceType !== "all_students" && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                              <Users className="h-2.5 w-2.5" />
                              {getAudienceBadgeLabel(
                                ann.audienceType as AudienceType,
                                ann.audienceCustomCount,
                              )}
                            </span>
                          )}
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor: "oklch(0.95 0.05 145)",
                            color: "oklch(0.35 0.14 145)",
                            border: "1px solid oklch(0.82 0.1 145)",
                          }}
                        >
                          <Eye className="h-2.5 w-2.5" />
                          {viewedPct}% viewed
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {ann.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2.5 ml-auto justify-end">
                    {confirmDeleteId === ann.id ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-destructive font-medium">
                          Delete?
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleDelete(ann.id)}
                          data-ocid={`communication.announcements.confirm_button.${i + 1}`}
                        >
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                          data-ocid={`communication.announcements.cancel_button.${i + 1}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(ann.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            ann.pinned
                              ? "text-primary bg-primary/10 hover:bg-primary/15"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                          title={ann.pinned ? "Unpin" : "Pin to top"}
                          data-ocid={`communication.announcements.pin.button.${i + 1}`}
                        >
                          {ann.pinned ? (
                            <PinOff className="h-3 w-3" />
                          ) : (
                            <Pin className="h-3 w-3" />
                          )}
                          {ann.pinned ? "Unpin" : "Pin"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleArchive(ann.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Archive"
                        >
                          <Archive className="h-3 w-3" />
                          Archive
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ann.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                          data-ocid={`communication.announcements.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
