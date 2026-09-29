import React, { useState, useMemo } from 'react';
import {
  HMIE_INDEX_UNIVERSE,
  IndexUniverseItem,
  IntelligencePeriod,
  getTopIntelligenceSummary,
  computeBenchmarkComparison,
  computeCorrectionRecoveryAnalysis,
  computeRsiAnalysis,
  computeEmaSupportAnalysis,
  computeSeasonalityAndFiscalCycles,
} from '../indexIntelligenceEngine';
import { BenchmarkAnalysisView } from './intelligence/BenchmarkAnalysisView';
import { CorrectionRecoveryView } from './intelligence/CorrectionRecoveryView';
import { RsiReboundView } from './intelligence/RsiReboundView';
import { EmaSupportView } from './intelligence/EmaSupportView';
import { SeasonalityCyclesView } from './intelligence/SeasonalityCyclesView';
import {
  Search,
  Layers,
  TrendingUp,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Calendar,
  RotateCcw,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  Info,
  ExternalLink,
  BookOpen,
  GitCompare,
  X,
} from 'lucide-react';

export const IndexIntelligenceScreen: React.FC = () => {
  const [selectedIndexKey, setSelectedIndexKey] = useState<string>('NIFTY50');
  const [selectedPeriod, setSelectedPeriod] = useState<IntelligencePeriod>('15Y');
  const [activeTab, setActiveTab] = useState<'BENCHMARK' | 'CORRECTION' | 'RSI' | 'EMA' | 'SEASONALITY'>('BENCHMARK');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'Broad' | 'Sector' | 'Factor'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Side-by-side comparison mode
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareIndices, setCompareIndices] = useState<string[]>(['NIFTY50', 'NIFTYBANK', 'NIFTYMIDCAP150']);

  // Filtered universe for selector
  const filteredUniverse = useMemo(() => {
    return HMIE_INDEX_UNIVERSE.filter((idx) => {
      const matchesCat = categoryFilter === 'ALL' || idx.category === categoryFilter;
      const matchesSearch =
        idx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idx.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  // Selected Index Details
  const selectedIndex = useMemo(() => {
    return HMIE_INDEX_UNIVERSE.find((u) => u.key === selectedIndexKey) || HMIE_INDEX_UNIVERSE[0];
  }, [selectedIndexKey]);

  // Executive Summary Metrics
  const summary = useMemo(() => {
    return getTopIntelligenceSummary(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Compute Engine 1: Benchmark Analysis
  const benchmarkStats = useMemo(() => {
    return computeBenchmarkComparison(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Compute Engine 2: Correction & Recovery
  const correctionData = useMemo(() => {
    return computeCorrectionRecoveryAnalysis(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Compute Engine 3: RSI Rebounds
  const rsiData = useMemo(() => {
    return computeRsiAnalysis(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Compute Engine 4: EMA Support
  const emaData = useMemo(() => {
    return computeEmaSupportAnalysis(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Compute Engine 5: Seasonality & FY Cycles
  const seasonalityData = useMemo(() => {
    return computeSeasonalityAndFiscalCycles(selectedIndexKey, selectedPeriod);
  }, [selectedIndexKey, selectedPeriod]);

  // Comparative data for Comparison Modal/View
  const comparativeSummaries = useMemo(() => {
    return compareIndices.map((k) => getTopIntelligenceSummary(k, selectedPeriod));
  }, [compareIndices, selectedPeriod]);

  const toggleCompareIndex = (key: string) => {
    if (compareIndices.includes(key)) {
      if (compareIndices.length > 2) {
        setCompareIndices(compareIndices.filter((k) => k !== key));
      }
    } else {
      if (compareIndices.length < 6) {
        setCompareIndices([...compareIndices, key]);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Universe Search, Index Selector, Category Tabs, Period & Compare */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Index Selector with Category Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px]">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Select HMIE Universe Index (40 Indices)
              </label>
              <div className="relative">
                <select
                  value={selectedIndexKey}
                  onChange={(e) => setSelectedIndexKey(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-2 pr-8 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                >
                  <optgroup label="Broad Market / Core (19)">
                    {HMIE_INDEX_UNIVERSE.filter((u) => u.category === 'Broad').map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.name} ({u.key})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Sector Indices (14)">
                    {HMIE_INDEX_UNIVERSE.filter((u) => u.category === 'Sector').map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.name} ({u.key})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Factor / Strategy Indices (7)">
                    {HMIE_INDEX_UNIVERSE.filter((u) => u.category === 'Factor').map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.name} ({u.key})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Inception & Category Indicator */}
            <div className="hidden sm:block self-end pb-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                <Layers className="w-3.5 h-3.5" />
                {selectedIndex.categoryLabel}
              </span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                Inception: {selectedIndex.inceptionDate}
              </span>
            </div>
          </div>

          {/* Right Action Bar: Period Selector & Compare Toggle */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['MAX', '15Y', '10Y', '5Y', '3Y'] as IntelligencePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                    selectedPeriod === p
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Compare Toggle Button */}
            <button
              onClick={() => setIsCompareOpen(!isCompareOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isCompareOpen
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare (2&ndash;6)</span>
            </button>
          </div>
        </div>

        {/* Category Quick Filter Chips */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">Filter Universe:</span>
          {(['ALL', 'Broad', 'Sector', 'Factor'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All (40 Indices)' : cat === 'Broad' ? 'Broad Market (19)' : cat === 'Sector' ? 'Sectors (14)' : 'Factor / Strategy (7)'}
            </button>
          ))}

          <span className="text-slate-300 mx-2">|</span>
          <span className="text-[11px] text-slate-500 font-mono">
            Dataset: FYERS_HIST_DATA.csv &bull; 100% Historical Empirical &bull; Zero Predictive Signals
          </span>
        </div>
      </div>

      {/* Comparison Drawer / Side-by-Side Table (When Toggled) */}
      {isCompareOpen && (
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Side-by-Side Index Intelligence Comparison ({selectedPeriod})
              </h3>
            </div>
            <button
              onClick={() => setIsCompareOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Compare up to 6 indices side-by-side across institutional CAGR, drawdowns, RSI bounce frequencies, and EMA support reliability.
          </p>

          {/* Quick Universe Selector Chips for Compare */}
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            {HMIE_INDEX_UNIVERSE.map((u) => {
              const isSelected = compareIndices.includes(u.key);
              return (
                <button
                  key={u.key}
                  onClick={() => toggleCompareIndex(u.key)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {u.name}
                </button>
              );
            })}
          </div>

          {/* Comparative Side-by-Side Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 font-mono border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Metric</th>
                  {comparativeSummaries.map((s) => (
                    <th key={s.indexKey} className="py-2.5 px-3 font-bold text-indigo-300">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.categoryLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">Compounded Annual Growth (CAGR)</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 font-bold text-white">
                      +{s.historicalCagr}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">Peak-to-Trough Max Drawdown</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-rose-400 font-bold">
                      {s.maxDrawdownPct}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">RSI &le; 30 Oversold Events</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-slate-200">
                      {s.totalRsiZoneAEvents} cycles
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">Avg Rebound After Oversold (63d)</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-emerald-400 font-bold">
                      +{s.avgReboundAfterOversoldPct}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">EMA200 Support Rate (&plusmn;3%)</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-teal-400 font-bold">
                      {s.ema200SupportRatePct}% ({s.ema200InteractionsCount} touches)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">Best Historical Quarter</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-emerald-400">
                      {s.bestQuarter.name} (+{s.bestQuarter.avgReturn}%)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans font-medium text-slate-400">Worst Historical Quarter</td>
                  {comparativeSummaries.map((s) => (
                    <td key={s.indexKey} className="py-2 px-3 text-rose-400">
                      {s.worstQuarter.name} ({s.worstQuarter.avgReturn}%)
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Executive Research Summary Card (7 Key Empirical Anchors) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {selectedIndex.name}
              </h2>
              <span className="text-xs font-mono text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                {selectedIndex.symbol}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <strong className="text-slate-700">{selectedIndex.categoryLabel}</strong> &bull; Parent Universe:{' '}
              <strong className="text-indigo-700">{summary.parentBenchmarkName}</strong> &bull; Baseline: <strong>NIFTY 50</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Observation Horizon</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              {summary.yearsTracked} Years ({selectedPeriod}) &bull; Active Close: ₹{selectedIndex.currentClose.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 7 Factual Research Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 1. Historical CAGR */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Historical CAGR</span>
            <span className={`text-lg font-black font-mono block mt-1 ${summary.historicalCagr >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              +{summary.historicalCagr}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Compounded growth</span>
          </div>

          {/* 2. Max Drawdown */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Drawdown</span>
            <span className="text-lg font-black font-mono block mt-1 text-rose-700">
              {summary.maxDrawdownPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Deepest historical drop</span>
          </div>

          {/* 3. Total RSI <= 30 Events */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">RSI &le; 30 Events</span>
            <span className="text-lg font-black font-mono block mt-1 text-slate-900">
              {summary.totalRsiZoneAEvents}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Deep oversold cycles</span>
          </div>

          {/* 4. Avg Rebound After Oversold */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Rebound (63d)</span>
            <span className="text-lg font-black font-mono block mt-1 text-emerald-700">
              +{summary.avgReboundAfterOversoldPct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Post-oversold peak</span>
          </div>

          {/* 5. EMA200 Interactions */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">EMA200 Touches</span>
            <span className="text-lg font-black font-mono block mt-1 text-slate-900">
              {summary.ema200InteractionsCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">&plusmn;3% proximity zone</span>
          </div>

          {/* 6. EMA200 Support Rate */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">EMA200 Bounce %</span>
            <span className="text-lg font-black font-mono block mt-1 text-indigo-700">
              {summary.ema200SupportRatePct}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Support confirmed rate</span>
          </div>

          {/* 7. Best / Worst Quarter */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Quarterly Bias</span>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xs">
              <span className="font-bold text-emerald-700">{summary.bestQuarter.name} (+{summary.bestQuarter.avgReturn}%)</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-rose-700">{summary.worstQuarter.name}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Historical extremes</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for the 5 Quantitative Research Engines */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 overflow-x-auto pb-px" aria-label="Research Engines">
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'BENCHMARK'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Index vs Benchmark Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('CORRECTION')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'CORRECTION'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>2. Correction &amp; Recovery</span>
          </button>

          <button
            onClick={() => setActiveTab('RSI')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'RSI'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. RSI Rebound Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('EMA')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'EMA'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. EMA Support Behaviour</span>
          </button>

          <button
            onClick={() => setActiveTab('SEASONALITY')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'SEASONALITY'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>5. Seasonality &amp; FY Cycles</span>
          </button>
        </nav>
      </div>

      {/* Render Active Quantitative Research Engine */}
      <div className="pt-2">
        {activeTab === 'BENCHMARK' && (
          <BenchmarkAnalysisView
            stats={benchmarkStats}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        )}

        {activeTab === 'CORRECTION' && (
          <CorrectionRecoveryView
            indexName={selectedIndex.name}
            episodes={correctionData.episodes}
            bucketSummaries={correctionData.bucketSummaries}
            deepDrawdowns={correctionData.deepDrawdowns}
          />
        )}

        {activeTab === 'RSI' && (
          <RsiReboundView
            indexName={selectedIndex.name}
            zoneAEvents={rsiData.zoneAEvents}
            zoneAStats={rsiData.zoneAStats}
            zoneBEvents={rsiData.zoneBEvents}
            zoneBStats={rsiData.zoneBStats}
          />
        )}

        {activeTab === 'EMA' && (
          <EmaSupportView
            indexName={selectedIndex.name}
            summaryRows={emaData.summaryRows}
            episodesByEma={emaData.episodesByEma}
          />
        )}

        {activeTab === 'SEASONALITY' && (
          <SeasonalityCyclesView
            indexName={selectedIndex.name}
            quarterlyStats={seasonalityData.quarterlyStats}
            fiscalTransitionStats={seasonalityData.fiscalTransitionStats}
          />
        )}
      </div>
    </div>
  );
};
