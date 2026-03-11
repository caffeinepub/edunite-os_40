// ─── EdUnite OS Expanded Seed Data ──────────────────────────────────────────
// All seed constants for comprehensive app testing

export interface SeedStudent {
  studentId: string;
  givenNames: string;
  familyName: string;
  preferredName?: string;
  gradeLevel: string;
  dob: string;
  email: string;
  phone?: string;
  accommodations?: string;
  allergies?: string;
  notes?: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelationship: string;
  emergencyContact?: string;
  medicalNotes?: string;
  senPlanType?: "IEP" | "504" | "SEN";
}

export const SEED_STUDENTS: SeedStudent[] = [
  // Grade 9
  {
    studentId: "S001",
    givenNames: "Aiden",
    familyName: "Torres",
    gradeLevel: "9",
    dob: "2010-03-15",
    email: "aiden.torres@school.edu",
    phone: "555-0101",
    parentName: "Maria Torres",
    parentEmail: "maria.torres@email.com",
    parentPhone: "555-0100",
    parentRelationship: "Mother",
    notes: "Eager learner, participates actively",
  },
  {
    studentId: "S002",
    givenNames: "Brianna",
    familyName: "Patel",
    preferredName: "Bri",
    gradeLevel: "9",
    dob: "2010-07-22",
    email: "brianna.patel@school.edu",
    parentName: "Raj Patel",
    parentEmail: "raj.patel@email.com",
    parentPhone: "555-0102",
    parentRelationship: "Father",
    accommodations: "Extended time on tests",
    senPlanType: "504",
  },
  {
    studentId: "S003",
    givenNames: "Carlos",
    familyName: "Mendoza",
    gradeLevel: "9",
    dob: "2010-01-08",
    email: "carlos.mendoza@school.edu",
    parentName: "Elena Mendoza",
    parentEmail: "elena.mendoza@email.com",
    parentPhone: "555-0103",
    parentRelationship: "Mother",
    notes: "High achiever, honor roll student",
  },
  {
    studentId: "S004",
    givenNames: "Diana",
    familyName: "Nguyen",
    gradeLevel: "9",
    dob: "2010-11-30",
    email: "diana.nguyen@school.edu",
    parentName: "Thanh Nguyen",
    parentEmail: "thanh.nguyen@email.com",
    parentPhone: "555-0104",
    parentRelationship: "Parent",
    accommodations: "Preferential seating, fidget tools",
    senPlanType: "IEP",
    medicalNotes: "ADHD",
  },
  {
    studentId: "S005",
    givenNames: "Ethan",
    familyName: "Williams",
    gradeLevel: "9",
    dob: "2010-05-17",
    email: "ethan.williams@school.edu",
    parentName: "David Williams",
    parentEmail: "david.williams@email.com",
    parentPhone: "555-0105",
    parentRelationship: "Father",
  },
  {
    studentId: "S006",
    givenNames: "Fatima",
    familyName: "Al-Hassan",
    gradeLevel: "9",
    dob: "2010-09-04",
    email: "fatima.alhassan@school.edu",
    parentName: "Omar Al-Hassan",
    parentEmail: "omar.alhassan@email.com",
    parentPhone: "555-0106",
    parentRelationship: "Father",
    notes: "Strong writer, excels in English",
  },
  {
    studentId: "S007",
    givenNames: "Gabriel",
    familyName: "Kim",
    preferredName: "Gabe",
    gradeLevel: "9",
    dob: "2010-12-12",
    email: "gabriel.kim@school.edu",
    parentName: "Soo-Jin Kim",
    parentEmail: "soojin.kim@email.com",
    parentPhone: "555-0107",
    parentRelationship: "Mother",
  },
  {
    studentId: "S008",
    givenNames: "Hannah",
    familyName: "Okafor",
    gradeLevel: "9",
    dob: "2010-02-28",
    email: "hannah.okafor@school.edu",
    parentName: "Chidi Okafor",
    parentEmail: "chidi.okafor@email.com",
    parentPhone: "555-0108",
    parentRelationship: "Father",
    allergies: "Tree nuts",
  },
  {
    studentId: "S009",
    givenNames: "Isaac",
    familyName: "Rodriguez",
    gradeLevel: "9",
    dob: "2010-08-06",
    email: "isaac.rodriguez@school.edu",
    parentName: "Carmen Rodriguez",
    parentEmail: "carmen.rodriguez@email.com",
    parentPhone: "555-0109",
    parentRelationship: "Mother",
    senPlanType: "SEN",
    accommodations: "Modified assignments, check-ins",
  },
  {
    studentId: "S010",
    givenNames: "Jasmine",
    familyName: "Chen",
    gradeLevel: "9",
    dob: "2010-04-19",
    email: "jasmine.chen@school.edu",
    parentName: "Wei Chen",
    parentEmail: "wei.chen@email.com",
    parentPhone: "555-0110",
    parentRelationship: "Father",
    notes: "Advanced math, tutors peers",
  },

  // Grade 10
  {
    studentId: "S011",
    givenNames: "Kevin",
    familyName: "Johnson",
    gradeLevel: "10",
    dob: "2009-06-25",
    email: "kevin.johnson@school.edu",
    parentName: "Lisa Johnson",
    parentEmail: "lisa.johnson@email.com",
    parentPhone: "555-0111",
    parentRelationship: "Mother",
  },
  {
    studentId: "S012",
    givenNames: "Lily",
    familyName: "Thompson",
    preferredName: "Lily",
    gradeLevel: "10",
    dob: "2009-10-14",
    email: "lily.thompson@school.edu",
    parentName: "James Thompson",
    parentEmail: "james.thompson@email.com",
    parentPhone: "555-0112",
    parentRelationship: "Father",
    accommodations: "Quiet testing room",
    senPlanType: "504",
  },
  {
    studentId: "S013",
    givenNames: "Marcus",
    familyName: "Brown",
    gradeLevel: "10",
    dob: "2009-03-07",
    email: "marcus.brown@school.edu",
    parentName: "Angela Brown",
    parentEmail: "angela.brown@email.com",
    parentPhone: "555-0113",
    parentRelationship: "Mother",
    notes: "At-risk: 3 incidents this month",
    medicalNotes: "Anxiety disorder",
  },
  {
    studentId: "S014",
    givenNames: "Nadia",
    familyName: "Petrov",
    gradeLevel: "10",
    dob: "2009-07-31",
    email: "nadia.petrov@school.edu",
    parentName: "Alexei Petrov",
    parentEmail: "alexei.petrov@email.com",
    parentPhone: "555-0114",
    parentRelationship: "Father",
    notes: "Top student, class representative",
  },
  {
    studentId: "S015",
    givenNames: "Oscar",
    familyName: "Davis",
    gradeLevel: "10",
    dob: "2009-12-20",
    email: "oscar.davis@school.edu",
    parentName: "Michelle Davis",
    parentEmail: "michelle.davis@email.com",
    parentPhone: "555-0115",
    parentRelationship: "Mother",
  },
  {
    studentId: "S016",
    givenNames: "Priya",
    familyName: "Sharma",
    gradeLevel: "10",
    dob: "2009-02-11",
    email: "priya.sharma@school.edu",
    parentName: "Anita Sharma",
    parentEmail: "anita.sharma@email.com",
    parentPhone: "555-0116",
    parentRelationship: "Mother",
    senPlanType: "IEP",
    accommodations: "Speech therapy, modified oral assignments",
  },
  {
    studentId: "S017",
    givenNames: "Quinn",
    familyName: "Martinez",
    gradeLevel: "10",
    dob: "2009-05-03",
    email: "quinn.martinez@school.edu",
    parentName: "Rosa Martinez",
    parentEmail: "rosa.martinez@email.com",
    parentPhone: "555-0117",
    parentRelationship: "Mother",
  },
  {
    studentId: "S018",
    givenNames: "Riley",
    familyName: "Wilson",
    gradeLevel: "10",
    dob: "2009-09-16",
    email: "riley.wilson@school.edu",
    parentName: "Tom Wilson",
    parentEmail: "tom.wilson@email.com",
    parentPhone: "555-0118",
    parentRelationship: "Father",
    allergies: "Peanuts, shellfish",
    medicalNotes: "Carries EpiPen",
  },
  {
    studentId: "S019",
    givenNames: "Sofia",
    familyName: "Garcia",
    gradeLevel: "10",
    dob: "2009-01-27",
    email: "sofia.garcia@school.edu",
    parentName: "Ricardo Garcia",
    parentEmail: "ricardo.garcia@email.com",
    parentPhone: "555-0119",
    parentRelationship: "Father",
  },
  {
    studentId: "S020",
    givenNames: "Tyler",
    familyName: "Anderson",
    gradeLevel: "10",
    dob: "2009-08-08",
    email: "tyler.anderson@school.edu",
    parentName: "Susan Anderson",
    parentEmail: "susan.anderson@email.com",
    parentPhone: "555-0120",
    parentRelationship: "Mother",
    notes: "Struggling with attendance",
  },

  // Grade 11
  {
    studentId: "S021",
    givenNames: "Uma",
    familyName: "Jackson",
    gradeLevel: "11",
    dob: "2008-04-09",
    email: "uma.jackson@school.edu",
    parentName: "Keith Jackson",
    parentEmail: "keith.jackson@email.com",
    parentPhone: "555-0121",
    parentRelationship: "Father",
  },
  {
    studentId: "S022",
    givenNames: "Victor",
    familyName: "Lee",
    gradeLevel: "11",
    dob: "2008-11-22",
    email: "victor.lee@school.edu",
    parentName: "Jenny Lee",
    parentEmail: "jenny.lee@email.com",
    parentPhone: "555-0122",
    parentRelationship: "Mother",
    notes: "AP student, college bound",
  },
  {
    studentId: "S023",
    givenNames: "Wendy",
    familyName: "Clark",
    gradeLevel: "11",
    dob: "2008-06-14",
    email: "wendy.clark@school.edu",
    parentName: "Bob Clark",
    parentEmail: "bob.clark@email.com",
    parentPhone: "555-0123",
    parentRelationship: "Father",
    accommodations: "Extra time, notes provided",
    senPlanType: "504",
  },
  {
    studentId: "S024",
    givenNames: "Xavier",
    familyName: "Robinson",
    preferredName: "Xav",
    gradeLevel: "11",
    dob: "2008-02-18",
    email: "xavier.robinson@school.edu",
    parentName: "Denise Robinson",
    parentEmail: "denise.robinson@email.com",
    parentPhone: "555-0124",
    parentRelationship: "Mother",
  },
  {
    studentId: "S025",
    givenNames: "Yara",
    familyName: "Hassan",
    gradeLevel: "11",
    dob: "2008-09-01",
    email: "yara.hassan@school.edu",
    parentName: "Farah Hassan",
    parentEmail: "farah.hassan@email.com",
    parentPhone: "555-0125",
    parentRelationship: "Mother",
    notes: "ESL student, strong progress",
  },
  {
    studentId: "S026",
    givenNames: "Zachary",
    familyName: "White",
    gradeLevel: "11",
    dob: "2008-07-05",
    email: "zachary.white@school.edu",
    parentName: "Patricia White",
    parentEmail: "patricia.white@email.com",
    parentPhone: "555-0126",
    parentRelationship: "Mother",
    notes: "At-risk: missing assignments, low grades",
  },
  {
    studentId: "S027",
    givenNames: "Amara",
    familyName: "Diallo",
    gradeLevel: "11",
    dob: "2008-12-29",
    email: "amara.diallo@school.edu",
    parentName: "Ibrahim Diallo",
    parentEmail: "ibrahim.diallo@email.com",
    parentPhone: "555-0127",
    parentRelationship: "Father",
    senPlanType: "IEP",
    accommodations: "Bilingual support, visual aids",
  },
  {
    studentId: "S028",
    givenNames: "Blake",
    familyName: "Harris",
    gradeLevel: "11",
    dob: "2008-03-22",
    email: "blake.harris@school.edu",
    parentName: "Tanya Harris",
    parentEmail: "tanya.harris@email.com",
    parentPhone: "555-0128",
    parentRelationship: "Mother",
  },
  {
    studentId: "S029",
    givenNames: "Chloe",
    familyName: "Lewis",
    gradeLevel: "11",
    dob: "2008-10-11",
    email: "chloe.lewis@school.edu",
    parentName: "Frank Lewis",
    parentEmail: "frank.lewis@email.com",
    parentPhone: "555-0129",
    parentRelationship: "Father",
    notes: "Strong performer, school athlete",
  },
  {
    studentId: "S030",
    givenNames: "Devon",
    familyName: "Walker",
    gradeLevel: "11",
    dob: "2008-08-17",
    email: "devon.walker@school.edu",
    parentName: "Sandra Walker",
    parentEmail: "sandra.walker@email.com",
    parentPhone: "555-0130",
    parentRelationship: "Mother",
  },

  // Grade 12
  {
    studentId: "S031",
    givenNames: "Elena",
    familyName: "Scott",
    gradeLevel: "12",
    dob: "2007-05-20",
    email: "elena.scott@school.edu",
    parentName: "Michael Scott",
    parentEmail: "michael.scott@email.com",
    parentPhone: "555-0131",
    parentRelationship: "Father",
    notes: "Valedictorian candidate",
  },
  {
    studentId: "S032",
    givenNames: "Finn",
    familyName: "Young",
    gradeLevel: "12",
    dob: "2007-01-13",
    email: "finn.young@school.edu",
    parentName: "Carol Young",
    parentEmail: "carol.young@email.com",
    parentPhone: "555-0132",
    parentRelationship: "Mother",
    accommodations: "Extended time, oral assessments",
    senPlanType: "IEP",
  },
  {
    studentId: "S033",
    givenNames: "Grace",
    familyName: "Hall",
    gradeLevel: "12",
    dob: "2007-06-30",
    email: "grace.hall@school.edu",
    parentName: "Peter Hall",
    parentEmail: "peter.hall@email.com",
    parentPhone: "555-0133",
    parentRelationship: "Father",
  },
  {
    studentId: "S034",
    givenNames: "Henry",
    familyName: "Allen",
    gradeLevel: "12",
    dob: "2007-11-07",
    email: "henry.allen@school.edu",
    parentName: "Barbara Allen",
    parentEmail: "barbara.allen@email.com",
    parentPhone: "555-0134",
    parentRelationship: "Mother",
    notes: "At-risk: chronic absenteeism",
  },
  {
    studentId: "S035",
    givenNames: "Isla",
    familyName: "Wright",
    gradeLevel: "12",
    dob: "2007-04-24",
    email: "isla.wright@school.edu",
    parentName: "Colin Wright",
    parentEmail: "colin.wright@email.com",
    parentPhone: "555-0135",
    parentRelationship: "Father",
    notes: "Drama lead, strong public speaker",
  },
  {
    studentId: "S036",
    givenNames: "James",
    familyName: "King",
    gradeLevel: "12",
    dob: "2007-09-03",
    email: "james.king@school.edu",
    parentName: "Evelyn King",
    parentEmail: "evelyn.king@email.com",
    parentPhone: "555-0136",
    parentRelationship: "Mother",
    senPlanType: "504",
    accommodations: "Calculator use, graph paper",
  },
  {
    studentId: "S037",
    givenNames: "Keisha",
    familyName: "Moore",
    gradeLevel: "12",
    dob: "2007-07-16",
    email: "keisha.moore@school.edu",
    parentName: "Darius Moore",
    parentEmail: "darius.moore@email.com",
    parentPhone: "555-0137",
    parentRelationship: "Father",
  },
  {
    studentId: "S038",
    givenNames: "Lena",
    familyName: "Taylor",
    gradeLevel: "12",
    dob: "2007-02-09",
    email: "lena.taylor@school.edu",
    parentName: "Bruce Taylor",
    parentEmail: "bruce.taylor@email.com",
    parentPhone: "555-0138",
    parentRelationship: "Father",
    notes: "Scholarship recipient, top 5%",
  },
  {
    studentId: "S039",
    givenNames: "Marco",
    familyName: "Flores",
    gradeLevel: "12",
    dob: "2007-12-04",
    email: "marco.flores@school.edu",
    parentName: "Isabel Flores",
    parentEmail: "isabel.flores@email.com",
    parentPhone: "555-0139",
    parentRelationship: "Mother",
  },
  {
    studentId: "S040",
    givenNames: "Nina",
    familyName: "Barnes",
    gradeLevel: "12",
    dob: "2007-08-21",
    email: "nina.barnes@school.edu",
    parentName: "Curtis Barnes",
    parentEmail: "curtis.barnes@email.com",
    parentPhone: "555-0140",
    parentRelationship: "Father",
    notes: "Student council president",
  },
];

