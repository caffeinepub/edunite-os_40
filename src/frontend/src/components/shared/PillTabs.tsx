import type React from "react";

export interface PillTab<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  badgeVariant?: "default" | "destructive" | "warning" | "success";
}

interface PillTabsProps<T extends string> {
  tabs: PillTab<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  className?: string;
}

export function PillTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: PillTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mt-1 mb-5 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive
                ? "bg-purple-100 text-purple-800 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium leading-none ${
                  tab.badgeVariant === "destructive"
                    ? "bg-red-100 text-red-700"
                    : tab.badgeVariant === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : tab.badgeVariant === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
