import React, { useState } from 'react';
import { AffiliateAccount, IncomeRecord } from '../types/index.ts';
import {
  formatFullIndonesianDate,
  formatIndonesianDate,
  formatMonthYear,
  formatRupiah,
  getMonthWeeklyBreakdown,
  getWeekRange,
  INDONESIAN_MONTHS,
  parseISODate,
  toISODateString,
} from '../utils/dateUtils.ts';

interface ReportsViewProps {
  accounts: AffiliateAccount[];
  incomes: IncomeRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ accounts, incomes }) => {
  const [reportType, setReportType] = useState<'bulanan' | 'mingguan' | 'harian'>('bulanan');

  const todayISO = toISODateString();
  const todayDate = parseISODate(todayISO);

  // --- BULANAN STATE ---
  const thisMonthISO = todayISO.slice(0, 7);
  const getLastMonthISO = () => {
    const d = parseISODate(todayISO);
    d.setMonth(d.getMonth() - 1);
    return toISODateString(d).slice(0, 7);
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(thisMonthISO);
  const [customMonthInput, setCustomMonthInput] = useState<string>(thisMonthISO);

  // --- HARIAN & MINGGUAN STATE ---
  const [dailyFilter, setDailyFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDailyDate, setCustomDailyDate] = useState<string>(todayISO);

  const getYesterdayISO = () => {
    const d = parseISODate(todayISO);
    d.setDate(d.getDate() - 1);
    return toISODateString(d);
  };

  const selectedDailyDate =
    dailyFilter === 'today'
      ? todayISO
      : dailyFilter === 'yesterday'
      ? getYesterdayISO()
      : customDailyDate;

  const [weeklyFilter, setWeeklyFilter] = useState<'thisWeek' | 'lastWeek'>('thisWeek');
  const getLastWeekDate = () => {
    const d = parseISODate(todayISO);
    d.setDate(d.getDate() - 7);
    return toISODateString(d);
  };
  const currentWeekRange = getWeekRange(weeklyFilter === 'thisWeek' ? todayISO : getLastWeekDate());

  // CALCULATIONS
  // 1. Bulanan
  const isMonthOngoing = selectedMonth === thisMonthISO;
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInSelectedMonth = new Date(yearNum, monthNum, 0).getDate();
  const monthName = INDONESIAN_MONTHS[monthNum - 1];
  const monthPeriodLabel = isMonthOngoing
    ? `1 ${monthName} ${yearNum} – ${todayDate.getDate()} ${monthName} ${yearNum}`
    : `1 ${monthName} ${yearNum} – ${daysInSelectedMonth} ${monthName} ${yearNum}`;

  const monthlyIncomes = incomes.filter((i) => i.date.startsWith(selectedMonth));
  const monthlyTotal = monthlyIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const monthlyWeekSegments = getMonthWeeklyBreakdown(selectedMonth);

  // 2. Mingguan
  const weeklyIncomes = incomes.filter(
    (i) => i.date >= currentWeekRange.start && i.date <= currentWeekRange.end
  );
  const weeklyTotal = weeklyIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 3. Harian
  const dailyIncomes = incomes.filter((i) => i.date === selectedDailyDate);
  const dailyTotal = dailyIncomes.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 pb-28 max-w-md mx-auto">
      {/* 1. Header Segmented Type Switcher */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setReportType('bulanan')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            reportType === 'bulanan'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Bulanan
        </button>
        <button
          onClick={() => setReportType('mingguan')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            reportType === 'mingguan'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Mingguan
        </button>
        <button
          onClick={() => setReportType('harian')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            reportType === 'harian'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Harian
        </button>
      </div>

      {/* ===================== LAPORAN BULANAN ===================== */}
      {reportType === 'bulanan' && (
        <div className="space-y-4">
          {/* Month Selector Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(thisMonthISO)}
              className={`flex-1 py-2 px-3 rounded-2xl border text-xs font-bold transition font-display ${
                selectedMonth === thisMonthISO
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Bulan ini
            </button>
            <button
              onClick={() => setSelectedMonth(getLastMonthISO())}
              className={`flex-1 py-2 px-3 rounded-2xl border text-xs font-bold transition font-display ${
                selectedMonth === getLastMonthISO()
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Bulan lalu
            </button>
            <div className="relative">
              <input
                type="month"
                value={customMonthInput}
                onChange={(e) => {
                  setCustomMonthInput(e.target.value);
                  setSelectedMonth(e.target.value);
                }}
                className="py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Monthly Budget Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Total Omset ({formatMonthYear(selectedMonth)})
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">
                  {formatRupiah(monthlyTotal)}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isMonthOngoing ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {isMonthOngoing ? 'Bulan Berjalan' : 'Bulan Selesai'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-slate-900 dark:bg-slate-300 rounded-full transition-all duration-300"
                  style={{ width: isMonthOngoing ? `${Math.min(100, Math.round((todayDate.getDate() / daysInSelectedMonth) * 100))}%` : '100%' }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{monthPeriodLabel}</span>
                <span>{isMonthOngoing ? `${todayDate.getDate()}/${daysInSelectedMonth} Hari` : 'Selesai'}</span>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Rincian Akun Toko
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {accounts.length} Akun
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-2xs space-y-3 transition-colors">
              {accounts.map((acc) => {
                const accMonthIncomes = monthlyIncomes.filter(
                  (i) => i.affiliateAccountId === acc.accountId
                );
                const total = accMonthIncomes.reduce(
                  (accSum, curr) => accSum + (curr.amount || 0),
                  0
                );
                const percent =
                  monthlyTotal > 0 ? Math.min(100, Math.round((total / monthlyTotal) * 100)) : 0;
                const initials = getInitials(acc.accountName);

                return (
                  <div key={acc.accountId} className="p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-display">
                            {acc.accountName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {formatRupiah(total)}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-display">
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 dark:bg-slate-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Breakdown within Month */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Rincian Mingguan
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {monthlyWeekSegments.map((seg) => {
                const segIncomes = incomes.filter(
                  (i) => i.date >= seg.startDate && i.date <= seg.endDate
                );
                const segTotal = segIncomes.reduce(
                  (sum, item) => sum + (item.amount || 0),
                  0
                );
                return (
                  <div key={seg.weekNumber} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white font-display">{seg.label}</p>
                      <p className="text-[11px] text-slate-400">{seg.periodLabel}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-display">
                      {formatRupiah(segTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== LAPORAN MINGGUAN ===================== */}
      {reportType === 'mingguan' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeeklyFilter('thisWeek')}
              className={`flex-1 py-2 rounded-2xl border text-xs font-bold transition font-display ${
                weeklyFilter === 'thisWeek'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Minggu ini
            </button>
            <button
              onClick={() => setWeeklyFilter('lastWeek')}
              className={`flex-1 py-2 rounded-2xl border text-xs font-bold transition font-display ${
                weeklyFilter === 'lastWeek'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Minggu lalu
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 transition-colors">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Minggu (Senin – Minggu)
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {formatRupiah(weeklyTotal)}
            </h2>
            <p className="text-xs text-slate-400 pt-1">
              {formatIndonesianDate(currentWeekRange.start)} – {formatIndonesianDate(currentWeekRange.end)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-2 transition-colors">
            {accounts.map((acc) => {
              const accWeekIncomes = weeklyIncomes.filter(
                (i) => i.affiliateAccountId === acc.accountId
              );
              const total = accWeekIncomes.reduce(
                (accSum, curr) => accSum + (curr.amount || 0),
                0
              );
              const initials = getInitials(acc.accountName);

              return (
                <div key={acc.accountId} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200">
                      {initials}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                      {acc.accountName}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                    {formatRupiah(total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== LAPORAN HARIAN ===================== */}
      {reportType === 'harian' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDailyFilter('today')}
              className={`flex-1 py-2 rounded-2xl border text-xs font-bold transition font-display ${
                dailyFilter === 'today'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Hari ini
            </button>
            <button
              onClick={() => setDailyFilter('yesterday')}
              className={`flex-1 py-2 rounded-2xl border text-xs font-bold transition font-display ${
                dailyFilter === 'yesterday'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Kemarin
            </button>
            <input
              type="date"
              value={customDailyDate}
              onChange={(e) => {
                setCustomDailyDate(e.target.value);
                setDailyFilter('custom');
              }}
              className="py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-1 transition-colors">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Penghasilan Harian
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
              {formatRupiah(dailyTotal)}
            </h2>
            <p className="text-xs text-slate-400 pt-1">
              {formatFullIndonesianDate(selectedDailyDate)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-2 transition-colors">
            {accounts.map((acc) => {
              const match = dailyIncomes.find((i) => i.affiliateAccountId === acc.accountId);
              const amount = match ? match.amount : 0;
              const initials = getInitials(acc.accountName);

              return (
                <div key={acc.accountId} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200">
                      {initials}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                      {acc.accountName}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-display">
                    {formatRupiah(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
