import React, { useState } from 'react';
import { AffiliateAccount, IncomeRecord, TabType } from '../types/index.ts';
import {
  formatFullIndonesianDate,
  formatIndonesianDate,
  formatMonthYear,
  formatRupiah,
  getIndonesianDayName,
  getWeekRange,
  toISODateString,
} from '../utils/dateUtils.ts';
import { saveDailyIncomes } from '../services/affiliateService.ts';
import {
  ReceiptText,
  Calculator,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface AIAssistantModalProps {
  userId: string;
  accounts: AffiliateAccount[];
  incomes: IncomeRecord[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: TabType) => void;
  onSuccessSave: (date: string, total: number) => void;
}

interface ParsedResponse {
  action: 'RECORD_INCOME' | 'CORRECT_INCOME' | 'ADD_INCOME' | 'QUERY_REKAP' | 'PROMPT_REKAP_OPTIONS' | 'UNKNOWN';
  targetDate?: string;
  items?: {
    accountId: string;
    accountName: string;
    amount: number;
    mode?: 'set' | 'add';
  }[];
  queryType?: 'daily' | 'weekly' | 'monthly' | 'all_time' | 'account_specific';
  queryPeriod?: {
    month?: string;
    week?: string;
    targetAccountName?: string;
  };
  explanation: string;
  confidence?: number;
}

const EXAMPLE_PROMPTS = [
  'Catat hari ini DK 50 ribu, Velora 30 ribu, Nana 20 ribu',
  'Koreksi DK hari ini jadi 75 ribu',
  'Rekap hari ini',
  'Rekap minggu ini',
  'Rekap bulan ini',
  'Rekap',
  'Berapa total semua akun?',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  userId,
  accounts,
  incomes,
  isOpen,
  onClose,
  onNavigateToTab,
  onSuccessSave,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayISO = toISODateString();

  const handleSendPrompt = async (textToSend?: string) => {
    const text = (textToSend || prompt).trim();
    if (!text) return;

    try {
      setLoading(true);
      setError(null);
      setParsedResult(null);
      setSavedSuccessMsg(null);

      const res = await fetch('/api/gemini/parse-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          accounts: accounts.map((a) => ({
            accountId: a.accountId,
            accountName: a.accountName,
            active: a.active,
          })),
          currentDate: todayISO,
          currentDayName: getIndonesianDayName(todayISO),
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses instruksi finansial.');
      }

      const data: ParsedResponse = await res.json();
      setParsedResult(data);
    } catch (err: any) {
      console.error('NLP command error:', err);
      setError(err?.message || 'Terjadi gangguan saat memvalidasi instruksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedResult || !parsedResult.items) return;

    try {
      setLoading(true);
      const targetDate = parsedResult.targetDate || todayISO;

      const existingForDate = incomes.filter((i) => i.date === targetDate);

      const entries = accounts.filter((a) => a.active).map((acc) => {
        const item = parsedResult.items?.find(
          (it) => it.accountId === acc.accountId || it.accountName.toLowerCase() === acc.accountName.toLowerCase()
        );

        if (item) {
          if (item.mode === 'add') {
            const currentAmount = existingForDate.find((e) => e.affiliateAccountId === acc.accountId)?.amount || 0;
            return {
              accountId: acc.accountId,
              accountName: acc.accountName,
              amount: currentAmount + item.amount,
            };
          }
          return {
            accountId: acc.accountId,
            accountName: acc.accountName,
            amount: item.amount,
          };
        }

        const existingRec = existingForDate.find((e) => e.affiliateAccountId === acc.accountId);
        if (parsedResult.action === 'CORRECT_INCOME' && existingRec) {
          return {
            accountId: acc.accountId,
            accountName: acc.accountName,
            amount: existingRec.amount,
          };
        }

        return {
          accountId: acc.accountId,
          accountName: acc.accountName,
          amount: 0,
        };
      });

      await saveDailyIncomes(userId, targetDate, entries);

      const total = entries.reduce((s, e) => s + e.amount, 0);
      setSavedSuccessMsg(`Sukses membukukan transaksi untuk tanggal ${formatIndonesianDate(targetDate)}! Total: ${formatRupiah(total)}`);
      onSuccessSave(targetDate, total);
      setParsedResult(null);
      setPrompt('');
    } catch (err: any) {
      console.error('Failed to commit command:', err);
      setError('Gagal membukukan transaksi ke database.');
    } finally {
      setLoading(false);
    }
  };

  const renderQueryAnswer = (res: ParsedResponse) => {
    let answerText = '';
    let totalFound = 0;

    if (res.queryType === 'daily') {
      const qDate = res.targetDate || todayISO;
      const recs = incomes.filter((i) => i.date === qDate);
      totalFound = recs.reduce((s, i) => s + (i.amount || 0), 0);
      answerText = `Penghasilan ${formatFullIndonesianDate(qDate)}: ${formatRupiah(totalFound)}`;
    } else if (res.queryType === 'weekly') {
      const targetWeek = getWeekRange(res.targetDate || todayISO);
      const recs = incomes.filter((i) => i.date >= targetWeek.start && i.date <= targetWeek.end);
      totalFound = recs.reduce((s, i) => s + (i.amount || 0), 0);
      answerText = `Penghasilan Mingguan (${formatIndonesianDate(targetWeek.start)} – ${formatIndonesianDate(targetWeek.end)}): ${formatRupiah(totalFound)}`;
    } else if (res.queryType === 'monthly') {
      const monthPrefix = res.queryPeriod?.month || todayISO.slice(0, 7);
      const recs = incomes.filter((i) => i.date.startsWith(monthPrefix));
      totalFound = recs.reduce((s, i) => s + (i.amount || 0), 0);
      answerText = `Penghasilan Bulan ${formatMonthYear(monthPrefix)}: ${formatRupiah(totalFound)}`;
    } else if (res.queryType === 'all_time') {
      totalFound = incomes.reduce((s, i) => s + (i.amount || 0), 0);
      answerText = `Total Penghasilan Keseluruhan Sejak Awal: ${formatRupiah(totalFound)}`;
    }

    return (
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Hasil Rekapitulasi Buku Kas:</p>
        <p className="text-base sm:text-lg font-mono font-bold text-emerald-400">
          {answerText}
        </p>
        <button
          onClick={() => {
            onNavigateToTab('laporan');
            onClose();
          }}
          className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1 mt-2"
        >
          <span>Buka Laporan Keuangan Terinci</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white font-display">
                Entri Cepat & Ledger Otomatis
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Sistem Input Cepat Berbasis Teks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {savedSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/50 flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* Quick Example Chips */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
              Pintasan Perintah Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(ex);
                    handleSendPrompt(ex);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition text-left font-mono"
                >
                  &gt; {ex}
                </button>
              ))}
            </div>
          </div>

          {/* PARSED RESULT CARD */}
          {parsedResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Verifikasi Instruksi
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {parsedResult.action}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {parsedResult.explanation}
              </p>

              {/* ACTION: RECORD / CORRECT / ADD */}
              {(parsedResult.action === 'RECORD_INCOME' ||
                parsedResult.action === 'CORRECT_INCOME' ||
                parsedResult.action === 'ADD_INCOME') &&
                parsedResult.items && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Jurnal yang akan dibukukan ({formatIndonesianDate(parsedResult.targetDate || todayISO)}):
                    </span>
                    <div className="space-y-1.5">
                      {parsedResult.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                        >
                          <span className="font-semibold text-slate-200">
                            {item.accountName}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {item.mode === 'add' ? `+${formatRupiah(item.amount)}` : formatRupiah(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleConfirmSave}
                      disabled={loading}
                      className="w-full mt-3 py-2.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {loading ? 'Memvalidasi...' : 'Bukukan ke Database Cloud'}
                    </button>
                  </div>
                )}

              {/* ACTION: QUERY_REKAP */}
              {parsedResult.action === 'QUERY_REKAP' && renderQueryAnswer(parsedResult)}

              {/* ACTION: PROMPT_REKAP_OPTIONS (Rule 32) */}
              {parsedResult.action === 'PROMPT_REKAP_OPTIONS' && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Pilih format laporan yang ingin dimuat:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => {
                        onNavigateToTab('laporan');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-left transition text-slate-200"
                    >
                      1. Laporan Harian
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToTab('laporan');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-left transition text-slate-200"
                    >
                      2. Laporan Mingguan
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToTab('laporan');
                        onClose();
                      }}
                      className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-left transition text-slate-200"
                    >
                      3. Laporan Bulanan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instruksi: Catat hari ini DK 50 ribu, Velora 30 ribu..."
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 rounded-lg bg-slate-100 hover:bg-white text-slate-950 disabled:opacity-30 shadow-xs transition shrink-0"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
