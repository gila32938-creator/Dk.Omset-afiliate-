export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: string;
}

export interface AffiliateAccount {
  accountId: string;
  userId: string;
  accountName: string;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  transactionId: string;
  userId: string;
  affiliateAccountId: string;
  accountName: string;
  date: string; // YYYY-MM-DD
  day: string; // "Senin", "Selasa", etc.
  month: string; // "YYYY-MM" e.g. "2026-10"
  year: number; // 2026
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  amount: number; // in IDR
  createdAt: string;
  updatedAt: string;
}

export type TabType = 'beranda' | 'input' | 'laporan' | 'riwayat' | 'pengaturan';

export type ReportPeriodType = 'harian' | 'mingguan' | 'bulanan';

export interface DayAccountSummary {
  accountId: string;
  accountName: string;
  amount: number;
}
