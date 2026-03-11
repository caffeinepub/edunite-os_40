import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BehaviorEntryType } from "../../backend";
import {
  INCIDENT_ACTION_OPTIONS,
  PRAISE_ACTION_OPTIONS,
} from "./behaviorOptions";

interface Props {
  entryType: BehaviorEntryType;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  customText: string;
  onCustomTextChange: (text: string) => void;
}

const CUSTOM_VALUE = "custom";

export default function ActionTakenMultiSelect({
  entryType,
  selectedValues,
  onChange,
  customText,
  onCustomTextChange,
}: Props) {
  const isCustomChecked = selectedValues.includes(CUSTOM_VALUE);

  const toggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
      if (value === CUSTOM_VALUE) onCustomTextChange("");
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="border border-border rounded-md p-3 bg-background max-h-56 overflow-y-auto space-y-1">
      {entryType === BehaviorEntryType.incident ? (
        <>
          {INCIDENT_ACTION_OPTIONS.map((group) => (
            <div key={group.group} className="mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 mt-1">
                {group.group}
              </p>
              {group.options.map((opt) => {
                const checked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    htmlFor={`action-${opt.value}`}
                    className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors"
                  >
                    <Checkbox
                      id={`action-${opt.value}`}
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      className="flex-shrink-0"
                    />
                    <span className="text-sm text-foreground leading-snug">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </>
      ) : (
        <>
          {PRAISE_ACTION_OPTIONS.map((opt) => {
            const checked = selectedValues.includes(opt.value);
            return (
              <label
                key={opt.value}
                htmlFor={`action-${opt.value}`}
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors"
              >
                <Checkbox
                  id={`action-${opt.value}`}
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                  className="flex-shrink-0"
                />
                <span className="text-sm text-foreground leading-snug">
                  {opt.label}
                </span>
              </label>
            );
          })}
        </>
      )}

      {/* Custom option */}
      <div className="mt-1 pt-1 border-t border-border">
        <label
          htmlFor="action-custom"
          className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors"
        >
          <Checkbox
            id="action-custom"
            checked={isCustomChecked}
            onCheckedChange={() => toggle(CUSTOM_VALUE)}
            className="flex-shrink-0"
          />
          <span className="text-sm text-muted-foreground italic">
            Custom...
          </span>
        </label>
        {isCustomChecked && (
          <Textarea
            value={customText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder="Describe the action taken..."
            rows={2}
            className="resize-none mt-2 text-sm"
            data-ocid="behavior.action_taken.custom_textarea"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Serialize selected action values + custom text into a single string.
 * Returns a "; " separated list of human-readable labels.
 */
export function serializeActionTaken(
  _entryType: BehaviorEntryType,
  selectedValues: string[],
  customText: string,
): string {
  const allOptions = [
    ...INCIDENT_ACTION_OPTIONS.flatMap((g) => g.options),
    ...PRAISE_ACTION_OPTIONS,
  ];

  const labels = selectedValues
    .filter((v) => v !== "custom")
    .map((v) => allOptions.find((o) => o.value === v)?.label ?? v);

  if (selectedValues.includes("custom") && customText.trim()) {
    labels.push(customText.trim());
  }

  return labels.join("; ");
}

/**
 * Parse a stored actionTaken string back into selectedValues + customText.
 * Tries to reverse-map labels to values; unmatched labels go into customText.
 */
export function parseActionTaken(raw: string | null | undefined): {
  values: string[];
  customText: string;
} {
  if (!raw) return { values: [], customText: "" };

  const allOptions = [
    ...INCIDENT_ACTION_OPTIONS.flatMap((g) => g.options),
    ...PRAISE_ACTION_OPTIONS,
  ];

  const parts = raw
    .split("; ")
    .map((s) => s.trim())
    .filter(Boolean);
  const matchedValues: string[] = [];
  const unmatchedLabels: string[] = [];

  for (const part of parts) {
    const match = allOptions.find((o) => o.label === part);
    if (match) {
      matchedValues.push(match.value);
    } else {
      unmatchedLabels.push(part);
    }
  }

  if (unmatchedLabels.length > 0) {
    matchedValues.push("custom");
    return { values: matchedValues, customText: unmatchedLabels.join("; ") };
  }

  return { values: matchedValues, customText: "" };
}
