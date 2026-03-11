import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

type SingleModule = {
  type: "single";
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  key: string;
};

type GroupChild = {
  label: string;
  path: string;
  key: string;
  searchParams?: Record<string, string>;
};

type GroupModule = {
  type: "group";
  label: string;
  key: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  children: GroupChild[];
};

type NavModule = SingleModule | GroupModule;

const NAV_MODULES: NavModule[] = [
  {
    type: "single",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    key: "dashboard",
  },
  {
    type: "group",
    label: "Classroom",
    key: "classroom",
    icon: GraduationCap,
    children: [
      { label: "Today's Class", path: "/classes", key: "classes" },
      { label: "Timetable", path: "/timetable", key: "timetable" },
    ],
  },
  {
    type: "group",
    label: "Students",
    key: "students",
    icon: Users,
    children: [
      { label: "Student List", path: "/students", key: "students" },
      { label: "Behavior", path: "/behavior", key: "behavior" },
      { label: "Reports", path: "/reports", key: "reports" },
    ],
  },
  {
    type: "single",
    label: "Curriculum",
    path: "/curriculum",
    icon: BookOpen,
    key: "curriculum",
  },
  {
    type: "single",
    label: "Communication",
    path: "/communication",
    icon: MessageSquare,
    key: "communication",
  },
  {
    type: "single",
    label: "Calendar",
    path: "/calendar",
    icon: CalendarDays,
    key: "calendar",
  },
  {
    type: "single",
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    key: "analytics",
  },
  {
    type: "single",
    label: "Settings",
    path: "/settings",
    icon: Settings,
    key: "settings",
  },
];

const TRANSITION = "250ms cubic-bezier(0.4, 0, 0.2, 1)";

function getSearchParams(search: unknown): URLSearchParams {
  return new URLSearchParams(String(search ?? ""));
}

function getParentGroupKey(
  pathname: string,
  searchParams: URLSearchParams,
): string | null {
  for (const mod of NAV_MODULES) {
    if (mod.type === "group") {
      const match = mod.children.some((child) =>
        isChildActiveCheck(child, pathname, searchParams),
      );
      if (match) return mod.key;
    }
  }
  return null;
}

