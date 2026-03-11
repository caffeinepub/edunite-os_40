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
import { CheckCircle, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

export type ResolutionOutcome =
  | "Resolved"
  | "Referred to Admin"
  | "Parent Contacted"
  | "Intervention Started"
  | "No Action Needed"
  | "Other";

const RESOLUTION_OUTCOMES: ResolutionOutcome[] = [
  "Resolved",
  "Referred to Admin",
  "Parent Contacted",
  "Intervention Started",
  "No Action Needed",
  "Other",
];

interface Props {
  onClose: () => void;
  onSubmit: (outcome: ResolutionOutcome, notes: string) => Promise<void>;
  isPending?: boolean;
}

export default function FollowUpResolutionForm({
  onClose,
  onSubmit,
  isPending = false,
}: Props) {
  const [outcome, setOutcome] = useState<ResolutionOutcome | "">("");
  const [notes, setNotes] = useState("");

  const today = format(new Date(), "MMM d, yyyy");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) return;
    await onSubmit(outcome as ResolutionOutcome, notes.trim());
  };

  return (
    <div
      className="mt-3 rounded-lg border border-success/30 bg-success/5 px-4 py-4"
      data-ocid="behavior.resolution.panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold text-foreground">
            Resolve Follow-up
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Cancel resolution"
          data-ocid="behavior.resolution.close_button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Outcome — required */}
          <div className="space-y-1.5">
            <Label htmlFor="resolution-outcome" className="text-xs font-medium">
              Outcome <span className="text-destructive">*</span>
            </Label>
            <Select
              value={outcome}
              onValueChange={(v) => setOutcome(v as ResolutionOutcome)}
              required
            >
              <SelectTrigger
                id="resolution-outcome"
                className="h-9 text-sm"
                data-ocid="behavior.resolution.select"
              >
                <SelectValue placeholder="Select outcome..." />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date resolved — read-only */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Date Resolved</Label>
            <div className="h-9 px-3 py-2 text-sm text-muted-foreground bg-muted/40 border border-border rounded-md flex items-center">
              {today}
            </div>
          </div>
        </div>

        {/* Resolution notes — optional */}
        <div className="space-y-1.5">
          <Label htmlFor="resolution-notes" className="text-xs font-medium">
            Resolution Notes{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="resolution-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was done to resolve this? Any additional context..."
            rows={2}
            className="text-sm resize-none"
            data-ocid="behavior.resolution.textarea"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !outcome}
            className="gap-1.5"
            data-ocid="behavior.resolution.submit_button"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {isPending ? "Saving..." : "Mark as Resolved"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            data-ocid="behavior.resolution.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
