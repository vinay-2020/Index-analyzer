import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { Sun, Moon, Sparkles, Laptop, ChevronDown, Check } from 'lucide-react';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light Mode',
    sublabel: 'Crisp daylight institutional view',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    sublabel: 'Deep charcoal slate, low eye strain',
    icon: Moon,
  },
  {
    id: 'navy',
    label: 'Midnight Navy',
    sublabel: 'Bloomberg / Terminal quant aesthetic',
    icon: Sparkles,
    badge: 'Recommended',
  },
  {
    id: 'system',
    label: 'System Default',
    sublabel: 'Sync with operating system',
    icon: Laptop,
  },
];

export const ThemeSwitcher: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = THEME_OPTIONS.find((o) => o.id === theme) || THEME_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="theme-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors border border-slate-200/80 shadow-2xs"
        title="Switch color theme"
        aria-label="Switch color theme"
      >
        <CurrentIcon className={`w-3.5 h-3.5 ${
          theme === 'navy'
            ? 'text-indigo-400'
            : theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')
            ? 'text-amber-400'
            : 'text-amber-500'
        }`} />
        <span className="hidden sm:inline font-medium">
          {theme === 'navy' ? 'Midnight' : theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Appearance &amp; Theme
          </div>

          <div className="p-1 space-y-0.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`theme-option-${opt.id}`}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1 rounded-md ${
                      opt.id === 'navy'
                        ? 'bg-slate-900 text-indigo-400'
                        : opt.id === 'dark'
                        ? 'bg-slate-800 text-amber-300'
                        : opt.id === 'light'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-800">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-tight">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                        {opt.sublabel}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