function isChildActiveCheck(
  child: GroupChild,
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  const pathMatches =
    pathname === child.path || pathname.startsWith(`${child.path}/`);
  if (!pathMatches) return false;
  if (!child.searchParams) return true;
  for (const [key, value] of Object.entries(child.searchParams)) {
    const actual = searchParams.get(key);
    if (actual === null) {
      if (child.key === "today" || child.key === "messages") return true;
      return false;
    }
    if (actual !== value) return false;
  }
  return true;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchParams = getSearchParams(routerState.location.search);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const parentKey = getParentGroupKey(pathname, searchParams);
    return parentKey ? new Set([parentKey]) : new Set();
  });

  useEffect(() => {
    const sp = getSearchParams(routerState.location.search);
    const parentKey = getParentGroupKey(pathname, sp);
    if (parentKey) {
      setOpenGroups((prev) => {
        if (prev.has(parentKey)) return prev;
        const next = new Set(prev);
        next.add(parentKey);
        return next;
      });
    }
  }, [pathname, routerState.location.search]);

  function toggleGroup(key: string) {
    if (collapsed) return;
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function isPathActive(path: string) {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  function isChildActive(child: GroupChild): boolean {
    return isChildActiveCheck(child, pathname, searchParams);
  }

  function isGroupActive(mod: GroupModule) {
    return mod.children.some((child) => isChildActive(child));
  }

  function navigateToChild(child: GroupChild) {
    if (child.searchParams) {
      navigate({ to: child.path, search: child.searchParams });
    } else {
      navigate({ to: child.path });
    }
  }

  // Shared label style — fades and collapses horizontally
  const labelStyle: React.CSSProperties = {
    overflow: "hidden",
    whiteSpace: "nowrap",
    opacity: collapsed ? 0 : 1,
    maxWidth: collapsed ? "0px" : "160px",
    transition: `opacity ${TRANSITION}, max-width ${TRANSITION}`,
    pointerEvents: collapsed ? "none" : "auto",
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className="flex flex-col h-full flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? "64px" : "220px",
          backgroundColor: "oklch(0.28 0.14 293)",
          transition: `width ${TRANSITION}`,
        }}
      >
        {/* Branding header */}
        <div
          className="h-16 flex items-center flex-shrink-0"
          style={{
            borderBottom: "1px solid oklch(0.35 0.10 293)",
            padding: "0 12px",
          }}
        >
          {collapsed ? (
            /* Collapsed state: only the expand button, centered */
            <button
              type="button"
              onClick={onToggle}
              className="flex-shrink-0 w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center mx-auto"
              aria-label="Expand sidebar"
              data-ocid="sidebar.toggle.button"
            >
              <ChevronRight size={16} />
            </button>
          ) : (
            /* Expanded state: logo + brand text + collapse button */
            <>
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "oklch(0.55 0.22 293)" }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect
                    x="2"
                    y="2"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <rect
                    x="10"
                    y="2"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                    fillOpacity="0.6"
                  />
                  <rect
                    x="2"
                    y="10"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                    fillOpacity="0.6"
                  />
                  <rect
                    x="10"
                    y="10"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                    fillOpacity="0.9"
                  />
                </svg>
              </div>

              <div className="flex-1 overflow-hidden ml-3">
                <div className="text-white font-bold text-sm leading-tight">
                  EdUnite OS
                </div>
                <div className="text-white/60 text-xs leading-tight">
                  Class Edition
                </div>
              </div>

              <button
                type="button"
                onClick={onToggle}
                className="flex-shrink-0 w-8 h-8 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Collapse sidebar"
                data-ocid="sidebar.toggle.button"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          <ul className="px-2 space-y-1">
            {NAV_MODULES.map((mod) => {
              if (mod.type === "single") {
                const active = isPathActive(mod.path);
                const Icon = mod.icon;

                const btn = (
                  <button
                    type="button"
                    onClick={() => navigate({ to: mod.path })}
                    className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-150 ${
                      active
                        ? "text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    style={{
                      padding: "10px 12px",
                      gap: "12px",
                      ...(active
                        ? { backgroundColor: "oklch(0.38 0.14 293)" }
                        : {}),
                    }}
                    aria-label={mod.label}
                    data-ocid={`sidebar.${mod.key}.link`}
                  >
                    <Icon
                      size={18}
                      style={{
                        minWidth: "18px",
                        minHeight: "18px",
                        flexShrink: 0,
                      }}
                    />
                    <span style={labelStyle}>{mod.label}</span>
                  </button>
                );

                return (
                  <li key={mod.key}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {mod.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      btn
                    )}
                  </li>
                );
              }

              // Group module
              const Icon = mod.icon;
              const isOpen = openGroups.has(mod.key) && !collapsed;
              const groupActive = isGroupActive(mod);

              const groupBtn = (
                <button
                  type="button"
                  onClick={() => toggleGroup(mod.key)}
                  className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-150 ${
                    groupActive
                      ? "text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  style={{
                    padding: "10px 12px",
                    gap: "12px",
                    ...(groupActive
                      ? { backgroundColor: "oklch(0.33 0.12 293)" }
                      : {}),
                  }}
                  aria-expanded={isOpen}
                  aria-label={mod.label}
                  data-ocid={`sidebar.${mod.key}.toggle`}
                >
                  <Icon
                    size={18}
                    style={{
                      minWidth: "18px",
                      minHeight: "18px",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ ...labelStyle, flex: 1, textAlign: "left" }}>
                    {mod.label}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      flexShrink: 0,
                      opacity: collapsed ? 0 : 1,
                      transition: `transform 200ms ease, opacity ${TRANSITION}`,
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    }}
                  />
                </button>
              );

              return (
                <li key={mod.key}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{groupBtn}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {mod.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    groupBtn
                  )}

                  {/* Submodule list — animates open/close, hidden when sidebar collapsed */}
                  <div
                    style={{
                      maxHeight: isOpen ? "300px" : "0px",
                      overflow: "hidden",
                      opacity: collapsed ? 0 : 1,
                      transition: `max-height 200ms ease, opacity ${TRANSITION}`,
                    }}
                  >
                    <ul className="mt-0.5 space-y-0.5">
                      {mod.children.map((child) => {
                        const childActive = isChildActive(child);
                        return (
                          <li key={child.key}>
                            <button
                              type="button"
                              onClick={() => navigateToChild(child)}
                              className={`w-full flex items-center gap-2 rounded-md text-sm transition-colors duration-150 ${
                                childActive
                                  ? "text-white font-medium"
                                  : "text-white/60 hover:text-white hover:bg-white/10"
                              }`}
                              style={{
                                padding: "7px 12px 7px 28px",
                                ...(childActive
                                  ? { backgroundColor: "oklch(0.38 0.14 293)" }
                                  : {}),
                              }}
                              data-ocid={`sidebar.${mod.key}.${child.key}.link`}
                            >
                              <span
                                className="flex-shrink-0 rounded-full"
                                style={{
                                  width: "4px",
                                  height: "4px",
                                  backgroundColor: childActive
                                    ? "white"
                                    : "oklch(0.55 0.10 293)",
                                }}
                              />
                              <span className="truncate">{child.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
