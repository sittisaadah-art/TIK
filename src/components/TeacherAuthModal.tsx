import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'guru123') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-blue-100" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Otentikasi Guru / Pengajar</h3>
          <p className="text-blue-100 text-xs mt-1">
            Silakan masukkan PIN pengajar untuk membuka Dashboard Rekapitulasi & Analisis
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Masukkan PIN guru..."
                autoFocus
                className={`w-full px-4 py-3 rounded-xl border text-sm font-medium tracking-wider transition-all focus:outline-none ${
                  error
                    ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-400'
                    : 'border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                PIN yang Anda masukkan salah. Silakan periksa kembali.
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Akses Terproteksi:</span> Dashboard guru menyediakan grafik real-time,
              pemantauan kecurangan siswa, rekap nilai kelas, dan penyesuaian skor essay.
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
            >
              Masuk Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