// ─── Courses ──────────────────────────────────────────────────────────────────

export const SEED_ENROLLMENT: Record<string, string[]> = {
  // English 10 (course id 1) — Grade 10 students
  "1": [
    "S011",
    "S012",
    "S013",
    "S014",
    "S015",
    "S016",
    "S017",
    "S018",
    "S019",
    "S020",
  ],
  // Math 10 (course id 2) — Grade 10 + some 9s
  "2": [
    "S001",
    "S002",
    "S003",
    "S004",
    "S005",
    "S011",
    "S012",
    "S015",
    "S019",
    "S020",
  ],
  // Biology 11 (course id 3) — Grade 11 students
  "3": [
    "S021",
    "S022",
    "S023",
    "S024",
    "S025",
    "S026",
    "S027",
    "S028",
    "S029",
    "S030",
  ],
};

// ─── Gradebook ────────────────────────────────────────────────────────────────
// Grade structure: { [courseId]: { [studentId]: { [assignmentId]: score } } }

function randomGrade(base: number, variance: number): number | null {
  const r = Math.random();
  if (r < 0.07) return null; // missing ~7%
  const score = Math.round(base + (Math.random() - 0.5) * variance * 2);
  return Math.max(0, Math.min(100, score));
}

const english10Students = [
  "S011",
  "S012",
  "S013",
  "S014",
  "S015",
  "S016",
  "S017",
  "S018",
  "S019",
  "S020",
];
const math10Students = [
  "S001",
  "S002",
  "S003",
  "S004",
  "S005",
  "S011",
  "S012",
  "S015",
  "S019",
  "S020",
];
const bio11Students = [
  "S021",
  "S022",
  "S023",
  "S024",
  "S025",
  "S026",
  "S027",
  "S028",
  "S029",
  "S030",
];

