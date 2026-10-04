/**
 * Utilities for Dates, Timezone (Asia/Jakarta / WIB), and Indonesian Currency Formatting
 */

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Returns a Date object adjusted to Asia/Jakarta (WIB)
 */
export function getJakartaDate(date: Date = new Date()): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  // Jakarta is UTC+7
  return new Date(utc + (3600000 * 7));
}

/**
 * Formats a Date or date string to YYYY-MM-DD
 */
export function toISODateString(dateInput?: Date | string): string {
  let d: Date;
  if (!dateInput) {
    d = getJakartaDate();
  } else if (typeof dateInput === 'string') {
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
    d = new Date(dateInput);
  } else {
    d = dateInput;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a localized Date
 */
export function parseISODate(isoString: string): Date {
  const parts = isoString.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Full Indonesian formatted date: e.g. "Jumat, 2 Oktober 2026"
 */
export function formatFullIndonesianDate(isoString: string): string {
  const d = parseISODate(isoString);
  const dayName = INDONESIAN_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Medium Indonesian formatted date: e.g. "2 Oktober 2026"
 */
export function formatIndonesianDate(isoString: string): string {
  const d = parseISODate(isoString);
  const dayNum = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dayNum} ${monthName} ${year}`;
}

/**
 * Month Year title: e.g. "Oktober 2026"
 */
export function formatMonthYear(yearMonth: string): string {
  // yearMonth format: "YYYY-MM"
  const [year, month] = yearMonth.split('-').map(Number);
  const monthName = INDONESIAN_MONTHS[month - 1];
  return `${monthName} ${year}`;
}

/**
 * Get Indonesian day name from ISO string
 */
export function getIndonesianDayName(isoString: string): string {
  const d = parseISODate(isoString);
  return INDONESIAN_DAYS[d.getDay()];
}

/**
 * Calculate Monday to Sunday week range for any given ISO date
 */
export function getWeekRange(isoString: string): { start: string; end: string } {
  const date = parseISODate(isoString);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  // In Monday-Sunday week: Monday is day 1, Sunday is day 7
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: toISODateString(monday),
    end: toISODateString(sunday),
  };
}

/**
 * Calculate weekly segments for a specific month (e.g. "2026-09" or "2026-10")
 */
export interface MonthWeekSegment {
  weekNumber: number;
  label: string; // e.g. "Minggu 1"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodLabel: string; // e.g. "1 Sep - 7 Sep"
}

export function getMonthWeeklyBreakdown(yearMonth: string): MonthWeekSegment[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  
  const segments: MonthWeekSegment[] = [];
  let currentStartDay = 1;
  let weekIndex = 1;

  while (currentStartDay <= lastDay) {
    const currentEndDay = Math.min(currentStartDay + 6, lastDay);
    const startStr = `${year}-${String(month).padStart(2, '0')}-${String(currentStartDay).padStart(2, '0')}`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(currentEndDay).padStart(2, '0')}`;
    
    const monthShort = INDONESIAN_MONTHS[month - 1].slice(0, 3);
    const periodLabel = `${currentStartDay} ${monthShort} – ${currentEndDay} ${monthShort}`;

    segments.push({
      weekNumber: weekIndex,
      label: `Minggu ${weekIndex}`,
      startDate: startStr,
      endDate: endStr,
      periodLabel,
    });

    currentStartDay += 7;
    weekIndex++;
  }

  return segments;
}

/**
 * Currency formatter: 50000 -> "Rp50.000", 0 -> "Rp0"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }
  const clean = Math.round(amount);
  const formatted = clean.toLocaleString('id-ID');
  return `Rp${formatted}`;
}

/**
 * Parse input string or number to clean positive integer Rupiah
 */
export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.floor(value));
  }
  if (!value) return 0;
  // Remove non-digit characters
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return 0;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}
