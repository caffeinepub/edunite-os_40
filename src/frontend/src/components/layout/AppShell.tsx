import { useRouterState } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppUI } from "../../context/AppUIContext";
import { useStudentContext } from "../../context/StudentContextProvider";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import StudentContextPanel from "../studentContext/StudentContextPanel";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

const MODULE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/curriculum": "Curriculum",
  "/classes": "Classes",
  "/behavior": "Behavior",
  "/calendar": "Calendar",
  "/analytics": "Analytics",
  "/progress-reports": "Progress Reports",
  "/settings": "Settings",
  "/timetable": "Timetable",
};

// Routes that have full sub-paths that should be treated differently
const MODULE_NAMES_FULL: Record<string, string> = {
  "/behavior/serious-incident": "Serious Incident Report",
};

// Routes where the page fills the viewport exactly (no page-level scroll)
const VIEWPORT_CONSTRAINED_ROUTES = ["/calendar", "/curriculum"];

function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "#6D28D9" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              EdUnite OS
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium uppercase tracking-widest">
              Class Edition
            </p>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Your unified classroom operating system
            </p>
          </div>

          {/* Sign in button */}
          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isLoggingIn ? "#7C3AED" : "#6D28D9",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingIn)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#5B21B6";
            }}
            onMouseLeave={(e) => {
              if (!isLoggingIn)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#6D28D9";
            }}
          >
            {isLoggingIn ? (
              <>
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                <LogIn size={16} strokeWidth={2} />
                Sign in with Internet Identity
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-xs text-muted-foreground text-center mt-5 leading-relaxed">
            Internet Identity keeps your classroom data private and secure — no
            password required.
          </p>
        </div>

        {/* Attribution */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  // All hooks must be called unconditionally at the top
  const { identity, isInitializing } = useInternetIdentity();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const routerState = useRouterState();
  const { isOpen: contextPanelOpen } = useStudentContext();
  const { moduleNameOverride } = useAppUI();

  // Show a minimal loading state while the auth client initialises
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          data-ocid="app.loading_state"
          className="flex flex-col items-center gap-3"
        >
          <svg
            className="animate-spin"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6D28D9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  // Not logged in — show the login page instead of the app shell
  if (!identity) {
    return <LoginPage />;
  }

  const pathname = routerState.location.pathname;
  const baseRoute = `/${pathname.split("/")[1] || "dashboard"}`;
  const fullRouteModuleName = MODULE_NAMES_FULL[pathname];
  const defaultModuleName =
    fullRouteModuleName ?? MODULE_NAMES[baseRoute] ?? "Dashboard";
  const moduleName = moduleNameOverride ?? defaultModuleName;

  const isViewportConstrained = VIEWPORT_CONSTRAINED_ROUTES.includes(baseRoute);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header moduleName={moduleName} />
        {isViewportConstrained ? (
          // Viewport-constrained: no page scroll, content fills available height
          <main className="flex-1 overflow-hidden p-6 flex flex-col min-h-0 w-full">
            {children}
          </main>
        ) : (
          // Natural scroll: page scrolls when content exceeds viewport
          <main className="flex-1 overflow-y-auto p-6 w-full">
            <div className="w-full">{children}</div>
          </main>
        )}
      </div>

      {/* Student Context Panel — rendered when open */}
      {contextPanelOpen && <StudentContextPanel />}
    </div>
  );
}
