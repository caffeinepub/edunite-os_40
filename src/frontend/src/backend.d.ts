import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Student {
    familyName: string;
    studentId: string;
    guardianContacts: Array<GuardianContact>;
    createdAt: Time;
    attendanceRecords: Array<AttendanceRecord>;
    teacherNotes: string;
    behaviorEntries: Array<BehaviorEntry>;
    senPlan?: SENPlan;
    accommodations: Array<Accommodation>;
    gradeLevel: string;
    preferredName?: string;
    medicalNotes: string;
    photo: string;
    givenNames: string;
    interventionPlans: string;
    allergies: Array<string>;
}
export type Time = bigint;
export interface SENGoal {
    id: bigint;
    status: SENGoalStatus;
    description: string;
    targetDate: string;
}
export interface GuardianContact {
    id: bigint;
    languagePreference: string;
    relationship: string;
    emergencyContact: boolean;
    email: string;
    phone: string;
    lastName: string;
    preferredContactMethod: ContactMethod;
    firstName: string;
}
export interface BehaviorLog {
    context: string;
    entryType: BehaviorEntryType;
    followUpNeeded: boolean;
    studentName: string;
    description: string;
    entryId: bigint;
    category: BehaviorCategory;
    severity?: BehaviorSeverity;
    actionTaken?: string;
    loggedAt: Time;
}
export interface BehaviorEntry {
    date: string;
    description: string;
    consequence?: string;
}
export interface SENPlan {
    expiryDate: string;
    reviewDate: string;
    goals: Array<SENGoal>;
    notes: string;
    services: Array<string>;
    planType: SENPlanType;
    coordinator: string;
    startDate: string;
}
export interface Accommodation {
    id: bigint;
    description: string;
}
export interface AttendanceRecord {
    status: AttendanceStatus;
    date: string;
    reason?: string;
}
export interface UserProfile {
    name: string;
}
export enum AttendanceStatus {
    tardy = "tardy",
    present = "present",
    absent = "absent",
    excused = "excused"
}
export enum BehaviorCategory {
    safety = "safety",
    social = "social",
    other = "other",
    academic = "academic",
    respect = "respect",
    responsibility = "responsibility"
}
export enum BehaviorEntryType {
    incident = "incident",
    praise = "praise"
}
export enum BehaviorSeverity {
    major = "major",
    minor = "minor",
    moderate = "moderate"
}
export enum ContactMethod {
    either = "either",
    email = "email",
    phone = "phone"
}
export enum SENGoalStatus {
    met = "met",
    notStarted = "notStarted",
    inProgress = "inProgress"
}
export enum SENPlanType {
    iep = "iep",
    sen = "sen",
    other = "other",
    none = "none",
    plan504 = "plan504"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBehaviorEntry(studentId: string, date: string, description: string, consequence: string | null): Promise<BehaviorEntry>;
    addBehaviorLog(studentName: string, entryType: BehaviorEntryType, category: BehaviorCategory, context: string, description: string, severity: BehaviorSeverity | null, actionTaken: string | null, followUpNeeded: boolean): Promise<bigint>;
    addGuardianContact(studentId: string, firstName: string, lastName: string, relationship: string, phone: string, email: string, preferredContactMethod: ContactMethod, languagePreference: string, emergencyContact: boolean): Promise<GuardianContact>;
    addStudent(studentId: string, givenNames: string, familyName: string, preferredName: string | null, gradeLevel: string, photo: string, accommodations: Array<Accommodation>, allergies: Array<string>, medicalNotes: string, attendanceRecords: Array<AttendanceRecord>, guardianContacts: Array<GuardianContact>, teacherNotes: string, interventionPlans: string, behaviorEntries: Array<BehaviorEntry>, senPlan: SENPlan | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBehaviorEntry(studentId: string, _entryId: bigint): Promise<void>;
    deleteBehaviorLog(entryId: bigint): Promise<void>;
    deleteGuardianContact(studentId: string, contactId: bigint): Promise<void>;
    deleteStudent(studentId: string): Promise<void>;
    getAccommodationsByStudent(studentId: string): Promise<Array<Accommodation>>;
    getAllBehaviorLogs(): Promise<Array<BehaviorLog>>;
    getAllStudents(): Promise<Array<Student>>;
    getBehaviorEntriesByStudent(studentId: string): Promise<Array<BehaviorEntry>>;
    getBehaviorLogById(entryId: bigint): Promise<BehaviorLog | null>;
    getBehaviorLogsByCategory(category: BehaviorCategory): Promise<Array<BehaviorLog>>;
    getBehaviorLogsByStudent(studentName: string): Promise<Array<BehaviorLog>>;
    getBehaviorLogsByType(entryType: BehaviorEntryType): Promise<Array<BehaviorLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGuardiansByStudent(studentId: string): Promise<Array<GuardianContact>>;
    getRoster(): Promise<Array<string>>;
    getSENPlan(studentId: string): Promise<SENPlan | null>;
    getStudentById(studentId: string): Promise<Student>;
    getStudentCountByClass(className: string): Promise<bigint>;
    getStudentsByClass(className: string): Promise<Array<Student>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedStudents(): Promise<void>;
    updateBehaviorEntry(studentId: string, entryId: bigint, date: string, description: string, consequence: string | null): Promise<BehaviorEntry>;
    updateBehaviorLog(entryId: bigint, studentName: string, entryType: BehaviorEntryType, category: BehaviorCategory, context: string, description: string, severity: BehaviorSeverity | null, actionTaken: string | null, followUpNeeded: boolean): Promise<void>;
    updateGuardianContact(studentId: string, contactId: bigint, firstName: string, lastName: string, relationship: string, phone: string, email: string, preferredContactMethod: ContactMethod, languagePreference: string, emergencyContact: boolean): Promise<GuardianContact>;
    updateSENPlan(studentId: string, senPlan: SENPlan): Promise<void>;
    updateStudent(studentId: string, givenNames: string, familyName: string, preferredName: string | null, gradeLevel: string, photo: string, accommodations: Array<Accommodation>, allergies: Array<string>, medicalNotes: string, attendanceRecords: Array<AttendanceRecord>, guardianContacts: Array<GuardianContact>, teacherNotes: string, interventionPlans: string, behaviorEntries: Array<BehaviorEntry>, senPlan: SENPlan | null): Promise<void>;
}
