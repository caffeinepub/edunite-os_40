import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import AppShell from "./components/layout/AppShell";
import { AppUIProvider } from "./context/AppUIContext";
import { StudentContextProvider } from "./context/StudentContextProvider";
import Analytics from "./pages/Analytics";
import Behavior from "./pages/Behavior";
import Calendar from "./pages/Calendar";
import Classes from "./pages/Classes";
import Communication from "./pages/Communication";
import Curriculum from "./pages/Curriculum";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import SeriousIncidentReport from "./pages/SeriousIncidentReport";
import Settings from "./pages/Settings";
import StudentProfile from "./pages/StudentProfile";
import Students from "./pages/Students";
import Timetable from "./pages/Timetable";

// Root route with AppShell layout
const rootRoute = createRootRoute({
  component: () => (
    <AppUIProvider>
      <StudentContextProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </StudentContextProvider>
    </AppUIProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const studentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students",
  component: Students,
});

const studentProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/students/$studentId",
  component: StudentProfile,
});

const behaviorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/behavior",
  component: Behavior,
});

const seriousIncidentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/behavior/serious-incident",
  component: SeriousIncidentReport,
});

const curriculumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/curriculum",
  component: Curriculum,
});

const classesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/classes",
  component: Classes,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: Calendar,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: Analytics,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Reports,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

const communicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/communication",
  component: Communication,
});

const timetableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/timetable",
  component: Timetable,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  studentsRoute,
  studentProfileRoute,
  behaviorRoute,
  seriousIncidentRoute,
  curriculumRoute,
  classesRoute,
  calendarRoute,
  analyticsRoute,
  reportsRoute,
  settingsRoute,
  communicationRoute,
  timetableRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
