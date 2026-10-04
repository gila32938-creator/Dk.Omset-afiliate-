import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AffiliateAccount, IncomeRecord } from '../types/index.ts';
import {
  addAffiliateAccount,
  updateAffiliateAccount,
  deleteAffiliateAccount,
  deleteAllUserData,
  restoreUserData,
} from '../services/affiliateService.ts';
import { toISODateString } from '../utils/dateUtils.ts';
import {
  User,
  Layers,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  PowerOff,
  Power,
} from 'lucide-react';

interface SettingsViewProps {
  accounts: AffiliateAccount[];
  incomes: IncomeRecord[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ accounts, incomes }) => {
  const { currentUser, theme, setTheme, logout } = useAuth();

  // Add Account State
  const [newAccountName, setNewAccountName] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Edit Account State
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  // Delete Account Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<AffiliateAccount | null>(null);

  // Delete All Data State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Backup & Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !currentUser) return;
    try {
      const maxOrder = accounts.reduce((max, a) => Math.max(max, a.order || 0), 0);
      await addAffiliateAccount(currentUser.uid, newAccountName.trim(), maxOrder + 1);
      setNewAccountName('');
      setIsAddingAccount(false);
    } catch (err) {
      console.error('Failed to add account:', err);
      alert('Gagal menambahkan akun affiliate.');
    }
  };

  const handleStartEdit = (acc: AffiliateAccount) => {
    setEditingAccountId(acc.accountId);
    setEditNameValue(acc.accountName);
  };

  const handleSaveEdit = async (accountId: string) => {
    if (!editNameValue.trim()) return;
    try {
      await updateAffiliateAccount(accountId, { accountName: editNameValue.trim() });
      setEditingAccountId(null);
    } catch (err) {
      console.error('Failed to update account:', err);
      alert('Gagal mengubah nama akun.');
    }
  };

  const handleToggleActive = async (acc: AffiliateAccount) => {
    try {
      await updateAffiliateAccount(acc.accountId, { active: !acc.active });
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Gagal mengubah status akun.');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const currentAcc = accounts[index];
    const swapAcc = accounts[targetIndex];

    try {
      const tempOrder = currentAcc.order;
      await updateAffiliateAccount(currentAcc.accountId, { order: swapAcc.order });
      await updateAffiliateAccount(swapAcc.accountId, { order: tempOrder });
    } catch (err) {
      console.error('Failed to reorder accounts:', err);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await deleteAffiliateAccount(accountToDelete.accountId);
      setAccountToDelete(null);
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Gagal menghapus akun.');
    }
  };

  // EXPORT JSON
  const handleExportJSON = () => {
    const backupData = {
      appName: 'DK AFFILIATE MANAGER PRO',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        email: currentUser?.email,
        userId: currentUser?.uid,
      },
      accounts,
      incomes,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dk-affiliate-backup-${toISODateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'Hari', 'Bulan', 'Tahun', 'Nama Akun', 'ID Akun', 'Penghasilan Kotor (IDR)'];
    const rows = incomes.map((i) => [
      i.transactionId,
      i.date,
      i.day,
      i.month,
      i.year,
      `"${i.accountName.replace(/"/g, '""')}"`,
      i.affiliateAccountId,
      i.amount || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dk-affiliate-transaksi-${toISODateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORT JSON (RESTORE)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setRestoreStatus('Sedang memverifikasi struktur file arsip...');
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.accounts && !parsed.incomes) {
        throw new Error('Format file backup tidak valid.');
      }

      setRestoreStatus('Memulihkan entitas akun & transaksi ke database...');
      const result = await restoreUserData(currentUser.uid, parsed);
      setRestoreStatus(
        `Sukses memulihkan ${result.accountsRestored} entitas akun dan ${result.incomesRestored} baris transaksi kas!`
      );
      setTimeout(() => setRestoreStatus(null), 5000);
    } catch (err: any) {
      console.error('Restore error:', err);
      alert('Gagal memulihkan data: ' + (err?.message || 'File tidak valid'));
      setRestoreStatus(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // DELETE ALL USER DATA
  const handleDeleteAll = async () => {
    if (deleteConfirmationText !== 'HAPUS SEMUA' || !currentUser) return;
    try {
      setIsDeletingAll(true);
      await deleteAllUserData(currentUser.uid);
      setShowDeleteAllModal(false);
      setDeleteConfirmationText('');
      alert('Seluruh data transaksi dan entitas akun telah dibersihkan dari database.');
    } catch (err) {
      console.error('Failed to delete all data:', err);
      alert('Gagal membersihkan database.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-md mx-auto">
      {/* 1. PROFIL PENGGUNA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-slate-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-display">
            Profil Pengguna
          </h2>
        </div>

        <div className="space-y-2 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              Email Terdaftar
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {currentUser?.email || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              Status Database
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tersambung Cloud Firestore (Terisolasi per User ID)
            </span>
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN TEMA (Terang, Gelap, Sistem) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-display">
              Tema Tampilan
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium capitalize">
            {theme === 'system' ? 'Otomatis' : theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-3 px-2 rounded-2xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
              theme === 'light'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="font-display">Terang</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-3 px-2 rounded-2xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
              theme === 'dark'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="font-display">Gelap</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`py-3 px-2 rounded-2xl border text-center text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
              theme === 'system'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span className="font-display">Sistem</span>
          </button>
        </div>
      </div>

      {/* 3. KELOLA AKUN AFFILIATE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-display">
              Akun Toko Affiliate ({accounts.length})
            </h2>
          </div>
          <button
            onClick={() => setIsAddingAccount(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-2xs hover:opacity-90 transition font-display"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Add Account Inline Form */}
        {isAddingAccount && (
          <form
            onSubmit={handleAddAccount}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-white font-display">
                Nama Toko / Akun Baru
              </span>
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              required
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Contoh: Akun Baru TikTok"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-medium"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 font-display"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold font-display"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Account List */}
        <div className="space-y-2">
          {accounts.map((acc, index) => {
            const isEditing = editingAccountId === acc.accountId;
            return (
              <div
                key={acc.accountId}
                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 text-xs sm:text-sm ${
                  acc.active
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800/80 opacity-60'
                }`}
              >
                {/* Left: Reorder & Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={index === accounts.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white flex-1 min-w-0 font-medium"
                      />
                      <button
                        onClick={() => handleSaveEdit(acc.accountId)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingAccountId(null)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate font-display">
                        {acc.accountName}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {acc.active ? 'Status: Aktif' : 'Status: Dinonaktifkan'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleActive(acc)}
                      className={`p-1.5 rounded-lg transition ${
                        acc.active
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                      title={acc.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                    >
                      {acc.active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
                      title="Edit nama"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setAccountToDelete(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Hapus akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BACKUP & RESTORE DATA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800 font-display">
          Backup & Ekspor Data
        </h2>

        {restoreStatus && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {restoreStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleExportJSON}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition"
          >
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white font-display">
                Backup JSON
              </span>
              <span className="text-[10px] text-slate-400">Semua Data</span>
            </div>
            <Download className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition"
          >
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white font-display">
                Restore JSON
              </span>
              <span className="text-[10px] text-slate-400">Pulihkan File</span>
            </div>
            <Upload className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleExportCSV}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-left transition"
          >
            <div>
              <span className="block text-xs font-bold text-slate-900 dark:text-white font-display">
                Ekspor CSV
              </span>
              <span className="text-[10px] text-slate-400">Excel / Spreadsheet</span>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* 5. KEAMANAN & AKUN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-3 transition-colors">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800 font-display">
          Keamanan & Akun
        </h2>

        <div className="space-y-2">
          <button
            onClick={logout}
            className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition font-display"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun (Logout)</span>
          </button>

          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="w-full p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition font-display"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Seluruh Data Buku Kas</span>
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI HAPUS AKUN TERTENTU */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                Hapus Toko Affiliate?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Anda yakin ingin menghapus akun <strong>{accountToDelete.accountName}</strong>?
            </p>
            <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              *Saran: Gunakan <strong>Nonaktifkan</strong> agar riwayat omset masa lalu toko ini tetap aman dalam laporan.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 font-display"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition font-display"
              >
                Konfirmasi Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI KERAS HAPUS SELURUH DATA */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm font-display">
                Konfirmasi Hapus Seluruh Data
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tindakan ini akan <strong>menghapus permanen</strong> seluruh data omset dan toko affiliate Anda dari database.
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3">
              Ketik <span className="font-mono font-bold text-red-600 dark:text-red-400">HAPUS SEMUA</span> untuk melanjutkan:
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="HAPUS SEMUA"
              className="mt-2 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase"
            />

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 font-display"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'HAPUS SEMUA' || isDeletingAll}
                onClick={handleDeleteAll}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-xs font-bold text-white transition font-display"
              >
                {isDeletingAll ? 'Membersihkan...' : 'Hapus Seluruh Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
