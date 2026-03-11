import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useState } from "react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface TemplateCategory {
  id: string;
  label: string;
  templates: Template[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "missing_work",
    label: "Missing Work",
    templates: [
      {
        id: "missing_1",
        name: "Missing Assignment Reminder",
        subject: "Missing Assignment \u2014 Action Required",
        body: "Dear Parent/Guardian,\n\nI'm writing to let you know that [Student Name] has a missing assignment: [Assignment]. This was due on [Due Date] and has not yet been submitted.\n\nPlease encourage [Student Name] to complete and submit this work as soon as possible. If there are any circumstances affecting their ability to complete assignments, please don't hesitate to reach out.\n\nThank you for your support.",
      },
      {
        id: "missing_2",
        name: "Multiple Missing Assignments",
        subject: "Multiple Missing Assignments \u2014 Urgent",
        body: "Dear Parent/Guardian,\n\nI'm reaching out because [Student Name] currently has multiple missing assignments in our class. This is beginning to impact their overall grade and I want to address it before it becomes a larger issue.\n\nI'd like to work together to find a solution. Please reply to this message or contact me to schedule a brief call at your convenience.\n\nThank you for your partnership.",
      },
    ],
  },
  {
    id: "praise",
    label: "Praise",
    templates: [
      {
        id: "praise_1",
        name: "Excellent Progress",
        subject: "Great News About [Student Name]'s Progress!",
        body: "Dear Parent/Guardian,\n\nI wanted to share some wonderful news \u2014 [Student Name] has been doing excellent work in class lately! Their dedication and effort are really showing, and I wanted to make sure you heard about it.\n\n[Student Name] should be proud of the progress they're making. Please pass along my congratulations!\n\nBest regards,",
      },
      {
        id: "praise_2",
        name: "Outstanding Behavior",
        subject: "Recognizing [Student Name]'s Outstanding Behavior",
        body: "Dear Parent/Guardian,\n\nI'm writing with some very positive news. [Student Name] has been demonstrating outstanding behavior and attitude in class. They are a pleasure to have and a great example to their peers.\n\nThis kind of character makes a real difference, and I wanted you to know how much it's appreciated.\n\nThank you for raising such a thoughtful student!",
      },
    ],
  },
  {
    id: "behavior_concern",
    label: "Behavior Concern",
    templates: [
      {
        id: "behavior_1",
        name: "Classroom Behavior",
        subject: "Classroom Behavior \u2014 [Student Name]",
        body: "Dear Parent/Guardian,\n\nI'm writing to share a concern about [Student Name]'s recent behavior in class. There have been some incidents that are affecting the learning environment, and I wanted to keep you informed.\n\nI believe we can address this together. Please reply or call me so we can discuss strategies to support [Student Name] both at school and at home.\n\nThank you for your partnership.",
      },
      {
        id: "behavior_2",
        name: "Serious Incident Follow-up",
        subject: "Follow-up: Incident on [Date]",
        body: "Dear Parent/Guardian,\n\nI'm following up regarding the incident involving [Student Name] that occurred on [Date]. We took the matter seriously and have spoken with [Student Name] about the situation.\n\nA meeting with school administration may be required. Please contact me at your earliest convenience so we can discuss next steps and appropriate support for [Student Name].\n\nThank you.",
      },
    ],
  },
  {
    id: "meeting_request",
    label: "Meeting Request",
    templates: [
      {
        id: "meeting_1",
        name: "Parent-Teacher Conference",
        subject: "Parent-Teacher Conference Invitation \u2014 [Student Name]",
        body: "Dear Parent/Guardian,\n\nI would love the opportunity to meet with you to discuss [Student Name]'s progress this term. Parent-teacher conferences are a great way for us to align on goals and ensure [Student Name] has all the support they need.\n\nPlease let me know your availability, and I'll do my best to accommodate your schedule.\n\nLooking forward to connecting!",
      },
      {
        id: "meeting_2",
        name: "Urgent Meeting Request",
        subject: "Urgent: Please Contact Me Regarding [Student Name]",
        body: "Dear Parent/Guardian,\n\nI am writing to request an urgent meeting or phone call regarding [Student Name]. There is an important matter I would like to discuss with you as soon as possible.\n\nPlease contact me at your earliest convenience \u2014 either by replying to this message or calling the school office to arrange a meeting time.\n\nThank you.",
      },
    ],
  },
  {
    id: "general_update",
    label: "General Update",
    templates: [
      {
        id: "general_1",
        name: "Weekly Class Update",
        subject: "Weekly Class Update \u2014 Week of [Date]",
        body: "Dear Families,\n\nHere's a quick update on what we've been up to in class this week:\n\n\u2022 We covered [Topic 1] and [Topic 2]\n\u2022 Students worked on [Project/Activity]\n\u2022 Coming up next week: [Preview]\n\nUpcoming due dates:\n\u2022 [Assignment] \u2014 due [Date]\n\u2022 [Assessment] \u2014 [Date]\n\nPlease reach out if you have any questions. Have a wonderful weekend!",
      },
      {
        id: "general_2",
        name: "Upcoming Assessment",
        subject: "Upcoming Assessment: [Assessment Name] on [Date]",
        body: "Dear Parent/Guardian,\n\nI wanted to give you advance notice that [Student Name]'s class has an upcoming [Quiz/Test/Project] on [Date].\n\nTopics covered include: [Topic List].\n\nHere are some suggestions to help [Student Name] prepare:\n\u2022 Review class notes and handouts\n\u2022 Complete any practice exercises\n\u2022 Get a good night's sleep before the assessment\n\nPlease encourage [Student Name] to come to me with any questions before the assessment date.",
      },
    ],
  },
];

interface Props {
  onSelect: (subject: string, body: string) => void;
}

export default function MessageTemplates({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  function handleSelect(template: Template) {
    onSelect(template.subject, template.body);
    setOpen(false);
    setActiveCategory(null);
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => setOpen((prev) => !prev)}
        data-ocid="communication.messages.templates.toggle"
      >
        <FileText className="h-3.5 w-3.5" />
        Templates
        {open ? (
          <ChevronUp className="h-3 w-3 ml-0.5" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-0.5" />
        )}
      </Button>

      {open && (
        <div
          className="border border-border rounded-lg bg-background overflow-hidden"
          data-ocid="communication.messages.templates.panel"
        >
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Choose a template
            </p>
          </div>
          <div className="divide-y divide-border/50">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setActiveCategory(activeCategory === cat.id ? null : cat.id)
                  }
                  data-ocid="communication.messages.template-category.tab"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {activeCategory === cat.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </button>
                {activeCategory === cat.id && (
                  <div className="bg-muted/10 border-t border-border/30">
                    {cat.templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="w-full flex flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors border-b border-border/20 last:border-0"
                        onClick={() => handleSelect(tpl)}
                        data-ocid="communication.messages.template.button"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {tpl.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {tpl.subject}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
