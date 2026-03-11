import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Edit,
  Eye,
  FileText,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import ReportBuilderPanel from "../components/progressReports/ReportBuilderPanel";
import ReportDetailView from "../components/progressReports/ReportDetailView";
import { getCurrentPeriod, getFinalizedPeriods } from "../lib/gradingPeriods";
import { useDeleteReport, useGetReports } from "../lib/progressReportStore";
import type { ProgressReport } from "../lib/progressReportTypes";

type PageView = "list" | "detail";

function StatusBadge({ status }: { status: ProgressReport["status"] }) {
  if (status === "final") {
    return (
      <Badge
        className="text-xs font-medium px-2 py-0.5"
        style={{
          backgroundColor: "var(--color-success-subtle)",
          color: "oklch(0.35 0.14 145)",
          border: "1px solid oklch(0.75 0.12 145)",
        }}
      >
        <CheckCircle2 size={10} className="mr-1" />
        Final
      </Badge>
    );
  }
  return (
    <Badge
      className="text-xs font-medium px-2 py-0.5"
      style={{
        backgroundColor: "var(--color-warning-subtle)",
        color: "oklch(0.45 0.14 75)",
        border: "1px solid oklch(0.82 0.14 75)",
      }}
    >
      <Edit size={10} className="mr-1" />
      Draft
    </Badge>
  );
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProgressReports() {
  const { data: reports = [], isLoading } = useGetReports();
  const deleteReport = useDeleteReport();

  const [view, setView] = useState<PageView>("list");
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(
    null,
  );
  const [showBuilder, setShowBuilder] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const currentPeriod = getCurrentPeriod();
  const isCurrentPeriodFinalized = getFinalizedPeriods().includes(
    currentPeriod.id,
  );

  function handleViewReport(report: ProgressReport) {
    setSelectedReport(report);
    setView("detail");
  }

  function handleBack() {
    setSelectedReport(null);
    setView("list");
  }

  function handleEdit(id: number) {
    // For now, scroll to comments section — future: open edit panel inline
    const report = reports.find((r) => r.id === id);
    if (report) {
      setSelectedReport(report);
      setView("detail");
    }
  }

  function handleReportCreated(report: ProgressReport) {
    setShowBuilder(false);
    setSelectedReport(report);
    setView("detail");
  }

  function handleDeleteClick(id: number) {
    setDeleteConfirmId(id);
  }

  function handleDeleteConfirm() {
    if (deleteConfirmId === null) return;
    deleteReport.mutate(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        if (selectedReport?.id === deleteConfirmId) {
          setSelectedReport(null);
          setView("list");
        }
      },
    });
  }

  // ─── Detail view ─────────────────────────────────────────────────────────────
  if (view === "detail" && selectedReport) {
    // Get latest version of the report from store
    const liveReport =
      reports.find((r) => r.id === selectedReport.id) ?? selectedReport;
    return (
      <div>
        <ReportDetailView
          report={liveReport}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Finalized period banner */}
      {isCurrentPeriodFinalized && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm"
          style={{
            backgroundColor: "oklch(0.96 0.05 145)",
            borderColor: "oklch(0.75 0.12 145)",
            color: "oklch(0.35 0.14 145)",
          }}
          data-ocid="progress_reports.finalized_banner"
        >
          <Lock className="h-4 w-4 flex-shrink-0" />
          <p className="font-medium">
            {currentPeriod.label} grades are finalized — report cards are ready
            to generate.
          </p>
        </div>
      )}

      {/* Top bar — count badge + action button, right-aligned */}
      <div className="flex items-center justify-end gap-2 mb-6">
        {!isLoading && reports.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {reports.length}
          </Badge>
        )}
        <Button
          size="sm"
          onClick={() => setShowBuilder((v) => !v)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="progress_reports.new_report_button"
        >
          <Plus size={14} className="mr-1.5" />
          New Report
        </Button>
      </div>

      {/* Inline builder */}
      {showBuilder && (
        <ReportBuilderPanel
          onCancel={() => setShowBuilder(false)}
          onCreated={handleReportCreated}
        />
      )}

      {/* Report list */}
      <div
        className="rounded-lg border border-border bg-card overflow-hidden"
        style={{ boxShadow: "var(--shadow-xs)" }}
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
            data-ocid="progress_reports.list.empty_state"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--color-primary-subtle)" }}
            >
              <FileText size={22} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No progress reports yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Generate a progress report to summarize student attendance,
              behavior, academic progress, and standards mastery.
            </p>
            <Button
              size="sm"
              onClick={() => setShowBuilder(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="progress_reports.list.primary_button"
            >
              <Plus size={14} className="mr-1.5" />
              Create First Report
            </Button>
          </div>
        ) : (
          <Table data-ocid="progress_reports.list.table">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                  Student
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                  Grade
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                  Period
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                  Generated
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report, index) => {
                const rowNum = index + 1;
                const isConfirmingDelete = deleteConfirmId === report.id;
                return (
                  <TableRow
                    key={report.id}
                    className="border-border hover:bg-muted/20 transition-colors group"
                    data-ocid={`progress_reports.list.row.${rowNum}`}
                  >
                    <TableCell className="py-3">
                      <span className="font-medium text-foreground text-sm">
                        {report.studentName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {report.gradeLevel}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-foreground">
                        {report.period}
                      </span>
                      {report.period === "Custom" && report.customStartDate && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({report.customStartDate} – {report.customEndDate})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(report.generatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {isConfirmingDelete ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">
                            Delete?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={handleDeleteConfirm}
                            disabled={deleteReport.isPending}
                            data-ocid="progress_reports.list.confirm_button"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDeleteConfirmId(null)}
                            data-ocid="progress_reports.list.cancel_button"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewReport(report)}
                            data-ocid={`progress_reports.list.view_button.${rowNum}`}
                          >
                            <Eye size={13} className="mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteClick(report.id)}
                            data-ocid={`progress_reports.list.delete_button.${rowNum}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
