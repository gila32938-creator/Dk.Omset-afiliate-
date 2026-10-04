import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AffiliateAccount, IncomeRecord } from '../types/index.ts';
import {
  formatFullIndonesianDate,
  formatRupiah,
  getWeekRange,
  toISODateString,
} from '../utils/dateUtils.ts';
import {
  Eye,
  EyeOff,
  ChevronRight,
  TrendingUp,
  Store,
  ShoppingBag,
  Plus,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  accounts: AffiliateAccount[];
  incomes: IncomeRecord[];
  onOpenAddIncome: (initialDate?: string) => void;
  onNavigateToReports: () => void;
  onOpenQuickLedger?: () => void;
}

// Clean, modern monochromatic merchant palette for professional finance
const PALETTE_COLORS = ['#0f172a', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  incomes,
  onOpenAddIncome,
  onNavigateToReports,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [overviewPeriod, setOverviewPeriod] = useState<'month' | 'today' | 'all'>('month');

  const todayISO = toISODateString();
  const currentMonthISO = todayISO.slice(0, 7); // "YYYY-MM"
  const currentWeek = getWeekRange(todayISO);

  const activeAccounts = accounts.filter((a) => a.active);

  // --- Real Database Calculations ---
  const todayIncomes = incomes.filter((i) => i.date === todayISO);
  const totalToday = todayIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const weekIncomes = incomes.filter(
    (i) => i.date >= currentWeek.start && i.date <= currentWeek.end
  );
  const totalWeek = weekIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const monthIncomes = incomes.filter((i) => i.date.startsWith(currentMonthISO));
  const totalMonth = monthIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalAllTime = incomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Per Account Calculation based on selected overview period
  const getAccountIncome = (accountId: string) => {
    let list = incomes.filter((i) => i.affiliateAccountId === accountId);
    if (overviewPeriod === 'today') {
      list = list.filter((i) => i.date === todayISO);
    } else if (overviewPeriod === 'month') {
      list = list.filter((i) => i.date.startsWith(currentMonthISO));
    }
    return list.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const currentOverviewTotal =
    overviewPeriod === 'today'
      ? totalToday
      : overviewPeriod === 'month'
      ? totalMonth
      : totalAllTime;

  // Breakdown percentages for Portfolio Donut
  const breakdownData = activeAccounts.map((acc, index) => {
    const amount = getAccountIncome(acc.accountId);
    const color = PALETTE_COLORS[index % PALETTE_COLORS.length];
    const percentage = currentOverviewTotal > 0 ? (amount / currentOverviewTotal) * 100 : 0;
    return {
      name: acc.accountName,
      amount,
      percentage: Math.round(percentage),
      rawPercentage: percentage,
      color,
    };
  });

  const displayName =
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Partner';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 pb-28 max-w-md mx-auto">
      {/* 1. GREETING & VERIFIED LEDGER STATUS */}
      <div className="px-1 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ledger Terverifikasi
          </p>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
            Selamat datang, {displayName}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Privat & Aman</span>
        </div>
      </div>

      {/* 2. MODERN MATTE FINANCIAL HERO CARD (Clean & Authoritative, Zero AI Slop) */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-md border border-slate-800 relative transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold tracking-widest text-slate-300 uppercase font-display">
              Ledger Omset Toko
            </span>
          </div>

          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={showBalance ? 'Sembunyikan Angka' : 'Tampilkan Angka'}
          >
            {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Central Balance */}
        <div className="mt-4">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Total Penghasilan Kotor (Bulan Ini)
          </span>
          <div className="mt-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              {showBalance ? formatRupiah(totalMonth) : 'Rp ••••••••'}
            </h2>
          </div>
        </div>

        {/* Card Sub-Ledger Performance */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3 h-3" />
              <span>Hari ini:</span>
            </span>
            <span className="font-semibold text-slate-200">
              {showBalance ? formatRupiah(totalToday) : '••••'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 text-[11px]">Minggu Ini: </span>
            <span className="font-bold text-slate-200">
              {showBalance ? formatRupiah(totalWeek) : '••••'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onOpenAddIncome(todayISO)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-emerald-400 font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition font-display"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Tambah Penghasilan</span>
        </button>

        <button
          onClick={onNavigateToReports}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-xs sm:text-sm shadow-2xs active:scale-[0.98] transition font-display"
        >
          <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span>Rekap & Laporan</span>
        </button>
      </div>

      {/* 4. SUMMARY METRIC CARDS (Clean Dual-Theme Adaptation) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs text-center transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hari Ini
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate font-display">
            {formatRupiah(totalToday)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs text-center transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Minggu Ini
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate font-display">
            {formatRupiah(totalWeek)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs text-center transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Akumulasi
          </span>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate font-display">
            {formatRupiah(totalAllTime)}
          </p>
        </div>
      </div>

      {/* 5. DAFTAR TOKO AFFILIATE (Clean Monogram Merchant Cards) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Akun Toko Affiliate
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeAccounts.length} Toko Aktif Terdaftar
            </p>
          </div>
          <button
            onClick={onNavigateToReports}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-0.5 transition"
          >
            <span>Analisis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
          {activeAccounts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada akun affiliate aktif. Tambahkan di menu Pengaturan.
            </div>
          ) : (
            activeAccounts.map((acc, index) => {
              const gross = getAccountIncome(acc.accountId);
              const percentage = currentOverviewTotal > 0 ? (gross / currentOverviewTotal) * 100 : 0;
              const initials = getInitials(acc.accountName);

              return (
                <div
                  key={acc.accountId}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl transition cursor-pointer group"
                  onClick={() => onOpenAddIncome(todayISO)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Modern Clean Monogram Squircle Badge (Standard Fintech Pattern) */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-display">
                          {acc.accountName}
                        </p>
                      </div>

                      {/* Contribution Progress */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 dark:bg-slate-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {Math.round(percentage)}% kontribusi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-display block">
                        {formatRupiah(gross)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {overviewPeriod === 'today' ? 'Hari ini' : overviewPeriod === 'month' ? 'Bulan ini' : 'Semua'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. DISTRIBUSI PENGHASILAN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Distribusi Omset Toko
            </h3>
            <p className="text-[11px] text-slate-400">
              Porsi pendapatan per toko affiliate
            </p>
          </div>
          <select
            value={overviewPeriod}
            onChange={(e) => setOverviewPeriod(e.target.value as any)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="month">Bulan Ini</option>
            <option value="today">Hari Ini</option>
            <option value="all">Akumulasi</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-1">
          {/* Donut Chart */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="11"
                className="text-slate-100 dark:text-slate-800"
              />
              {(() => {
                let accumulatedPercent = 0;
                return breakdownData.map((item, idx) => {
                  if (item.rawPercentage <= 0) return null;
                  const circumference = 2 * Math.PI * 38;
                  const strokeDasharray = `${(item.rawPercentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += item.rawPercentage;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="11"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                });
              })()}
            </svg>

            {/* Donut Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[85px] font-display">
                {formatRupiah(currentOverviewTotal)}
              </span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="space-y-2.5 flex-1 w-full">
            {breakdownData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {formatRupiah(item.amount)}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-display min-w-[32px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
