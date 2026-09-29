import React, { useState, useMemo } from 'react';
import { IndexDataRow, HeatmapPeriod, IndexQuarterlySeasonality, QuarterlyCellStats } from '../types';
import { SAMPLE_FYERS_INDICES } from '../defaultData';
import {
  computeIndexSeasonality,
  MONTH_SHORT_NAMES,
  MONTH_FULL_NAMES,
} from '../monthlyHeatmapData';
import {
  computeIndexQuarterlySeasonality,
  computeMarketQuarterlySeasonality,
  QUARTER_NUMBERS,
  QUARTER_NAMES,
  QUARTER_FULL_LABELS,
  QUARTER_MONTHS,
} from '../quarterlyHeatmapData';
import { QuarterlyCellDrilldownModal } from './QuarterlyCellDrilldownModal';
import { MarketQuarterlySeasonalityChart } from './MarketQuarterlySeasonalityChart';
import { QuarterlyRankingView } from './QuarterlyRankingView';
import { QuarterlySeasonalDeepDive } from './QuarterlySeasonalDeepDive';
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
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

type SortColumn =
  | 'name'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'annual'
  | 'bestQuarter'
  | 'worstQuarter'
  | 'winRate';

type SortDirection = 'asc' | 'desc';

interface QuarterlyHeatmapScreenProps {
  indices?: IndexDataRow[];
}

