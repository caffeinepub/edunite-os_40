import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Upload,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import type { Student } from "../../backend";
import { useAddStudent, useGetAllStudents } from "../../hooks/useQueries";

interface BulkImportCSVPanelProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  givenNames: string;
  familyName: string;
  preferredName: string | null;
  studentId: string;
  gradeLevel: string;
  rowIndex: number;
  isDuplicate?: boolean;
}

interface RowError {
  rowIndex: number;
  message: string;
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    "Given Name(s)",
    "Family Name",
    "Preferred Name",
    "Student ID",
    "Grade Level",
  ].join(",");

  const example = ["Jane Marie", "Smith", "Jane", "STU-001", "9"].join(",");

  const notes = [
    "# REQUIRED: Given Name(s), Family Name, Student ID, Grade Level",
    "# OPTIONAL: Preferred Name (leave blank if not applicable)",
    "# Grade Level: K, 1, 2, 3 ... 12",
    "# Student ID must be unique",
  ].join("\n");

  const content = `${notes}\n${headers}\n${example}\n`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edunite-student-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  // Filter out comment lines starting with #
  const lines = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");

  const rows = lines.trim().split("\n");
  return rows.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BulkImportCSVPanel({
  onClose,
  onSuccess,
}: BulkImportCSVPanelProps) {
  const addStudent = useAddStudent();
  const { data: existingStudents = [] } = useGetAllStudents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<RowError[]>([]);
  const [importErrors, setImportErrors] = useState<RowError[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const PREVIEW_LIMIT = 5;

  function processFile(file: File) {
    setFileName(file.name);
    setParsedRows([]);
    setParseErrors([]);
    setImportErrors([]);
    setImportedCount(0);
    setIsDone(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processCSV(text, existingStudents);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processCSV(text: string, existing: Student[]) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setParseErrors([
        {
          rowIndex: 0,
          message: "CSV file must have a header row and at least one data row.",
        },
      ]);
      return;
    }

    const headers = rows[0].map(normalizeHeader);

    const colIndex = (names: string[]): number => {
      for (const name of names) {
        const idx = headers.indexOf(normalizeHeader(name));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const givenNamesCol = colIndex([
      "Given Name(s)",
      "Given Names",
      "GivenNames",
      "First Name",
      "FirstName",
      "givenNames",
    ]);
    const familyNameCol = colIndex([
      "Family Name",
      "FamilyName",
      "Last Name",
      "LastName",
      "familyName",
      "Surname",
    ]);
    const preferredNameCol = colIndex([
      "Preferred Name",
      "PreferredName",
      "preferredName",
      "Nickname",
    ]);
    const studentIdCol = colIndex([
      "Student ID",
      "StudentID",
      "studentId",
      "ID",
      "id",
    ]);
    const gradeLevelCol = colIndex([
      "Grade Level",
      "GradeLevel",
      "gradeLevel",
      "Grade",
      "grade",
    ]);

    const errors: RowError[] = [];

    if (givenNamesCol === -1) {
      errors.push({
        rowIndex: 0,
        message: 'Missing required column: "Given Name(s)"',
      });
    }
    if (familyNameCol === -1) {
      errors.push({
        rowIndex: 0,
        message: 'Missing required column: "Family Name"',
      });
    }
    if (studentIdCol === -1) {
      errors.push({
        rowIndex: 0,
        message: 'Missing required column: "Student ID"',
      });
    }
    if (gradeLevelCol === -1) {
      errors.push({
        rowIndex: 0,
        message: 'Missing required column: "Grade Level"',
      });
    }

    if (errors.length > 0) {
      setParseErrors(errors);
      return;
    }

    // Build a set of existing student IDs for duplicate detection
    const existingIds = new Set(existing.map((s) => s.studentId.toLowerCase()));

    const parsed: ParsedRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every((cell) => cell === "")) continue; // skip blank rows

      const givenNames = row[givenNamesCol] ?? "";
      const familyName = row[familyNameCol] ?? "";
      const preferredName =
        preferredNameCol !== -1
          ? (row[preferredNameCol] ?? "").trim() || null
          : null;
      const studentId = row[studentIdCol] ?? "";
      const gradeLevel = row[gradeLevelCol] ?? "";

      const rowErrors: string[] = [];
      if (!givenNames.trim()) rowErrors.push("Given Name(s) is required");
      if (!familyName.trim()) rowErrors.push("Family Name is required");
      if (!studentId.trim()) rowErrors.push("Student ID is required");
      if (!gradeLevel.trim()) rowErrors.push("Grade Level is required");

      if (rowErrors.length > 0) {
        errors.push({
          rowIndex: i,
          message: `Row ${i}: ${rowErrors.join(", ")}`,
        });
      } else {
        const isDuplicate = existingIds.has(studentId.trim().toLowerCase());
        parsed.push({
          givenNames: givenNames.trim(),
          familyName: familyName.trim(),
          preferredName,
          studentId: studentId.trim(),
          gradeLevel: gradeLevel.trim(),
          rowIndex: i,
          isDuplicate,
        });
      }
    }

    setParseErrors(errors);
    setParsedRows(parsed);
  }

  async function handleImport() {
    const rowsToImport = skipDuplicates
      ? parsedRows.filter((r) => !r.isDuplicate)
      : parsedRows;

    if (rowsToImport.length === 0) return;
    setIsImporting(true);
    setImportErrors([]);
    let count = 0;
    const errors: RowError[] = [];

    for (const row of rowsToImport) {
      try {
        await addStudent.mutateAsync({
          studentId: row.studentId,
          givenNames: row.givenNames,
          familyName: row.familyName,
          preferredName: row.preferredName,
          gradeLevel: row.gradeLevel,
          photo: "",
          accommodations: [],
          allergies: [],
          medicalNotes: "",
          attendanceRecords: [],
          guardianContacts: [],
          teacherNotes: "",
          interventionPlans: "",
          behaviorEntries: [],
        });
        count++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push({
          rowIndex: row.rowIndex,
          message: `Row ${row.rowIndex} (${row.givenNames} ${row.familyName}): ${msg}`,
        });
      }
    }

    setImportedCount(count);
    setImportErrors(errors);
    setIsImporting(false);
    setIsDone(true);

    if (count > 0 && errors.length === 0) {
      onSuccess?.();
    }
  }

  function handleReset() {
    setFileName(null);
    setParsedRows([]);
    setParseErrors([]);
    setImportErrors([]);
    setImportedCount(0);
    setIsDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasParseErrors = parseErrors.length > 0;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const newCount = parsedRows.filter((r) => !r.isDuplicate).length;
  const rowsToImportCount = skipDuplicates ? newCount : parsedRows.length;
  const canImport =
    parsedRows.length > 0 &&
    !hasParseErrors &&
    !isDone &&
    rowsToImportCount > 0;

  return (
    <div className="space-y-5">
      {/* Step 1: Get the template */}
      <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm space-y-3">
        <p className="font-semibold text-foreground">
          Step 1: Download the template
        </p>
        <p className="text-muted-foreground">
          Use the template to prepare your student data in the correct format.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={downloadTemplate}
            data-ocid="students.csv_template.button"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>
          <span className="text-xs text-muted-foreground">
            Includes example row and field descriptions
          </span>
        </div>

        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-xs font-medium text-foreground">
            Required columns:
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Given Name(s)</span>,{" "}
            <span className="font-medium text-foreground">Family Name</span>,{" "}
            <span className="font-medium text-foreground">Student ID</span>{" "}
            (must be unique),{" "}
            <span className="font-medium text-foreground">Grade Level</span> (K,
            1–12)
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Optional:</span>{" "}
            Preferred Name
          </p>
        </div>
      </div>

      {/* Step 2: Upload */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Step 2: Upload your CSV
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
          data-ocid="students.csv_upload.upload_button"
        />
        <label
          htmlFor="csv-upload"
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/30"
          }`}
          data-ocid="students.csv_upload.dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
          }}
        >
          <Upload
            className={`h-8 w-8 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-sm font-medium text-foreground">
            {fileName
              ? fileName
              : isDragOver
                ? "Drop CSV file here"
                : "Click to upload CSV file"}
          </span>
          {!fileName && !isDragOver && (
            <span className="text-xs text-muted-foreground">
              or drag and drop
            </span>
          )}
        </label>
      </div>

      {/* Parse errors */}
      {hasParseErrors && (
        <Alert
          variant="destructive"
          data-ocid="students.csv_upload.error_state"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="space-y-1">
              {parseErrors.map((err) => (
                <li key={err.message}>{err.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && !hasParseErrors && !isDone && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""}{" "}
                parsed
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-success/10 text-success border-success/30"
            >
              {newCount} new
            </Badge>
            {duplicateCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-warning/10 text-warning border-warning/30"
              >
                {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Duplicate handling option */}
          {duplicateCount > 0 && (
            <Alert data-ocid="students.csv_upload.loading_state">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="space-y-2">
                <p className="font-medium text-warning">
                  {duplicateCount} student ID{duplicateCount !== 1 ? "s" : ""}{" "}
                  already exist{duplicateCount === 1 ? "s" : ""} in the system.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSkipDuplicates(true)}
                    className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                      skipDuplicates
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Skip duplicates (import {newCount} new only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkipDuplicates(false)}
                    className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                      !skipDuplicates
                        ? "bg-warning/10 border-warning/40 text-warning"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Import all ({parsedRows.length} rows)
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Table preview — first 5 rows by default */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Given Name(s)
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Family Name
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Preferred Name
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Grade
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(previewExpanded
                  ? parsedRows
                  : parsedRows.slice(0, PREVIEW_LIMIT)
                ).map((row) => (
                  <tr
                    key={row.studentId}
                    className={`border-t border-border ${
                      row.isDuplicate && skipDuplicates ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-foreground">
                      {row.givenNames}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {row.familyName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.preferredName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {row.studentId}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {row.gradeLevel}
                    </td>
                    <td className="px-3 py-2">
                      {row.isDuplicate ? (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 bg-warning/10 text-warning border-warning/30"
                        >
                          Duplicate
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 bg-success/10 text-success border-success/30"
                        >
                          New
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > PREVIEW_LIMIT && (
              <div className="border-t border-border bg-muted/40 px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => setPreviewExpanded((v) => !v)}
                  className="text-xs text-primary hover:underline font-medium"
                  data-ocid="students.csv_preview.toggle"
                >
                  {previewExpanded
                    ? "Show fewer rows"
                    : `Show all ${parsedRows.length} rows (${parsedRows.length - PREVIEW_LIMIT} more)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import result */}
      {isDone && (
        <div className="space-y-2">
          {importedCount > 0 && (
            <Alert data-ocid="students.csv_upload.success_state">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                Successfully imported {importedCount} student
                {importedCount !== 1 ? "s" : ""}.
              </AlertDescription>
            </Alert>
          )}
          {importErrors.length > 0 && (
            <Alert
              variant="destructive"
              data-ocid="students.csv_upload.error_state"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">
                  {importErrors.length} row
                  {importErrors.length !== 1 ? "s" : ""} failed:
                </p>
                <ul className="space-y-1">
                  {importErrors.map((err) => (
                    <li key={err.message}>{err.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isImporting}>
          {isDone ? "Close" : "Cancel"}
        </Button>
        {isDone ? (
          <Button variant="outline" onClick={handleReset}>
            Import Another File
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            disabled={!canImport || isImporting}
            data-ocid="students.csv_upload.submit_button"
          >
            {isImporting
              ? "Importing..."
              : `Import ${rowsToImportCount > 0 ? `${rowsToImportCount} ` : ""}Student${rowsToImportCount !== 1 ? "s" : ""}`}
          </Button>
        )}
      </div>
    </div>
  );
}