// Student performance profiles (base scores)
const gradeProfile: Record<string, number> = {
  S011: 75,
  S012: 82,
  S013: 58,
  S014: 96,
  S015: 70,
  S016: 79,
  S017: 73,
  S018: 88,
  S019: 84,
  S020: 62,
  S001: 86,
  S002: 77,
  S003: 95,
  S004: 63,
  S005: 81,
  S021: 89,
  S022: 93,
  S023: 80,
  S024: 76,
  S025: 71,
  S026: 55,
  S027: 68,
  S028: 85,
  S029: 91,
  S030: 78,
};

const eng10Assignments = [
  "assign-1",
  "assign-2",
  "assign-3",
  "assign-4",
  "assess-1",
  "assess-2",
];
const math10Assignments = [
  "m-assign-1",
  "m-assign-2",
  "m-assign-3",
  "m-assign-4",
  "m-assess-1",
  "m-assess-2",
];
const bio11Assignments = [
  "b-assign-1",
  "b-assign-2",
  "b-assign-3",
  "b-assign-4",
  "b-assess-1",
  "b-assess-2",
];

function buildGrades(students: string[], assignments: string[]) {
  const result: Record<string, Record<string, number | null>> = {};
  for (const sid of students) {
    const base = gradeProfile[sid] ?? 78;
    result[sid] = {};
    for (const aid of assignments) {
      result[sid][aid] = randomGrade(base, 8);
    }
  }
  return result;
}

