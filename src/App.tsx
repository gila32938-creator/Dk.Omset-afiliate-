/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { Header } from './components/Header.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { InputIncomeModal } from './components/InputIncomeModal.tsx';
import { AIAssistantModal } from './components/AIAssistantModal.tsx';
import { AffiliateAccount, IncomeRecord, TabType } from './types/index.ts';
import {
  subscribeAffiliateAccounts,
  subscribeIncomes,
} from './services/affiliateService.ts';
import { formatIndonesianDate, formatRupiah, toISODateString } from './utils/dateUtils.ts';
import { CheckCircle2, WifiOff } from 'lucide-react';

function MainApp() {
  const { currentUser, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('beranda');
  const [accounts, setAccounts] = useState<AffiliateAccount[]>([]);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);

  // Modals
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalInitialDate, setInputModalInitialDate] = useState<string>(toISODateString());
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Online status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to Firestore data for the logged in user
  useEffect(() => {
    if (!currentUser) {
      setAccounts([]);
      setIncomes([]);
      return;
    }

    const unsubAccounts = subscribeAffiliateAccounts(currentUser.uid, (accs) => {
      setAccounts(accs);
    });

    const unsubIncomes = subscribeIncomes(currentUser.uid, (incs) => {
      setIncomes(incs);
    });

    return () => {
      unsubAccounts();
      unsubIncomes();
    };
  }, [currentUser]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenAddIncome = (dateStr?: string) => {
    setInputModalInitialDate(dateStr || toISODateString());
    setIsInputModalOpen(true);
  };

  const handleIncomeSaved = (dateStr: string, totalAmount: number) => {
    showToast(
      `Entri ${formatIndonesianDate(dateStr)} berhasil dibukukan! Total: ${formatRupiah(totalAmount)}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          Memuat Sistem Pembukuan...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Corporate Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="bg-amber-950 border-b border-amber-800 text-amber-200 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-1.5 font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Koneksi offline aktif. Data tersimpan dalam antrean lokal dan akan disinkronkan saat online.</span>
        </div>
      )}

      {/* Corporate Financial Header */}
      <Header onOpenAssistant={() => setIsAssistantOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'beranda' && (
          <DashboardView
            accounts={accounts}
            incomes={incomes}
            onOpenAddIncome={handleOpenAddIncome}
            onNavigateToReports={() => setCurrentTab('laporan')}
            onOpenQuickLedger={() => setIsAssistantOpen(true)}
          />
        )}

        {currentTab === 'laporan' && (
          <ReportsView accounts={accounts} incomes={incomes} />
        )}

        {currentTab === 'riwayat' && (
          <HistoryView accounts={accounts} incomes={incomes} />
        )}

        {currentTab === 'pengaturan' && (
          <SettingsView accounts={accounts} incomes={incomes} />
        )}
      </main>

      {/* Official Transaction Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top duration-200 max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Cash Receipt Voucher Modal */}
      <InputIncomeModal
        userId={currentUser.uid}
        accounts={accounts}
        existingIncomes={incomes}
        initialDate={inputModalInitialDate}
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSuccess={handleIncomeSaved}
      />

      {/* Financial Natural Command Terminal Modal */}
      <AIAssistantModal
        userId={currentUser.uid}
        accounts={accounts}
        incomes={incomes}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateToTab={(tab) => setCurrentTab(tab)}
        onSuccessSave={handleIncomeSaved}
      />

      {/* Executive Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(t) => setCurrentTab(t)}
        onOpenQuickInput={() => handleOpenAddIncome()}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
