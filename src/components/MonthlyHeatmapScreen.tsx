import React, { useState, useMemo } from 'react';
import { IndexDataRow, HeatmapPeriod, IndexMonthlySeasonality, MonthlyCellStats } from '../types';
import { SAMPLE_FYERS_INDICES } from '../defaultData';
import {
  computeIndexSeasonality,
  computeMarketMonthlySeasonality,
  computeDatasetQuality,
  MONTH_SHORT_NAMES,
  MONTH_FULL_NAMES,
} from '../monthlyHeatmapData';
import { MonthlyCellDrilldownModal } from './MonthlyCellDrilldownModal';
import { MarketSeasonalityChart } from './MarketSeasonalityChart';
import { MonthlyRankingView } from './MonthlyRankingView';
import { IndexSeasonalDeepDive } from './IndexSeasonalDeepDive';
import {
  Calendar,
  Grid,
  Trophy,
  BarChart3,
  Search,
  SlidersHorizontal,
  Info,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

type SortColumn =
  | 'name'
  | 'm1'
  | 'm2'
  | 'm3'
  | 'm4'
  | 'm5'
  | 'm6'
  | 'm7'
  | 'm8'
  | 'm9'
  | 'm10'
  | 'm11'
  | 'm12'
  | 'bestMonth'
  | 'worstMonth'
  | 'winRate';

type SortDirection = 'asc' | 'desc';

interface MonthlyHeatmapScreenProps {
  indices?: IndexDataRow[];
}

export const MonthlyHeatmapScreen: React.FC<MonthlyHeatmapScreenProps> = ({ indices }) => {
  // Navigation sub-views inside the Heatmap module
  const [subView, setSubView] = useState<'matrix' | 'market' | 'rankings' | 'deepdive'>('matrix');

  // Filters & State
  const [selectedPeriod, setSelectedPeriod] = useState<HeatmapPeriod>('15Y');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

  // Sorting State for Heatmap Matrix
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selected Index for Deep Dive view synchronization
  const [selectedDeepDiveSymbol, setSelectedDeepDiveSymbol] = useState<string>('NSE:NIFTY50-INDEX');

  // Drill-down Modal State
  const [activeModalProfile, setActiveModalProfile] = useState<IndexMonthlySeasonality | null>(null);
  const [activeModalStats, setActiveModalStats] = useState<MonthlyCellStats | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Compute seasonality profiles for all indices based on selected period
  const indexProfiles: IndexMonthlySeasonality[] = useMemo(() => {
    const rawList = indices && indices.length > 0 ? indices : SAMPLE_FYERS_INDICES;

    return rawList.map((item) => {
      // Find matching index details
      const defaultMatch = SAMPLE_FYERS_INDICES.find((s) => s.symbol === item.symbol);
      const inception = (item.rawRecord && item.rawRecord.inception) || '2010-12-31';

      return computeIndexSeasonality(
        item.symbol,
        item.name,
        item.category,
        inception,
        selectedPeriod,
        undefined,
        item.close
      );
    });
  }, [indices, selectedPeriod]);

  // Market Seasonality composite
  const marketSeasonality = useMemo(() => {
    return computeMarketMonthlySeasonality(indexProfiles);
  }, [indexProfiles]);

  // Dataset quality summary
  const datasetQuality = useMemo(() => {
    return computeDatasetQuality(indexProfiles, selectedPeriod, 'FYERS_HIST_DATA.csv');
  }, [indexProfiles, selectedPeriod]);

  // Filtered profiles for matrix view
  const filteredProfiles = useMemo(() => {
    return indexProfiles.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || p.category.toUpperCase() === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [indexProfiles, searchQuery, categoryFilter]);

  // Sort handler for Heatmap Matrix columns
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      // For name, default asc (A-Z); for numerical returns / win rates, default desc (highest first)
      if (col === 'name') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  // Sort and filter profiles for matrix view
  const sortedProfiles = useMemo(() => {
    const list = [...filteredProfiles];
    list.sort((a, b) => {
      let diff = 0;
      if (sortColumn === 'name') {
        diff = a.name.localeCompare(b.name);
      } else if (sortColumn.startsWith('m')) {
        const mNum = parseInt(sortColumn.replace('m', ''), 10);
        const valA = a.months[mNum]?.avgReturn ?? -9999;
        const valB = b.months[mNum]?.avgReturn ?? -9999;
        diff = valA - valB;
      } else if (sortColumn === 'bestMonth') {
        // Sort based on the underlying monthly average return associated with that month
        diff = a.bestMonth.avgReturn - b.bestMonth.avgReturn;
      } else if (sortColumn === 'worstMonth') {
        // Sort based on the underlying monthly average return associated with that month
        diff = a.worstMonth.avgReturn - b.worstMonth.avgReturn;
      } else if (sortColumn === 'winRate') {
        diff = a.periodSummary.winRatePct - b.periodSummary.winRatePct;
      }
      return sortDirection === 'asc' ? diff : -diff;
    });
    return list;
  }, [filteredProfiles, sortColumn, sortDirection]);

  // Navigate directly to Deep Dive with selected index
  const handleOpenDeepDive = (symbol: string) => {
    setSelectedDeepDiveSymbol(symbol);
    setSubView('deepdive');
  };

  // Cell click handler
  const handleCellClick = (profile: IndexMonthlySeasonality, stats: MonthlyCellStats) => {
    setActiveModalProfile(profile);
    setActiveModalStats(stats);
    setIsDrilldownOpen(true);
  };

  // Helper for matrix cell color
  const getCellVisual = (val: number, isInsufficient: boolean) => {
    if (isInsufficient) {
      return 'bg-slate-100/80 text-slate-400 border border-dashed border-slate-300 font-normal';
    }
    if (val >= 3.0) return 'bg-emerald-600 text-white font-bold shadow-xs';
    if (val >= 1.5) return 'bg-emerald-500 text-white font-semibold';
    if (val >= 0.05) return 'bg-emerald-100 text-emerald-950 font-medium';
    if (val <= -3.0) return 'bg-rose-600 text-white font-bold shadow-xs';
    if (val <= -1.5) return 'bg-rose-500 text-white font-semibold';
    if (val < -0.05) return 'bg-rose-100 text-rose-950 font-medium';
    return 'bg-slate-100 text-slate-700 font-normal';
  };

  return (
    <div id="monthly-heatmap-module" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                INDEPENDENT MODULE
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Source: FYERS_HIST_DATA.csv
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
              <span>Indices Monthly Heatmap</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {indexProfiles.length} INDICES
              </span>
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Empirical historical monthly seasonality across the 40+ HMIE index universe. Examine calendar-month tendencies, identify consistent patterns, and drill down into year-by-year distributions.
            </p>
          </div>

          {/* Sub-View Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start lg:self-auto shrink-0">
            <button
              id="tab-heatmap-matrix"
              onClick={() => setSubView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subView === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Heatmap Matrix
            </button>
            <button
              id="tab-market-seasonality"
              onClick={() => setSubView('market')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subView === 'market'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Market Seasonality
            </button>
            <button
              id="tab-monthly-rankings"
              onClick={() => setSubView('rankings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subView === 'rankings'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Rankings
            </button>
            <button
              id="tab-index-deepdive"
              onClick={() => setSubView('deepdive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                subView === 'deepdive'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Index Deep Dive
            </button>
          </div>
        </div>

        {/* Control Toolbar: Period & Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-700 shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Period:
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              {(['15Y', '10Y', '5Y', '3Y', 'MAX'] as HeatmapPeriod[]).map((period) => (
                <button
                  key={period}
                  id={`period-btn-${period}`}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedPeriod === period
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period === '15Y'
                    ? '15 Years'
                    : period === '10Y'
                    ? '10 Years'
                    : period === '5Y'
                    ? '5 Years'
                    : period === '3Y'
                    ? '3 Years'
                    : 'Max Available'}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter index name or symbol..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
              {['ALL', 'BROAD', 'SECTORAL', 'STRATEGY', 'THEMATIC'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md shrink-0 transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMethodologyModal(true)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1 shrink-0"
              title="View Data Quality & Methodology Details"
            >
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Methodology</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view Rendering */}
      {subView === 'market' && (
        <MarketSeasonalityChart seasonalityData={marketSeasonality} />
      )}

      {subView === 'rankings' && (
        <MonthlyRankingView
          profiles={indexProfiles}
          selectedPeriod={selectedPeriod}
          onSelectCell={handleCellClick}
        />
      )}

      {subView === 'deepdive' && (
        <IndexSeasonalDeepDive
          profiles={indexProfiles}
          selectedPeriod={selectedPeriod}
          onSelectCell={handleCellClick}
          selectedSymbol={selectedDeepDiveSymbol}
          onSelectSymbol={setSelectedDeepDiveSymbol}
        />
      )}

      {subView === 'matrix' && (
        <div className="space-y-4">
          {/* Heatmap Legend & Sort Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">Diverging Scale:</span>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold">&lt; -3%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500 text-white font-semibold">-1.5%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-950 font-medium">-0.5%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">0%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-950 font-medium">+0.5%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-semibold">+1.5%</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-bold">&gt; +3%</span>
              </div>
              <span className="text-slate-400 text-[11px] ml-1">
                (Click any cell for monthly drilldown)
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-600 text-xs flex-wrap">
              {/* Active Sort Status & Reset */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                <span className="text-[11px] text-slate-500">Sorted by:</span>
                <strong className="text-[11px] text-indigo-700 font-semibold">
                  {sortColumn === 'name'
                    ? 'Index Universe'
                    : sortColumn === 'bestMonth'
                    ? 'Best Month'
                    : sortColumn === 'worstMonth'
                    ? 'Worst Month'
                    : sortColumn === 'winRate'
                    ? 'Win Rate'
                    : sortColumn.startsWith('m')
                    ? MONTH_SHORT_NAMES[parseInt(sortColumn.replace('m', ''), 10) - 1]
                    : sortColumn}
                </strong>
                <span className="text-[10px] text-slate-400 uppercase">
                  ({sortDirection})
                </span>
                {(sortColumn !== 'name' || sortDirection !== 'asc') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortColumn('name');
                      setSortDirection('asc');
                    }}
                    className="ml-1 text-[10px] text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                Showing {sortedProfiles.length} of {indexProfiles.length} Indices
              </span>
            </div>
          </div>

          {/* Primary Heatmap Matrix Table with Sortable Columns */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    {/* Index Universe Header */}
                    <th
                      scope="col"
                      onClick={() => handleSort('name')}
                      className={`py-3 px-4 text-left min-w-[210px] sticky left-0 z-20 cursor-pointer select-none transition-colors group ${
                        sortColumn === 'name'
                          ? 'bg-indigo-50/90 text-indigo-900 border-b-2 border-indigo-600 font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                      }`}
                      title="Click to sort by Index Universe name"
                    >
                      <div className="flex items-center justify-between">
                        <span>Index Universe</span>
                        <span className="shrink-0 ml-1">
                          {sortColumn !== 'name' && (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                          )}
                          {sortColumn === 'name' && sortDirection === 'asc' && (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {sortColumn === 'name' && sortDirection === 'desc' && (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </span>
                      </div>
                    </th>

                    {/* Jan through Dec Monthly Columns */}
                    {MONTH_SHORT_NAMES.map((m, idx) => {
                      const mNum = idx + 1;
                      const colKey = `m${mNum}` as SortColumn;
                      const isActive = sortColumn === colKey;

                      return (
                        <th
                          key={m}
                          scope="col"
                          onClick={() => handleSort(colKey)}
                          className={`py-3 px-1 w-16 uppercase tracking-wider cursor-pointer select-none transition-colors group ${
                            isActive
                              ? 'bg-indigo-50/90 text-indigo-900 border-b-2 border-indigo-600 font-bold'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                          }`}
                          title={`Click to sort by ${m} average return`}
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>{m}</span>
                            <span className="shrink-0">
                              {!isActive && (
                                <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600" />
                              )}
                              {isActive && sortDirection === 'asc' && (
                                <ArrowUp className="w-3 h-3 text-indigo-600" />
                              )}
                              {isActive && sortDirection === 'desc' && (
                                <ArrowDown className="w-3 h-3 text-indigo-600" />
                              )}
                            </span>
                          </div>
                        </th>
                      );
                    })}

                    {/* Best Month Header */}
                    <th
                      scope="col"
                      onClick={() => handleSort('bestMonth')}
                      className={`py-3 px-2 text-right w-28 cursor-pointer select-none transition-colors group ${
                        sortColumn === 'bestMonth'
                          ? 'bg-indigo-50/90 text-indigo-900 border-b-2 border-indigo-600 font-bold'
                          : 'bg-slate-50 text-emerald-800 hover:bg-slate-100 hover:text-emerald-900 font-semibold'
                      }`}
                      title="Click to sort by Best Month return value"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Best Month</span>
                        <span className="shrink-0">
                          {sortColumn !== 'bestMonth' && (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                          {sortColumn === 'bestMonth' && sortDirection === 'asc' && (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {sortColumn === 'bestMonth' && sortDirection === 'desc' && (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </span>
                      </div>
                    </th>

                    {/* Worst Month Header */}
                    <th
                      scope="col"
                      onClick={() => handleSort('worstMonth')}
                      className={`py-3 px-2 text-right w-28 cursor-pointer select-none transition-colors group ${
                        sortColumn === 'worstMonth'
                          ? 'bg-indigo-50/90 text-indigo-900 border-b-2 border-indigo-600 font-bold'
                          : 'bg-slate-50 text-rose-800 hover:bg-slate-100 hover:text-rose-900 font-semibold'
                      }`}
                      title="Click to sort by Worst Month return value"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Worst Month</span>
                        <span className="shrink-0">
                          {sortColumn !== 'worstMonth' && (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                          {sortColumn === 'worstMonth' && sortDirection === 'asc' && (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {sortColumn === 'worstMonth' && sortDirection === 'desc' && (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </span>
                      </div>
                    </th>

                    {/* Win Rate Header */}
                    <th
                      scope="col"
                      onClick={() => handleSort('winRate')}
                      className={`py-3 px-3 text-right w-24 cursor-pointer select-none transition-colors group ${
                        sortColumn === 'winRate'
                          ? 'bg-indigo-50/90 text-indigo-900 border-b-2 border-indigo-600 font-bold'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                      }`}
                      title="Click to sort by overall monthly win rate"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Win Rate</span>
                        <span className="shrink-0">
                          {sortColumn !== 'winRate' && (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                          {sortColumn === 'winRate' && sortDirection === 'asc' && (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {sortColumn === 'winRate' && sortDirection === 'desc' && (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-400">
                        No indices matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedProfiles.map((profile) => {
                      return (
                        <tr
                          key={profile.symbol}
                          className="hover:bg-indigo-50/20 transition-colors group"
                        >
                          {/* Sticky Index Column with Deep Dive Link */}
                          <td className="py-2 px-4 text-left sticky left-0 bg-white group-hover:bg-indigo-50/40 z-10 border-r border-slate-100">
                            <div className="flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenDeepDive(profile.symbol)}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate max-w-[170px] text-left cursor-pointer"
                                title={`Open Deep Dive for ${profile.name}`}
                              >
                                {profile.name}
                              </button>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 shrink-0">
                                {profile.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="truncate max-w-[130px]">
                                {profile.symbol.replace('NSE:', '')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenDeepDive(profile.symbol)}
                                className="text-indigo-600 hover:text-indigo-800 font-sans font-semibold flex items-center gap-0.5 cursor-pointer shrink-0"
                                title={`Deep Dive into ${profile.name}`}
                              >
                                <span>Deep Dive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </td>

                          {/* 12 Month Cells */}
                          {MONTH_SHORT_NAMES.map((_, idx) => {
                            const mNum = idx + 1;
                            const cell = profile.months[mNum];
                            if (!cell) {
                              return (
                                <td key={mNum} className="py-1 px-1">
                                  <span className="block w-full py-1.5 rounded text-[11px] text-slate-300">
                                    —
                                  </span>
                                </td>
                              );
                            }

                            const val = cell.avgReturn;
                            const isInsufficient = cell.insufficientHistory;
                            const cellColorClass = getCellVisual(val, isInsufficient);

                            return (
                              <td key={mNum} className="py-1 px-1">
                                <button
                                  type="button"
                                  onClick={() => handleCellClick(profile, cell)}
                                  title={`${profile.name} • ${MONTH_FULL_NAMES[mNum - 1]}: ${val >= 0 ? '+' : ''}${val.toFixed(2)}% | Win Rate: ${cell.winRatePct.toFixed(0)}% (N=${cell.sampleSize})`}
                                  className={`w-full py-1.5 px-0.5 rounded text-[11px] transition-transform hover:scale-105 cursor-pointer block ${cellColorClass}`}
                                >
                                  {isInsufficient
                                    ? 'Lim'
                                    : val >= 0
                                    ? `+${val.toFixed(1)}`
                                    : val.toFixed(1)}
                                </button>
                              </td>
                            );
                          })}

                          {/* Best Month */}
                          <td className="py-2 px-2 text-right">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50">
                              {profile.bestMonth.monthName} (+{profile.bestMonth.avgReturn.toFixed(1)}%)
                            </span>
                          </td>

                          {/* Worst Month */}
                          <td className="py-2 px-2 text-right">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-50">
                              {profile.worstMonth.monthName} ({profile.worstMonth.avgReturn.toFixed(1)}%)
                            </span>
                          </td>

                          {/* Win Rate (Calculated from underlying individual monthly observations) */}
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            <span title={`${profile.periodSummary.positiveCount} positive months out of ${profile.periodSummary.totalObservations} valid monthly observations`}>
                              {profile.periodSummary.winRatePct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Values represent historical average monthly returns (%) over the selected {selectedPeriod} period.</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">
                N = {selectedPeriod === '15Y' ? '15' : selectedPeriod === '10Y' ? '10' : selectedPeriod === '5Y' ? '5' : '3'} Max Observations per cell
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Methodology & Data Quality Modal */}
      {showMethodologyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowMethodologyModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Data Quality &amp; Monthly Calculation Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Indices</span>
                  <span className="text-base font-bold text-slate-900">{datasetQuality.totalIndices}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Date Range</span>
                  <span className="text-sm font-bold text-slate-900">{datasetQuality.startDate} to 2026</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Monthly Obs</span>
                  <span className="text-base font-bold text-slate-900">{datasetQuality.totalMonthlyObservations}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900">Strict Return Calculation Formula</h4>
                <div className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px]">
                  Monthly Return = ((Month End Close / Previous Month End Close) - 1) × 100
                </div>
                <p>
                  <strong>January Continuity Rule:</strong> The return for January strictly uses the last trading close of December of the preceding calendar year as its baseline. It is never calculated simply as January-last divided by January-first.
                </p>
                <p>
                  <strong>Deduplication &amp; Non-Fabrication:</strong> All input records are validated chronologically, deduplicated by symbol and date, and missing trading sessions are never fabricated.
                </p>
                <p>
                  <strong>Insufficient Observations Rule:</strong> Any cell with fewer than 3 valid historical years is flagged with an Insufficient History warning to prevent statistical distortion.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cell Drill-down Modal */}
      <MonthlyCellDrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        indexProfile={activeModalProfile}
        cellStats={activeModalStats}
        selectedPeriod={selectedPeriod}
      />

      {/* Statistical Boundary Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-500">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-700">HMIE Quantitative Seasonality Disclaimer:</strong> Historical monthly seasonality describes past empirical performance patterns across Indian market indices. Macroeconomic cycles, election cycles, fiscal policy shifts, and liquidity regimes change over time. Historical performance is neither an indicator nor a guarantee of future performance. This module is strictly designed for retrospective statistical research.
        </div>
      </div>
    </div>
  );
};
