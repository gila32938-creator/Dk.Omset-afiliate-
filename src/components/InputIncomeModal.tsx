import React, { useState, useEffect } from 'react';
import { AffiliateAccount, IncomeRecord } from '../types/index.ts';
import {
  formatFullIndonesianDate,
  formatRupiah,
  parseRupiahInput,
  toISODateString,
} from '../utils/dateUtils.ts';
import { saveDailyIncomes } from '../services/affiliateService.ts';
import {
  X,
  Check,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface InputIncomeModalProps {
  userId: string;
  accounts: AffiliateAccount[];
  existingIncomes: IncomeRecord[];
  initialDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedDate: string, totalAmount: number) => void;
}

export const InputIncomeModal: React.FC<InputIncomeModalProps> = ({
  userId,
  accounts,
  existingIncomes,
  initialDate,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || toISODateString()
  );
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.active);

  useEffect(() => {
    if (!isOpen) return;

    const recordsForDate = existingIncomes.filter((i) => i.date === selectedDate);
    const newValues: Record<string, string> = {};

    activeAccounts.forEach((acc) => {
      const match = recordsForDate.find((r) => r.affiliateAccountId === acc.accountId);
      if (match && match.amount > 0) {
        newValues[acc.accountId] = match.amount.toLocaleString('id-ID');
      } else {
        newValues[acc.accountId] = '';
      }
    });

    setInputValues(newValues);
    setError(null);
  }, [selectedDate, isOpen, existingIncomes, accounts]);

  if (!isOpen) return null;

  // Calculate live total
  const totalGross = activeAccounts.reduce((acc, curr) => {
    const rawVal = inputValues[curr.accountId] || '';
    const numeric = parseRupiahInput(rawVal);
    return acc + numeric;
  }, 0);

  const handleInputChange = (accountId: string, value: string) => {
    const cleanDigits = value.replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      setInputValues((prev) => ({ ...prev, [accountId]: '' }));
      return;
    }
    const num = parseInt(cleanDigits, 10);
    setInputValues((prev) => ({
      ...prev,
      [accountId]: num.toLocaleString('id-ID'),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Silakan tentukan tanggal pencatatan.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Rule 10: Empty is strictly Rp0
      const entries = activeAccounts.map((acc) => {
        const rawVal = inputValues[acc.accountId] || '';
        const amount = parseRupiahInput(rawVal);
        return {
          accountId: acc.accountId,
          accountName: acc.accountName,
          amount,
        };
      });

      await saveDailyIncomes(userId, selectedDate, entries);
      onSuccess(selectedDate, totalGross);
      onClose();
    } catch (err: any) {
      console.error('Error saving income:', err);
      setError(err?.message || 'Gagal menyimpan data ke database.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden animate-slide-up transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-display">
              Buku Kas Masuk
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Input Penghasilan Kotor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date Selector Row */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-display">
              Tanggal Transaksi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1">
              {formatFullIndonesianDate(selectedDate)}
            </p>
          </div>

          {/* Accounts Input Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">
                Nominal Omset Per Toko
              </label>
              <span className="text-[11px] text-slate-400 italic">
                *Kosong otomatis Rp0
              </span>
            </div>

            {activeAccounts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada akun affiliate aktif. Silakan tambahkan di Pengaturan.
              </div>
            ) : (
              activeAccounts.map((acc) => {
                const initials = getInitials(acc.accountName);

                return (
                  <div
                    key={acc.accountId}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate block font-display">
                          {acc.accountName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          TikTok Shop
                        </span>
                      </div>
                    </div>

                    {/* Numeric Input */}
                    <div className="w-36 sm:w-44 relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 font-display">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={inputValues[acc.accountId] || ''}
                        onChange={(e) => handleInputChange(acc.accountId, e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-extrabold text-right text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-display"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Running Total Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-between border border-slate-800 dark:border-slate-700 shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Total Omset Terpilih
              </span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {activeAccounts.length} Toko Aktif
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-extrabold text-white font-display">
                {formatRupiah(totalGross)}
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-display"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-2 py-3 px-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 font-display disabled:opacity-50"
          >
            {saving ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Simpan Penghasilan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
