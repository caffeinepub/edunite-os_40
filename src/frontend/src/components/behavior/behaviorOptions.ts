import { BehaviorSeverity } from "../../backend";

export interface BehaviorOption {
  label: string;
  severity?: BehaviorSeverity; // only for incidents
}

export const INCIDENT_OPTIONS: Record<string, BehaviorOption[]> = {
  academic: [
    { label: "Off-task during instruction", severity: BehaviorSeverity.minor },
    { label: "Did not complete assignment", severity: BehaviorSeverity.minor },
    { label: "Refused to participate", severity: BehaviorSeverity.moderate },
    { label: "Sleeping in class", severity: BehaviorSeverity.minor },
    { label: "Not following directions", severity: BehaviorSeverity.minor },
    { label: "Disruptive during lesson", severity: BehaviorSeverity.minor },
    { label: "Cheating on assessment", severity: BehaviorSeverity.moderate },
  ],
  social: [
    { label: "Verbal conflict with peer", severity: BehaviorSeverity.moderate },
    { label: "Physical conflict with peer", severity: BehaviorSeverity.major },
    { label: "Mean/hurtful comments", severity: BehaviorSeverity.moderate },
    { label: "Exclusionary behavior", severity: BehaviorSeverity.moderate },
    { label: "Inappropriate language", severity: BehaviorSeverity.minor },
    { label: "Disrupting others' work", severity: BehaviorSeverity.minor },
  ],
  safety: [
    { label: "Physical altercation", severity: BehaviorSeverity.major },
    { label: "Unsafe lab behavior", severity: BehaviorSeverity.major },
    { label: "Running in hallway", severity: BehaviorSeverity.minor },
    { label: "Throwing objects", severity: BehaviorSeverity.moderate },
    {
      label: "Left class without permission",
      severity: BehaviorSeverity.moderate,
    },
    { label: "Rough play", severity: BehaviorSeverity.minor },
  ],
  respect: [
    { label: "Disrespectful to teacher", severity: BehaviorSeverity.moderate },
    { label: "Talking back/defiance", severity: BehaviorSeverity.moderate },
    {
      label: "Inappropriate language to adult",
      severity: BehaviorSeverity.moderate,
    },
    { label: "Refused directive", severity: BehaviorSeverity.moderate },
    { label: "Damaged property", severity: BehaviorSeverity.major },
    { label: "Did not clean up", severity: BehaviorSeverity.minor },
  ],
  responsibility: [
    { label: "Tardy to class", severity: BehaviorSeverity.minor },
    { label: "Unprepared (no materials)", severity: BehaviorSeverity.minor },
    { label: "Lost materials", severity: BehaviorSeverity.minor },
    { label: "Dishonesty", severity: BehaviorSeverity.moderate },
    {
      label: "Did not complete assigned role",
      severity: BehaviorSeverity.minor,
    },
  ],
  emotional_regulation: [
    {
      label: "Emotional outburst / meltdown",
      severity: BehaviorSeverity.moderate,
    },
    { label: "Crying / shutting down", severity: BehaviorSeverity.minor },
    { label: "Refusing to engage", severity: BehaviorSeverity.minor },
    {
      label: "Verbal aggression when upset",
      severity: BehaviorSeverity.moderate,
    },
    {
      label: "Physical aggression when upset",
      severity: BehaviorSeverity.major,
    },
    { label: "Difficulty transitioning", severity: BehaviorSeverity.minor },
  ],
  other: [
    { label: "Technology misuse", severity: BehaviorSeverity.minor },
    { label: "Dress code violation", severity: BehaviorSeverity.minor },
  ],
};

