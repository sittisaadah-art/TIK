import React from 'react';
import { ExamSubmission } from '../types/assessment';
import { QUESTIONS_PG, QUESTIONS_ESSAY } from '../data/questionsData';

interface PrintCertificateProps {
  submission: ExamSubmission;
}

export const PrintCertificate: React.FC<PrintCertificateProps> = ({ submission }) => {
  const isPassing = submission.totalScore >= 78;
  const gradeLabel =
    submission.totalScore >= 90
      ? 'A (Sangat Baik)'
      : submission.totalScore >= 80
      ? 'B (Baik)'
      : submission.totalScore >= 78
      ? 'C (Cukup / Tuntas KKM)'
      : 'D (Perlu Bimbingan / Remedial)';

  const formattedDate = new Date(submission.submittedAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="hidden print:block print:p-8 bg-white text-black font-sans w-full max-w-4xl mx-auto">
      {/* Official School Header / Kop Surat */}
      <div className="border-b-4 border-double border-black pb-4 mb-6 flex items-center justify-between text-center relative">
        <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center font-black text-xl shrink-0">
          SMA
        </div>
        <div className="flex-1 px-4">
          <h2 className="text-xl font-bold uppercase tracking-wide">
            KARTU HASIL ASESMEN HARIAN (DAILY ASSESSMENT)
          </h2>
          <h3 className="text-sm font-semibold uppercase">
            MATA PELAJARAN INFORMATIKA KELAS X — SEMESTER GANJIL
          </h3>
          <p className="text-xs text-gray-700">
            BAB 1: Menelusuri Data dan Kebenaran Informasi di Dunia Digital
          </p>
        </div>
        <div className="w-16 h-16 border-2 border-black rounded-lg flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
          <span>SMART</span>
          <span>BOOK</span>
        </div>
      </div>

      {/* Student Identity Grid */}
      <div className="border border-black p-4 rounded-lg mb-6 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <div>
            <span className="font-semibold inline-block w-36">Nama Siswa:</span>
            <span className="font-bold uppercase">{submission.student.name}</span>
          </div>
          <div>
            <span className="font-semibold inline-block w-36">Program / Jenjang:</span>
            <span>{submission.student.program}</span>
          </div>
          <div>
            <span className="font-semibold inline-block w-36">No. Absen / NISN:</span>
            <span className="font-mono font-semibold">{submission.student.studentId}</span>
          </div>
          <div>
            <span className="font-semibold inline-block w-36">Kelas:</span>
            <span className="font-bold">{submission.student.className}</span>
          </div>
          <div>
            <span className="font-semibold inline-block w-36">Tanggal Pengerjaan:</span>
            <span>{formattedDate}</span>
          </div>
          <div>
            <span className="font-semibold inline-block w-36">Durasi Pengerjaan:</span>
            <span>{Math.round(submission.durationSeconds / 60)} Menit</span>
          </div>
        </div>
      </div>

      {/* Score Summary Box */}
      <div className="border-2 border-black p-5 rounded-lg mb-6 text-center bg-gray-100/60">
        <div className="text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
          NILAI AKHIR ASESMEN (SKOR MAKSIMAL 100)
        </div>
        <div className="text-5xl font-black tracking-tight my-2">
          {submission.totalScore}
        </div>
        <div className="flex items-center justify-center gap-6 text-xs mt-3">
          <div>
            <span className="text-gray-600">Skor Pilihan Ganda: </span>
            <span className="font-bold">{submission.scorePG} / 60</span>
          </div>
          <div>•</div>
          <div>
            <span className="text-gray-600">Skor Uraian / Essay: </span>
            <span className="font-bold">{submission.scoreEssay} / 40</span>
          </div>
          <div>•</div>
          <div>
            <span className="text-gray-600">Predikat: </span>
            <span className="font-bold">{gradeLabel}</span>
          </div>
        </div>
        <div className="mt-3">
          <span
            className={`inline-block px-4 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
              isPassing ? 'bg-white border-black' : 'bg-gray-200 border-black'
            }`}
          >
            STATUS: {isPassing ? 'TUNTAS (LULUS KKM)' : 'BELUM TUNTAS (PERLU REMEDIAL)'}
          </span>
        </div>
      </div>

      {/* Proctoring & Integrity Verification Note */}
      <div className="border border-black p-3 rounded-lg mb-6 text-xs">
        <div className="font-bold mb-1">Catatan Integritas Ujian & Proctoring:</div>
        <p className="text-gray-700">
          {submission.status === 'LOCKED_CHEAT'
            ? `PERINGATAN: Siswa melanggar aturan tab ${submission.tabViolations} kali (Ujian dikunci otomatis oleh sistem).`
            : `Siswa mengerjakan ujian dengan tertib. Terdeteksi ${submission.tabViolations} kali pergantian tab.`}
        </p>
        {submission.teacherNotes && (
          <p className="mt-1 text-gray-800 italic">
            <strong>Catatan Guru:</strong> {submission.teacherNotes}
          </p>
        )}
      </div>

      {/* Question Breakdown Table */}
      <div className="mb-8">
        <h4 className="text-xs font-bold uppercase mb-2">Ringkasan Capaian Soal Pilihan Ganda (10 Butir)</h4>
        <table className="w-full text-xs border border-black border-collapse text-center">
          <thead>
            <tr className="bg-gray-200 border-b border-black">
              <th className="p-1 border-r border-black">No</th>
              {QUESTIONS_PG.map((q) => (
                <th key={q.id} className="p-1 border-r border-black">{q.number}</th>
              ))}
              <th className="p-1">Benar</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">Kunci</td>
              {QUESTIONS_PG.map((q) => (
                <td key={q.id} className="p-1 border-r border-black font-mono">{q.correctAnswer}</td>
              ))}
              <td className="p-1 font-bold">-</td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-semibold">Jawab</td>
              {QUESTIONS_PG.map((q) => {
                const ans = submission.answersPG[q.id];
                const isCorrect = ans === q.correctAnswer;
                return (
                  <td
                    key={q.id}
                    className={`p-1 border-r border-black font-mono font-bold ${
                      isCorrect ? 'text-black' : 'text-gray-400 underline'
                    }`}
                  >
                    {ans || '-'}
                  </td>
                );
              })}
              <td className="p-1 font-bold">
                {Object.keys(submission.answersPG).filter((k) => {
                  const q = QUESTIONS_PG.find((item) => item.id === Number(k));
                  return q && submission.answersPG[Number(k)] === q.correctAnswer;
                }).length} / 10
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 text-center text-xs pt-6 mt-6 border-t border-black">
        <div>
          <p>Peserta Ujian,</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">{submission.student.name}</p>
          <p className="text-gray-600">NISN. {submission.student.studentId}</p>
        </div>
        <div>
          <p>Guru Pengampu Informatika,</p>
          <div className="h-16" />
          <p className="font-bold underline uppercase">Sitti Sa'adah, S.Kom., M.Pd.</p>
          <p className="text-gray-600">NIP. 198506122010012015</p>
        </div>
      </div>

      <div className="text-[10px] text-gray-500 text-center mt-8">
        Dokumen resmi digenerate secara otomatis oleh Sistem CBT Asesmen Harian SMA Kelas X • Dicetak pada {new Date().toLocaleString('id-ID')}
      </div>
    </div>
  );
};
