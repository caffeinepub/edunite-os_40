import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";



actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type AttendanceStatus = {
    #present;
    #absent;
    #tardy;
    #excused;
  };

  public type AttendanceRecord = {
    date : Text;
    status : AttendanceStatus;
    reason : ?Text;
  };

  public type ContactMethod = {
    #phone;
    #email;
    #either;
  };

  public type GuardianContact = {
    id : Nat;
    firstName : Text;
    lastName : Text;
    relationship : Text;
    phone : Text;
    email : Text;
    preferredContactMethod : ContactMethod;
    languagePreference : Text;
    emergencyContact : Bool;
  };

  public type Accommodation = {
    id : Nat;
    description : Text;
  };

  public type BehaviorEntry = {
    date : Text;
    description : Text;
    consequence : ?Text;
  };

  public type BehaviorEntryType = {
    #incident;
    #praise;
  };

  public type BehaviorCategory = {
    #academic;
    #social;
    #safety;
    #respect;
    #responsibility;
    #other;
  };

  public type BehaviorSeverity = {
    #minor;
    #moderate;
    #major;
  };

  public type BehaviorLog = {
    entryId : Nat;
    studentName : Text;
    entryType : BehaviorEntryType;
    category : BehaviorCategory;
    context : Text;
    description : Text;
    severity : ?BehaviorSeverity;
    actionTaken : ?Text;
    followUpNeeded : Bool;
    loggedAt : Time.Time;
  };

  public type SENPlanType = {
    #iep;
    #plan504;
    #sen;
    #other;
    #none;
  };

  public type SENGoalStatus = {
    #notStarted;
    #inProgress;
    #met;
  };

  public type SENGoal = {
    id : Nat;
    description : Text;
    targetDate : Text;
    status : SENGoalStatus;
  };

  public type SENPlan = {
    planType : SENPlanType;
    startDate : Text;
    reviewDate : Text;
    expiryDate : Text;
    coordinator : Text;
    services : [Text];
    goals : [SENGoal];
    notes : Text;
  };

  public type Student = {
    studentId : Text;
    givenNames : Text;
    familyName : Text;
    preferredName : ?Text;
    gradeLevel : Text;
    photo : Text;
    accommodations : [Accommodation];
    allergies : [Text];
    medicalNotes : Text;
    attendanceRecords : [AttendanceRecord];
    guardianContacts : [GuardianContact];
    teacherNotes : Text;
    interventionPlans : Text; // keep for backwards compatibility
    behaviorEntries : [BehaviorEntry];
    createdAt : Time.Time;
    senPlan : ?SENPlan;
  };

  let students = Map.empty<Text, Student>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextGuardianContactId = 0;
  var nextBehaviorEntryId = 0;
  var nextAccommodationId = 0;
  var nextBehaviorLogId = 1;
  var nextSENGoalId = 0;
  let behaviorLogs = Map.empty<Nat, BehaviorLog>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Student Management
  public shared ({ caller }) func addStudent(
    studentId : Text,
    givenNames : Text,
    familyName : Text,
    preferredName : ?Text,
    gradeLevel : Text,
    photo : Text,
    accommodations : [Accommodation],
    allergies : [Text],
    medicalNotes : Text,
    attendanceRecords : [AttendanceRecord],
    guardianContacts : [GuardianContact],
    teacherNotes : Text,
    interventionPlans : Text,
    behaviorEntries : [BehaviorEntry],
    senPlan : ?SENPlan,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add students");
    };
    if (students.containsKey(studentId)) {
      Runtime.trap("Student with that ID already exists");
    };
    let newStudent : Student = {
      studentId;
      givenNames;
      familyName;
      preferredName;
      gradeLevel;
      photo;
      accommodations;
      allergies;
      medicalNotes;
      attendanceRecords;
      guardianContacts;
      teacherNotes;
      interventionPlans;
      behaviorEntries;
      createdAt = Time.now();
      senPlan;
    };
    students.add(studentId, newStudent);
  };

  public query ({ caller }) func getStudentById(studentId : Text) : async Student {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get students by ID");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { return student };
    };
  };

  public query ({ caller }) func getAllStudents() : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get all students");
    };
    students.values().toArray();
  };

  public shared ({ caller }) func updateStudent(
    studentId : Text,
    givenNames : Text,
    familyName : Text,
    preferredName : ?Text,
    gradeLevel : Text,
    photo : Text,
    accommodations : [Accommodation],
    allergies : [Text],
    medicalNotes : Text,
    attendanceRecords : [AttendanceRecord],
    guardianContacts : [GuardianContact],
    teacherNotes : Text,
    interventionPlans : Text,
    behaviorEntries : [BehaviorEntry],
    senPlan : ?SENPlan,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update students");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?_existingStudent) {
        let updatedStudent : Student = {
          studentId;
          givenNames;
          familyName;
          preferredName;
          gradeLevel;
          photo;
          accommodations;
          allergies;
          medicalNotes;
          attendanceRecords;
          guardianContacts;
          teacherNotes;
          interventionPlans;
          behaviorEntries;
          createdAt = Time.now();
          senPlan;
        };
        students.add(studentId, updatedStudent);
      };
    };
  };

  public shared ({ caller }) func deleteStudent(studentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete students");
    };
    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    students.remove(studentId);
  };

  // Guardian Contact Management
  public shared ({ caller }) func addGuardianContact(
    studentId : Text,
    firstName : Text,
    lastName : Text,
    relationship : Text,
    phone : Text,
    email : Text,
    preferredContactMethod : ContactMethod,
    languagePreference : Text,
    emergencyContact : Bool,
  ) : async GuardianContact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add guardian contacts");
    };
    let newContact : GuardianContact = {
      id = nextGuardianContactId;
      firstName;
      lastName;
      relationship;
      phone;
      email;
      preferredContactMethod;
      languagePreference;
      emergencyContact;
    };
    nextGuardianContactId += 1;
    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    let student = students.get(studentId).unwrap();
    let updatedContacts = student.guardianContacts.concat([newContact]);
    let updatedStudent = { student with guardianContacts = updatedContacts };
    students.add(studentId, updatedStudent);
    newContact;
  };

  public shared ({ caller }) func updateGuardianContact(
    studentId : Text,
    contactId : Nat,
    firstName : Text,
    lastName : Text,
    relationship : Text,
    phone : Text,
    email : Text,
    preferredContactMethod : ContactMethod,
    languagePreference : Text,
    emergencyContact : Bool,
  ) : async GuardianContact {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update guardian contacts");
    };

    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    let student = students.get(studentId).unwrap();
    let contactExists = student.guardianContacts.any(func(c) { c.id == contactId });
    if (not contactExists) {
      Runtime.trap("Guardian contact not found");
    };
    let updatedContact : GuardianContact = {
      id = contactId;
      firstName;
      lastName;
      relationship;
      phone;
      email;
      preferredContactMethod;
      languagePreference;
      emergencyContact;
    };
    let filteredContacts = student.guardianContacts.filter(func(c) { c.id != contactId });
    let updatedContacts = filteredContacts.concat([updatedContact]);
    let updatedStudent = { student with guardianContacts = updatedContacts };
    students.add(studentId, updatedStudent);
    updatedContact;
  };

  public shared ({ caller }) func deleteGuardianContact(studentId : Text, contactId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete guardian contacts");
    };

    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    let student = students.get(studentId).unwrap();
    let contactExists = student.guardianContacts.any(func(c) { c.id == contactId });
    if (not contactExists) {
      Runtime.trap("Guardian contact not found");
    };
    let updatedContacts = student.guardianContacts.filter(func(c) { c.id != contactId });
    let updatedStudent = { student with guardianContacts = updatedContacts };
    students.add(studentId, updatedStudent);
  };

  // Behavior Entry Management
  public shared ({ caller }) func addBehaviorEntry(
    studentId : Text,
    date : Text,
    description : Text,
    consequence : ?Text,
  ) : async BehaviorEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add behavior entries");
    };

    let newEntry : BehaviorEntry = {
      date;
      description;
      consequence;
    };

    nextBehaviorEntryId += 1;

    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };

    let student = students.get(studentId).unwrap();
    let updatedEntries = student.behaviorEntries.concat([newEntry]);
    let updatedStudent = { student with behaviorEntries = updatedEntries };

    students.add(studentId, updatedStudent);

    newEntry;
  };

  public shared ({ caller }) func updateBehaviorEntry(
    studentId : Text,
    entryId : Nat,
    date : Text,
    description : Text,
    consequence : ?Text,
  ) : async BehaviorEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update behavior entries");
    };

    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    let student = students.get(studentId).unwrap();
    let entryExists = student.behaviorEntries.any(func(_entry) { true });
    if (not entryExists) {
      Runtime.trap("Behavior entry not found");
    };
    let updatedEntry : BehaviorEntry = {
      date;
      description;
      consequence;
    };
    let filteredEntries = student.behaviorEntries.filter(func(_entry) { true });
    let updatedEntries = filteredEntries.concat([updatedEntry]);
    let updatedStudent = { student with behaviorEntries = updatedEntries };
    students.add(studentId, updatedStudent);
    updatedEntry;
  };

  public shared ({ caller }) func deleteBehaviorEntry(studentId : Text, _entryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete behavior entries");
    };
    if (not students.containsKey(studentId)) {
      Runtime.trap("Student not found");
    };
    let student = students.get(studentId).unwrap();
    let entryExists = student.behaviorEntries.any(func(_entry) { true });
    if (not entryExists) {
      Runtime.trap("Behavior entry not found");
    };
    let updatedEntries = student.behaviorEntries.filter(func(_entry) { false });
    let updatedStudent = { student with behaviorEntries = updatedEntries };
    students.add(studentId, updatedStudent);
  };

  // Query Functions
  public query ({ caller }) func getStudentsByClass(className : Text) : async [Student] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get students by class");
    };
    students.values().toArray().filter(
      func(student) {
        Text.equal(student.gradeLevel, className);
      }
    );
  };

  public query ({ caller }) func getStudentCountByClass(className : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get student count by class");
    };
    students.values().toArray().filter(
      func(student) {
        Text.equal(student.gradeLevel, className);
      }
    ).size();
  };

  public query ({ caller }) func getGuardiansByStudent(studentId : Text) : async [GuardianContact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get guardians by student");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student.guardianContacts };
    };
  };

  public query ({ caller }) func getAccommodationsByStudent(studentId : Text) : async [Accommodation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get accommodations by student");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student.accommodations };
    };
  };

  public query ({ caller }) func getBehaviorEntriesByStudent(studentId : Text) : async [BehaviorEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior entries by student");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) { student.behaviorEntries };
    };
  };

  // Behavior Log Management
  public query ({ caller }) func getAllBehaviorLogs() : async [BehaviorLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior logs");
    };
    behaviorLogs.values().toArray();
  };

  public query ({ caller }) func getBehaviorLogById(entryId : Nat) : async ?BehaviorLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior log by ID");
    };
    behaviorLogs.get(entryId);
  };

  public query ({ caller }) func getBehaviorLogsByStudent(studentName : Text) : async [BehaviorLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior logs by student");
    };
    let filteredIter = behaviorLogs.values().filter(
      func(log) {
        Text.equal(log.studentName, studentName);
      }
    );
    filteredIter.toArray();
  };

  public query ({ caller }) func getBehaviorLogsByType(entryType : BehaviorEntryType) : async [BehaviorLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior logs by type");
    };
    let filteredIter = behaviorLogs.values().filter(
      func(log) {
        switch (entryType, log.entryType) {
          case (#incident, #incident) { true };
          case (#praise, #praise) { true };
          case (_) { false };
        };
      }
    );
    filteredIter.toArray();
  };

  public query ({ caller }) func getBehaviorLogsByCategory(category : BehaviorCategory) : async [BehaviorLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get behavior logs by category");
    };
    let filteredIter = behaviorLogs.values().filter(
      func(log) {
        switch (category, log.category) {
          case (#academic, #academic) { true };
          case (#social, #social) { true };
          case (#safety, #safety) { true };
          case (#respect, #respect) { true };
          case (#responsibility, #responsibility) { true };
          case (#other, #other) { true };
          case (_) { false };
        };
      }
    );
    filteredIter.toArray();
  };

  public query ({ caller }) func getRoster() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get roster");
    };
    let namesSet = Set.empty<Text>();
    for (log in behaviorLogs.values()) {
      namesSet.add(log.studentName);
    };
    namesSet.toArray();
  };

  public shared ({ caller }) func addBehaviorLog(
    studentName : Text,
    entryType : BehaviorEntryType,
    category : BehaviorCategory,
    context : Text,
    description : Text,
    severity : ?BehaviorSeverity,
    actionTaken : ?Text,
    followUpNeeded : Bool,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add behavior logs");
    };
    let newEntry : BehaviorLog = {
      entryId = nextBehaviorLogId;
      studentName;
      entryType;
      category;
      context;
      description;
      severity;
      actionTaken;
      followUpNeeded;
      loggedAt = Time.now();
    };
    behaviorLogs.add(nextBehaviorLogId, newEntry);
    nextBehaviorLogId += 1;
    nextBehaviorLogId - 1; // Return the entryId of the newly created log
  };

  public shared ({ caller }) func updateBehaviorLog(
    entryId : Nat,
    studentName : Text,
    entryType : BehaviorEntryType,
    category : BehaviorCategory,
    context : Text,
    description : Text,
    severity : ?BehaviorSeverity,
    actionTaken : ?Text,
    followUpNeeded : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update behavior logs");
    };
    if (not behaviorLogs.containsKey(entryId)) {
      Runtime.trap("Behavior log not found");
    };
    let updatedEntry : BehaviorLog = {
      entryId;
      studentName;
      entryType;
      category;
      context;
      description;
      severity;
      actionTaken;
      followUpNeeded;
      loggedAt = Time.now();
    };
    behaviorLogs.add(entryId, updatedEntry);
  };

  public shared ({ caller }) func deleteBehaviorLog(entryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete behavior logs");
    };
    if (not behaviorLogs.containsKey(entryId)) {
      Runtime.trap("Behavior log not found");
    };
    behaviorLogs.remove(entryId);
  };

  // SEN/IEP/504 Plan Methods
  public shared ({ caller }) func updateSENPlan(
    studentId : Text,
    senPlan : SENPlan,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update SEN plans");
    };
    switch (students.get(studentId)) {
      case (null) { Runtime.trap("Student not found") };
      case (?student) {
        let updatedStudent = { student with senPlan = ?senPlan };
        students.add(studentId, updatedStudent);
      };
    };
  };

  public query ({ caller }) func getSENPlan(studentId : Text) : async ?SENPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get SEN plans");
    };
    switch (students.get(studentId)) {
      case (null) { null };
      case (?student) { student.senPlan };
    };
  };

  // Seed Data — no admin restriction, only runs when student store is empty
  public shared (_) func seedStudents() : async () {
    if (students.values().toArray().size() > 0) {
      return;
    };

    let t = Time.now();
    let exampleStudents : [Student] = [
      {
        studentId = "S001"; givenNames = "Liam"; familyName = "Harrison"; preferredName = ?("Liam");
        gradeLevel = "10"; photo = ""; accommodations = []; allergies = ["Peanuts"];
        medicalNotes = "Carries EpiPen for peanut allergy.";
        attendanceRecords = []; guardianContacts = [{
          id = 1; firstName = "David"; lastName = "Harrison"; relationship = "Father";
          phone = "555-101-0001"; email = "david.harrison@email.com";
          preferredContactMethod = #email; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Strong verbal communicator. Enjoys class discussions.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S002"; givenNames = "Sophia"; familyName = "Martinez"; preferredName = null;
        gradeLevel = "10"; photo = "";
        accommodations = [{ id = 2; description = "Extended time on assessments" }];
        allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 2; firstName = "Rosa"; lastName = "Martinez"; relationship = "Mother";
          phone = "555-101-0002"; email = "rosa.martinez@email.com";
          preferredContactMethod = #phone; languagePreference = "Spanish"; emergencyContact = true;
        }];
        teacherNotes = "Bilingual — Spanish first language. Strong writer when given processing time.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t;
        senPlan = ?{
          planType = #plan504; startDate = "2024-09-01"; reviewDate = "2025-03-01"; expiryDate = "2026-09-01";
          coordinator = "Ms. Patel"; services = ["Extended Time", "Quiet Testing Environment"];
          goals = [{ id = 1; description = "Complete assessments within extended time window"; targetDate = "2025-06-01"; status = #inProgress }];
          notes = "504 for processing speed. Review in March.";
        };
      },
      {
        studentId = "S003"; givenNames = "Noah"; familyName = "Chen"; preferredName = ?("Noah");
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = ["Shellfish"];
        medicalNotes = "Shellfish allergy — avoid cross-contamination.";
        attendanceRecords = []; guardianContacts = [{
          id = 3; firstName = "Wei"; lastName = "Chen"; relationship = "Father";
          phone = "555-101-0003"; email = "wei.chen@email.com";
          preferredContactMethod = #email; languagePreference = "Mandarin"; emergencyContact = true;
        }];
        teacherNotes = "Top student, excels in STEM. Quiet but insightful contributor.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S004"; givenNames = "Amara"; familyName = "Okafor"; preferredName = null;
        gradeLevel = "9"; photo = "";
        accommodations = [{ id = 4; description = "Preferential seating near the front" }];
        allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 4; firstName = "Chidi"; lastName = "Okafor"; relationship = "Father";
          phone = "555-101-0004"; email = "chidi.okafor@email.com";
          preferredContactMethod = #either; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "New to the school this year. Settling in well. Needs encouragement.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S005"; givenNames = "Ethan"; familyName = "Brooks"; preferredName = ?("E");
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 5; firstName = "Carol"; lastName = "Brooks"; relationship = "Mother";
          phone = "555-101-0005"; email = "carol.brooks@email.com";
          preferredContactMethod = #phone; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Applying to engineering programs. Strong in math and physics. Class representative.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S006"; givenNames = "Isabella"; familyName = "Thompson"; preferredName = ?("Bella");
        gradeLevel = "10"; photo = "";
        accommodations = [{ id = 6; description = "Assistive technology - text-to-speech" }];
        allergies = ["Tree nuts"];
        medicalNotes = "Uses text-to-speech software for reading tasks.";
        attendanceRecords = []; guardianContacts = [{
          id = 6; firstName = "Mark"; lastName = "Thompson"; relationship = "Father";
          phone = "555-101-0006"; email = "mark.thompson@email.com";
          preferredContactMethod = #email; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Diagnosed with dyslexia. Excellent spatial reasoning and oral presentation skills.";
        interventionPlans = "Weekly reading support sessions.";
        behaviorEntries = []; createdAt = t;
        senPlan = ?{
          planType = #iep; startDate = "2023-09-01"; reviewDate = "2025-01-15"; expiryDate = "2026-09-01";
          coordinator = "Mr. Davis"; services = ["Reading Support", "Assistive Technology"];
          goals = [
            { id = 2; description = "Read grade-level passages with 80% comprehension"; targetDate = "2025-06-01"; status = #inProgress },
            { id = 3; description = "Use text-to-speech independently for all written tasks"; targetDate = "2025-03-01"; status = #met }
          ];
          notes = "IEP reviewed annually. Strong progress with assistive tech.";
        };
      },
      {
        studentId = "S007"; givenNames = "Marcus"; familyName = "Brown"; preferredName = null;
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 7; firstName = "Angela"; lastName = "Brown"; relationship = "Mother";
          phone = "555-101-0007"; email = "angela.brown@email.com";
          preferredContactMethod = #phone; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Talented athlete. Can lose focus mid-term. Responds well to goal-setting conversations.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S008"; givenNames = "Priya"; familyName = "Sharma"; preferredName = null;
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 8; firstName = "Rajan"; lastName = "Sharma"; relationship = "Father";
          phone = "555-101-0008"; email = "rajan.sharma@email.com";
          preferredContactMethod = #email; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "High achiever. Active in debate club. Likely valedictorian candidate.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S009"; givenNames = "Jackson"; familyName = "Rivera"; preferredName = ?("Jax");
        gradeLevel = "9"; photo = "";
        accommodations = [{ id = 9; description = "Movement breaks every 30 minutes" }];
        allergies = []; medicalNotes = "ADHD diagnosis. Medication managed at home.";
        attendanceRecords = []; guardianContacts = [{
          id = 9; firstName = "Lucia"; lastName = "Rivera"; relationship = "Mother";
          phone = "555-101-0009"; email = "lucia.rivera@email.com";
          preferredContactMethod = #either; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Energetic and creative. Benefits from structured routines and movement breaks.";
        interventionPlans = "Check-in/check-out system with counsellor.";
        behaviorEntries = []; createdAt = t;
        senPlan = ?{
          planType = #plan504; startDate = "2024-09-01"; reviewDate = "2025-02-01"; expiryDate = "2026-09-01";
          coordinator = "Ms. Patel"; services = ["Movement Breaks", "Flexible Seating", "Chunked Assignments"];
          goals = [{ id = 4; description = "Complete tasks within structured 30-minute blocks"; targetDate = "2025-06-01"; status = #inProgress }];
          notes = "504 accommodation for ADHD. Parent very engaged.";
        };
      },
      {
        studentId = "S010"; givenNames = "Zoe"; familyName = "Williams"; preferredName = null;
        gradeLevel = "10"; photo = ""; accommodations = []; allergies = ["Dairy"];
        medicalNotes = ""; attendanceRecords = []; guardianContacts = [{
          id = 10; firstName = "Karen"; lastName = "Williams"; relationship = "Mother";
          phone = "555-101-0010"; email = "karen.williams@email.com";
          preferredContactMethod = #email; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Creative writer. Leads peer writing groups. Strong analytical thinker.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S011"; givenNames = "Aiden"; familyName = "Patel"; preferredName = null;
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 11; firstName = "Sunita"; lastName = "Patel"; relationship = "Mother";
          phone = "555-101-0011"; email = "sunita.patel@email.com";
          preferredContactMethod = #phone; languagePreference = "Gujarati"; emergencyContact = true;
        }];
        teacherNotes = "Strong in sciences. Quiet worker, needs prompting to contribute verbally.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S012"; givenNames = "Chloe"; familyName = "Nguyen"; preferredName = null;
        gradeLevel = "9"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 12; firstName = "Minh"; lastName = "Nguyen"; relationship = "Father";
          phone = "555-101-0012"; email = "minh.nguyen@email.com";
          preferredContactMethod = #email; languagePreference = "Vietnamese"; emergencyContact = true;
        }];
        teacherNotes = "Recent arrival, adapting quickly. ESL support recommended.";
        interventionPlans = "ESL pull-out sessions twice weekly.";
        behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S013"; givenNames = "Tyler"; familyName = "Johnson"; preferredName = ?("Ty");
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 13; firstName = "Brian"; lastName = "Johnson"; relationship = "Father";
          phone = "555-101-0013"; email = "brian.johnson@email.com";
          preferredContactMethod = #phone; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Inconsistent effort. Capable of A-level work when engaged. Attendance concern last semester.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S014"; givenNames = "Aaliyah"; familyName = "Davis"; preferredName = null;
        gradeLevel = "10"; photo = "";
        accommodations = [{ id = 14; description = "Oral examination option available" }];
        allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 14; firstName = "Monica"; lastName = "Davis"; relationship = "Mother";
          phone = "555-101-0014"; email = "monica.davis@email.com";
          preferredContactMethod = #either; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Test anxiety documented. Excels on projects and presentations.";
        interventionPlans = "";
        behaviorEntries = []; createdAt = t;
        senPlan = ?{
          planType = #plan504; startDate = "2024-01-10"; reviewDate = "2025-01-10"; expiryDate = "2026-01-10";
          coordinator = "Ms. Patel"; services = ["Oral Assessment Option", "Extended Time"];
          goals = [{ id = 5; description = "Demonstrate knowledge through alternate formats"; targetDate = "2025-06-01"; status = #inProgress }];
          notes = "Anxiety around written exams. Oral options significantly improve performance.";
        };
      },
      {
        studentId = "S015"; givenNames = "Connor"; familyName = "Walsh"; preferredName = null;
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = ["Latex"];
        medicalNotes = "Latex allergy — notify art/science staff.";
        attendanceRecords = []; guardianContacts = [{
          id = 15; firstName = "Patrick"; lastName = "Walsh"; relationship = "Father";
          phone = "555-101-0015"; email = "patrick.walsh@email.com";
          preferredContactMethod = #email; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Natural leader. Peer mediator. Strong in humanities.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S016"; givenNames = "Fatima"; familyName = "Al-Rashid"; preferredName = null;
        gradeLevel = "9"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 16; firstName = "Yusuf"; lastName = "Al-Rashid"; relationship = "Father";
          phone = "555-101-0016"; email = "yusuf.alrashid@email.com";
          preferredContactMethod = #phone; languagePreference = "Arabic"; emergencyContact = true;
        }];
        teacherNotes = "Highly motivated. Strong academic record from previous school.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S017"; givenNames = "Ryan"; familyName = "OSullivan"; preferredName = null;
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 17; firstName = "Siobhan"; lastName = "OSullivan"; relationship = "Mother";
          phone = "555-101-0017"; email = "siobhan.osullivan@email.com";
          preferredContactMethod = #either; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Solid all-rounder. School council president. Heading to college next year.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S018"; givenNames = "Mei"; familyName = "Tanaka"; preferredName = null;
        gradeLevel = "10"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 18; firstName = "Kenji"; lastName = "Tanaka"; relationship = "Father";
          phone = "555-101-0018"; email = "kenji.tanaka@email.com";
          preferredContactMethod = #email; languagePreference = "Japanese"; emergencyContact = true;
        }];
        teacherNotes = "Exceptional in mathematics. Reserved but highly engaged.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S019"; givenNames = "Jaylen"; familyName = "Scott"; preferredName = ?("Jay");
        gradeLevel = "9"; photo = "";
        accommodations = [{ id = 19; description = "Scribe available for long-form writing" }];
        allergies = []; medicalNotes = "Dysgraphia — handwriting support needed.";
        attendanceRecords = []; guardianContacts = [{
          id = 19; firstName = "Denise"; lastName = "Scott"; relationship = "Mother";
          phone = "555-101-0019"; email = "denise.scott@email.com";
          preferredContactMethod = #phone; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Very verbal and creative. Written output limited by dysgraphia.";
        interventionPlans = "Scribe support for assessments; keyboard alternatives provided.";
        behaviorEntries = []; createdAt = t;
        senPlan = ?{
          planType = #iep; startDate = "2024-09-01"; reviewDate = "2025-02-15"; expiryDate = "2026-09-01";
          coordinator = "Mr. Davis"; services = ["Scribe", "Keyboard Accommodation"];
          goals = [{ id = 6; description = "Produce written work digitally at grade level"; targetDate = "2025-06-01"; status = #inProgress }];
          notes = "IEP for dysgraphia. Digital submissions accepted in all subjects.";
        };
      },
      {
        studentId = "S020"; givenNames = "Hannah"; familyName = "Lee"; preferredName = null;
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 20; firstName = "Grace"; lastName = "Lee"; relationship = "Mother";
          phone = "555-101-0020"; email = "grace.lee@email.com";
          preferredContactMethod = #email; languagePreference = "Korean"; emergencyContact = true;
        }];
        teacherNotes = "Consistent hard worker. Detail-oriented. Interested in medicine.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S021"; givenNames = "Diego"; familyName = "Fernandez"; preferredName = null;
        gradeLevel = "10"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 21; firstName = "Elena"; lastName = "Fernandez"; relationship = "Mother";
          phone = "555-101-0021"; email = "elena.fernandez@email.com";
          preferredContactMethod = #either; languagePreference = "Spanish"; emergencyContact = true;
        }];
        teacherNotes = "Sporty and competitive. Needs redirection from off-task socialising.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S022"; givenNames = "Naomi"; familyName = "Campbell"; preferredName = null;
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = ["Eggs"]; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 22; firstName = "Sandra"; lastName = "Campbell"; relationship = "Mother";
          phone = "555-101-0022"; email = "sandra.campbell@email.com";
          preferredContactMethod = #phone; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Aspiring journalist. Strong argumentation and research skills.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S023"; givenNames = "Alex"; familyName = "Kim"; preferredName = null;
        gradeLevel = "11"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 23; firstName = "Jin"; lastName = "Kim"; relationship = "Father";
          phone = "555-101-0023"; email = "jin.kim@email.com";
          preferredContactMethod = #email; languagePreference = "Korean"; emergencyContact = true;
        }];
        teacherNotes = "Gifted in visual arts. Quieter in class but produces excellent independent work.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S024"; givenNames = "Olivia"; familyName = "Grant"; preferredName = ?("Liv");
        gradeLevel = "9"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 24; firstName = "James"; lastName = "Grant"; relationship = "Father";
          phone = "555-101-0024"; email = "james.grant@email.com";
          preferredContactMethod = #either; languagePreference = "English"; emergencyContact = true;
        }];
        teacherNotes = "Eager learner, very social. Needs help managing group work dynamics.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      },
      {
        studentId = "S025"; givenNames = "Samuel"; familyName = "Adeyemi"; preferredName = ?("Sam");
        gradeLevel = "12"; photo = ""; accommodations = []; allergies = []; medicalNotes = "";
        attendanceRecords = []; guardianContacts = [{
          id = 25; firstName = "Bola"; lastName = "Adeyemi"; relationship = "Mother";
          phone = "555-101-0025"; email = "bola.adeyemi@email.com";
          preferredContactMethod = #phone; languagePreference = "Yoruba"; emergencyContact = true;
        }];
        teacherNotes = "Community leader and volunteer. Excellent written and spoken English.";
        interventionPlans = ""; behaviorEntries = []; createdAt = t; senPlan = null;
      }
    ];
    for (student in exampleStudents.values()) {
      students.add(student.studentId, student);
    };
  };
};