export const PRAISE_OPTIONS: Record<string, BehaviorOption[]> = {
  academic: [
    { label: "Excellent participation" },
    { label: "Completed all work" },
    { label: "Insightful question" },
    { label: "Helped peer learn" },
    { label: "Showed perseverance" },
    { label: "Improved effort" },
  ],
  social: [
    { label: "Helped classmate" },
    { label: "Excellent collaboration" },
    { label: "Inclusive behavior" },
    { label: "Resolved conflict positively" },
    { label: "Showed empathy" },
    { label: "Leadership in group work" },
  ],
  safety: [
    { label: "Followed safety procedures" },
    { label: "Reported safety concern" },
    { label: "Helped during emergency drill" },
    { label: "Careful with equipment" },
  ],
  respect: [
    { label: "Respectful communication" },
    { label: "Helped teacher without being asked" },
    { label: "Polite and courteous" },
    { label: "Cleaned up workspace" },
    { label: "Respectful disagreement" },
  ],
  responsibility: [
    { label: "Always prepared" },
    { label: "Arrived early to help" },
    { label: "Organized and ready" },
    { label: "Took responsibility for mistake" },
    { label: "Reliable and dependable" },
  ],
  emotional_regulation: [
    { label: "Managed frustration well" },
    { label: "Used coping strategies" },
    { label: "Self-regulated independently" },
    { label: "Asked for help when overwhelmed" },
    { label: "Handled disappointment gracefully" },
  ],
  other: [
    { label: "Above and beyond effort" },
    { label: "Positive role model" },
  ],
};

export const CUSTOM_OPTION = "custom";
export const CUSTOM_LABEL = "Custom...";

// ─── Action Taken Options ─────────────────────────────────────────────────────

export interface ActionTakenOption {
  value: string;
  label: string;
}

/** Predefined actions for incidents — grouped by typical severity tier */
export const INCIDENT_ACTION_OPTIONS: {
  group: string;
  options: ActionTakenOption[];
}[] = [
  {
    group: "Verbal / Classroom",
    options: [
      { value: "verbal_warning", label: "Verbal warning given" },
      { value: "redirect", label: "Redirected student" },
      { value: "proximity", label: "Proximity / non-verbal cue" },
      { value: "seat_change", label: "Temporary seat change" },
      { value: "break_offered", label: "Offered a break / sensory break" },
      {
        value: "private_conversation",
        label: "Private conversation with student",
      },
    ],
  },
  {
    group: "Documentation / Communication",
    options: [
      { value: "logged_only", label: "Logged for record — no action taken" },
      {
        value: "parent_contact_phone",
        label: "Parent/guardian contacted by phone",
      },
      {
        value: "parent_contact_email",
        label: "Parent/guardian contacted by email",
      },
      { value: "parent_meeting_scheduled", label: "Parent meeting scheduled" },
      {
        value: "counselor_notified",
        label: "Counselor / support staff notified",
      },
      { value: "admin_notified", label: "Administration notified" },
    ],
  },
  {
    group: "Escalated / Formal",
    options: [
      { value: "sent_to_office", label: "Sent to the office" },
      { value: "detention", label: "Detention assigned" },
      { value: "in_school_suspension", label: "In-school suspension" },
      {
        value: "out_of_school_suspension",
        label: "Out-of-school suspension recommended",
      },
      { value: "behavior_contract", label: "Behavior contract initiated" },
      {
        value: "intervention_plan_started",
        label: "Intervention plan started",
      },
      { value: "safety_plan_created", label: "Safety plan created" },
    ],
  },
  {
    group: "Restorative",
    options: [
      {
        value: "restorative_conversation",
        label: "Restorative conversation held",
      },
      { value: "peer_mediation", label: "Peer mediation arranged" },
      { value: "apology_letter", label: "Apology letter / repair plan" },
      { value: "community_service", label: "Community service / restitution" },
    ],
  },
];

/** Predefined actions for praise entries */
export const PRAISE_ACTION_OPTIONS: ActionTakenOption[] = [
  { value: "verbal_praise", label: "Verbal praise given" },
  { value: "positive_note", label: "Positive note sent home" },
  { value: "positive_call_home", label: "Positive phone call home" },
  { value: "sticker_reward", label: "Sticker / token reward given" },
  { value: "certificate", label: "Certificate or award given" },
  { value: "class_recognition", label: "Recognized in front of class" },
  { value: "logged_only_praise", label: "Logged for record — no action taken" },
];