export const SEED_GRADEBOOK = {
  "1": buildGrades(english10Students, eng10Assignments),
  "2": buildGrades(math10Students, math10Assignments),
  "3": buildGrades(bio11Students, bio11Assignments),
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface SeedAttendanceRecord {
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
}

function generateAttendance(): SeedAttendanceRecord[] {
  const records: SeedAttendanceRecord[] = [];
  const allStudents = SEED_STUDENTS.map((s) => s.studentId);
  const today = new Date();

  for (let dayOffset = 28; dayOffset >= 1; dayOffset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const iso = d.toISOString().split("T")[0];

    for (const sid of allStudents) {
      // determine class
      let classId = "1";
      if (math10Students.includes(sid)) classId = "2";
      if (bio11Students.includes(sid)) classId = "3";

      // at-risk students have higher absence rate
      const atRisk = ["S013", "S020", "S026", "S034"].includes(sid);
      const rand = Math.random();
      let status: SeedAttendanceRecord["status"] = "present";
      if (atRisk) {
        if (rand < 0.15) status = "absent";
        else if (rand < 0.25) status = "late";
        else if (rand < 0.28) status = "excused";
      } else {
        if (rand < 0.04) status = "absent";
        else if (rand < 0.08) status = "late";
        else if (rand < 0.1) status = "excused";
      }

      records.push({ studentId: sid, classId, date: iso, status });
    }
  }
  return records;
}

export const SEED_ATTENDANCE = generateAttendance();

// ─── Timetable ────────────────────────────────────────────────────────────────

export const SEED_TIMETABLE = {
  periods: [
    { id: "p1", name: "Period 1", startTime: "08:00", endTime: "08:55" },
    { id: "p2", name: "Period 2", startTime: "09:00", endTime: "09:55" },
    { id: "p3", name: "Period 3", startTime: "10:00", endTime: "10:55" },
    { id: "p4", name: "Lunch", startTime: "11:00", endTime: "11:30" },
    { id: "p5", name: "Period 5", startTime: "11:35", endTime: "12:30" },
    { id: "p6", name: "Period 6", startTime: "12:35", endTime: "13:30" },
  ],
  assignments: [
    // Monday–Friday for each period
    ...(
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
    ).flatMap((day) => [
      { periodId: "p1", day, courseName: "English 10", room: "Room 101" },
      {
        periodId: "p2",
        day,
        courseName: "Math 10 Algebra II",
        room: "Room 203",
      },
      { periodId: "p3", day, courseName: "Biology 11", room: "Room 115" },
      { periodId: "p4", day, courseName: "Lunch", room: "Cafeteria" },
      { periodId: "p5", day, courseName: "Art", room: "Room 301" },
      {
        periodId: "p6",
        day,
        courseName: "Physical Education",
        room: "Gymnasium",
      },
    ]),
  ],
};

// ─── Behavior Logs ────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const SEED_BEHAVIOR_LOGS = [
  {
    id: 1001,
    studentId: "S013",
    studentName: "Marcus Brown",
    type: "Incident",
    category: "Social",
    subcategory: "Disruption",
    description: "Disrupted group work by arguing loudly with a peer",
    severity: "Moderate",
    actionsTaken: ["Verbal warning", "Parent contact"],
    antecedent: "Group conflict",
    date: daysAgo(2),
    period: "Period 2",
    tags: ["disruption", "peer-conflict"],
  },
  {
    id: 1002,
    studentId: "S013",
    studentName: "Marcus Brown",
    type: "Incident",
    category: "Respect",
    subcategory: "Defiance",
    description:
      "Refused to follow teacher instructions during independent work",
    severity: "Moderate",
    actionsTaken: ["Conference with student"],
    antecedent: "Academic frustration",
    date: daysAgo(5),
    period: "Period 1",
    tags: ["defiance", "at-risk"],
  },
  {
    id: 1003,
    studentId: "S014",
    studentName: "Nadia Petrov",
    type: "Praise",
    category: "Academic",
    subcategory: "Excellence",
    description: "Achieved 100% on the algebra unit test — outstanding work",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(3),
    period: "Period 2",
    tags: ["achievement", "honor-roll"],
  },
  {
    id: 1004,
    studentId: "S020",
    studentName: "Tyler Anderson",
    type: "Incident",
    category: "Responsibility",
    subcategory: "Truancy",
    description: "Absent without excuse for third time this month",
    severity: "Moderate",
    actionsTaken: ["Parent contact", "Attendance review"],
    date: daysAgo(7),
    period: "Morning",
    tags: ["attendance", "at-risk"],
  },
  {
    id: 1005,
    studentId: "S026",
    studentName: "Zachary White",
    type: "Incident",
    category: "Academic",
    subcategory: "Missing work",
    description: "5th consecutive missing homework assignment",
    severity: "Low",
    actionsTaken: ["Conference with student", "Academic support referral"],
    date: daysAgo(4),
    period: "Period 1",
    tags: ["missing-work", "at-risk"],
  },
  {
    id: 1006,
    studentId: "S003",
    studentName: "Carlos Mendoza",
    type: "Praise",
    category: "Social",
    subcategory: "Peer support",
    description: "Voluntarily tutored two struggling classmates during lunch",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(1),
    period: "Lunch",
    tags: ["leadership", "positive"],
  },
  {
    id: 1007,
    studentId: "S004",
    studentName: "Diana Nguyen",
    type: "Observation",
    category: "Emotional Regulation",
    subcategory: "Anxiety",
    description:
      "Showed signs of distress before presentation — provided accommodations",
    severity: "Low",
    actionsTaken: ["Accommodation provided", "Check-in scheduled"],
    date: daysAgo(6),
    period: "Period 3",
    tags: ["anxiety", "IEP"],
  },
  {
    id: 1008,
    studentId: "S034",
    studentName: "Henry Allen",
    type: "Incident",
    category: "Responsibility",
    subcategory: "Chronic absence",
    description: "8th absence this semester — well above threshold",
    severity: "High",
    actionsTaken: [
      "Principal referral",
      "Parent meeting",
      "Attendance contract",
    ],
    date: daysAgo(3),
    period: "All Day",
    tags: ["absenteeism", "at-risk", "intervention"],
  },
  {
    id: 1009,
    studentId: "S022",
    studentName: "Victor Lee",
    type: "Praise",
    category: "Academic",
    subcategory: "Excellence",
    description:
      "Led class discussion with insightful analysis of DNA replication",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(2),
    period: "Period 3",
    tags: ["leadership", "academic"],
  },
  {
    id: 1010,
    studentId: "S013",
    studentName: "Marcus Brown",
    type: "Incident",
    category: "Safety",
    subcategory: "Physical altercation",
    description:
      "Minor scuffle in hallway between classes — both students separated",
    severity: "High",
    actionsTaken: ["Office referral", "Parent contact", "Suspension review"],
    date: daysAgo(10),
    period: "Passing",
    tags: ["safety", "serious", "at-risk"],
  },
  {
    id: 1011,
    studentId: "S001",
    studentName: "Aiden Torres",
    type: "Praise",
    category: "Academic",
    subcategory: "Participation",
    description:
      "Excellent contributions to the literature circle — insightful connections",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(1),
    period: "Period 1",
    tags: ["participation", "positive"],
  },
  {
    id: 1012,
    studentId: "S009",
    studentName: "Isaac Rodriguez",
    type: "Observation",
    category: "Emotional Regulation",
    subcategory: "Withdrawal",
    description:
      "Seemed disengaged and quiet — follow up with counselor recommended",
    severity: "Low",
    actionsTaken: ["Counselor referral"],
    date: daysAgo(8),
    period: "Period 1",
    tags: ["wellness", "SEN", "follow-up"],
  },
  {
    id: 1013,
    studentId: "S031",
    studentName: "Elena Scott",
    type: "Praise",
    category: "Responsibility",
    subcategory: "Leadership",
    description:
      "Organized study group for upcoming midterm — showed excellent initiative",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(4),
    period: "After school",
    tags: ["leadership", "positive"],
  },
  {
    id: 1014,
    studentId: "S026",
    studentName: "Zachary White",
    type: "Incident",
    category: "Respect",
    subcategory: "Disrespect to teacher",
    description: "Used inappropriate language when frustrated during exam",
    severity: "Moderate",
    actionsTaken: ["Verbal warning", "Parent contact"],
    date: daysAgo(9),
    period: "Period 3",
    tags: ["language", "at-risk"],
  },
  {
    id: 1015,
    studentId: "S018",
    studentName: "Riley Wilson",
    type: "Observation",
    category: "Other",
    subcategory: "Medical concern",
    description:
      "Appeared to have allergic reaction — EpiPen administered, parents notified",
    severity: "High",
    actionsTaken: ["Medical intervention", "Parent contact", "Incident report"],
    date: daysAgo(14),
    period: "Period 5",
    tags: ["medical", "allergy"],
  },
  {
    id: 1016,
    studentId: "S029",
    studentName: "Chloe Lewis",
    type: "Praise",
    category: "Social",
    subcategory: "Community",
    description:
      "Organized a class fundraiser for the local food bank — raised $340",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(5),
    period: "After school",
    tags: ["community", "leadership"],
  },
  {
    id: 1017,
    studentId: "S027",
    studentName: "Amara Diallo",
    type: "Observation",
    category: "Academic",
    subcategory: "Support need",
    description:
      "Struggling with reading comprehension — IEP team meeting scheduled",
    severity: "Low",
    actionsTaken: ["IEP review", "Reading support arranged"],
    date: daysAgo(11),
    period: "Period 1",
    tags: ["IEP", "reading", "support"],
  },
  {
    id: 1018,
    studentId: "S020",
    studentName: "Tyler Anderson",
    type: "Incident",
    category: "Responsibility",
    subcategory: "Late arrival",
    description:
      "Arrived 20 minutes late without explanation — third time this week",
    severity: "Low",
    actionsTaken: ["Verbal warning"],
    date: daysAgo(1),
    period: "Period 1",
    tags: ["attendance", "tardiness"],
  },
  {
    id: 1019,
    studentId: "S038",
    studentName: "Lena Taylor",
    type: "Praise",
    category: "Academic",
    subcategory: "Excellence",
    description: "Won district-wide essay competition — exceptional writing",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(6),
    period: "N/A",
    tags: ["achievement", "district"],
  },
  {
    id: 1020,
    studentId: "S013",
    studentName: "Marcus Brown",
    type: "Incident",
    category: "Emotional Regulation",
    subcategory: "Outburst",
    description: "Emotional outburst during test — disrupted peers",
    severity: "Moderate",
    actionsTaken: ["De-escalation", "Counselor check-in"],
    date: daysAgo(15),
    period: "Period 2",
    tags: ["emotional-regulation", "at-risk"],
  },
  {
    id: 1021,
    studentId: "S040",
    studentName: "Nina Barnes",
    type: "Praise",
    category: "Responsibility",
    subcategory: "Leadership",
    description:
      "Ran a successful student council meeting — excellent facilitation skills",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(3),
    period: "After school",
    tags: ["leadership", "student-council"],
  },
  {
    id: 1022,
    studentId: "S015",
    studentName: "Oscar Davis",
    type: "Observation",
    category: "Academic",
    subcategory: "Improvement",
    description:
      "Showed significant improvement in essay structure after targeted feedback",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(7),
    period: "Period 1",
    tags: ["improvement", "growth"],
  },
  {
    id: 1023,
    studentId: "S026",
    studentName: "Zachary White",
    type: "Incident",
    category: "Academic",
    subcategory: "Cheating",
    description:
      "Found copying from neighbor during quiz — handled with academic integrity process",
    severity: "High",
    actionsTaken: ["Zero on quiz", "Parent contact", "Academic integrity form"],
    date: daysAgo(20),
    period: "Period 3",
    tags: ["integrity", "at-risk", "serious"],
  },
  {
    id: 1024,
    studentId: "S006",
    studentName: "Fatima Al-Hassan",
    type: "Praise",
    category: "Academic",
    subcategory: "Creative work",
    description:
      "Delivered a beautifully written personal narrative — shared with class",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(2),
    period: "Period 1",
    tags: ["writing", "creative"],
  },
  {
    id: 1025,
    studentId: "S034",
    studentName: "Henry Allen",
    type: "Incident",
    category: "Responsibility",
    subcategory: "Missing work",
    description: "Third missing major assignment this grading period",
    severity: "Moderate",
    actionsTaken: ["Parent contact", "Grade warning"],
    date: daysAgo(12),
    period: "Period 1",
    tags: ["missing-work", "at-risk"],
  },
  {
    id: 1026,
    studentId: "S012",
    studentName: "Lily Thompson",
    type: "Observation",
    category: "Emotional Regulation",
    subcategory: "Test anxiety",
    description:
      "Showed signs of test anxiety — 504 accommodations reviewed and applied",
    severity: "Low",
    actionsTaken: ["504 accommodation", "Check-in"],
    date: daysAgo(8),
    period: "Period 2",
    tags: ["504", "anxiety"],
  },
  {
    id: 1027,
    studentId: "S010",
    studentName: "Jasmine Chen",
    type: "Praise",
    category: "Academic",
    subcategory: "Peer tutoring",
    description:
      "Provided exemplary peer tutoring — students she helped passed the quiz",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(5),
    period: "Lunch",
    tags: ["tutoring", "leadership"],
  },
  {
    id: 1028,
    studentId: "S034",
    studentName: "Henry Allen",
    type: "Incident",
    category: "Responsibility",
    subcategory: "Truancy",
    description: "Unexcused absence confirmed — parents unreachable",
    severity: "Moderate",
    actionsTaken: ["Attendance officer notified"],
    date: daysAgo(18),
    period: "All Day",
    tags: ["absenteeism", "at-risk"],
  },
  {
    id: 1029,
    studentId: "S025",
    studentName: "Yara Hassan",
    type: "Praise",
    category: "Social",
    subcategory: "Language growth",
    description:
      "Presented entirely in English for the first time — remarkable progress",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(9),
    period: "Period 3",
    tags: ["ESL", "growth"],
  },
  {
    id: 1030,
    studentId: "S016",
    studentName: "Priya Sharma",
    type: "Observation",
    category: "Academic",
    subcategory: "Support need",
    description:
      "IEP goals reviewed — speech therapy yielding positive results",
    severity: "None",
    actionsTaken: ["IEP note"],
    date: daysAgo(13),
    period: "Period 1",
    tags: ["IEP", "speech"],
  },
  {
    id: 1031,
    studentId: "S005",
    studentName: "Ethan Williams",
    type: "Incident",
    category: "Social",
    subcategory: "Exclusion",
    description:
      "Observed excluding a peer from group activity — addressed immediately",
    severity: "Low",
    actionsTaken: ["Restorative conversation"],
    date: daysAgo(16),
    period: "Period 5",
    tags: ["social", "bullying"],
  },
  {
    id: 1032,
    studentId: "S022",
    studentName: "Victor Lee",
    type: "Praise",
    category: "Academic",
    subcategory: "Research",
    description:
      "Submitted an outstanding independent research report on genetics",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(4),
    period: "Period 3",
    tags: ["research", "AP"],
  },
  {
    id: 1033,
    studentId: "S013",
    studentName: "Marcus Brown",
    type: "Incident",
    category: "Social",
    subcategory: "Bullying",
    description:
      "Witnessed verbal bullying toward a younger student — referred to counselor",
    severity: "High",
    actionsTaken: ["Counselor referral", "Parent contact", "Behavior contract"],
    date: daysAgo(22),
    period: "Lunch",
    tags: ["bullying", "at-risk", "serious"],
  },
  {
    id: 1034,
    studentId: "S028",
    studentName: "Blake Harris",
    type: "Observation",
    category: "Emotional Regulation",
    subcategory: "Stress",
    description:
      "Mentioned feeling overwhelmed with workload — referred to school counselor",
    severity: "Low",
    actionsTaken: ["Counselor referral"],
    date: daysAgo(6),
    period: "Period 2",
    tags: ["wellness", "stress"],
  },
  {
    id: 1035,
    studentId: "S035",
    studentName: "Isla Wright",
    type: "Praise",
    category: "Social",
    subcategory: "Performance",
    description:
      "Exceptional performance in drama production — received standing ovation",
    severity: "None",
    actionsTaken: [],
    date: daysAgo(7),
    period: "After school",
    tags: ["drama", "performance"],
  },
];

