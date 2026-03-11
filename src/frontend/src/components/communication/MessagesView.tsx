import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ScheduledMessage,
  type SentMessage,
  type ThreadEntry,
  addMessage,
  addThreadEntry,
  cancelScheduledMessage,
  getMessages,
  getScheduledMessages,
  scheduleMessage,
  updateMessageStatus,
} from "../../lib/communicationStore";
import MessageTemplates from "./MessageTemplates";

const CLASS_OPTIONS = [
  { value: "all_parents", label: "All Parents", count: 30 },
  { value: "period_1", label: "Period 1 \u2014 Biology", count: 8 },
  { value: "period_2", label: "Period 2 \u2014 Chemistry", count: 7 },
  { value: "period_3", label: "Period 3 \u2014 Physics", count: 8 },
  { value: "period_4", label: "Period 4 \u2014 Earth Science", count: 7 },
];

function getRecipientCount(to: string): number {
  return CLASS_OPTIONS.find((o) => o.value === to)?.count ?? 0;
}

function getRecipientLabel(to: string): string {
  return CLASS_OPTIONS.find((o) => o.value === to)?.label ?? to;
}

/** Advance status based on elapsed time and persist changes. */
function advanceStatuses(messages: SentMessage[]): SentMessage[] {
  const now = Date.now();
  return messages.map((m) => {
    if (m.status === "sent" && now - m.sentAt > 30000) {
      updateMessageStatus(m.id, "delivered");
      return { ...m, status: "delivered" as const };
    }
    if (m.status === "delivered" && now - m.sentAt > 120000) {
      updateMessageStatus(m.id, "read");
      return { ...m, status: "read" as const };
    }
    return m;
  });
}

function StatusBadge({ status }: { status: SentMessage["status"] }) {
  if (status === "read")
    return (
      <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        Read
      </Badge>
    );
  if (status === "delivered")
    return (
      <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        Delivered
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      Sent
    </Badge>
  );
}

function ThreadEntryRow({ entry }: { entry: ThreadEntry }) {
  const isTeacher = entry.from === "teacher";
  return (
    <div
      className={`flex gap-2 ${isTeacher ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
          isTeacher
            ? "bg-primary/10 border border-primary/20 text-right"
            : "bg-muted text-foreground border border-border"
        }`}
      >
        <p className="font-medium text-xs mb-0.5 text-muted-foreground">
          {isTeacher ? "You" : "Parent"} \u00b7{" "}
          {format(new Date(entry.date), "MMM d, h:mm a")}
        </p>
        <p className="leading-relaxed text-foreground">{entry.body}</p>
        {entry.outcome && (
          <p className="text-xs mt-1 text-muted-foreground italic">
            Outcome: {entry.outcome}
          </p>
        )}
      </div>
    </div>
  );
}

function ReplyForm({
  messageId,
  onSaved,
}: {
  messageId: number;
  onSaved: () => void;
}) {
  const [from, setFrom] = useState<"parent" | "teacher">("parent");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    if (!body.trim()) {
      setError("Reply text is required.");
      return;
    }
    const entry: ThreadEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      from,
      body: body.trim(),
      outcome: outcome.trim() || undefined,
    };
    addThreadEntry(messageId, entry);
    setBody("");
    setOutcome("");
    setError("");
    onSaved();
    toast.success("Reply note added");
  }

  return (
    <div
      className="bg-muted/20 border border-border/60 rounded-lg p-3 space-y-2.5"
      data-ocid="communication.messages.reply.panel"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Add Reply Note
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setFrom("parent")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            from === "parent"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          data-ocid="communication.messages.reply.from-parent.toggle"
        >
          From Parent
        </button>
        <button
          type="button"
          onClick={() => setFrom("teacher")}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            from === "teacher"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          data-ocid="communication.messages.reply.from-teacher.toggle"
        >
          From Me
        </button>
      </div>

      <Textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError("");
        }}
        placeholder="Log what was said..."
        rows={2}
        className="text-sm resize-none"
        data-ocid="communication.messages.reply.textarea"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        type="text"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        placeholder="Outcome (optional)"
        className="w-full h-8 px-3 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        data-ocid="communication.messages.reply.outcome.input"
      />

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleSave}
          data-ocid="communication.messages.reply.save.button"
        >
          Save Note
        </Button>
      </div>
    </div>
  );
}

