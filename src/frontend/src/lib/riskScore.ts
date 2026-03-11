export const AT_RISK_THRESHOLD = 30;

export function computeRiskScore(
  incidents: number,
  attendanceRate: number | null,
  hasAttendanceData: boolean,
): number {
  const behaviorComponent = Math.min(incidents / 5, 1) * 40;
  let attendanceComponent = 0;
  if (hasAttendanceData && attendanceRate !== null) {
    attendanceComponent = Math.min(
      Math.max(0, (100 - attendanceRate) / 20) * 40,
      40,
    );
  }
  const academicProxy =
    incidents >= 2 ||
    (hasAttendanceData && attendanceRate !== null && attendanceRate < 90)
      ? 10
      : 0;
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(behaviorComponent + attendanceComponent + academicProxy),
    ),
  );
}
