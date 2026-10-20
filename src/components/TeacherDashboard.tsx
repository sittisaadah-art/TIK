import React, { useState, useEffect, useMemo } from 'react';
import {
  ExamSubmission,
  ProgramType,
  ExamStatus,
} from '../types/assessment';
import { QUESTIONS_PG, QUESTIONS_ESSAY } from '../data/questionsData';
import { apiService } from '../services/apiService';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  LogOut,
  Unlock,
  CheckCircle2,
  Edit3,
  Trash2,
  BarChart3,
  BookOpen,
  ShieldAlert,
  ChevronRight,
  X,
  FileSpreadsheet,
  Code,
  Sparkles,
  Check,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected Student for Essay Review Modal
  const [reviewingStudent, setReviewingStudent] = useState<ExamSubmission | null>(null);
  const [editEssayScores, setEditEssayScores] = useState<Record<number, number>>({});
  const [editTeacherNotes, setEditTeacherNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // Reset Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotification, setResetNotification] = useState('');

  // Active Tab: Analytics vs Student Table vs Question Bank
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TABLE' | 'QUESTIONS'>('OVERVIEW');
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'PG' | 'ESSAY'>('ALL');

  // Fetch submissions from API/LocalStorage
  const fetchSubmissions = async () => {
    setIsRefreshing(true);
    const data = await apiService.getAllSubmissions();
    setSubmissions(data);
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchSubmissions();
    // Real-time polling every 6 seconds
    const interval = setInterval(() => {
      fetchSubmissions();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Distinct classes present in data
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.student.className) set.add(s.student.className);
    });
    return Array.from(set).sort();
  }, [submissions]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchSearch =
        sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProgram =
        selectedProgram === 'ALL' || sub.student.program === selectedProgram;

      const matchClass =
        selectedClass === 'ALL' || sub.student.className === selectedClass;

      const matchStatus =
        selectedStatus === 'ALL' || sub.status === selectedStatus;

      return matchSearch && matchProgram && matchClass && matchStatus;
    });
  }, [submissions, searchQuery, selectedProgram, selectedClass, selectedStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = submissions.length;
    const submitted = submissions.filter((s) => s.status === 'SUBMITTED').length;
    const locked = submissions.filter((s) => s.status === 'LOCKED_CHEAT').length;
    const inProgress = submissions.filter((s) => s.status === 'IN_PROGRESS').length;

    const scores = submissions.map((s) => s.totalScore);
    const avgScore = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
    const maxScore = total > 0 ? Math.max(...scores) : 0;
    const minScore = total > 0 ? Math.min(...scores) : 0;
    const passingCount = submissions.filter((s) => s.totalScore >= 78).length;
    const passingRate = total > 0 ? Math.round((passingCount / total) * 100) : 0;

    return {
      total,
      submitted,
      locked,
      inProgress,
      avgScore,
      maxScore,
      minScore,
      passingCount,
      passingRate,
    };
  }, [submissions]);

  // Class Analytics (Average per class)
  const classAnalytics = useMemo(() => {
    const classMap: Record<
      string,
      { count: number; sum: number; highest: number; lowest: number; program: string }
    > = {};

    submissions.forEach((sub) => {
      const cls = sub.student.className || 'Lainnya';
      if (!classMap[cls]) {
        classMap[cls] = {
          count: 0,
          sum: 0,
          highest: 0,
          lowest: 100,
          program: sub.student.program,
        };
      }
      classMap[cls].count += 1;
      classMap[cls].sum += sub.totalScore;
      classMap[cls].highest = Math.max(classMap[cls].highest, sub.totalScore);
      classMap[cls].lowest = Math.min(classMap[cls].lowest, sub.totalScore);
    });

    return Object.entries(classMap).map(([className, data]) => ({
      className,
      program: data.program,
      count: data.count,
      avg: Math.round(data.sum / data.count),
      highest: data.highest,
      lowest: data.lowest,
    })).sort((a, b) => b.avg - a.avg);
  }, [submissions]);

  // Score Distribution
  const scoreDistribution = useMemo(() => {
    const counts = {
      sangatBaik: 0, // >= 85
      baik: 0, // 78 - 84
      cukup: 0, // 65 - 77
      remedial: 0, // < 65
    };

    submissions.forEach((s) => {
      if (s.totalScore >= 85) counts.sangatBaik++;
      else if (s.totalScore >= 78) counts.baik++;
      else if (s.totalScore >= 65) counts.cukup++;
      else counts.remedial++;
    });

    return counts;
  }, [submissions]);

  // Item Analysis (Day Serap Butir Soal PG 1-10)
  const itemAnalysisPG = useMemo(() => {
    return QUESTIONS_PG.map((q) => {
      let correctCount = 0;
      let totalAnswered = 0;
      submissions.forEach((sub) => {
        if (sub.answersPG && sub.answersPG[q.id]) {
          totalAnswered++;
          if (sub.answersPG[q.id] === q.correctAnswer) {
            correctCount++;
          }
        }
      });
      const percent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      return {
        id: q.id,
        number: q.number,
        topic: q.topic,
        correctCount,
        totalAnswered,
        percent,
      };
    });
  }, [submissions]);

  // Item Analysis (Rata-rata Skor Tiap Nomor Essay)
  const essayStats = useMemo(() => {
    return QUESTIONS_ESSAY.map((essay) => {
      let totalScore = 0;
      let count = 0;
      submissions.forEach((sub) => {
        if (sub.essayScores && sub.essayScores[essay.id] !== undefined) {
          totalScore += Number(sub.essayScores[essay.id]) || 0;
          count++;
        }
      });
      const avg = count > 0 ? (totalScore / count).toFixed(1) : '0';
      return {
        id: essay.id,
        number: essay.number,
        topic: essay.topic,
        avg,
        count,
      };
    });
  }, [submissions]);

  // Unlock Student Handler
  const handleUnlockStudent = async (studentId: string, studentName: string) => {
    if (
      window.confirm(
        `Buka kunci ujian untuk siswa "${studentName}"? Siswa akan dapat melanjutkan kembali ujian.`
      )
    ) {
      await apiService.unlockStudent(studentId);
      await fetchSubmissions();
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Hapus data ujian siswa "${studentName}" dari sistem?`)) {
      await apiService.deleteSubmission(studentId);
      await fetchSubmissions();
    }
  };

  // Open Essay Review Modal
  const openEssayReview = (student: ExamSubmission) => {
    setReviewingStudent(student);
    setEditEssayScores({ ...student.essayScores });
    setEditTeacherNotes(student.teacherNotes || '');
  };

  // Save Essay Review
  const handleSaveEssayReview = async () => {
    if (!reviewingStudent) return;
    setSavingReview(true);
    await apiService.reviewEssayScore(
      reviewingStudent.id,
      editEssayScores,
      editTeacherNotes
    );
    await fetchSubmissions();
    setSavingReview(false);
    setReviewingStudent(null);
  };

  // Reset & Clear Handlers
  const handleConfirmClearAll = async () => {
    setIsResetting(true);
    await apiService.clearAll();
    await fetchSubmissions();
    setIsResetting(false);
    setShowResetModal(false);
    setResetNotification('Semua data ujian siswa berhasil dihapus dan dikosongkan!');
    setTimeout(() => setResetNotification(''), 4000);
  };

  const handleConfirmResetDemo = async () => {
    setIsResetting(true);
    await apiService.resetToDemo();
    await fetchSubmissions();
    setIsResetting(false);
    setShowResetModal(false);
    setResetNotification('Data berhasil di-reset kembali ke sampel demo!');
    setTimeout(() => setResetNotification(''), 4000);
  };

  const handleLoadDemo = () => {
    setShowResetModal(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'NISN/Absen',
      'Nama Siswa',
      'Program',
      'Kelas',
      'Nilai PG',
      'Nilai Essay',
      'Total Nilai',
      'Grade',
      'Status Ujian',
      'Pelanggaran Tab',
      'Waktu Submit',
    ];

    const rows = filteredSubmissions.map((s, idx) => {
      const grade =
        s.totalScore >= 90 ? 'A' : s.totalScore >= 80 ? 'B' : s.totalScore >= 78 ? 'C' : 'D';
      return [
        idx + 1,
        `"${s.student.studentId}"`,
        `"${s.student.name}"`,
        `"${s.student.program}"`,
        `"${s.student.className}"`,
        s.scorePG,
        s.scoreEssay,
        s.totalScore,
        grade,
        s.status,
        s.tabViolations,
        `"${new Date(s.submittedAt || s.startedAt).toLocaleString('id-ID')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Nilai_Informatika_SMA_X_Bab1_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Recap Sheet
  const handlePrintRecap = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Essay Manual Review Modal */}
      {reviewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="max-w-3xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Koreksi & Penyesuaian Nilai Essay Guru
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {reviewingStudent.student.name} ({reviewingStudent.student.className})
                </h3>
              </div>
              <button
                onClick={() => setReviewingStudent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {QUESTIONS_ESSAY.map((essay) => {
                const currentScore = editEssayScores[essay.id] ?? 0;
                const studentAns = reviewingStudent.answersEssay[essay.id] || '';

                return (
                  <div
                    key={essay.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">
                        Essay #{essay.number}: {essay.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Skor (Maks 8):</label>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          value={currentScore}
                          onChange={(e) => {
                            const val = Math.min(8, Math.max(0, Number(e.target.value)));
                            setEditEssayScores((prev) => ({
                              ...prev,
                              [essay.id]: val,
                            }));
                          }}
                          className="w-16 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-white font-mono font-bold text-center text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {essay.context && (
                      <p className="text-xs text-slate-400 italic">{essay.context}</p>
                    )}

                    {essay.codeSnippet && (
                      <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                        <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{essay.id === 1 ? 'hello_world.py' : 'scraping_books.py'}</span>
                        </div>
                        <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                          <code>{essay.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    <p className="text-xs text-slate-300 font-medium">{essay.question}</p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase">
                        Jawaban Siswa:
                      </span>
                      <p className="text-slate-200 italic leading-relaxed">
                        {studentAns || '(Tidak ada jawaban)'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">Rubrik Acuan: </span>
                      {essay.rubricGuide}
                    </div>
                  </div>
                );
              })}

              {/* Teacher Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Catatan Guru / Pembina (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={editTeacherNotes}
                  onChange={(e) => setEditTeacherNotes(e.target.value)}
                  placeholder="Tambahkan catatan khusus untuk siswa..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setReviewingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingReview}
                onClick={handleSaveEssayReview}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingReview ? 'Menyimpan...' : 'Simpan & Perbarui Nilai'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {resetNotification && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetNotification}</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Semua Data Asesmen</h3>
                  <p className="text-xs text-slate-400">Pilih opsi reset data hasil ujian siswa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Perhatian: Mereset database akan menghapus seluruh data pengerjaan ujian ({submissions.length} siswa), lembar jawaban PG & Uraian, serta riwayat deteksi kecurangan tab.
            </p>

            <div className="space-y-3">
              {/* Option 1: Kosongkan Total */}
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmClearAll}
                className="w-full p-4 rounded-2xl border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-left transition-all group flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-red-300 group-hover:text-red-200 flex items-center gap-2">
                    <span>Kosongkan Semua Data (0 Siswa)</span>
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">Mulai Ujian Baru</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Hapus bersih seluruh riwayat dan lembar jawaban siswa agar sistem bersih untuk sesi ujian siswa yang baru.
                  </div>
                </div>
              </button>

              {/* Option 2: Reset ke Sampel Demo */}
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmResetDemo}
                className="w-full p-4 rounded-2xl border border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/40 text-left transition-all group flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-blue-300 group-hover:text-blue-200 flex items-center gap-2">
                    <span>Reset & Muat Ulang Sampel Demo</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">Simulasi</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Isi kembali database dengan data sampel kelas X Reguler & X Cambridge untuk simulasi analisis nilai.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white">
                  Dashboard Pengajar & Analisis Kelas
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Informatika SMA Kelas X • Bab 1 Menelusuri Data dan Kebenaran Informasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchSubmissions}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
              title="Perbarui Data Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={handleLoadDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium transition-colors"
              title="Muat Sampel Data"
            >
              <span>Sampel Demo</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-colors"
              title="Reset atau kosongkan semua data siswa"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="hidden md:inline">Reset Semua Data</span>
            </button>

            <button
              onClick={handlePrintRecap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Rekap</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 print:grid-cols-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Peserta</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {metrics.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Siswa Terdata</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Selesai Submit</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              {metrics.submitted}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Tuntas Mengerjakan</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Terkunci Curang</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-400 mt-1">
              {metrics.locked}
            </div>
            <div className="text-[11px] text-red-400/80 mt-1">&gt; 3x Pindah Tab</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Rata-Rata Nilai</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 mt-1">
              {metrics.avgScore}
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Seluruh Kelas</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tertinggi / Terendah</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {metrics.maxScore} <span className="text-xs text-slate-500">/ {metrics.minScore}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Rentang Nilai</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tuntas KKM (&ge;78)</span>
              <span className="text-xs font-bold text-emerald-400">{metrics.passingRate}%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {metrics.passingCount}
              <span className="text-xs text-slate-500 font-normal">/{metrics.total}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Tingkat Kelulusan</div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Grafik Analisis Real-Time</span>
            </button>
            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tabel Rekapitulasi Siswa ({filteredSubmissions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('QUESTIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'QUESTIONS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Daftar Soal Asesmen (10 PG & 5 Essay)</span>
            </button>
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all shadow-sm hover:border-red-400 cursor-pointer"
            title="Reset atau kosongkan semua data siswa"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Reset Semua Data</span>
          </button>
        </div>

        {/* TAB 1: ANALYTICS & CHARTS */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Database Management Alert Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Kelola Database Hasil Asesmen</div>
                  <div className="text-[11px] text-slate-400">
                    Tersimpan {submissions.length} lembar ujian ({metrics.submitted} selesai, {metrics.locked} terkunci). Gunakan tombol reset bila ingin memulai sesi ujian baru.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all shrink-0 hover:border-red-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reset Semua Data</span>
              </button>
            </div>
            {/* Row 1: Class Comparison & Score Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Average Score Per Class (Bar Chart) */}
              <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      Komparasi Rata-Rata Nilai Per Kelas
                    </h3>
                    <p className="text-xs text-slate-400">
                      Perbandingan performa kelas X Reguler vs X Cambridge
                    </p>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold">KKM: 78</span>
                </div>

                {classAnalytics.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Belum ada data siswa yang masuk.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classAnalytics.map((item) => {
                      const isPassing = item.avg >= 78;
                      const widthPercent = Math.min(100, Math.max(10, item.avg));
                      return (
                        <div key={item.className} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-2">
                              {item.className}
                              <span className="text-[10px] font-normal text-slate-400">
                                ({item.count} Siswa)
                              </span>
                            </span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400 text-[11px]">
                                Min: {item.lowest} | Max: {item.highest}
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded ${
                                  isPassing
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {item.avg}
                              </span>
                            </div>
                          </div>

                          <div className="h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 relative">
                            <div
                              style={{ width: `${widthPercent}%` }}
                              className={`h-full rounded-full transition-all duration-700 ${
                                item.program === 'X Cambridge'
                                  ? 'bg-gradient-to-r from-indigo-500 to-sky-400'
                                  : 'bg-gradient-to-r from-blue-600 to-teal-400'
                              }`}
                            />
                            {/* KKM vertical marker at 78% */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                              style={{ left: '78%' }}
                              title="Garis KKM (78)"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score Distribution Breakdown */}
              <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-amber-400" />
                    Distribusi Kategori Nilai
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Klasifikasi hasil belajar berdasarkan predikat kurikulum
                  </p>

                  <div className="space-y-3">
                    {/* Sangat Baik */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Sangat Baik (A)</div>
                          <div className="text-[10px] text-slate-400">Rentang Skor 85 - 100</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-emerald-400">
                          {scoreDistribution.sangatBaik}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">Siswa</span>
                      </div>
                    </div>

                    {/* Baik */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Baik (B)</div>
                          <div className="text-[10px] text-slate-400">Rentang Skor 78 - 84</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-400">
                          {scoreDistribution.baik}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">Siswa</span>
                      </div>
                    </div>

                    {/* Cukup */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Cukup (C)</div>
                          <div className="text-[10px] text-slate-400">Rentang Skor 65 - 77</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-amber-400">
                          {scoreDistribution.cukup}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">Siswa</span>
                      </div>
                    </div>

                    {/* Remedial */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-red-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Perlu Remedial (D)</div>
                          <div className="text-[10px] text-slate-400">Skor di bawah 65</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-red-400">
                          {scoreDistribution.remedial}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">Siswa</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
                  <span>Target Ketuntasan Klasikal: 80%</span>
                  <span className="font-bold text-white">Capaian Saat Ini: {metrics.passingRate}%</span>
                </div>
              </div>
            </div>

            {/* Row 2: Item Analysis (Daya Serap Butir Soal PG 1 - 10) */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Analisis Daya Serap Butir Soal (Pilihan Ganda 1 - 10)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Persentase siswa yang menjawab benar per indikator materi dari buku Smart Book Bab 1
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>&ge; 75% (Tinggi)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>50-74% (Sedang)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span>&lt; 50% (Sulit)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {itemAnalysisPG.map((item) => {
                  const badgeColor =
                    item.percent >= 75
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : item.percent >= 50
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-red-400 bg-red-500/10 border-red-500/30';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                            #{item.number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                            {item.percent}%
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1">
                          {item.topic}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                        <span>Benar: {item.correctCount}</span>
                        <span>Total: {item.totalAnswered}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED STUDENT TABLE & ACTIONS */}
        {activeTab === 'TABLE' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NISN..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filter Program */}
              <div>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Program (X & X Cambridge)</option>
                  <option value="X">Kelas X (Reguler)</option>
                  <option value="X Cambridge">Kelas X Cambridge</option>
                </select>
              </div>

              {/* Filter Class */}
              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Kelas</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUBMITTED">Selesai (Submitted)</option>
                  <option value="LOCKED_CHEAT">Terkunci (Curang)</option>
                  <option value="IN_PROGRESS">Sedang Mengerjakan</option>
                </select>
              </div>
            </div>

            {/* Table Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1">
              <div className="text-xs text-slate-400">
                Menampilkan <strong className="text-white">{filteredSubmissions.length}</strong> dari <strong className="text-white">{submissions.length}</strong> peserta ujian
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-all shadow-xs hover:border-red-400 cursor-pointer"
                title="Reset semua data ujian siswa"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reset Semua Data</span>
              </button>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN / Absen</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4 text-center">PG (60)</th>
                    <th className="py-3 px-4 text-center">Essay (40)</th>
                    <th className="py-3 px-4 text-center">Total (100)</th>
                    <th className="py-3 px-4 text-center">Pindah Tab</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Tidak ada data siswa yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, idx) => {
                      const isPassing = sub.totalScore >= 78;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {sub.student.name}
                            {sub.verifiedByTeacher && (
                              <span className="ml-1.5 inline-block text-[10px] text-blue-400">
                                (Terkoreksi)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {sub.student.studentId}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-medium">
                              {sub.student.className}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                            {sub.scorePG}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400">
                            {sub.scoreEssay}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`font-black font-mono text-sm px-2 py-0.5 rounded-lg ${
                                isPassing
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}
                            >
                              {sub.totalScore}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                sub.tabViolations > 3
                                  ? 'bg-red-500/20 text-red-400'
                                  : sub.tabViolations > 0
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {sub.tabViolations}x
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {sub.status === 'LOCKED_CHEAT' ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                                Terkunci (Curang)
                              </span>
                            ) : sub.status === 'SUBMITTED' ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                Selesai
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold">
                                Mengerjakan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Essay Review Button */}
                              <button
                                onClick={() => openEssayReview(sub)}
                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors"
                                title="Koreksi Essay & Beri Catatan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Unlock Button if locked */}
                              {sub.status === 'LOCKED_CHEAT' && (
                                <button
                                  onClick={() => handleUnlockStudent(sub.id, sub.student.name)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                                  title="Buka Kunci Ujian Siswa Ini"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteStudent(sub.id, sub.student.name)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                title="Hapus Data Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DAFTAR & BANK SOAL ASESMEN */}
        {activeTab === 'QUESTIONS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Bank Soal */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Bank Soal & Kisi-Kisi Asesmen Harian
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Informatika SMA Kelas X • Bab 1 Menelusuri Data dan Kebenaran Informasi di Dunia Digital
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                    10 PG (@6 Poin)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                    5 Essay (@8 Poin)
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    Total: 100 Poin
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Reset Semua Data</span>
                  </button>
                </div>
              </div>

              {/* Filter Type Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      questionFilter === 'ALL'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Soal (15 Butir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('PG')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      questionFilter === 'PG'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pilihan Ganda (1 - 10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('ESSAY')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      questionFilter === 'ESSAY'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Uraian / Essay (1 - 5)
                  </button>
                </div>

                <div className="text-xs text-slate-400 italic">
                  *Sumber rujukan materi: Smart Book Informatika 10 Halaman 31, 32, 33, dan 34
                </div>
              </div>
            </div>

            {/* BAGIAN 1: PILIHAN GANDA */}
            {(questionFilter === 'ALL' || questionFilter === 'PG') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                      Bagian 1: 10 Butir Soal Pilihan Ganda (Skor Maksimal: 60)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Bobot @6 Poin per Soal</span>
                </div>

                <div className="space-y-5">
                  {QUESTIONS_PG.map((q) => {
                    const stats = itemAnalysisPG.find((item) => item.id === q.id);
                    const percent = stats ? stats.percent : 0;
                    const correctCount = stats ? stats.correctCount : 0;
                    const totalCount = stats ? stats.totalAnswered : 0;

                    return (
                      <div
                        key={q.id}
                        className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-md space-y-4"
                      >
                        {/* Question Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-xs flex items-center justify-center">
                              #{q.number}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              Topik: <span className="text-blue-400">{q.topic}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold">
                              Bobot: {q.points} Poin
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                percent >= 75
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : percent >= 50
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                  : 'bg-red-500/15 border-red-500/30 text-red-400'
                              }`}
                              title="Tingkat ketuntasan siswa pada butir soal ini"
                            >
                              Daya Serap: {percent}% Siswa Benar ({correctCount}/{totalCount})
                            </span>
                          </div>
                        </div>

                        {/* Reading source if available */}
                        {q.sourceText && (
                          <div className="p-3.5 rounded-2xl bg-slate-900/90 border-l-4 border-blue-500 text-xs text-slate-300 italic leading-relaxed">
                            "{q.sourceText}"
                          </div>
                        )}

                        {/* Python Code Snippet if present */}
                        {q.codeSnippet && (
                          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                            <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-emerald-400" />
                                <span className="font-mono font-semibold text-slate-200">
                                  skrip_scraping_laptop.py
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">Python 3</span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Question Prompt */}
                        <h4 className="text-sm font-semibold text-white leading-relaxed">
                          {q.question}
                        </h4>

                        {/* Options A - E */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt) => {
                            const isKey = opt.key === q.correctAnswer;
                            return (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                                  isKey
                                    ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-xs'
                                    : 'bg-slate-900/70 border-slate-700/60 text-slate-300'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs ${
                                    isKey
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <div className="space-y-1 flex-1">
                                  <p className="leading-relaxed">{opt.text}</p>
                                  {isKey && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                      <Check className="w-3 h-3" />
                                      Kunci Jawaban Resmi
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Official Explanation Box */}
                        <div className="p-3.5 rounded-2xl bg-blue-950/25 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                          <span className="font-bold text-blue-400 block mb-1">
                            Pembahasan & Alasan Pedagogis Guru:
                          </span>
                          <p>{q.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BAGIAN 2: URAIAN / ESSAY */}
            {(questionFilter === 'ALL' || questionFilter === 'ESSAY') && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                      Bagian 2: 5 Butir Soal Uraian / Essay (Skor Maksimal: 40)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Bobot @8 Poin per Soal</span>
                </div>

                <div className="space-y-5">
                  {QUESTIONS_ESSAY.map((essay) => {
                    const stat = essayStats.find((s) => s.id === essay.id);
                    const avgScore = stat ? stat.avg : '0';

                    return (
                      <div
                        key={essay.id}
                        className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-md space-y-4"
                      >
                        {/* Essay Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black text-xs flex items-center justify-center">
                              #{essay.number + 10}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              Topik: <span className="text-indigo-400">{essay.topic}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 text-xs font-bold">
                              Bobot: {essay.points} Poin
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                              Rata-Rata Capaian: {avgScore} / 8 Poin
                            </span>
                          </div>
                        </div>

                        {/* Essay Context */}
                        {essay.context && (
                          <div className="p-3.5 rounded-2xl bg-slate-900/90 border-l-4 border-indigo-500 text-xs text-slate-300 italic leading-relaxed">
                            "{essay.context}"
                          </div>
                        )}

                        {/* Code Snippet if present in Essay */}
                        {essay.codeSnippet && (
                          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
                            <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-emerald-400" />
                                <span className="font-mono font-semibold text-slate-200">
                                  {essay.id === 1 ? 'hello_world.py' : 'scraping_books.py'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">Python 3</span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                              <code>{essay.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Essay Question */}
                        <h4 className="text-sm font-semibold text-white leading-relaxed">
                          {essay.question}
                        </h4>

                        {/* Model Sample Answer */}
                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/70 text-xs text-slate-300 space-y-1.5">
                          <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Referensi Jawaban Ideal (Model Answer):
                          </span>
                          <p className="leading-relaxed text-slate-200">{essay.sampleAnswer}</p>
                        </div>

                        {/* Semantic Keywords Tag Cloud */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kata Kunci Penilaian Otomatis Sistem (Keyword Matching):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {essay.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Teacher Rubric Guide */}
                        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/25 text-xs text-amber-200 leading-relaxed">
                          <span className="font-bold text-amber-300 block mb-1">
                            Pedoman & Rubrik Penskoran Guru:
                          </span>
                          <p>{essay.rubricGuide}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Printable Official Recap Section (Visible ONLY during print) */}
        <div className="hidden print:block text-black bg-white p-6 font-sans">
          <div className="text-center border-b-2 border-black pb-3 mb-4">
            <h2 className="text-lg font-bold uppercase">
              REKAPITULASI NILAI ASESMEN HARIAN INFORMATIKA KELAS X
            </h2>
            <p className="text-xs">
              BAB 1: Menelusuri Data dan Kebenaran Informasi di Dunia Digital • Semester Ganjil
            </p>
            <p className="text-[11px] text-gray-600">
              Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <table className="w-full text-[10px] border border-black border-collapse text-left mb-6">
            <thead>
              <tr className="bg-gray-200 border-b border-black">
                <th className="p-1 border-r border-black">No</th>
                <th className="p-1 border-r border-black">NISN/Absen</th>
                <th className="p-1 border-r border-black">Nama Siswa</th>
                <th className="p-1 border-r border-black">Kelas</th>
                <th className="p-1 border-r border-black text-center">Nilai PG</th>
                <th className="p-1 border-r border-black text-center">Nilai Essay</th>
                <th className="p-1 border-r border-black text-center">Total</th>
                <th className="p-1 border-r border-black text-center">Peringatan Tab</th>
                <th className="p-1 text-center">Ketuntasan</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((s, idx) => (
                <tr key={s.id} className="border-b border-black">
                  <td className="p-1 border-r border-black">{idx + 1}</td>
                  <td className="p-1 border-r border-black font-mono">{s.student.studentId}</td>
                  <td className="p-1 border-r border-black font-bold uppercase">{s.student.name}</td>
                  <td className="p-1 border-r border-black">{s.student.className}</td>
                  <td className="p-1 border-r border-black text-center">{s.scorePG}</td>
                  <td className="p-1 border-r border-black text-center">{s.scoreEssay}</td>
                  <td className="p-1 border-r border-black text-center font-bold">{s.totalScore}</td>
                  <td className="p-1 border-r border-black text-center">{s.tabViolations}x</td>
                  <td className="p-1 text-center font-bold">
                    {s.totalScore >= 78 ? 'TUNTAS' : 'REMEDIAL'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end text-xs pt-4">
            <div className="text-center w-56">
              <p>Guru Pengampu Informatika,</p>
              <div className="h-16" />
              <p className="font-bold underline uppercase">Sitti Sa'adah, S.Kom., M.Pd.</p>
              <p className="text-[10px]">NIP. 198506122010012015</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-3 px-4 text-center text-xs text-slate-500 print:hidden">
        Sistem Manajemen Asesmen Informatika SMA • Guru Pengampu • Real-Time Database Sync
      </footer>
    </div>
  );
};
