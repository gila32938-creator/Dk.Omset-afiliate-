import React from 'react';
import { Home, Receipt, Plus, BarChart3, Sliders } from 'lucide-react';
import { TabType } from '../types/index.ts';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenQuickInput: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenQuickInput,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-safe shadow-xs transition-colors duration-200">
      <div className="max-w-md mx-auto px-4 flex items-center justify-between h-16">
        {/* 1. Beranda */}
        <button
          onClick={() => onChangeTab('beranda')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            currentTab === 'beranda'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span className="text-[10px] font-display">Beranda</span>
        </button>

        {/* 2. Transaksi (Riwayat) */}
        <button
          onClick={() => onChangeTab('riwayat')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            currentTab === 'riwayat'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span className="text-[10px] font-display">Transaksi</span>
        </button>

        {/* 3. Center Modern Action Button (+ Omset) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => onOpenQuickInput()}
            className="w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md flex items-center justify-center active:scale-95 transition-transform duration-150 border-2 border-white dark:border-slate-900"
            title="Tambah Penghasilan"
            aria-label="Tambah Penghasilan"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Laporan (Rekap) */}
        <button
          onClick={() => onChangeTab('laporan')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            currentTab === 'laporan'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span className="text-[10px] font-display">Laporan</span>
        </button>

        {/* 5. Pengaturan */}
        <button
          onClick={() => onChangeTab('pengaturan')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            currentTab === 'pengaturan'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Sliders className="w-5 h-5 mb-0.5 stroke-[2]" />
          <span className="text-[10px] font-display">Pengaturan</span>
        </button>
      </div>
    </nav>
  );
};