// ─── Announcements ────────────────────────────────────────────────────────────

export const SEED_ANNOUNCEMENTS = [
  {
    id: 2001,
    title: "Parent-Teacher Conference Week — Book Your Slot",
    body: "Parent-teacher conferences will be held next week, March 17–21. Please book your slot through the school portal or contact the office directly. Meetings are 15 minutes each. If you cannot attend in person, video call options are available.",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    visibility: "all",
    pinned: true,
    archived: false,
    createdAt: Date.now() - 86400000 * 2,
    deliveryCount: 38,
    viewCount: 29,
  },
  {
    id: 2002,
    title: "Spring Science Fair — Entries Due Friday",
    body: "The annual Spring Science Fair is approaching! All Grade 11 Biology students are expected to submit a project proposal by this Friday. Projects will be displayed in the gymnasium on April 5th. Parents and guardians are warmly invited to attend.",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    visibility: "all",
    pinned: false,
    archived: false,
    createdAt: Date.now() - 86400000 * 5,
    deliveryCount: 30,
    viewCount: 24,
  },
  {
    id: 2003,
    title: "Q2 Grade Reports Available Online",
    body: "Quarter 2 grade reports are now available through the parent portal. Please review your child's progress and reach out to their teachers if you have any questions. Report cards will be mailed home next week.",
    date: new Date(Date.now() - 86400000 * 10).toISOString().split("T")[0],
    visibility: "all",
    pinned: false,
    archived: false,
    createdAt: Date.now() - 86400000 * 10,
    deliveryCount: 40,
    viewCount: 35,
  },
  {
    id: 2004,
    title: "School Holiday — No Classes March 15",
    body: "Please be advised that there will be no school on Friday, March 15th due to a professional development day for staff. Normal classes will resume on Monday, March 18th.",
    date: new Date(Date.now() - 86400000 * 8).toISOString().split("T")[0],
    visibility: "all",
    pinned: false,
    archived: true,
    createdAt: Date.now() - 86400000 * 8,
    deliveryCount: 40,
    viewCount: 38,
  },
  {
    id: 2005,
    title: "Algebra Unit Test — This Thursday",
    body: "A reminder that the Algebra II Unit 3 test will take place this Thursday during Period 2. Students should review chapters 8–10. Practice worksheets are available on the class page. Students requiring extended time accommodations should confirm arrangements with me by Wednesday.",
    date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0],
    visibility: "all",
    pinned: true,
    archived: false,
    createdAt: Date.now() - 86400000 * 1,
    deliveryCount: 10,
    viewCount: 7,
  },
];

