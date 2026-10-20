import React, { useState } from 'react';
import { StudentProfile, ExamSubmission } from './types/assessment';
import { StudentRegistration } from './components/StudentRegistration';
import { ExamEngine } from './components/ExamEngine';
import { StudentResult } from './components/StudentResult';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { TeacherDashboard } from './components/TeacherDashboard';

type AppView = 'REGISTRATION' | 'EXAM' | 'RESULT' | 'TEACHER_DASHBOARD';

export default function App() {
  const [view, setView] = useState<AppView>('REGISTRATION');
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<ExamSubmission | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // Start exam from student registration
  const handleStartExam = (profile: StudentProfile) => {
    setCurrentStudent(profile);
    setView('EXAM');
  };

  // Exam completed (submitted or locked due to cheat limit)
  const handleExamComplete = (submission: ExamSubmission) => {
    setLatestSubmission(submission);
    setView('RESULT');
  };

  // Return to home / retake
  const handleRetake = () => {
    setCurrentStudent(null);
    setLatestSubmission(null);
    setView('REGISTRATION');
  };

  // Teacher authenticated successfully with PIN guru123
  const handleTeacherAuthSuccess = () => {
    setIsTeacherModalOpen(false);
    setView('TEACHER_DASHBOARD');
  };

  // Logout from teacher dashboard
  const handleTeacherLogout = () => {
    setView('REGISTRATION');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Teacher Authentication Modal */}
      <TeacherAuthModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={handleTeacherAuthSuccess}
      />

      {/* View Routing */}
      {view === 'REGISTRATION' && (
        <StudentRegistration
          onStartExam={handleStartExam}
          onOpenTeacherLogin={() => setIsTeacherModalOpen(true)}
        />
      )}

      {view === 'EXAM' && currentStudent && (
        <ExamEngine
          student={currentStudent}
          onComplete={handleExamComplete}
        />
      )}

      {view === 'RESULT' && latestSubmission && (
        <StudentResult
          submission={latestSubmission}
          onRetake={handleRetake}
        />
      )}

      {view === 'TEACHER_DASHBOARD' && (
        <TeacherDashboard onLogout={handleTeacherLogout} />
      )}
    </div>
  );
}
