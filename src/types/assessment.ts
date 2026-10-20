export type ProgramType = 'X' | 'X Cambridge';

export interface StudentProfile {
  name: string;
  studentId: string; // No Absen / NISN
  program: ProgramType;
  className: string;
}

export interface OptionItem {
  key: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
}

export interface QuestionPG {
  id: number;
  number: number;
  topic: string;
  sourceText?: string;
  codeSnippet?: string;
  imageHint?: string;
  question: string;
  options: OptionItem[];
  correctAnswer: string;
  explanation: string;
  points: number; // 6 points per question
}

export interface QuestionEssay {
  id: number;
  number: number;
  topic: string;
  context?: string;
  codeSnippet?: string;
  question: string;
  points: number; // 8 points per question
  rubricGuide: string;
  keywords: string[];
  sampleAnswer: string;
}

export type ExamStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'LOCKED_CHEAT';

export interface ViolationLog {
  timestamp: string;
  message: string;
  count: number;
}

export interface ExamSubmission {
  id: string;
  student: StudentProfile;
  answersPG: Record<number, string>;
  answersEssay: Record<number, string>;
  essayScores: Record<number, number>;
  essayFeedback?: Record<number, string>;
  scorePG: number; // max 60
  scoreEssay: number; // max 40
  totalScore: number; // max 100
  status: ExamStatus;
  tabViolations: number;
  violationLogs: ViolationLog[];
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
  verifiedByTeacher: boolean;
  teacherNotes?: string;
}

export interface ClassPerformance {
  className: string;
  program: ProgramType;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passingRate: number; // percentage >= 78
}
