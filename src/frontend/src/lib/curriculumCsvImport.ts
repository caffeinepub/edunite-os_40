// Curriculum CSV import utility for EdUnite OS
// Handles CSV parsing and column-to-field mapping

export interface CsvImportColumn {
  header: string;
  detectedField: string | null; // null = unknown
  mappedTo: string | "skip"; // teacher's choice
}

export interface CsvImportResult {
  columns: CsvImportColumn[];
  rows: Record<string, string>[];
  errors: string[];
}

// Known column headers and their human-readable field labels
export const KNOWN_HEADER_MAP: Record<string, string> = {
  // Base columns
  Level: "Level",
  Title: "Title",
  Description: "Description",
  Type: "Type",
  Points: "Points",
  "Due Date": "Due Date",
  Duration: "Duration",
  Standards: "Standards",
  Tags: "Tags",
  Framework: "Framework",
  "Essential Question": "Essential Question",
  "Learning Objectives": "Learning Objectives",
  Order: "Order",
  // IMS framework fields
  field_intent: "IMS: Intent",
  field_method: "IMS: Method",
  field_scope: "IMS: Scope",
  // UbD framework fields
  field_transferGoals: "UbD: Transfer Goals",
  field_enduringUnderstandings: "UbD: Enduring Understandings",
  field_essentialQuestions: "UbD/Backwards: Essential Questions",
  field_knowledgeSkills: "UbD: Knowledge & Skills",
  field_performanceTasks: "UbD: Performance Tasks",
  field_learningActivities: "UbD: Learning Activities",
  // Backwards design fields
  field_goals: "Backwards: Goals",
  field_understandings: "Backwards: Understandings",
  field_assessmentEvidence: "Backwards: Assessment Evidence",
  field_learningExperiences: "Backwards: Learning Experiences",
  // 5E framework fields
  field_engage: "5E: Engage",
  field_explore: "5E: Explore",
  field_explain: "5E: Explain",
  field_elaborate: "5E: Elaborate",
  field_evaluate: "5E: Evaluate",
  // Custom framework
  custom_frameworkId: "Custom Framework ID",
};

/**
 * A simple RFC 4180-compliant CSV parser.
 * Handles quoted fields, escaped quotes (double-quote), and CRLF/LF line endings.
 */
function parseCsvRaw(csvText: string): string[][] {
  const rows: string[][] = [];
  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let pos = 0;

  while (pos < text.length) {
    const row: string[] = [];
    // Parse fields until EOL or EOF
    while (pos < text.length) {
      if (text[pos] === '"') {
        // Quoted field
        pos++; // skip opening quote
        let field = "";
        while (pos < text.length) {
          if (text[pos] === '"') {
            if (text[pos + 1] === '"') {
              // Escaped quote
              field += '"';
              pos += 2;
            } else {
              pos++; // skip closing quote
              break;
            }
          } else {
            field += text[pos];
            pos++;
          }
        }
        row.push(field);
        // Consume comma or newline after field
        if (text[pos] === ",") pos++;
        else if (text[pos] === "\n") {
          pos++;
          break;
        } else if (pos >= text.length) {
          break;
        }
      } else {
        // Unquoted field: read until comma or newline
        let field = "";
        while (pos < text.length && text[pos] !== "," && text[pos] !== "\n") {
          field += text[pos];
          pos++;
        }
        row.push(field);
        if (text[pos] === ",") pos++;
        else if (text[pos] === "\n") {
          pos++;
          break;
        } else if (pos >= text.length) {
          break;
        }
      }
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }

  return rows;
}

export function parseCurriculumCsv(csvText: string): CsvImportResult {
  const errors: string[] = [];

  if (!csvText.trim()) {
    return { columns: [], rows: [], errors: ["File is empty"] };
  }

  let rawRows: string[][];
  try {
    rawRows = parseCsvRaw(csvText.trim());
  } catch {
    return {
      columns: [],
      rows: [],
      errors: ["Failed to parse CSV. Please check the file format."],
    };
  }

  if (rawRows.length === 0) {
    return { columns: [], rows: [], errors: ["No data found in file."] };
  }

  const headers = rawRows[0];
  if (headers.length === 0) {
    return {
      columns: [],
      rows: [],
      errors: ["No columns found in header row."],
    };
  }

  // Build column metadata
  const columns: CsvImportColumn[] = headers.map((header) => {
    const trimmed = header.trim();
    const detectedField = KNOWN_HEADER_MAP[trimmed] ?? null;
    return {
      header: trimmed,
      detectedField,
      mappedTo: detectedField ? trimmed : "skip",
    };
  });

  // Build data rows
  const dataRows = rawRows.slice(1);
  const rows: Record<string, string>[] = dataRows.map((rawRow) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i].trim()] = rawRow[i]?.trim() ?? "";
    }
    return record;
  });

  if (rows.length === 0) {
    errors.push("No data rows found (only header row present).");
  }

  // Validate that at least one key column is recognized
  const hasLevel = headers.some((h) => h.trim() === "Level");
  if (!hasLevel) {
    errors.push(
      'Warning: No "Level" column found. Import may not correctly identify Course/Unit/Module hierarchy.',
    );
  }

  return { columns, rows, errors };
}

