import type React from "react";
import { createContext, useContext, useState } from "react";

interface StudentContextValue {
  selectedStudentId: string | null;
  isOpen: boolean;
  openStudentContext: (studentId: string) => void;
  closeStudentContext: () => void;
}

const StudentContext = createContext<StudentContextValue>({
  selectedStudentId: null,
  isOpen: false,
  openStudentContext: () => {},
  closeStudentContext: () => {},
});

export function useStudentContext() {
  return useContext(StudentContext);
}

export function StudentContextProvider({
  children,
}: { children: React.ReactNode }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const openStudentContext = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsOpen(true);
  };

  const closeStudentContext = () => {
    setIsOpen(false);
    setSelectedStudentId(null);
  };

  return (
    <StudentContext.Provider
      value={{
        selectedStudentId,
        isOpen,
        openStudentContext,
        closeStudentContext,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