export const QuarterlyHeatmapScreen: React.FC<QuarterlyHeatmapScreenProps> = ({ indices }) => {
  // Navigation sub-views inside the Quarterly module
  const [subView, setSubView] = useState<'matrix' | 'market' | 'rankings' | 'deepdive'>('matrix');

  // Matrix display mode: compact quarters vs full quarters + constituent months
  const [displayMode, setDisplayMode] = useState<'quarterly_summary' | 'quarterly_monthly'>('quarterly_monthly');

  // Filters & State
  const [selectedPeriod, setSelectedPeriod] = useState<HeatmapPeriod>('15Y');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selected Index for Deep Dive view
  const [selectedDeepDiveSymbol, setSelectedDeepDiveSymbol] = useState<string>('NSE:NIFTY50-INDEX');

  // Drilldown Modal State
  const [activeModalProfile, setActiveModalProfile] = useState<IndexQuarterlySeasonality | null>(null);
  const [activeModalStats, setActiveModalStats] = useState<QuarterlyCellStats | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState<boolean>(false);

  // Compute quarterly seasonality profiles for all indices
  const indexProfiles: IndexQuarterlySeasonality[] = useMemo(() => {
    const rawList = indices && indices.length > 0 ? indices : SAMPLE_FYERS_INDICES;

    return rawList.map((item) => {
      const inception = (item.rawRecord && item.rawRecord.inception) || '2010-12-31';

      // 1. Compute monthly profile
      const monthlyProfile = computeIndexSeasonality(
        item.symbol,
        item.name,
        item.category,
        inception,
        selectedPeriod,
        undefined,
        item.close
      );

      // 2. Derive authentic quarterly seasonality from compounded monthly data
      return computeIndexQuarterlySeasonality(monthlyProfile);
    });
  }, [indices, selectedPeriod]);

  // Market Quarterly Seasonality benchmark
  const marketQuarterly = useMemo(() => {
    return computeMarketQuarterlySeasonality(indexProfiles);
  }, [indexProfiles]);

  // Filtered profiles for matrix
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

  // Sorted profiles for matrix
  const sortedProfiles = useMemo(() => {
    return [...filteredProfiles].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortColumn === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return sortDirection === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      } else if (sortColumn === 'q1') {
        valA = a.quarters[1]?.avgReturn ?? -999;
        valB = b.quarters[1]?.avgReturn ?? -999;
      } else if (sortColumn === 'q2') {
        valA = a.quarters[2]?.avgReturn ?? -999;
        valB = b.quarters[2]?.avgReturn ?? -999;
      } else if (sortColumn === 'q3') {
        valA = a.quarters[3]?.avgReturn ?? -999;
        valB = b.quarters[3]?.avgReturn ?? -999;
      } else if (sortColumn === 'q4') {
        valA = a.quarters[4]?.avgReturn ?? -999;
        valB = b.quarters[4]?.avgReturn ?? -999;
      } else if (sortColumn === 'bestQuarter') {
        valA = a.bestQuarter.avgReturn;
        valB = b.bestQuarter.avgReturn;
      } else if (sortColumn === 'worstQuarter') {
        valA = a.worstQuarter.avgReturn;
        valB = b.worstQuarter.avgReturn;
      } else if (sortColumn === 'winRate') {
        valA = a.overallWinRate;
        valB = b.overallWinRate;
      } else if (sortColumn === 'annual') {
        valA = a.periodSummary.averageReturn;
        valB = b.periodSummary.averageReturn;
      }

      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [filteredProfiles, sortColumn, sortDirection]);

  // Toggle sorting handler
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection(col === 'name' ? 'asc' : 'desc');
    }
  };

  // Open drilldown modal
  const handleOpenDrilldown = (profile: IndexQuarterlySeasonality, stats: QuarterlyCellStats) => {
    setActiveModalProfile(profile);
    setActiveModalStats(stats);
    setIsDrilldownOpen(true);
  };

  // Switch to deepdive for a specific index
  const handleSelectIndexDeepDive = (symbol: string) => {
    setSelectedDeepDiveSymbol(symbol);
    setSubView('deepdive');
  };

  // Color intensity calculator for quarterly returns
  const getCellColorClass = (returnVal: number | undefined, sampleSize: number) => {
    if (returnVal === undefined || isNaN(returnVal) || sampleSize === 0) {
      return 'bg-slate-100/60 text-slate-400';
    }

    if (returnVal > 8) return 'bg-emerald-600 text-white font-bold';
    if (returnVal > 5) return 'bg-emerald-500 text-white font-bold';
    if (returnVal > 3) return 'bg-emerald-200 text-emerald-950 font-bold';
    if (returnVal > 1) return 'bg-emerald-100 text-emerald-900 font-medium';
    if (returnVal > 0) return 'bg-emerald-50 text-emerald-800 font-medium';
    if (returnVal === 0) return 'bg-slate-100 text-slate-700';
    if (returnVal > -1) return 'bg-rose-50 text-rose-800 font-medium';
    if (returnVal > -3) return 'bg-rose-100 text-rose-900 font-medium';
    if (returnVal > -5) return 'bg-rose-200 text-rose-950 font-bold';
    if (returnVal > -8) return 'bg-rose-500 text-white font-bold';
    return 'bg-rose-600 text-white font-bold';
  };

  // Export Quarterly CSV
  const handleExportCsv = () => {
    let csv = 'Symbol,Name,Category,Q1_Avg,Q2_Avg,Q3_Avg,Q4_Avg,Best_Quarter,Worst_Quarter,Quarter_WinRate\n';
    sortedProfiles.forEach((p) => {
      csv += `"${p.symbol}","${p.name}","${p.category}",${p.quarters[1]?.avgReturn ?? ''},${p.quarters[2]?.avgReturn ?? ''},${p.quarters[3]?.avgReturn ?? ''},${p.quarters[4]?.avgReturn ?? ''},"${p.bestQuarter.quarterName}","${p.worstQuarter.quarterName}",${p.overallWinRate.toFixed(1)}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QUARTERLY_MONTHLY_SEASONALITY_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Mode Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
                Institutional Seasonality Module
              </span>
              <span className="text-xs text-slate-500 font-medium">
                FYERS Historical Index Suite (2011–2026)
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>Quarterly Monthly Heatmap</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Q1 • Q2 • Q3 • Q4 Cyclical Matrix
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Cross-quarter seasonality matrix, compounded quarterly return patterns, constituent monthly contributions, and cyclical win rates across Indian benchmark & sector indices.
            </p>
          </div>

          {/* Sub-view Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                id="btn-subview-matrix"
                onClick={() => setSubView('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  subView === 'matrix'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-violet-600" />
                <span>Quarterly Matrix</span>
              </button>

              <button
                id="btn-subview-market"
                onClick={() => setSubView('market')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  subView === 'market'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Market Benchmark</span>
              </button>

              <button
                id="btn-subview-rankings"
                onClick={() => setSubView('rankings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  subView === 'rankings'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard</span>
              </button>

              <button
                id="btn-subview-deepdive"
                onClick={() => setSubView('deepdive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  subView === 'deepdive'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Index Deep Dive</span>
              </button>
            </div>

            <button
              onClick={() => setShowMethodologyModal(true)}
              title="Quarterly Compounding Methodology & Logic"
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-Views */}
      {subView === 'market' ? (
        <MarketQuarterlySeasonalityChart
          seasonalityData={marketQuarterly}
          onSelectQuarter={(q) => {
            setSubView('rankings');
          }}
        />
      ) : subView === 'rankings' ? (
        <QuarterlyRankingView
          profiles={indexProfiles}
          selectedPeriod={selectedPeriod}
          onSelectCell={handleOpenDrilldown}
        />
      ) : subView === 'deepdive' ? (
        <QuarterlySeasonalDeepDive
          profiles={indexProfiles}
          selectedSymbol={selectedDeepDiveSymbol}
          onSelectSymbol={(sym) => setSelectedDeepDiveSymbol(sym)}
          selectedPeriod={selectedPeriod}
          onSelectCell={handleOpenDrilldown}
        />
      ) : (
        /* Quarterly Heatmap Matrix View */
        <div className="space-y-4">
          {/* Top Control Bar: Period, View Mode, Category, Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Period Selector & Display Mode */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Lookback Window:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                {(['MAX', '15Y', '10Y', '5Y', '3Y'] as HeatmapPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      selectedPeriod === period
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Display Mode: Summary vs Full Quarterly-Monthly */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs ml-0 sm:ml-2">
                <button
                  onClick={() => setDisplayMode('quarterly_monthly')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    displayMode === 'quarterly_monthly'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quarterly + Months View
                </button>
                <button
                  onClick={() => setDisplayMode('quarterly_summary')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    displayMode === 'quarterly_summary'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quarters Only (Q1 - Q4)
                </button>
              </div>
            </div>

            {/* Right: Search, Category & CSV Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search index..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 text-slate-800"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
              >
                <option value="ALL">All Categories</option>
                <option value="BROAD">Broad Market</option>
                <option value="SECTORAL">Sectoral</option>
                <option value="THEMATIC">Thematic</option>
                <option value="STRATEGY">Strategy / Factor</option>
              </select>

              <button
                onClick={handleExportCsv}
                title="Export Quarterly Heatmap to CSV"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Quarterly Heatmap Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  {displayMode === 'quarterly_monthly' ? (
                    <>
                      {/* Multi-tiered header for Quarterly + Monthly */}
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-xs">
                        <th
                          rowSpan={2}
                          onClick={() => handleSort('name')}
                          className="py-2.5 px-3 text-left w-52 sticky left-0 bg-slate-100 z-20 cursor-pointer hover:bg-slate-200/80 transition-colors border-r border-slate-200 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span>Index Name ({sortedProfiles.length})</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          rowSpan={2}
                          className="py-2.5 px-2 text-left w-20 border-r border-slate-200 text-[11px] text-slate-500 font-medium"
                        >
                          Category
                        </th>
                        {QUARTER_NUMBERS.map((q) => (
                          <th
                            key={q}
                            colSpan={4}
                            className="py-2 px-1 text-center border-r border-slate-200 bg-slate-100/90 font-bold text-slate-800"
                          >
                            <span className="text-violet-900">{QUARTER_FULL_LABELS[q]}</span>
                          </th>
                        ))}
                        <th
                          rowSpan={2}
                          onClick={() => handleSort('annual')}
                          className="py-2.5 px-2.5 text-right w-20 cursor-pointer hover:bg-slate-200/80 transition-colors border-r border-slate-200"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Annual</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                        <th
                          rowSpan={2}
                          onClick={() => handleSort('winRate')}
                          className="py-2.5 px-2.5 text-right w-20 cursor-pointer hover:bg-slate-200/80 transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Win %</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                      </tr>
                      {/* Second header row: constituent months + Quarter Total */}
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px]">
                        {QUARTER_NUMBERS.map((q) => (
                          <React.Fragment key={q}>
                            {QUARTER_MONTHS[q].map((m) => (
                              <th key={m} className="py-1 px-1 text-center font-normal text-slate-500">
                                {MONTH_SHORT_NAMES[m - 1]}
                              </th>
                            ))}
                            <th className="py-1 px-1.5 text-center font-bold text-violet-900 bg-violet-50/70 border-r border-slate-200">
                              {QUARTER_NAMES[q - 1]}
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </>
                  ) : (
                    /* Simple Quarters-only header */
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-xs">
                      <th
                        onClick={() => handleSort('name')}
                        className="py-2.5 px-3 text-left w-56 sticky left-0 bg-slate-100 z-20 cursor-pointer hover:bg-slate-200/80 transition-colors border-r border-slate-200 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span>Index Name ({sortedProfiles.length})</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-2.5 px-2.5 text-left w-20 border-r border-slate-200 text-[11px] text-slate-500 font-medium">
                        Category
                      </th>
                      {QUARTER_NUMBERS.map((q) => (
                        <th
                          key={q}
                          onClick={() => handleSort(`q${q}` as SortColumn)}
                          className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/80 transition-colors border-r border-slate-100"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{QUARTER_FULL_LABELS[q]}</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                      ))}
                      <th
                        onClick={() => handleSort('annual')}
                        className="py-2.5 px-3 text-right w-24 cursor-pointer hover:bg-slate-200/80 transition-colors border-r border-slate-200"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Annual Avg</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('bestQuarter')}
                        className="py-2.5 px-3 text-center w-24 cursor-pointer hover:bg-slate-200/80 transition-colors"
                      >
                        Best Qtr
                      </th>
                      <th
                        onClick={() => handleSort('winRate')}
                        className="py-2.5 px-3 text-right w-20 cursor-pointer hover:bg-slate-200/80 transition-colors"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Win %</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100 font-mono">
                  {sortedProfiles.map((p) => {
                    const annualVal = p.periodSummary.averageReturn;
                    const isAnnualPos = annualVal >= 0;

                    return (
                      <tr key={p.symbol} className="hover:bg-slate-50/80 transition-colors">
                        {/* Sticky Index Name */}
                        <td className="py-2 px-3 sticky left-0 bg-white z-10 font-sans border-r border-slate-100 shadow-2xs whitespace-nowrap">
                          <button
                            onClick={() => handleSelectIndexDeepDive(p.symbol)}
                            className="text-left font-bold text-slate-900 hover:text-violet-700 transition-colors flex items-center gap-1.5 group"
                          >
                            <span className="truncate max-w-[190px]">{p.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-violet-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {p.symbol}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-2 px-2 font-sans border-r border-slate-100 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {p.category}
                          </span>
                        </td>

                        {/* Quarters Cells */}
                        {displayMode === 'quarterly_monthly' ? (
                          <>
                            {QUARTER_NUMBERS.map((q) => {
                              const qStats = p.quarters[q];
                              const qReturn = qStats?.avgReturn;

                              return (
                                <React.Fragment key={q}>
                                  {QUARTER_MONTHS[q].map((m) => {
                                    const mStats = p.monthlyProfile.months[m];
                                    const mAvg = mStats ? mStats.avgReturn : 0;
                                    const isMPos = mAvg >= 0;
                                    return (
                                      <td key={m} className="py-1 px-1 text-center">
                                        <span
                                          className={`inline-block w-full py-1 px-0.5 rounded text-[10px] ${
                                            isMPos
                                              ? 'bg-emerald-50 text-emerald-800'
                                              : 'bg-rose-50 text-rose-800'
                                          }`}
                                        >
                                          {isMPos ? `+${mAvg.toFixed(1)}` : mAvg.toFixed(1)}%
                                        </span>
                                      </td>
                                    );
                                  })}
                                  {/* Compounded Quarter Cell */}
                                  <td
                                    className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/20 hover:bg-violet-100/60 transition-colors"
                                    onClick={() => handleOpenDrilldown(p, qStats)}
                                    title={`Click for ${p.name} ${QUARTER_FULL_LABELS[q]} details`}
                                  >
                                    <span
                                      className={`inline-block w-full py-1.5 px-1 rounded text-xs font-bold ${getCellColorClass(
                                        qReturn,
                                        qStats?.sampleSize || 0
                                      )}`}
                                    >
                                      {qReturn !== undefined
                                        ? qReturn >= 0
                                          ? `+${qReturn.toFixed(1)}`
                                          : qReturn.toFixed(1)
                                        : '—'}%
                                    </span>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </>
                        ) : (
                          /* Compact Quarters-only view */
                          <>
                            {QUARTER_NUMBERS.map((q) => {
                              const qStats = p.quarters[q];
                              const qReturn = qStats?.avgReturn;

                              return (
                                <td
                                  key={q}
                                  className="py-1.5 px-2 text-center cursor-pointer border-r border-slate-100 hover:opacity-80 transition-opacity"
                                  onClick={() => handleOpenDrilldown(p, qStats)}
                                  title={`Click for ${p.name} ${QUARTER_FULL_LABELS[q]} details`}
                                >
                                  <span
                                    className={`inline-block w-full py-1 px-2 rounded text-xs ${getCellColorClass(
                                      qReturn,
                                      qStats?.sampleSize || 0
                                    )}`}
                                  >
                                    {qReturn !== undefined
                                      ? qReturn >= 0
                                        ? `+${qReturn.toFixed(2)}`
                                        : qReturn.toFixed(2)
                                      : '—'}%
                                  </span>
                                </td>
                              );
                            })}
                          </>
                        )}

                        {/* Annual Return */}
                        <td className="py-2 px-2.5 text-right font-bold border-r border-slate-100">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                              isAnnualPos ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                            }`}
                          >
                            {isAnnualPos ? `+${annualVal.toFixed(1)}` : annualVal.toFixed(1)}%
                          </span>
                        </td>

                        {/* Best Quarter (compact mode only) */}
                        {displayMode === 'quarterly_summary' && (
                          <td className="py-2 px-3 text-center text-xs">
                            <span className="font-bold text-emerald-700">
                              {p.bestQuarter.quarterName}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              (+{p.bestQuarter.avgReturn.toFixed(1)}%)
                            </span>
                          </td>
                        )}

                        {/* Overall Win Rate */}
                        <td className="py-2 px-2.5 text-right font-bold text-slate-900 text-xs">
                          {p.overallWinRate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer Note */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Returns represent compounded performance for each quarter: (1 + M1/100) × (1 + M2/100) × (1 + M3/100) - 1. Click any cell for drilldown.
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {sortedProfiles.length} of {indexProfiles.length} Indices
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drilldown Modal */}
      <QuarterlyCellDrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        indexProfile={activeModalProfile}
        cellStats={activeModalStats}
        selectedPeriod={selectedPeriod}
      />

      {/* Methodology Modal */}
      {showMethodologyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowMethodologyModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                Quarterly Seasonality Methodology & Accounting
              </h3>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">1. Compounding Formula</h4>
                <p>
                  Quarterly returns are strictly compounded from consecutive month-end closes:
                  <br />
                  <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-violet-700 block mt-1">
                    Quarter Return = [(1 + Month₁/100) × (1 + Month₂/100) × (1 + Month₃/100) - 1] × 100
                  </code>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">2. Indian Equity Market Quarterly Cycles</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Q1 (Jan – Mar):</strong> Pre-Budget rally, Union Budget announcement, fiscal year-end corporate tax settlements, and NAV rebalancing.</li>
                  <li><strong>Q2 (Apr – Jun):</strong> Start of the new financial year with fresh institutional inflows, Q4 corporate results, and southwest monsoon onset.</li>
                  <li><strong>Q3 (Jul – Sep):</strong> Monsoon progression, agricultural output clarity, and early festive channel inventory build-up.</li>
                  <li><strong>Q4 (Oct – Dec):</strong> Peak festive demand (Navratri, Dussehra, Diwali), Muhurat trading, advance tax collections, and global institutional year-end rally.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">3. Lookback Windows</h4>
                <p>
                  Available periods: <strong>15Y</strong> (2012–2026), <strong>10Y</strong> (2017–2026), <strong>5Y</strong> (2022–2026), <strong>3Y</strong> (2024–2026), and <strong>MAX</strong>. All statistics automatically recompute across the chosen historical horizon.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
