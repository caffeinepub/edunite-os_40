// ─── Communication Store ──────────────────────────────────────────────────────
// localStorage-backed store for sent messages, scheduled messages, and announcements.

const MESSAGES_KEY = "edunite_sent_messages";
const SCHEDULED_KEY = "edunite_scheduled_messages";
const ANNOUNCEMENTS_KEY = "edunite_announcements";

export interface ThreadEntry {
  id: string;
  date: string; // ISO
  from: "parent" | "teacher";
  body: string;
  outcome?: string;
}

export interface SentMessage {
  id: number;
  to: string;
  subject: string;
  body: string;
  sentAt: number;
  scheduledAt?: number; // if set, message was scheduled
  recipientCount: number;
  status: "sent" | "delivered" | "read";
  thread: ThreadEntry[];
}

export interface ScheduledMessage {
  id: number;
  to: string;
  subject: string;
  body: string;
  scheduledAt: number;
  recipientCount: number;
  templateId?: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  date: string;
  visibility: string;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  audienceType?: string;
  audienceCustomCount?: number;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function getMessages(): SentMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SentMessage>[];
    // Backfill missing fields for old records
    return parsed.map((m) => ({
      id: m.id ?? Date.now(),
      to: m.to ?? "",
      subject: m.subject ?? "",
      body: m.body ?? "",
      sentAt: m.sentAt ?? Date.now(),
      recipientCount: m.recipientCount ?? 0,
      status: m.status ?? "sent",
      thread: m.thread ?? [],
    }));
  } catch {
    return [];
  }
}

export function addMessage(
  to: string,
  subject: string,
  body: string,
  recipientCount: number,
  scheduledAt?: number,
): SentMessage {
  const messages = getMessages();
  const msg: SentMessage = {
    id: Date.now(),
    to,
    subject,
    body,
    sentAt: Date.now(),
    scheduledAt,
    recipientCount,
    status: "sent",
    thread: [],
  };
  localStorage.setItem(MESSAGES_KEY, JSON.stringify([...messages, msg]));
  return msg;
}

export function updateMessageStatus(
  messageId: number,
  status: SentMessage["status"],
): void {
  const messages = getMessages().map((m) =>
    m.id === messageId ? { ...m, status } : m,
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function addThreadEntry(messageId: number, entry: ThreadEntry): void {
  const messages = getMessages().map((m) =>
    m.id === messageId ? { ...m, thread: [...m.thread, entry] } : m,
  );
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// ─── Scheduled Messages ───────────────────────────────────────────────────────

export function getScheduledMessages(): ScheduledMessage[] {
  try {
    const raw = localStorage.getItem(SCHEDULED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledMessage[];
  } catch {
    return [];
  }
}

export function scheduleMessage(
  to: string,
  subject: string,
  body: string,
  recipientCount: number,
  scheduledAt: number,
  templateId?: string,
): ScheduledMessage {
  const scheduled = getScheduledMessages();
  const msg: ScheduledMessage = {
    id: Date.now(),
    to,
    subject,
    body,
    scheduledAt,
    recipientCount,
    templateId,
  };
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify([...scheduled, msg]));
  return msg;
}

export function cancelScheduledMessage(id: number): void {
  const scheduled = getScheduledMessages().filter((m) => m.id !== id);
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduled));
}

// ─── Announcements ────────────────────────────────────────────────────────────

export function getAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Announcement[];
  } catch {
    return [];
  }
}

export function addAnnouncement(
  title: string,
  body: string,
  visibility: string,
  pinned: boolean,
  audienceType?: string,
  audienceCustomCount?: number,
): Announcement {
  const announcements = getAnnouncements();
  const today = new Date().toISOString().split("T")[0];
  const ann: Announcement = {
    id: Date.now(),
    title,
    body,
    date: today,
    visibility,
    pinned,
    archived: false,
    createdAt: Date.now(),
    audienceType,
    audienceCustomCount,
  };
  localStorage.setItem(
    ANNOUNCEMENTS_KEY,
    JSON.stringify([...announcements, ann]),
  );
  return ann;
}

export function togglePin(id: number): void {
  const announcements = getAnnouncements().map((a) =>
    a.id === id ? { ...a, pinned: !a.pinned } : a,
  );
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
}

export function archiveAnnouncement(id: number): void {
  const announcements = getAnnouncements().map((a) =>
    a.id === id ? { ...a, archived: true } : a,
  );
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
}

export function deleteAnnouncement(id: number): void {
  const announcements = getAnnouncements().filter((a) => a.id !== id);
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
}
