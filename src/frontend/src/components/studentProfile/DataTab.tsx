import { Activity, Calendar, TrendingUp } from "lucide-react";
import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Student } from "../../backend";
import { generateGradeTrend } from "../../utils/studentDerived";

interface DataTabProps {
  student: Student;
}

// Deterministic attendance data
function generateAttendanceData(studentId: string) {
  const seed = studentId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const months = [
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
  ];
  return months.map((month, i) => {
    const totalDays = 20;
    const absent = (seed * (i + 1)) % 4;
    const tardy = (seed * (i + 2)) % 3;
    const present = totalDays - absent - tardy;
    return { month, present, absent, tardy };
  });
}

export default function DataTab({ student }: DataTabProps) {
  const gradeTrend = generateGradeTrend(student.studentId);
  const attendanceData = generateAttendanceData(student.studentId);

  const totalDays = attendanceData.reduce(
    (sum, m) => sum + m.present + m.absent + m.tardy,
    0,
  );
  const totalPresent = attendanceData.reduce((sum, m) => sum + m.present, 0);
  const totalAbsent = attendanceData.reduce((sum, m) => sum + m.absent, 0);
  const totalTardy = attendanceData.reduce((sum, m) => sum + m.tardy, 0);
  const attendancePct =
    totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  const currentGrade = gradeTrend[gradeTrend.length - 1]?.grade ?? 0;
  const gradeLabel =
    currentGrade >= 90
      ? "A"
      : currentGrade >= 80
        ? "B"
        : currentGrade >= 70
          ? "C"
          : currentGrade >= 60
            ? "D"
            : "F";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{gradeLabel}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Current Grade
          </div>
          <div className="text-xs text-muted-foreground">{currentGrade}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {attendancePct}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">Attendance</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{totalAbsent}</div>
          <div className="text-xs text-muted-foreground mt-1">Absences</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{totalTardy}</div>
          <div className="text-xs text-muted-foreground mt-1">Tardies</div>
        </div>
      </div>

      {/* Grade Trend Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Grade Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={gradeTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[50, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="grade"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">
            Monthly Attendance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2">Month</th>
                <th className="text-center pb-2">Present</th>
                <th className="text-center pb-2">Absent</th>
                <th className="text-center pb-2">Tardy</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 text-foreground">{row.month}</td>
                  <td className="py-2 text-center text-green-600">
                    {row.present}
                  </td>
                  <td className="py-2 text-center text-red-500">
                    {row.absent}
                  </td>
                  <td className="py-2 text-center text-yellow-500">
                    {row.tardy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Behavior Entries */}
      {student.behaviorEntries.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Behavior Log
            </h3>
          </div>
          <div className="space-y-2">
            {[...student.behaviorEntries].reverse().map((entry) => (
              <div
                key={`${entry.date}-${entry.description.slice(0, 20)}`}
                className="p-3 bg-muted/50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {entry.date}
                  </span>
                  {entry.consequence && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {entry.consequence}
                    </span>
                  )}
                </div>
                <p className="text-foreground">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
