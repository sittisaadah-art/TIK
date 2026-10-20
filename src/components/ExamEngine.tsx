import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StudentProfile,
  ExamSubmission,
  ExamStatus,
  ViolationLog,
} from '../types/assessment';
import {
  QUESTIONS_PG,
  QUESTIONS_ESSAY,
  EXAM_DURATION_MINUTES,
  MAX_TAB_VIOLATIONS,
  autoGradeEssay,
} from '../data/questionsData';
import { apiService } from '../services/apiService';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Lock,
  Code,
  FileEdit,
  Info,
  Check,
  Maximize,
  Minimize,
} from 'lucide-react';

interface ExamEngineProps {
  student: StudentProfile;
  onComplete: (submission: ExamSubmission) => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ student, onComplete }) => {
  // Navigation: 1..10 are PG, 11..15 are Essay
  const [currentIndex, setCurrentIndex] = useState(1); // 1 to 15
  const [answersPG, setAnswersPG] = useState<Record<number, string>>({});
  const [answersEssay, setAnswersEssay] = useState<Record<number, string>>({});

  // Timer
  const totalSecondsInitial = EXAM_DURATION_MINUTES * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSecondsInitial);

  // Proctoring & Anti-Cheat
  const [violations, setViolations] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarningMsg, setCurrentWarningMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // Submit confirmation dialog
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IDs and refs
  const submissionIdRef = useRef<string>(`sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const startTimeRef = useRef<string>(new Date().toISOString());
  const timerRef = useRef<any>(null);
  const lastBlurTimeRef = useRef<number>(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    // Attempt fullscreen on mount if not yet active
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Helper to compile current submission state
  const buildSubmissionObject = useCallback(
    (status: ExamStatus): ExamSubmission => {
      // Calculate PG score
      let scorePG = 0;
      for (const q of QUESTIONS_PG) {
        if (answersPG[q.id] === q.correctAnswer) {
          scorePG += q.points;
        }
      }

      // Calculate preliminary essay scores
      let scoreEssay = 0;
      const essayScores: Record<number, number> = {};
      const essayFeedback: Record<number, string> = {};

      for (const essay of QUESTIONS_ESSAY) {
        const text = answersEssay[essay.id] || '';
        const graded = autoGradeEssay(essay.id, text);
        essayScores[essay.id] = graded.score;
        essayFeedback[essay.id] = graded.feedback;
        scoreEssay += graded.score;
      }

      const totalScore = scorePG + scoreEssay;
      const elapsed = totalSecondsInitial - secondsRemaining;

      return {
        id: submissionIdRef.current,
        student,
        answersPG,
        answersEssay,
        essayScores,
        essayFeedback,
        scorePG,
        scoreEssay,
        totalScore,
        status,
        tabViolations: violations,
        violationLogs,
        startedAt: startTimeRef.current,
        submittedAt: new Date().toISOString(),
        durationSeconds: elapsed,
        verifiedByTeacher: false,
      };
    },
    [answersPG, answersEssay, violations, violationLogs, secondsRemaining, student, totalSecondsInitial]
  );

  // Lock exam due to cheating
  const triggerCheatLock = useCallback(
    async (logs: ViolationLog[], count: number) => {
      setIsLocked(true);
      setShowWarningModal(false);
      if (timerRef.current) clearInterval(timerRef.current);

      const lockedSubmission: ExamSubmission = {
        ...buildSubmissionObject('LOCKED_CHEAT'),
        tabViolations: count,
        violationLogs: logs,
        status: 'LOCKED_CHEAT',
        teacherNotes: `Ujian dikunci otomatis oleh sistem: Siswa melanggar aturan tab ${count} kali.`,
      };

      await apiService.saveSubmission(lockedSubmission);
    },
    [buildSubmissionObject]
  );

  // Tab switch detection (Anti-Cheat listener)
  useEffect(() => {
    const handleViolation = (reason: string) => {
      // Debounce rapid events within 1.5 seconds
      const now = Date.now();
      if (now - lastBlurTimeRef.current < 1500) return;
      lastBlurTimeRef.current = now;

      if (isLocked) return;

      setViolations((prev) => {
        const nextCount = prev + 1;
        const newLog: ViolationLog = {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          message: `${reason} (${nextCount}/${MAX_TAB_VIOLATIONS})`,
          count: nextCount,
        };

        const updatedLogs = [...violationLogs, newLog];
        setViolationLogs(updatedLogs);

        // Check threshold: if > 3 violations, lock immediately
        if (nextCount > MAX_TAB_VIOLATIONS) {
          triggerCheatLock(updatedLogs, nextCount);
        } else {
          setCurrentWarningMsg(
            `Anda terdeteksi meninggalkan halaman ujian (${reason}). Ini adalah peringatan ${nextCount} dari maksimal ${MAX_TAB_VIOLATIONS}. Jika melanggar lagi, ujian Anda akan otomatis DIKUNCI!`
          );
          setShowWarningModal(true);
        }

        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Beralih Tab Peramban');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Keluar Jendela / Beralih Aplikasi');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isLocked, violationLogs, triggerCheatLock]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit('SUBMITTED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Periodic auto-save progress
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (!isLocked) {
        const inProgress = buildSubmissionObject('IN_PROGRESS');
        apiService.saveSubmission(inProgress);
      }
    }, 15000);

    return () => clearInterval(saveInterval);
  }, [buildSubmissionObject, isLocked]);

  const handleFinalSubmit = async (status: ExamStatus = 'SUBMITTED') => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsSubmitting(true);
    const finalSub = buildSubmissionObject(status);
    await apiService.saveSubmission(finalSub);
    setIsSubmitting(false);
    onComplete(finalSub);
  };

  // Timer format mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Current question metadata
  const isEssay = currentIndex > 10;
  const currentPG = !isEssay ? QUESTIONS_PG[currentIndex - 1] : null;
  const currentEssay = isEssay ? QUESTIONS_ESSAY[currentIndex - 11] : null;

  // Counts
  const answeredPGCount = Object.keys(answersPG).length;
  const answeredEssayCount = Object.keys(answersEssay).filter(
    (k) => (answersEssay[Number(k)] || '').trim().length > 0
  ).length;
  const totalAnswered = answeredPGCount + answeredEssayCount;

  // If exam is locked due to cheating
  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border-2 border-red-600 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
          <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/40 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">UJIAN DIKUNCI OLEH SISTEM</h2>
          <p className="text-red-400 font-semibold text-sm mt-1">
            Terdeteksi Pelanggaran Pindah Tab Lebih Dari {MAX_TAB_VIOLATIONS} Kali
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-6 text-left text-xs space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Nama Siswa:</span>
              <span className="font-semibold text-white">{student.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">NISN / No Absen:</span>
              <span className="font-semibold text-white">{student.studentId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Kelas:</span>
              <span className="font-semibold text-white">{student.className}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <span className="text-slate-400">Total Pelanggaran:</span>
              <span className="font-bold text-red-400">{violations} kali beralih tab</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status Penyimpanan:</span>
              <span className="text-amber-400 font-medium">Tersimpan ke Database Pengajar</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Demi menjaga integritas dan kejujuran akademik, pengerjaan Anda telah dihentikan secara sepihak oleh sistem.
            Silakan laporkan kejadian ini kepada pengawas atau guru mata pelajaran Informatika.
          </p>

          <button
            onClick={() => handleFinalSubmit('LOCKED_CHEAT')}
            className="w-full py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/30"
          >
            Lihat Rekapitulasi Nilai Tersimpan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between select-none">
      {/* Warning Modal (Popup when user switches tab) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-amber-400">PERINGATAN PELANGGARAN TAB!</h3>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs mt-2 border border-amber-500/30">
                Peringatan {violations} dari {MAX_TAB_VIOLATIONS}
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {currentWarningMsg}
            </p>
            <p className="text-[11px] text-red-400 font-medium">
              *Toleransi tersisa: {Math.max(0, MAX_TAB_VIOLATIONS - violations)} kali. Jika limit terlampaui, ujian Anda langsung dikunci!
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              Saya Mengerti, Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-500/15 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Kumpulkan Lembar Jawaban?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pastikan seluruh soal telah Anda jawab dengan seksama sebelum mengirimkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Soal PG Terjawab:</span>
                <span className="font-bold text-white text-base">
                  {answeredPGCount} / 10
                </span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Soal Essay Terjawab:</span>
                <span className="font-bold text-white text-base">
                  {answeredEssayCount} / 5
                </span>
              </div>
            </div>

            {totalAnswered < 15 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Masih terdapat <strong>{15 - totalAnswered} soal</strong> yang belum terisi. Yakin ingin mengumpulkan?
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Cek Jawaban Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('SUBMITTED')}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Mengirim...' : 'Ya, Kumpulkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
              {student.program === 'X Cambridge' ? 'XC' : 'X'}
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-white line-clamp-1">{student.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{student.className}</span>
                <span>•</span>
                <span>{student.studentId}</span>
              </div>
            </div>
          </div>

          {/* Center Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-inner transition-colors ${
              secondsRemaining < 300
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : secondsRemaining < 900
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-blue-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          {/* Right: Fullscreen, Violation badge & Submit button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-colors ${
                isFullscreen
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-indigo-600/30 border-indigo-500 text-indigo-300 animate-pulse'
              }`}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Wajib)'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Layar Penuh' : 'Aktifkan Fullscreen'}</span>
            </button>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${
                violations > 0
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Peringatan beralih tab"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Tab: {violations}/3</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kumpulkan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination View */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Navigator Drawer / Sidebar */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Navigasi Soal
                </h3>
                <span className="text-xs text-blue-400 font-semibold">
                  Terjawab: {totalAnswered} / 15
                </span>
              </div>

              {/* Section 1: Pilihan Ganda (1 - 10) */}
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Bagian 1: Pilihan Ganda (1 - 10)</span>
                  <span className="text-[10px] text-blue-400">@6 Poin</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {QUESTIONS_PG.map((q) => {
                    const isAnswered = !!answersPG[q.id];
                    const isCurrent = currentIndex === q.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(q.id)}
                        className={`h-10 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center relative ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md shadow-blue-600/30'
                            : isAnswered
                            ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span>{q.number}</span>
                        {isAnswered && (
                          <span className="text-[9px] uppercase font-mono text-emerald-400">
                            {answersPG[q.id]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Essay (11 - 15) */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Bagian 2: Uraian / Essay (11 - 15)</span>
                  <span className="text-[10px] text-indigo-400">@8 Poin</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {QUESTIONS_ESSAY.map((essay, idx) => {
                    const navIndex = 11 + idx;
                    const isAnswered = !!(answersEssay[essay.id] || '').trim();
                    const isCurrent = currentIndex === navIndex;
                    return (
                      <button
                        key={essay.id}
                        onClick={() => setCurrentIndex(navIndex)}
                        className={`h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-600/30'
                            : isAnswered
                            ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <span>{essay.number + 10}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 pt-4 border-t border-slate-700/70 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-400" />
                  <span>Terjawab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                  <span>Belum</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Question Panel */}
          <div className="lg:col-span-8 order-1 lg:order-2 space-y-5">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
              {/* Question Header & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    Soal Nomor {currentIndex} of 15
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium">
                    {isEssay ? 'Tipe: Uraian / Essay' : 'Tipe: Pilihan Ganda'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-amber-400">
                  Bobot: {isEssay ? '8 Poin' : '6 Poin'}
                </span>
              </div>

              {/* Question Body */}
              <div className="py-5 space-y-4">
                {/* Topic Indicator */}
                <div className="text-xs font-semibold text-blue-300/80 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  <span>Topik: {isEssay ? currentEssay?.topic : currentPG?.topic}</span>
                </div>

                {/* Source Context Text if any */}
                {(!isEssay && currentPG?.sourceText) || (isEssay && currentEssay?.context) ? (
                  <div className="bg-slate-900/90 border-l-4 border-blue-500 p-4 rounded-r-2xl text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    {isEssay ? currentEssay?.context : currentPG?.sourceText}
                  </div>
                ) : null}

                {/* Code Snippet if any (e.g. BeautifulSoup Python code) */}
                {((!isEssay && currentPG?.codeSnippet) || (isEssay && currentEssay?.codeSnippet)) && (
                  <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono font-semibold text-slate-300">
                          {isEssay ? (currentEssay?.id === 1 ? 'hello_world.py' : 'scraping_books.py') : 'scraper_laptop.py'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">Python 3</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      <code>{isEssay ? currentEssay?.codeSnippet : currentPG?.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Question Prompt */}
                <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed pt-1">
                  {isEssay ? currentEssay?.question : currentPG?.question}
                </h4>

                {/* Options for Multiple Choice */}
                {!isEssay && currentPG && (
                  <div className="space-y-3 pt-3">
                    {currentPG.options.map((opt) => {
                      const isSelected = answersPG[currentPG.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setAnswersPG((prev) => ({
                              ...prev,
                              [currentPG.id]: opt.key,
                            }));
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 group ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                              : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:bg-slate-900 hover:border-slate-600'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                            }`}
                          >
                            {opt.key}
                          </div>
                          <span className="text-xs sm:text-sm pt-0.5 leading-relaxed font-normal">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Textarea for Essay */}
                {isEssay && currentEssay && (
                  <div className="pt-2 space-y-2">
                    <div className="relative">
                      <textarea
                        rows={7}
                        value={answersEssay[currentEssay.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswersEssay((prev) => ({
                            ...prev,
                            [currentEssay.id]: val,
                          }));
                        }}
                        placeholder="Ketik uraian jawaban Anda secara komprehensif di sini..."
                        className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-normal"
                      />
                      <div className="absolute right-3 bottom-3 text-[11px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-slate-800">
                        {(answersEssay[currentEssay.id] || '').length} karakter
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 italic">
                      <FileEdit className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        Tips: Jelaskan konsep secara terstruktur sesuai materi buku Smart Book Informatika Bab 1.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 1}
                  onClick={() => setCurrentIndex((prev) => Math.max(1, prev - 1))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-700/80 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentIndex < 15 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(15, prev + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <span>Selesai & Kumpulkan</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Examination Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-2.5 px-4 text-center text-xs text-slate-400">
        Asesmen Terjadwal • Bab 1 Menelusuri Data dan Kebenaran Informasi • Proctoring Aktif
      </footer>
    </div>
  );
};
