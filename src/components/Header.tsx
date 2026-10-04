import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { formatFullIndonesianDate, toISODateString } from '../utils/dateUtils.ts';
import { Sun, Moon, Calendar, PenLine } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  onOpenAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAssistant }) => {
  const { currentUser, userProfile, theme, setTheme } = useAuth();
  const todayISO = toISODateString();
  const formattedToday = formatFullIndonesianDate(todayISO);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Professional Modern Fintech Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Clean Solid Monogram Mark (No AI gradients, no dot matrix) */}
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-display font-black text-sm tracking-tight shrink-0 shadow-xs select-none">
            DK
          </div>

          {/* Brand Name & Actual Indonesian System Date */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-[13px] tracking-tight text-slate-900 dark:text-white uppercase truncate">
                DK AFFILIATE
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded font-mono tracking-wider">
                PRO
              </span>
            </div>

            {/* Dynamic System Date - Rule 7 */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{formattedToday}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Theme Toggle (Terang / Gelap - Direct One-Tap Access) */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-95"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle Tema"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <PWAInstallButton compact />

          {/* Quick Input Shortcut Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95"
            title="Catat Cepat Omset"
          >
            <PenLine className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
            <span className="text-xs font-semibold font-display hidden xs:inline">Catat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
