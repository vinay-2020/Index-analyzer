import React, { useState, useMemo } from 'react';
import { IndexQuarterlySeasonality, QuarterlyCellStats, HeatmapPeriod } from '../types';
import {
  QUARTER_NUMBERS,
  QUARTER_NAMES,
  QUARTER_FULL_LABELS,
  QUARTER_MONTHS,
} from '../quarterlyHeatmapData';
import { MONTH_SHORT_NAMES, MONTH_FULL_NAMES } from '../monthlyHeatmapData';
import {
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpRight,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';

interface QuarterlySeasonalDeepDiveProps {
  profiles: IndexQuarterlySeasonality[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  selectedPeriod: HeatmapPeriod;
  onSelectCell: (profile: IndexQuarterlySeasonality, stats: QuarterlyCellStats) => void;
}

export const QuarterlySeasonalDeepDive: React.FC<QuarterlySeasonalDeepDiveProps> = ({
  profiles,
  selectedSymbol,
  onSelectSymbol,
  selectedPeriod,
  onSelectCell,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(selectedSymbol || profiles[0]?.symbol || '');
  const [viewMode, setViewMode] = useState<'quarters_only' | 'quarters_and_months'>('quarters_only');

  const currentProfile =
    profiles.find((p) => p.symbol === activeSymbol) || profiles[0];

  const annualReturns = useMemo(() => {
    if (!currentProfile) return [];
    return currentProfile.yearlyQuarterlyMatrix
      .map((yr) => yr.annualReturn)
      .filter((r): r is number => r !== undefined && !isNaN(r));
  }, [currentProfile]);

  const annualSummary = useMemo(() => {
    const n = annualReturns.length;
    if (n === 0) {
      return {
        avgReturn: 0,
        winRatePct: 0,
        loseRatePct: 0,
        stdDev: 0,
        maxReturn: 0,
        minReturn: 0,
      };
    }
    const sum = annualReturns.reduce((acc, v) => acc + v, 0);
    const avg = Number((sum / n).toFixed(2));
    const pos = annualReturns.filter((r) => r > 0).length;
    const neg = annualReturns.filter((r) => r < 0).length;
    const winRate = Number(((pos / n) * 100).toFixed(1));
    const loseRate = Number(((neg / n) * 100).toFixed(1));
    const max = Number(Math.max(...annualReturns).toFixed(1));
    const min = Number(Math.min(...annualReturns).toFixed(1));
    let std = 0;
    if (n > 1) {
      const variance =
        annualReturns.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (n - 1);
      std = Number(Math.sqrt(variance).toFixed(2));
    }
    return {
      avgReturn: avg,
      winRatePct: winRate,
      loseRatePct: loseRate,
      stdDev: std,
      maxReturn: max,
      minReturn: min,
    };
  }, [annualReturns]);

  if (!currentProfile) {
    return <div className="p-8 text-center text-slate-400">No quarterly profile available.</div>;
  }

  const handleIndexChange = (sym: string) => {
    setActiveSymbol(sym);
    onSelectSymbol(sym);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Index Selector & Top Highlights */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-violet-700 tracking-wide uppercase">
              Single-Index Quarterly Deep Dive
            </span>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold text-slate-900">
                {currentProfile.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {currentProfile.category}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {currentProfile.symbol} • Inception: {currentProfile.inceptionDate} • Window: {selectedPeriod}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative min-w-[260px]">
              <select
                value={activeSymbol}
                onChange={(e) => handleIndexChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-300 text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-hidden appearance-none cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.name} ({p.symbol.replace('NSE:', '').replace('-INDEX', '')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setViewMode('quarters_only')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'quarters_only'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quarters Only (Q1 - Q4)
              </button>
              <button
                onClick={() => setViewMode('quarters_and_months')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'quarters_and_months'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quarters + Months
              </button>
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Best Quarter</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-emerald-700">
                {currentProfile.bestQuarter.quarterName}
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                (+{currentProfile.bestQuarter.avgReturn.toFixed(2)}%)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {QUARTER_FULL_LABELS[currentProfile.bestQuarter.quarter]}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Worst Quarter</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-rose-700">
                {currentProfile.worstQuarter.quarterName}
              </span>
              <span className="text-xs font-bold text-rose-700 font-mono">
                ({currentProfile.worstQuarter.avgReturn.toFixed(2)}%)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {QUARTER_FULL_LABELS[currentProfile.worstQuarter.quarter]}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Quarter Win Rate</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-slate-900">
                {currentProfile.overallWinRate.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">
                ({currentProfile.periodSummary.positiveCount}/{currentProfile.totalObservations} Qtrs)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Positive quarterly returns</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">Annualized Avg (CAGR)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-base font-bold ${
                  annualSummary.avgReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {annualSummary.avgReturn >= 0 ? `+${annualSummary.avgReturn.toFixed(2)}` : annualSummary.avgReturn.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">
                σ: {annualSummary.stdDev.toFixed(2)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Across {currentProfile.yearlyQuarterlyMatrix.length} Tracked Years
            </span>
          </div>
        </div>
      </div>

      {/* Quarterly Seasonality Visual Cards (Q1 - Q4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUARTER_NUMBERS.map((q) => {
          const st = currentProfile.quarters[q];
          const isPositive = st.avgReturn >= 0;
          return (
            <div
              key={q}
              onClick={() => onSelectCell(currentProfile, st)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-violet-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                  {QUARTER_FULL_LABELS[q]}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    st.winRatePct >= 60
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : st.winRatePct <= 40
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Win: {st.winRatePct.toFixed(0)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span
                    className={`text-2xl font-black ${
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? `+${st.avgReturn.toFixed(2)}` : st.avgReturn.toFixed(2)}%
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Median: {st.medianReturn >= 0 ? `+${st.medianReturn.toFixed(2)}` : st.medianReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>σ: {st.stdDev.toFixed(2)}%</div>
                  <div>N: {st.sampleSize} yrs</div>
                </div>
              </div>

              {/* Monthly components in this quarter */}
              <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1 text-center">
                {QUARTER_MONTHS[q].map((m) => {
                  const mStats = currentProfile.monthlyProfile.months[m];
                  const mAvg = mStats ? mStats.avgReturn : 0;
                  return (
                    <div key={m} className="p-1 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block font-medium">
                        {MONTH_SHORT_NAMES[m - 1]}
                      </span>
                      <span
                        className={`text-[11px] font-bold font-mono ${
                          mAvg >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {mAvg >= 0 ? `+${mAvg.toFixed(1)}` : mAvg.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Year-by-Year Historical Return Matrix Table with 6 Historical Summary Rows merged directly at bottom */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              <span>Year-by-Year Historical Quarterly Return Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Historical compounded returns by quarter ({selectedPeriod} window) for {currentProfile.name}.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>&gt; 0% Positive</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>&lt; 0% Negative</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse min-w-[760px]">
            <thead>
              {/* If viewMode is quarters_and_months, render two header rows */}
              {viewMode === 'quarters_and_months' ? (
                <>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th rowSpan={2} className="py-2.5 px-3 text-left w-32 whitespace-nowrap border-r border-slate-200">
                      Year
                    </th>
                    {QUARTER_NUMBERS.map((q) => (
                      <th key={q} colSpan={4} className="py-2 px-2 border-r border-slate-200 bg-slate-100">
                        {QUARTER_FULL_LABELS[q]}
                      </th>
                    ))}
                    <th rowSpan={2} className="py-2.5 px-3 text-right w-24">
                      Annual
                    </th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    {QUARTER_NUMBERS.map((q) => (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => (
                          <th key={m} className="py-1.5 px-1 font-medium text-slate-500">
                            {MONTH_SHORT_NAMES[m - 1]}
                          </th>
                        ))}
                        <th className="py-1.5 px-1.5 font-bold text-violet-800 bg-violet-50/70 border-r border-slate-200">
                          {QUARTER_NAMES[q - 1]}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </>
              ) : (
                <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left w-32 whitespace-nowrap">Year</th>
                  {QUARTER_NUMBERS.map((q) => (
                    <th key={q} className="py-2.5 px-3">
                      {QUARTER_FULL_LABELS[q]}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right w-28">Annual Return</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100 font-mono">
              {currentProfile.yearlyQuarterlyMatrix.map((yrData) => {
                const hasAnnual = yrData.annualReturn !== undefined && !isNaN(yrData.annualReturn);
                const annualPos = hasAnnual && yrData.annualReturn! >= 0;

                return (
                  <tr key={yrData.year} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-left font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap border-r border-slate-100">
                      {yrData.year}
                    </td>

                    {/* Quarters cells */}
                    {QUARTER_NUMBERS.map((q) => {
                      const qReturn = yrData.quarters[q];
                      const hasQReturn = qReturn !== undefined && !isNaN(qReturn);
                      const isQPos = hasQReturn && qReturn >= 0;

                      if (viewMode === 'quarters_and_months') {
                        return (
                          <React.Fragment key={q}>
                            {QUARTER_MONTHS[q].map((m) => {
                              const mReturn = yrData.months[m];
                              const hasM = mReturn !== undefined && !isNaN(mReturn);
                              const isMPos = hasM && mReturn >= 0;
                              return (
                                <td key={m} className="py-1 px-1 text-center">
                                  {hasM ? (
                                    <span
                                      className={`inline-block w-full py-1 px-0.5 rounded text-[11px] ${
                                        isMPos
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : 'bg-rose-50 text-rose-800'
                                      }`}
                                    >
                                      {isMPos ? `+${mReturn.toFixed(1)}` : mReturn.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                            {/* Compounded Quarter Cell */}
                            <td
                              className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-100 bg-violet-50/30"
                              onClick={() => onSelectCell(currentProfile, currentProfile.quarters[q])}
                            >
                              {hasQReturn ? (
                                <span
                                  className={`inline-block w-full py-1 px-1 rounded text-xs font-bold ${
                                    isQPos
                                      ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                                      : 'bg-rose-100/90 text-rose-900 border border-rose-200'
                                  }`}
                                >
                                  {isQPos ? `+${qReturn.toFixed(1)}` : qReturn.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      }

                      // Standard Quarters-only view
                      return (
                        <td
                          key={q}
                          className="py-1 px-2 text-center cursor-pointer"
                          onClick={() => onSelectCell(currentProfile, currentProfile.quarters[q])}
                        >
                          {hasQReturn ? (
                            <span
                              className={`inline-block w-full py-1.5 px-2 rounded text-xs font-bold ${
                                isQPos
                                  ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                                  : 'bg-rose-100/90 text-rose-900 border border-rose-200'
                              }`}
                            >
                              {isQPos ? `+${qReturn.toFixed(2)}` : qReturn.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Annual Return */}
                    <td className="py-2 px-3 text-right font-bold">
                      {hasAnnual ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            annualPos
                              ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                              : 'text-rose-800 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {annualPos ? `+${yrData.annualReturn!.toFixed(1)}` : yrData.annualReturn!.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Historical Summary Rows directly at bottom of table */}
            <tfoot className="border-t-2 border-slate-300 divide-y divide-slate-200 bg-slate-50/95 font-mono text-xs">
              {/* Row 1: Average Return */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-xs">Average Return</div>
                  <div className="text-[10px] text-slate-500 font-sans">Quarterly Mean</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.avgReturn : 0;
                  const isPos = val >= 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          const mVal = mSt ? mSt.avgReturn : 0;
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span
                                className={`inline-block w-full py-1 px-0.5 rounded text-[11px] ${
                                  mVal >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                {mVal >= 0 ? `+${mVal.toFixed(1)}` : mVal.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span
                            className={`inline-block w-full py-1.5 px-1 rounded text-xs font-bold ${
                              isPos
                                ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                                : 'bg-rose-100/90 text-rose-900 border border-rose-200'
                            }`}
                          >
                            {isPos ? `+${val.toFixed(2)}` : val.toFixed(2)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        className={`inline-block w-full py-1.5 px-2 rounded text-xs font-bold ${
                          isPos
                            ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                            : 'bg-rose-100/90 text-rose-900 border border-rose-200'
                        }`}
                      >
                        {isPos ? `+${val.toFixed(2)}` : val.toFixed(2)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                      annualSummary.avgReturn >= 0 ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                    }`}
                  >
                    {annualSummary.avgReturn >= 0 ? `+${annualSummary.avgReturn.toFixed(2)}` : annualSummary.avgReturn.toFixed(2)}%
                  </span>
                </td>
              </tr>

              {/* Row 2: Win Rate */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-emerald-800 text-xs">Win Rate</div>
                  <div className="text-[10px] text-slate-500 font-sans">% Quarters &gt; 0</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.winRatePct : 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          const mWin = mSt ? mSt.winRatePct : 0;
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span className="inline-block w-full py-1 px-0.5 rounded text-[11px] text-emerald-800 bg-emerald-50">
                                {mWin.toFixed(0)}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span className="inline-block w-full py-1.5 px-1 rounded text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200">
                            {val.toFixed(1)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span className="inline-block w-full py-1.5 px-2 rounded text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200">
                        {val.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold text-emerald-800">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-xs">
                    {annualSummary.winRatePct.toFixed(1)}%
                  </span>
                </td>
              </tr>

              {/* Row 3: Lose Rate */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-rose-800 text-xs">Lose Rate</div>
                  <div className="text-[10px] text-slate-500 font-sans">% Quarters &lt; 0</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.loseRatePct : 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          const mLose = mSt && mSt.sampleSize > 0 ? (mSt.negativeCount / mSt.sampleSize) * 100 : 0;
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span className="inline-block w-full py-1 px-0.5 rounded text-[11px] text-rose-800 bg-rose-50">
                                {mLose.toFixed(0)}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span className="inline-block w-full py-1.5 px-1 rounded text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200">
                            {val.toFixed(1)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span className="inline-block w-full py-1.5 px-2 rounded text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200">
                        {val.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold text-rose-800">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-xs">
                    {annualSummary.loseRatePct.toFixed(1)}%
                  </span>
                </td>
              </tr>

              {/* Row 4: Std Dev */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-slate-800 text-xs">Std Dev</div>
                  <div className="text-[10px] text-slate-500 font-sans">Dispersion (σ)</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.stdDev : 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span className="inline-block w-full py-1 px-0.5 rounded text-[11px] text-slate-700 bg-slate-100">
                                {mSt ? mSt.stdDev.toFixed(1) : '0.0'}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span className="inline-block w-full py-1.5 px-1 rounded text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200">
                            {val.toFixed(2)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span className="inline-block w-full py-1.5 px-2 rounded text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200">
                        {val.toFixed(2)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold text-slate-800">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-xs">
                    {annualSummary.stdDev.toFixed(2)}%
                  </span>
                </td>
              </tr>

              {/* Row 5: Max Return */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-emerald-700 text-xs">Max Return</div>
                  <div className="text-[10px] text-slate-500 font-sans">Best Observed</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.bestYear.returnPct : 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          const mVal = mSt ? mSt.bestYear.returnPct : 0;
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span className="inline-block w-full py-1 px-0.5 rounded text-[11px] text-emerald-700 bg-emerald-50">
                                {mVal >= 0 ? `+${mVal.toFixed(1)}` : mVal.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span className="inline-block w-full py-1.5 px-1 rounded text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            +{val.toFixed(1)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span className="inline-block w-full py-1.5 px-2 rounded text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                        +{val.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-xs">
                    {annualSummary.maxReturn >= 0 ? `+${annualSummary.maxReturn.toFixed(1)}` : annualSummary.maxReturn.toFixed(1)}%
                  </span>
                </td>
              </tr>

              {/* Row 6: Min Return */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-rose-700 text-xs">Min Return</div>
                  <div className="text-[10px] text-slate-500 font-sans">Worst Observed</div>
                </td>
                {QUARTER_NUMBERS.map((q) => {
                  const st = currentProfile.quarters[q];
                  const val = st ? st.worstYear.returnPct : 0;

                  if (viewMode === 'quarters_and_months') {
                    return (
                      <React.Fragment key={q}>
                        {QUARTER_MONTHS[q].map((m) => {
                          const mSt = currentProfile.monthlyProfile.months[m];
                          const mVal = mSt ? mSt.worstYear.returnPct : 0;
                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              <span className="inline-block w-full py-1 px-0.5 rounded text-[11px] text-rose-700 bg-rose-50">
                                {mVal.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                        <td
                          className="py-1 px-1.5 text-center cursor-pointer border-r border-slate-200 bg-violet-50/50"
                          onClick={() => onSelectCell(currentProfile, st)}
                        >
                          <span className="inline-block w-full py-1.5 px-1 rounded text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
                            {val.toFixed(1)}%
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  }

                  return (
                    <td
                      key={q}
                      className="py-1 px-2 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span className="inline-block w-full py-1.5 px-2 rounded text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
                        {val.toFixed(1)}%
                      </span>
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right font-bold text-rose-700">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-xs">
                    {annualSummary.minReturn.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Table informative footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Summary rows summarize historical performance across all {currentProfile.yearlyQuarterlyMatrix.length} tracked years for {currentProfile.name} ({selectedPeriod}).
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            {currentProfile.totalObservations} Valid Quarterly Observations
          </span>
        </div>
      </div>
    </div>
  );
};
