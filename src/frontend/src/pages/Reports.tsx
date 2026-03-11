import { FileText, GraduationCap, Star } from "lucide-react";
import { useState } from "react";
import { PillTabs } from "../components/shared/PillTabs";
import ProgressReports from "./ProgressReports";
import ReportCards from "./ReportCards";
import StandardsReport from "./StandardsReport";

type ReportTab = "progress" | "cards" | "standards";

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("progress");

  return (
    <div className="space-y-5">
      {/* Pill tab navigation — inline at top of content area, not in header */}
      <PillTabs
        tabs={[
          {
            value: "progress" as const,
            label: "Progress Reports",
            icon: <FileText size={14} />,
          },
          {
            value: "cards" as const,
            label: "Report Cards",
            icon: <GraduationCap size={14} />,
          },
          {
            value: "standards" as const,
            label: "Standards Report",
            icon: <Star size={14} />,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === "progress" ? (
          <ProgressReports />
        ) : activeTab === "cards" ? (
          <ReportCards />
        ) : (
          <StandardsReport />
        )}
      </div>
    </div>
  );
}