function SentMessageRow({
  msg,
  index,
  onRefresh,
}: {
  msg: SentMessage;
  index: number;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-b border-border/40 last:border-0"
      data-ocid={`communication.messages.sent.item.${index + 1}`}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded((prev) => !prev)}
        data-ocid={`communication.messages.sent.row.${index + 1}`}
      >
        <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto_auto] items-center gap-3">
          <span className="text-sm font-medium text-foreground truncate">
            {msg.to}
          </span>
          <span className="text-sm text-muted-foreground truncate">
            {msg.subject}
          </span>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {msg.recipientCount} parent{msg.recipientCount !== 1 ? "s" : ""}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(msg.sentAt), "MMM d, h:mm a")}
          </span>
          <StatusBadge status={msg.status} />
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 bg-muted/10">
          <div className="pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Message
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {msg.body}
            </p>
          </div>

          {msg.thread.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Thread ({msg.thread.length})
              </p>
              <div className="space-y-2">
                {msg.thread.map((entry) => (
                  <ThreadEntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          <ReplyForm messageId={msg.id} onSaved={onRefresh} />
        </div>
      )}
    </div>
  );
}

export default function MessagesView() {
  const [to, setTo] = useState("all_parents");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("08:00");

  // Status advancement is done eagerly in the initializer — no useEffect needed
  const [sentMessages, setSentMessages] = useState<SentMessage[]>(() =>
    advanceStatuses(getMessages().sort((a, b) => b.sentAt - a.sentAt)),
  );
  const [scheduledMessages, setScheduledMessages] = useState<
    ScheduledMessage[]
  >(() => getScheduledMessages().sort((a, b) => a.scheduledAt - b.scheduledAt));
  const [errors, setErrors] = useState<{
    subject?: string;
    body?: string;
    scheduleDate?: string;
  }>({});

  function refreshMessages() {
    setSentMessages(
      advanceStatuses(getMessages().sort((a, b) => b.sentAt - a.sentAt)),
    );
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!body.trim()) newErrors.body = "Message body is required.";
    if (scheduleEnabled && !scheduleDate)
      newErrors.scheduleDate = "Please choose a date.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleTemplateSelect(tplSubject: string, tplBody: string) {
    setSubject(tplSubject);
    setBody(tplBody);
    setErrors((p) => ({ ...p, subject: undefined, body: undefined }));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const recipientCount = getRecipientCount(to);
    const label = getRecipientLabel(to);

    if (scheduleEnabled && scheduleDate) {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
      const sm = scheduleMessage(
        label,
        subject.trim(),
        body.trim(),
        recipientCount,
        scheduledAt,
      );
      setScheduledMessages((prev) =>
        [...prev, sm].sort((a, b) => a.scheduledAt - b.scheduledAt),
      );
      toast.success(
        `Message scheduled for ${format(new Date(scheduledAt), "MMM d 'at' h:mm a")}`,
      );
    } else {
      setIsSending(true);
      await new Promise((r) => setTimeout(r, 600));
      const msg = addMessage(
        label,
        subject.trim(),
        body.trim(),
        recipientCount,
      );
      setSentMessages((prev) => [msg, ...prev]);
      toast.success(
        `Message sent to ${recipientCount} recipient${
          recipientCount !== 1 ? "s" : ""
        }`,
      );
      setIsSending(false);
    }

    setSubject("");
    setBody("");
    setScheduleEnabled(false);
    setScheduleDate("");
    setScheduleTime("08:00");
    setErrors({});
  }

  function handleCancelScheduled(id: number) {
    cancelScheduledMessage(id);
    setScheduledMessages(
      getScheduledMessages().sort((a, b) => a.scheduledAt - b.scheduledAt),
    );
    toast.success("Scheduled message cancelled");
  }

  return (
    <div className="space-y-6">
      {/* Compose Form */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Compose Message
            </h3>
          </div>
        </div>
        <form onSubmit={handleSend} className="px-5 py-4 space-y-4">
          {/* Templates */}
          <MessageTemplates onSelect={handleTemplateSelect} />

          {/* To */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              To
            </Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="communication.messages.to.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {CLASS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      {opt.label}
                      <span className="text-muted-foreground text-xs">
                        ({opt.count} parents)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Subject
            </Label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject)
                  setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="e.g. Upcoming field trip \u2014 permission slip required"
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-ocid="communication.messages.subject.input"
            />
            {errors.subject && (
              <p
                className="text-xs text-destructive"
                data-ocid="communication.messages.subject.error_state"
              >
                {errors.subject}
              </p>
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
              placeholder="Type your message here..."
              rows={5}
              className="text-sm resize-none"
              data-ocid="communication.messages.body.textarea"
            />
            {errors.body && (
              <p
                className="text-xs text-destructive"
                data-ocid="communication.messages.body.error_state"
              >
                {errors.body}
              </p>
            )}
          </div>

          {/* Schedule toggle */}
          <div className="space-y-2">
            <label
              className="flex items-center gap-2 cursor-pointer w-fit"
              data-ocid="communication.messages.schedule.toggle"
            >
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => {
                  setScheduleEnabled(e.target.checked);
                  if (!e.target.checked)
                    setErrors((p) => ({ ...p, scheduleDate: undefined }));
                }}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span className="text-sm text-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Schedule for later
              </span>
            </label>

            {scheduleEnabled && (
              <div className="flex items-start gap-3 pl-5">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => {
                      setScheduleDate(e.target.value);
                      setErrors((p) => ({ ...p, scheduleDate: undefined }));
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-8 px-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-ocid="communication.messages.schedule-date.input"
                  />
                  {errors.scheduleDate && (
                    <p className="text-xs text-destructive">
                      {errors.scheduleDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-8 px-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    data-ocid="communication.messages.schedule-time.input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Sending to {getRecipientCount(to)} parent
              {getRecipientCount(to) !== 1 ? "s" : ""}
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={isSending}
              className="gap-1.5"
              data-ocid="communication.messages.send.button"
            >
              {isSending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending\u2026
                </>
              ) : scheduleEnabled ? (
                <>
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Scheduled Queue */}
      {scheduledMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Scheduled</h3>
            <Badge variant="secondary" className="text-xs">
              {scheduledMessages.length}
            </Badge>
          </div>
          <div
            className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border/40"
            data-ocid="communication.messages.scheduled.list"
          >
            {scheduledMessages.map((sm, i) => (
              <div
                key={sm.id}
                className="flex items-center gap-3 px-4 py-3"
                data-ocid={`communication.messages.scheduled.item.${i + 1}`}
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sm.to}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sm.subject}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(sm.scheduledAt), "MMM d 'at' h:mm a")}
                </span>
                <button
                  type="button"
                  onClick={() => handleCancelScheduled(sm.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  data-ocid={`communication.messages.scheduled.cancel.button.${i + 1}`}
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Messages */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Sent Messages
          </h3>
          {sentMessages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {sentMessages.length}
            </Badge>
          )}
        </div>

        {sentMessages.length === 0 ? (
          <div
            className="py-10 text-center text-muted-foreground"
            data-ocid="communication.messages.sent.empty_state"
          >
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm font-medium">No messages sent yet</p>
            <p className="text-xs mt-1 opacity-70">
              Composed messages will appear here after sending.
            </p>
          </div>
        ) : (
          <div
            className="bg-card border border-border rounded-lg overflow-hidden"
            data-ocid="communication.messages.sent.table"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto_auto] gap-3 px-4 py-2 border-b border-border bg-muted/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                To
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Subject
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recipients
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Sent
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </span>
            </div>
            {sentMessages.map((msg, i) => (
              <SentMessageRow
                key={msg.id}
                msg={msg}
                index={i}
                onRefresh={refreshMessages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
