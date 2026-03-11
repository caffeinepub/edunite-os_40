import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { format, isAfter, subDays } from "date-fns";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Clock,
  Megaphone,
  Pin,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { BehaviorEntryType, BehaviorSeverity } from "../backend";
import {
  useAllAssessments,
  useAllAssignments,
  useBehaviorLogs,
  useGetAllStudents,
  useGetCourses,
} from "../hooks/useQueries";
import { getAnnouncements } from "../lib/communicationStore";

function formatLogDate(ts: bigint): string {
  return format(new Date(Number(ts) / 1_000_000), "MMM d, yyyy");
}

export default function Dashboard() {
  const { data: students = [], isLoading: studentsLoading } =
    useGetAllStudents();
  const { data: courses = [], isLoading: coursesLoading } = useGetCourses();
  const { data: behaviorLogs = [] } = useBehaviorLogs();
  const { data: allAssignments = [] } = useAllAssignments();
  const { data: allAssessments = [] } = useAllAssessments();

  // Announcements — read from localStorage (refreshes on component mount)
  const [recentAnnouncements] = useState(() =>
    getAnnouncements()
      .filter((a) => !a.archived)
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      })
      .slice(0, 3),
  );

  const totalStudents = students.length;
  const totalCourses = courses.length;

  // Students with accommodations (used in tooltips/future display)
  const _studentsWithAccommodations = students.filter(
    (s) => s.accommodations.length > 0,
  ).length;

  // Recent serious incidents (Major, last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const seriousIncidents = behaviorLogs
    .filter(
      (log) =>
        log.entryType === BehaviorEntryType.incident &&
        log.severity === BehaviorSeverity.major &&
        isAfter(new Date(Number(log.loggedAt) / 1_000_000), sevenDaysAgo),
    )
    .sort((a, b) => Number(b.loggedAt) - Number(a.loggedAt));

  // Recent activity (last 5 behavior logs)
  const recentActivity = [...behaviorLogs]
    .sort((a, b) => Number(b.loggedAt) - Number(a.loggedAt))
    .slice(0, 5);

  // Unresolved follow-ups
  const unresolvedFollowUps = behaviorLogs.filter(
    (log) => log.entryType === BehaviorEntryType.incident && log.followUpNeeded,
  ).length;

  // Upcoming due dates (next 14 days)
  const upcomingItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() + 14);
    cutoff.setHours(23, 59, 59, 999);

    type UpcomingItem = {
      id: string;
      title: string;
      kind: "assignment" | "assessment";
      courseId: number;
      dueDate: string;
      dueDateObj: Date;
    };

    const items: UpcomingItem[] = [];

    for (const a of allAssignments) {
      if (!a.dueDate) continue;
      const d = new Date(a.dueDate);
      if (Number.isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      if (d >= today && d <= cutoff) {
        items.push({
          id: `assign-${a.id}`,
          title: a.title,
          kind: "assignment",
          courseId: a.courseId ?? 0,
          dueDate: a.dueDate,
          dueDateObj: d,
        });
      }
    }

    for (const a of allAssessments) {
      if (!a.dueDate) continue;
      const d = new Date(a.dueDate);
      if (Number.isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      if (d >= today && d <= cutoff) {
        items.push({
          id: `assess-${a.id}`,
          title: a.title,
          kind: "assessment",
          courseId: a.courseId ?? 0,
          dueDate: a.dueDate,
          dueDateObj: d,
        });
      }
    }

    return items
      .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime())
      .slice(0, 6);
  }, [allAssignments, allAssessments]);

  const courseMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const c of courses) m[c.id] = c.title;
    return m;
  }, [courses]);

  const _getStudentDisplayName = (studentId: string) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return "Unknown";
    return student.preferredName
      ? `${student.preferredName} ${student.familyName}`
      : `${student.givenNames} ${student.familyName}`;
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {studentsLoading ? "—" : totalStudents}
                </p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary/20">
                <BookOpen className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {coursesLoading ? "—" : totalCourses}
                </p>
                <p className="text-xs text-muted-foreground">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {
                    behaviorLogs.filter(
                      (l) => l.entryType === BehaviorEntryType.praise,
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Praise Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link to="/behavior" className="block">
          <Card
            className={`border-border shadow-sm transition-colors cursor-pointer ${unresolvedFollowUps > 0 ? "border-warning/40 bg-warning/5 hover:bg-warning/10" : "bg-card hover:border-primary/40 hover:bg-primary/5"}`}
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${unresolvedFollowUps > 0 ? "bg-warning/10" : "bg-muted"}`}
                >
                  <Clock
                    className={`h-5 w-5 ${unresolvedFollowUps > 0 ? "text-warning" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${unresolvedFollowUps > 0 ? "text-warning" : "text-foreground"}`}
                  >
                    {unresolvedFollowUps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Open Follow-ups
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Announcements Widget */}
      <Card
        className="border-border shadow-sm"
        data-ocid="dashboard.announcements.card"
      >
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Announcements
            <Link
              to="/communication"
              className="text-xs text-primary hover:underline font-normal ml-auto"
            >
              Manage →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {recentAnnouncements.length === 0 ? (
            <div
              className="flex items-center gap-2 py-3 text-muted-foreground"
              data-ocid="dashboard.announcements.empty_state"
            >
              <Megaphone className="h-4 w-4 opacity-30" />
              <p className="text-sm">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAnnouncements.map((ann, i) => (
                <div
                  key={ann.id}
                  className="flex items-start gap-2 py-1.5"
                  data-ocid={`dashboard.announcements.item.${i + 1}`}
                >
                  {ann.pinned && (
                    <Pin className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {ann.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 flex-shrink-0 bg-muted/50"
                      >
                        {ann.visibility === "all"
                          ? "All Classes"
                          : ann.visibility}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {ann.body}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(ann.createdAt), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Due Dates */}
      <Card
        className="border-border shadow-sm"
        data-ocid="dashboard.upcoming.card"
      >
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Due Dates
            <Link
              to="/curriculum"
              className="text-xs text-primary hover:underline font-normal ml-auto"
            >
              View curriculum →
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {upcomingItems.length === 0 ? (
            <div
              className="flex flex-col items-center py-6 text-muted-foreground"
              data-ocid="dashboard.upcoming.empty_state"
            >
              <CalendarCheck className="h-6 w-6 mb-2 opacity-30" />
              <p className="text-sm">No assignments due in the next 14 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingItems.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-1.5"
                  data-ocid={`dashboard.upcoming.item.${i + 1}`}
                >
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0 flex-shrink-0 ${
                      item.kind === "assessment"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : "bg-indigo-500/10 text-indigo-600 border-indigo-500/30"
                    }`}
                  >
                    {item.kind === "assessment" ? "Assessment" : "Assignment"}
                  </Badge>
                  <span className="text-sm font-medium text-foreground flex-1 truncate">
                    {item.title}
                  </span>
                  {item.courseId > 0 && courseMap[item.courseId] && (
                    <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
                      {courseMap[item.courseId]}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">
                    {format(item.dueDateObj, "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Serious Incidents */}
      {seriousIncidents.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recent Serious Incidents
              <Badge variant="destructive" className="ml-auto text-xs">
                {seriousIncidents.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-2">
            {seriousIncidents.map((log) => (
              <Link
                key={String(log.entryId)}
                to="/behavior"
                className="block p-3 bg-card rounded-lg border border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {log.studentName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/30"
                      >
                        Major
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.description.slice(0, 80)}
                      {log.description.length > 80 ? "…" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatLogDate(log.loggedAt)}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Behavior Activity */}
      {recentActivity.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Recent Behavior Activity</span>
              <Link
                to="/behavior"
                className="text-xs text-primary hover:underline font-normal"
              >
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-2">
            {recentActivity.map((log) => (
              <div
                key={String(log.entryId)}
                className="flex items-center gap-3 py-1.5"
              >
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0 flex-shrink-0 ${
                    log.entryType === BehaviorEntryType.incident
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-success/10 text-success border-success/30"
                  }`}
                >
                  {log.entryType === BehaviorEntryType.incident
                    ? "Incident"
                    : "Praise"}
                </Badge>
                <span className="text-sm font-medium text-foreground flex-shrink-0">
                  {log.studentName}
                </span>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {log.description.slice(0, 60)}
                  {log.description.length > 60 ? "…" : ""}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatLogDate(log.loggedAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/students" className="block">
          <Card className="border-border shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Manage Students</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/curriculum" className="block">
          <Card className="border-border shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">View Curriculum</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/behavior" className="block">
          <Card className="border-border shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Behavior Log</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
