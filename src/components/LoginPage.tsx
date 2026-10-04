import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Landmark,
  KeyRound,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!email.trim()) {
      setError('Silakan masukkan alamat email aktif Anda.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        if (!password) {
          setError('Silakan masukkan kata sandi akun.');
          return;
        }
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (!password || password.length < 6) {
          setError('Kata sandi minimal 6 karakter.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Konfirmasi kata sandi tidak cocok.');
          return;
        }
        await registerWithEmail(email, password);
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccessMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Kredensial tidak valid. Silakan periksa email dan kata sandi Anda.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Email ini sudah terdaftar. Silakan langsung masuk.');
      } else if (code === 'auth/weak-password') {
        setError('Kata sandi terlalu pendek. Gunakan minimal 6 karakter.');
      } else if (code === 'auth/invalid-email') {
        setError('Format alamat email tidak valid.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Pendaftaran email dapat dilakukan langsung menggunakan tombol Masuk dengan Google.');
      } else {
        setError(err.message || 'Terjadi gangguan otorisasi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetForm();
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Gagal masuk melalui Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-800 dark:text-slate-100 p-4 sm:p-6 antialiased transition-colors duration-200">
      {/* Brand Header */}
      <div className="w-full max-w-sm mx-auto pt-8 flex flex-col items-center text-center">
        {/* Modern Clean Monogram Mark */}
        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-display font-black text-xl tracking-tight mb-3 shadow-md select-none">
          DK
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            DK AFFILIATE
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded tracking-widest font-mono">
            PRO
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-xs">
          Sistem Pembukuan & Analisis Omset TikTok Affiliate
        </p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-sm mx-auto my-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-900/5">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            {mode === 'login' && 'Masuk ke Portal'}
            {mode === 'register' && 'Registrasi Akun Baru'}
            {mode === 'forgot' && 'Pemulihan Kata Sandi'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {mode === 'login' && 'Akses pembukuan omset harian TikTok Affiliate Anda'}
            {mode === 'register' && 'Buat akun privat untuk menyimpan ledger secara cloud-persistent'}
            {mode === 'forgot' && 'Masukkan email terdaftar untuk mengatur ulang kata sandi'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-display uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-display uppercase tracking-wider">
                  Kata Sandi
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMode('forgot');
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-display uppercase tracking-wider">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 font-display disabled:opacity-50"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Masuk ke Akun'}
                  {mode === 'register' && 'Daftar Sekarang'}
                  {mode === 'forgot' && 'Kirim Tautan Pemulihan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          <span className="px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            atau
          </span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2.5 shadow-2xs transition active:scale-[0.98] font-display"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Akun Google</span>
        </button>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' && (
            <p>
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('register');
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline font-display"
              >
                Daftar Akun Baru
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('login');
                }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline font-display"
              >
                Masuk ke Akun
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMode('login');
              }}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline font-display"
            >
              Kembali ke Login
            </button>
          )}
        </div>
      </div>

      {/* Security Assurance Footer */}
      <div className="w-full max-w-sm mx-auto text-center space-y-2 pb-2">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Keamanan Data Cloud Firestore Terisolasi</span>
        </div>
        <PWAInstallButton />
      </div>
    </div>
  );
};
