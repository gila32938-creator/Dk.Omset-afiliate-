import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={
          compact
            ? 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:text-white text-xs font-semibold active:scale-95 transition'
            : 'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white text-xs uppercase tracking-wider font-bold shadow-xs active:scale-[0.99] transition'
        }
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span>Pasang Aplikasi (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 text-xs font-semibold hover:bg-slate-800 active:scale-95 transition'
              : 'flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs uppercase tracking-wider font-bold hover:bg-slate-800 active:scale-[0.99] transition'
          }
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>Pasang di iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Panduan Instalasi iOS PWA
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-slate-200 font-mono font-bold text-xs shrink-0 mt-0.5 border border-slate-700">
                    1
                  </span>
                  <p>Tekan tombol <strong>Bagikan (Share)</strong> pada toolbar Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-slate-200 font-mono font-bold text-xs shrink-0 mt-0.5 border border-slate-700">
                    2
                  </span>
                  <p>Pilih opsi <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-800 text-slate-200 font-mono font-bold text-xs shrink-0 mt-0.5 border border-slate-700">
                    3
                  </span>
                  <p>Aplikasi akan terpasang sebagai aplikasi mandiri di layar utama Anda.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs uppercase tracking-wider transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
