import React, { useState, useEffect } from 'react';
import { ExamSubmission } from '../types/assessment';
import { QUESTIONS_PG, QUESTIONS_ESSAY } from '../data/questionsData';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  RotateCcw,
  Clock,
  ShieldAlert,
  User,
  ChevronDown,
  ChevronUp,
  Code,
  Sparkles,
} from 'lucide-react';

interface StudentResultProps {
  submission: ExamSubmission;
  onRetake: () => void;
}

export const StudentResult: React.FC<StudentResultProps> = ({ submission, onRetake }) => {
  const [showLogDetails, setShowLogDetails] = useState(false);
  const isPassing = submission.totalScore >= 78;

  // Trigger confetti if passing
  useEffect(() => {
    if (isPassing) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // fallback
      }
    }
  }, [isPassing]);

  const handlePrint = () => {
    window.print();
  };

  // Duration formatted (e.g. 17 menit 38 detik)
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} menit ${secs} detik`;
  };

  // Correct PG count
  const correctPGCount = Object.keys(submission.answersPG).filter((k) => {
    const q = QUESTIONS_PG.find((item) => item.id === Number(k));
    return q && submission.answersPG[Number(k)] === q.correctAnswer;
  }).length;

  // Percentage representations
  const pgPercentage = Math.round((submission.scorePG / 60) * 100);
  const essayPercentage = Math.round((submission.scoreEssay / 40) * 100);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 py-6 px-3 sm:px-6 print:bg-white print:p-0 print:text-black">
      {/* Outer Document Canvas */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Printable Document Header (Appears in Print & Screen) */}
        <div className="hidden print:flex items-center justify-between text-[11px] text-gray-500 pb-3 border-b border-gray-300 mb-4">
          <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="font-semibold">Asesmen Harian Informatika Kelas X - Bab 1 Menelusuri Data & Kebenaran Informasi</span>
          <span>https://da-informatika.sch.id</span>
        </div>

        {/* 1. TOP RESULT CARD */}
        <div className="bg-white rounded-3xl border border-slate-300/80 p-6 sm:p-8 shadow-sm space-y-6 print:border-gray-400 print:shadow-none print:p-6 print:rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
            {/* Student Info */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                HASIL ASESMEN HARIAN SISWA
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {submission.student.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  {submission.student.program === 'X Cambridge' ? 'Kelas X Cambridge' : 'Kelas X (Reguler)'}
                </span>
                <span className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold font-mono">
                  No/NIS: {submission.student.studentId}
                </span>
                <span className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Durasi: {formatDuration(submission.durationSeconds)}</span>
                </span>
              </div>
            </div>

            {/* Score Pill Card */}
            <div className="w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center border border-slate-200 rounded-2xl p-4 bg-slate-50/60 min-w-[170px] relative text-center">
              <div className="hidden sm:block absolute -top-3.5 right-3 w-7 h-7 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 shadow-xs">
                <User className="w-4 h-4" />
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  NILAI AKHIR
                </div>
                <div className="text-5xl font-black text-emerald-600 tracking-tight my-0.5">
                  {submission.totalScore}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  KKM: 78
                </div>
              </div>

              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                    isPassing
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {isPassing ? 'TUNTAS / LULUS' : 'REMEDIAL'}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* PG Card */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Pilihan Ganda (60%)</span>
                <span className="font-bold text-blue-600 text-xs px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                  PG
                </span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-black text-blue-600">
                  {pgPercentage}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({submission.scorePG}/60 Poin)
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {correctPGCount} dari 10 Benar
              </div>
            </div>

            {/* Essay Card */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Uraian / Essay (40%)</span>
                <span className="font-bold text-emerald-600 text-xs px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  ES
                </span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-black text-emerald-600">
                  {essayPercentage}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({submission.scoreEssay}/40 Poin)
                  </span>
                </div>
              </div>
              <div className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dinilai Otomatis</span>
              </div>
            </div>

            {/* Integrity Card */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Catatan Integritas</span>
                <ShieldAlert
                  className={`w-4 h-4 ${
                    submission.tabViolations > 0 ? 'text-red-500' : 'text-slate-400'
                  }`}
                />
              </div>
              <div className="my-2">
                <div
                  className={`text-3xl font-black ${
                    submission.tabViolations > 3
                      ? 'text-red-600'
                      : submission.tabViolations > 0
                      ? 'text-amber-600'
                      : 'text-slate-800'
                  }`}
                >
                  {submission.tabViolations}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {submission.status === 'LOCKED_CHEAT'
                  ? 'Ujian Terkunci (Curang)'
                  : 'Pelanggaran Tab/Layar'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. ANTI-CHEAT LOG DETAILS (If any violations) */}
        {submission.tabViolations > 0 && (
          <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-xs text-xs">
            <button
              onClick={() => setShowLogDetails(!showLogDetails)}
              className="w-full flex items-center justify-between text-red-600 font-semibold"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>
                  Rincian Log Pelanggaran Anti-Kecurangan ({submission.tabViolations} Kejadian)
                </span>
              </div>
              <div className="p-1 rounded-md hover:bg-red-50 text-red-500 print:hidden">
                {showLogDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {(showLogDetails || true) && (
              <div className="mt-3 pt-3 border-t border-red-100 space-y-1.5 text-slate-600">
                {submission.violationLogs.length > 0 ? (
                  submission.violationLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-red-500 font-bold">• [{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="italic text-slate-500">
                    Terdeteksi beralih tab sebanyak {submission.tabViolations} kali selama sesi asesmen.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. RINCIAN EVALUASI PILIHAN GANDA (10 SOAL) */}
        <div className="bg-white rounded-3xl border border-slate-300/80 p-6 sm:p-8 shadow-sm space-y-6 print:border-gray-400 print:shadow-none print:p-6 print:rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Rincian Evaluasi Pilihan Ganda (10 Soal)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kunci jawaban dan pembahasan konsep lembar kerja
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {correctPGCount}/10 Benar
            </span>
          </div>

          <div className="space-y-6">
            {QUESTIONS_PG.map((q) => {
              const studentAns = submission.answersPG[q.id];
              const isCorrect = studentAns === q.correctAnswer;
              const studentOptionText = q.options.find((o) => o.key === studentAns)?.text;
              const correctOptionText = q.options.find((o) => o.key === q.correctAnswer)?.text;

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 print:break-inside-avoid print:border-gray-300"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {q.number}
                      </div>
                      <div className="space-y-2">
                        {q.sourceText && (
                          <div className="text-xs italic text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            "{q.sourceText}"
                          </div>
                        )}
                        {q.codeSnippet && (
                          <pre className="text-[11px] font-mono bg-slate-900 text-emerald-300 p-3 rounded-xl overflow-x-auto leading-relaxed border border-slate-700">
                            <code>{q.codeSnippet}</code>
                          </pre>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 border ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-red-50 text-red-700 border-red-300'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Benar (+6)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Salah (0)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Two Columns: Jawaban Anda vs Kunci Jawaban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        JAWABAN ANDA:
                      </div>
                      <div className={`font-semibold ${isCorrect ? 'text-slate-800' : 'text-red-600'}`}>
                        {studentAns ? `${studentAns}. ${studentOptionText}` : '(Tidak dijawab)'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        KUNCI JAWABAN:
                      </div>
                      <div className="font-semibold text-slate-800">
                        {q.correctAnswer}. {correctOptionText}
                      </div>
                    </div>
                  </div>

                  {/* Pembahasan Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
                    <div className="font-bold text-slate-700 text-xs">Pembahasan:</div>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. RINCIAN EVALUASI JAWABAN URAIAN (5 SOAL ESSAY) */}
        <div className="bg-white rounded-3xl border border-slate-300/80 p-6 sm:p-8 shadow-sm space-y-6 print:border-gray-400 print:shadow-none print:p-6 print:rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Rincian Evaluasi Jawaban Uraian (5 Soal Essay)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Penilaian otomatis sistem berdasarkan rubrik konsep dan pembuktian hitungan
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Skor: {submission.scoreEssay}/40
            </span>
          </div>

          <div className="space-y-6">
            {QUESTIONS_ESSAY.map((essay) => {
              const studentAns = submission.answersEssay[essay.id] || '';
              const score = submission.essayScores[essay.id] ?? 0;
              const feedback = submission.essayFeedback?.[essay.id];

              return (
                <div
                  key={essay.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 print:break-inside-avoid print:border-gray-300"
                >
                  {/* Essay Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {essay.number}
                      </div>
                      <div className="space-y-1">
                        {essay.context && (
                          <div className="text-xs italic text-slate-500 mb-1">
                            {essay.context}
                          </div>
                        )}
                        {essay.codeSnippet && (
                          <pre className="text-[11px] font-mono bg-slate-900 text-emerald-300 p-3 rounded-xl overflow-x-auto leading-relaxed border border-slate-700 my-2">
                            <code>{essay.codeSnippet}</code>
                          </pre>
                        )}
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                          {essay.question}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-3 py-0.5 rounded-full border border-teal-300 bg-teal-50 text-teal-700 shrink-0 font-mono">
                      Skor: {score} / 8
                    </span>
                  </div>

                  {/* Jawaban Anda */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      JAWABAN ANDA:
                    </div>
                    <p className="text-slate-800 leading-relaxed italic">
                      {studentAns || '(Tidak ada jawaban tertulis)'}
                    </p>
                  </div>

                  {/* Umpan Balik & Analisis Otomatis */}
                  {feedback && (
                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-teal-800">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Umpan Balik & Analisis Otomatis:</span>
                      </div>
                      <p>{feedback}</p>
                    </div>
                  )}

                  {/* Kunci Jawaban Model / Pedoman Penskoran */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1.5">
                    <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      KUNCI JAWABAN MODEL / PEDOMAN PENSKORAN:
                    </div>
                    <p>{essay.sampleAnswer}</p>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Rubrik Acuan: </strong> {essay.rubricGuide}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. BOTTOM ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-4 py-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Simpan PDF Rekap</span>
          </button>
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>

        {/* Printable Footer */}
        <div className="hidden print:flex items-center justify-between text-[11px] text-gray-500 pt-4 border-t border-gray-300 mt-6">
          <span>https://da-informatika.sch.id</span>
          <span>Dokumen Resmi Hasil Asesmen Harian</span>
        </div>
      </div>
    </div>
  );
};