// ─── Messages (threads) ───────────────────────────────────────────────────────

export const SEED_MESSAGES = [
  {
    id: 3001,
    to: "Maria Torres (Aiden Torres)",
    subject: "Update on Aiden's Progress",
    body: "Dear Ms. Torres, I wanted to update you on Aiden's excellent progress in English 10 this quarter...",
    sentAt: Date.now() - 86400000 * 3,
    recipientCount: 1,
    status: "read" as const,
    thread: [
      {
        id: "t1",
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        from: "teacher" as const,
        body: "Dear Ms. Torres, I wanted to update you on Aiden's excellent progress in English 10 this quarter. He has shown great improvement in analytical writing and participates actively in class discussions. His recent essay on identity themes received one of the highest grades in the class. Please feel free to reach out if you have questions.",
      },
      {
        id: "t2",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        from: "parent" as const,
        body: "Thank you so much for the update! We're very proud of Aiden. He has been working really hard at home on his essays. Is there anything specific we can do to support him further?",
      },
      {
        id: "t3",
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        from: "teacher" as const,
        body: "Encouraging his independent reading at home would be wonderful — even 20 minutes a day makes a big difference. I'd also recommend the summer reading list I'll be sharing next week. You should be very proud!",
      },
    ],
  },
  {
    id: 3002,
    to: "Angela Brown (Marcus Brown)",
    subject: "Urgent: Behavior Concern — Marcus",
    body: "Dear Ms. Brown, I need to discuss some concerning behavior incidents involving Marcus...",
    sentAt: Date.now() - 86400000 * 7,
    recipientCount: 1,
    status: "replied" as const,
    thread: [
      {
        id: "t4",
        date: new Date(Date.now() - 86400000 * 7).toISOString(),
        from: "teacher" as const,
        body: "Dear Ms. Brown, I need to discuss some concerning behavior incidents involving Marcus this week. He has had several disruptions in class and one more serious incident. I believe early intervention is important here. Could we schedule a meeting at your earliest convenience?",
      },
      {
        id: "t5",
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        from: "parent" as const,
        body: "I'm really concerned to hear this. Marcus has been under stress at home lately. Can we meet on Thursday at 3:30pm? I want to work together on this.",
      },
      {
        id: "t6",
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        from: "teacher" as const,
        body: "Thursday at 3:30pm works perfectly. I'll also invite the school counselor to join us. Together we can come up with a support plan for Marcus. See you then.",
      },
    ],
  },
  {
    id: 3003,
    to: "All Parents — English 10",
    subject: "Upcoming Essay Assignment and Resources",
    body: "Dear Families, Students will begin a major essay assignment next week on social justice themes...",
    sentAt: Date.now() - 86400000 * 12,
    recipientCount: 10,
    status: "delivered" as const,
    thread: [
      {
        id: "t7",
        date: new Date(Date.now() - 86400000 * 12).toISOString(),
        from: "teacher" as const,
        body: "Dear Families, Students will begin a major essay assignment next week on social justice themes from our current unit. The assignment is worth 25% of their grade. A detailed rubric and sample essays will be provided in class. Please encourage your child to begin brainstorming this weekend.",
      },
    ],
  },
  {
    id: 3004,
    to: "Susan Anderson (Tyler Anderson)",
    subject: "Attendance Concern — Tyler",
    body: "Dear Ms. Anderson, I'm reaching out regarding Tyler's recent attendance issues...",
    sentAt: Date.now() - 86400000 * 4,
    recipientCount: 1,
    status: "sent" as const,
    thread: [
      {
        id: "t8",
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        from: "teacher" as const,
        body: "Dear Ms. Anderson, I'm reaching out regarding Tyler's recent attendance. He has been absent or tardy 5 times in the past three weeks, which is affecting his ability to keep up with class work. Missing key lessons is starting to impact his grades. I'd love to connect to understand what's happening and how we can support Tyler.",
      },
    ],
  },
];

