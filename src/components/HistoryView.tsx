import React, { useState, useMemo } from 'react';
import { AffiliateAccount, IncomeRecord } from '../types/index.ts';
import {
  formatIndonesianDate,
  formatRupiah,
  parseRupiahInput,
  toISODateString,
} from '../utils/dateUtils.ts';
import {
  updateIncomeRecord,
  deleteIncomeRecord,
} from '../services/affiliateService.ts';
import {
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface HistoryViewProps {
  accounts: AffiliateAccount[];
  incomes: IncomeRecord[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ accounts, incomes }) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'yesterday' | 'month'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editAmountStr, setEditAmountStr] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [recordToDelete, setRecordToDelete] = useState<IncomeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const todayISO = toISODateString();
  const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISODateString(d);
  };
  const yesterdayISO = getYesterdayISO();
  const currentMonthISO = todayISO.slice(0, 7);

  // Filter incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      // Filter by account
      if (filterAccount !== 'all' && item.affiliateAccountId !== filterAccount) {
        return false;
      }
      // Filter by period
      if (filterPeriod === 'today') {
        return item.date === todayISO;
      }
      if (filterPeriod === 'yesterday') {
        return item.date === yesterdayISO;
      }
      if (filterPeriod === 'month') {
        return item.date.startsWith(currentMonthISO);
      }
      return true;
    });
  }, [incomes, filterPeriod, filterAccount, todayISO, yesterdayISO, currentMonthISO]);

  // Group filtered incomes by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, IncomeRecord[]> = {};
    filteredIncomes.forEach((record) => {
      if (!groups[record.date]) {
        groups[record.date] = [];
      }
      groups[record.date].push(record);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => {
      let label = formatIndonesianDate(date);
      if (date === todayISO) label = 'Hari Ini';
      else if (date === yesterdayISO) label = 'Kemarin';

      return {
        date,
        label,
        items: groups[date],
        total: groups[date].reduce((sum, i) => sum + (i.amount || 0), 0),
      };
    });
  }, [filteredIncomes, todayISO, yesterdayISO]);

  const handleOpenEdit = (rec: IncomeRecord) => {
    setEditingRecord(rec);
    setEditDate(rec.date);
    setEditAccountId(rec.affiliateAccountId);
    setEditAmountStr(rec.amount ? rec.amount.toLocaleString('id-ID') : '0');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      setSavingEdit(true);
      const targetAccount = accounts.find((a) => a.accountId === editAccountId);
      const cleanAmount = parseRupiahInput(editAmountStr);

      await updateIncomeRecord(editingRecord.transactionId, {
        date: editDate,
        amount: cleanAmount,
        affiliateAccountId: editAccountId,
        accountName: targetAccount ? targetAccount.accountName : editingRecord.accountName,
      });

      setEditingRecord(null);
    } catch (err) {
      console.error('Failed to update income:', err);
      alert('Gagal memperbarui data.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setDeleting(true);
      await deleteIncomeRecord(recordToDelete.transactionId);
      setRecordToDelete(null);
    } catch (err) {
      console.error('Failed to delete income:', err);
      alert('Gagal menghapus data.');
    } finally {
      setDeleting(false);
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
    <div className="space-y-4 pb-28 max-w-md mx-auto">
      {/* 1. Header with Title & Filter Pill Menu */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
          Riwayat Transaksi
        </h2>
        <div className="flex items-center gap-1.5">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Toko</option>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Segmented Pills */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setFilterPeriod('all')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            filterPeriod === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterPeriod('today')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            filterPeriod === 'today'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setFilterPeriod('yesterday')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            filterPeriod === 'yesterday'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Kemarin
        </button>
        <button
          onClick={() => setFilterPeriod('month')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition font-display ${
            filterPeriod === 'month'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Bulan Ini
        </button>
      </div>

      {/* 2. Grouped Transaction List */}
      {groupedByDate.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 shadow-2xs">
          Tidak ada riwayat transaksi pada periode ini.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Group Date Header */}
              <div className="flex items-center justify-between px-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-display">
                  {group.label}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white font-display">
                  +{formatRupiah(group.total)}
                </span>
              </div>

              {/* Transaction Cards */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
                {group.items.map((item) => {
                  const initials = getInitials(item.accountName);

                  return (
                    <div
                      key={item.transactionId}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition group"
                    >
                      {/* Left: Clean Monogram Badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-display font-bold text-xs text-slate-800 dark:text-slate-200 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-display">
                            {item.accountName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {item.day || 'TikTok Affiliate'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Positive Amount & Action Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-display">
                          +{formatRupiah(item.amount)}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRecordToDelete(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm font-display">Edit Data Penghasilan</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 font-display">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 font-display">
                  Akun Toko
                </label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 font-display">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editAmountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setEditAmountStr(clean ? parseInt(clean, 10).toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white font-display"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 font-display"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition font-display"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm font-display">Konfirmasi Hapus</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hapus catatan penghasilan <strong>{recordToDelete.accountName}</strong> sebesar{' '}
              <strong>{formatRupiah(recordToDelete.amount)}</strong> pada {formatIndonesianDate(recordToDelete.date)}?
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 font-display"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition font-display"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
