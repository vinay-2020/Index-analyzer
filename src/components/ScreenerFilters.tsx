import React from 'react';
import { ScreenerFilterState } from '../types';
import { Search, Filter, RefreshCw, X } from 'lucide-react';

interface Props {
  filters: ScreenerFilterState;
  onFilterChange: (filters: ScreenerFilterState) => void;
  categories: string[];
  totalIndices: number;
  filteredCount: number;
  onReset: () => void;
}

export const ScreenerFilters: React.FC<Props> = ({
  filters,
  onFilterChange,
  categories,
  totalIndices,
  filteredCount,
  onReset,
}) => {
  return (
    <div id="screener-filters-bar" className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="filter-search-input"
            type="text"
            placeholder="Search index name, symbol, or sector (e.g. NIFTY AUTO)..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quant Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Preset:</span>

          <button
            id="preset-btn-all"
            onClick={() => onFilterChange({ ...filters, preset: 'ALL', macdCrossFilter: 'ALL' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filters.preset === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({totalIndices})
          </button>

          <button
            id="preset-btn-macd"
            onClick={() =>
              onFilterChange({
                ...filters,
                preset: 'MACD_BULLISH',
                macdCrossFilter: 'BULLISH',
              })
            }
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filters.preset === 'MACD_BULLISH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            MACD Bullish
          </button>

          <button
            id="preset-btn-pullback"
            onClick={() =>
              onFilterChange({
                ...filters,
                preset: 'HEALTHY_PULLBACK',
                minRsi: 45,
                maxRsi: 60,
              })
            }
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filters.preset === 'HEALTHY_PULLBACK'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Healthy Pullback (RSI 45-60)
          </button>

          <button
            id="preset-btn-200ema"
            onClick={() => onFilterChange({ ...filters, preset: 'ABOVE_200_EMA' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filters.preset === 'ABOVE_200_EMA'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            &gt; 200 EMA
          </button>
        </div>

        {/* Category Filter & Reset */}
        <div className="flex items-center gap-2">
          <select
            id="filter-category-select"
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            id="filter-reset-btn"
            onClick={onReset}
            title="Reset filters"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <div className="text-xs text-slate-500 font-mono whitespace-nowrap">
            Showing <strong className="text-slate-800">{filteredCount}</strong>/{totalIndices}
          </div>
        </div>
      </div>
    </div>
  );
};