/** Field options for the "Map To" dropdown, grouped by category */
export const MAPPABLE_FIELDS: {
  value: string;
  label: string;
  group: string;
}[] = [
  // Base columns
  { value: "Level", label: "Level", group: "Core" },
  { value: "Title", label: "Title", group: "Core" },
  { value: "Description", label: "Description", group: "Core" },
  { value: "Type", label: "Type", group: "Core" },
  { value: "Points", label: "Points", group: "Core" },
  { value: "Due Date", label: "Due Date", group: "Core" },
  { value: "Duration", label: "Duration", group: "Core" },
  { value: "Standards", label: "Standards", group: "Core" },
  { value: "Tags", label: "Tags", group: "Core" },
  { value: "Framework", label: "Framework", group: "Core" },
  { value: "Essential Question", label: "Essential Question", group: "Core" },
  { value: "Learning Objectives", label: "Learning Objectives", group: "Core" },
  { value: "Order", label: "Order", group: "Core" },
  // IMS
  { value: "field_intent", label: "IMS: Intent", group: "IMS Framework" },
  { value: "field_method", label: "IMS: Method", group: "IMS Framework" },
  { value: "field_scope", label: "IMS: Scope", group: "IMS Framework" },
  // UbD
  {
    value: "field_transferGoals",
    label: "Transfer Goals",
    group: "UbD Framework",
  },
  {
    value: "field_enduringUnderstandings",
    label: "Enduring Understandings",
    group: "UbD Framework",
  },
  {
    value: "field_essentialQuestions",
    label: "Essential Questions",
    group: "UbD Framework",
  },
  {
    value: "field_knowledgeSkills",
    label: "Knowledge & Skills",
    group: "UbD Framework",
  },
  {
    value: "field_performanceTasks",
    label: "Performance Tasks",
    group: "UbD Framework",
  },
  {
    value: "field_learningActivities",
    label: "Learning Activities",
    group: "UbD Framework",
  },
  // Backwards
  { value: "field_goals", label: "Goals", group: "Backwards Design" },
  {
    value: "field_understandings",
    label: "Understandings",
    group: "Backwards Design",
  },
  {
    value: "field_assessmentEvidence",
    label: "Assessment Evidence",
    group: "Backwards Design",
  },
  {
    value: "field_learningExperiences",
    label: "Learning Experiences",
    group: "Backwards Design",
  },
  // 5E
  { value: "field_engage", label: "5E: Engage", group: "5E Framework" },
  { value: "field_explore", label: "5E: Explore", group: "5E Framework" },
  { value: "field_explain", label: "5E: Explain", group: "5E Framework" },
  { value: "field_elaborate", label: "5E: Elaborate", group: "5E Framework" },
  { value: "field_evaluate", label: "5E: Evaluate", group: "5E Framework" },
  // Custom
  {
    value: "custom_frameworkId",
    label: "Custom Framework ID",
    group: "Custom Framework",
  },
  // Skip
  { value: "skip", label: "Skip this column", group: "Actions" },
];