// ─── Parent Correspondence ────────────────────────────────────────────────────
// Stored per student in their interventionPlans field

export const SEED_PARENT_CORRESPONDENCE: Array<{
  studentId: string;
  entries: Array<{
    id: string;
    date: string;
    guardian: string;
    method: "phone" | "email" | "in_person" | "note_home" | "video_call";
    summary: string;
    outcome: string;
  }>;
}> = [
  {
    studentId: "S013",
    entries: [
      {
        id: "pc-001",
        date: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
        guardian: "Angela Brown",
        method: "phone",
        summary:
          "Discussed behavior incidents and academic struggles. Parent expressed concern about home stressors.",
        outcome: "Meeting scheduled for Thursday. Counselor to be included.",
      },
      {
        id: "pc-002",
        date: new Date(Date.now() - 86400000 * 14).toISOString().split("T")[0],
        guardian: "Angela Brown",
        method: "email",
        summary: "Sent academic progress update and behavior incident details.",
        outcome: "Parent acknowledged and requested phone call.",
      },
    ],
  },
  {
    studentId: "S020",
    entries: [
      {
        id: "pc-003",
        date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
        guardian: "Susan Anderson",
        method: "email",
        summary:
          "Raised attendance concerns — 5 absences or tardies in 3 weeks.",
        outcome: "No response yet. Follow up required.",
      },
    ],
  },
  {
    studentId: "S026",
    entries: [
      {
        id: "pc-004",
        date: new Date(Date.now() - 86400000 * 9).toISOString().split("T")[0],
        guardian: "Patricia White",
        method: "phone",
        summary:
          "Discussed missing assignments and academic integrity incident.",
        outcome:
          "Parent apologized and committed to monitoring homework. Support plan discussed.",
      },
      {
        id: "pc-005",
        date: new Date(Date.now() - 86400000 * 20).toISOString().split("T")[0],
        guardian: "Patricia White",
        method: "in_person",
        summary:
          "Parent meeting to discuss Zachary's declining grades and behavior.",
        outcome: "Agreed on weekly check-in emails. Tutoring arranged.",
      },
    ],
  },
  {
    studentId: "S034",
    entries: [
      {
        id: "pc-006",
        date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        guardian: "Barbara Allen",
        method: "phone",
        summary:
          "Chronic absenteeism escalating — 8 absences. Principal involvement discussed.",
        outcome:
          "Parent attendance contract signed. Transportation support explored.",
      },
    ],
  },
  {
    studentId: "S001",
    entries: [
      {
        id: "pc-007",
        date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        guardian: "Maria Torres",
        method: "email",
        summary: "Shared positive progress update on Aiden's essay work.",
        outcome:
          "Parent responded enthusiastically. Discussed summer reading recommendations.",
      },
    ],
  },
];
