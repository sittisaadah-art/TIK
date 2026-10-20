import React, { useState } from 'react';
import { StudentProfile, ProgramType } from '../types/assessment';
import {
  BookOpen,
  Clock,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface StudentRegistrationProps {
  onStartExam: (profile: StudentProfile) => void;
  onOpenTeacherLogin: () => void;
}

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  onStartExam,
  onOpenTeacherLogin,
}) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState<ProgramType>('X');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Harap masukkan Nama Lengkap Anda.');
      return;
    }
    if (!studentId.trim()) {
      setError('Harap masukkan Nomor Absen atau NISN.');
      return;
    }
    if (!agreedTerms) {
      setError('Anda harus menyetujui peraturan ujian dan sistem proctoring anti-curang.');
      return;
    }

    setError('');

    // Trigger full screen when exam starts
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignore if user or browser cancels fullscreen
        });
      }
    } catch (err) {
      // safe fallback
    }

    onStartExam({
      name: name.trim(),
      studentId: studentId.trim(),
      program,
      className: program === 'X Cambridge' ? 'X Cambridge' : 'Kelas X',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
              X
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                Asesmen Harian Informatika SMA
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Bab 1
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Menelusuri Data dan Kebenaran Informasi di Dunia Digital
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTeacherLogin}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 transition-all hover:border-slate-500 shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Mode Guru / Pengajar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Briefing & Assessment Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Ujian Berbasis Komputer (CBT Terstandar)
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Daily Assessment <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                  Informatika Kelas X
                </span>
              </h2>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                Materi evaluasi keabsahan data digital: Ekstraksi Data (Web Scraping Python Requests & BeautifulSoup),
                Evaluasi Kredibilitas Informasi (Membaca Lateral), Uji CRAAP Test (Currency, Relevance, Authority, Accuracy, Purpose), serta Pencarian Visual berbasis Gambar.
              </p>
            </div>

            {/* Assessment Specs Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Struktur Soal</div>
                  <div className="text-sm font-bold text-white">10 PG + 5 Essay</div>
                  <div className="text-[11px] text-blue-400">Total: 100 Poin</div>
                </div>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Alokasi Waktu</div>
                  <div className="text-sm font-bold text-white">60 Menit</div>
                  <div className="text-[11px] text-amber-400">Penilaian Otomatis</div>
                </div>
              </div>
            </div>

            {/* Anti-Cheat Notice Card */}
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-xs text-red-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                Sistem Deteksi Anti-Kecurangan Aktif
              </div>
              <p className="leading-relaxed text-red-200/90">
                Siswa <strong className="text-white">dilarang membuka tab lain, meminimalkan browser, atau berpindah aplikasi</strong>.
                Sistem secara otomatis mendeteksi perpindahan tab. Jika terdeteksi berpindah lebih dari <strong>3 kali</strong>,
                ujian Anda akan <span className="underline font-bold text-white">langsung DIKUNCI dan disubmit seketika</span> ke database guru!
              </p>
            </div>
          </div>

          {/* Right Column: Student Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                    Identitas Peserta Ujian
                  </h3>
                  <p className="text-xs text-slate-400">Isi data diri dengan teliti sebelum memulai asesmen</p>
                </div>
              </div>

              <form onSubmit={handleStart} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Aisyah Putri Azzahra"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* NISN / No Absen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nomor Absen / NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Contoh: 008219401 atau No. Absen 04"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Program Selector (X vs X Cambridge) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Pilih Program / Jenjang *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProgram('X')}
                      className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                        program === 'X'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <span>Kelas X (Reguler)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgram('X Cambridge')}
                      className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                        program === 'X Cambridge'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>X Cambridge</span>
                    </button>
                  </div>
                </div>

                {/* Anti-cheat Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                      Saya bersumpah mengerjakan ujian ini secara mandiri, jujur, dan memahami bahwa berpindah tab browser lebih dari 3x akan mengakibatkan ujian langsung dikunci.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                {/* Submit / Start Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group mt-2"
                >
                  <span>Mulai Asesmen Sekarang (60 Menit)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Asesmen Terpadu Informatika SMA Kelas X • Bab 1 Menelusuri Data dan Kebenaran Informasi • Smart Book Informatika
      </footer>
    </div>
  );
};
