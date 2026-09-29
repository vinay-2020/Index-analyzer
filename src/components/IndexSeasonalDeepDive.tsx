import React, { useState, useMemo } from 'react';
import { IndexMonthlySeasonality, MonthlyCellStats, HeatmapPeriod } from '../types';
import { MONTH_SHORT_NAMES, MONTH_FULL_NAMES } from '../monthlyHeatmapData';
import {
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Info,
  BarChart3,
  Target,
} from 'lucide-react';

interface IndexSeasonalDeepDiveProps {
  profiles: IndexMonthlySeasonality[];
  selectedPeriod: HeatmapPeriod;
  onSelectCell: (profile: IndexMonthlySeasonality, stats: MonthlyCellStats) => void;
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

export const IndexSeasonalDeepDive: React.FC<IndexSeasonalDeepDiveProps> = ({
  profiles,
  selectedPeriod,
  onSelectCell,
  selectedSymbol: selectedSymbolProp,
  onSelectSymbol: onSelectSymbolProp,
}) => {
  const [internalSymbol, setInternalSymbol] = useState<string>(
    selectedSymbolProp || profiles[0]?.symbol || 'NSE:NIFTY50-INDEX'
  );

  const activeSymbol = selectedSymbolProp || internalSymbol;
  const handleSymbolChange = (sym: string) => {
    setInternalSymbol(sym);
    if (onSelectSymbolProp) {
      onSelectSymbolProp(sym);
    }
  };

  const currentProfile =
    profiles.find((p) => p.symbol === activeSymbol) || profiles[0];

  const annualReturns = useMemo(() => {
    if (!currentProfile) return [];
    return currentProfile.yearlyMatrix
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
    return <div className="p-8 text-center text-slate-400">No profile available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Index Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 uppercase font-semibold">
            Single Index Deep Dive
          </span>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>{currentProfile.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              {currentProfile.category}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {currentProfile.symbol} • Inception: {currentProfile.inceptionDate} • Analysis Window: {selectedPeriod}
          </p>
        </div>

        {/* Dropdown selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="select-deepdive-index" className="text-xs text-slate-600 font-medium shrink-0">
            Select Index:
          </label>
          <div className="relative">
            <select
              id="select-deepdive-index"
              value={activeSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {profiles.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 12-Month Seasonal Summary Cards for Selected Index */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          12-Month Seasonality Profile ({selectedPeriod} Analysis Window)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MONTH_SHORT_NAMES.map((mName, idx) => {
            const mNum = idx + 1;
            const stats = currentProfile.months[mNum];
            if (!stats) return null;

            const isPos = stats.avgReturn >= 0;
            const isInsufficient = stats.insufficientHistory;

            return (
              <button
                key={mNum}
                onClick={() => onSelectCell(currentProfile, stats)}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-300 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase">{mName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">N={stats.sampleSize}</span>
                </div>

                <div
                  className={`text-base font-extrabold mt-1.5 ${
                    isInsufficient
                      ? 'text-slate-400'
                      : isPos
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {isInsufficient
                    ? 'Limited'
                    : isPos
                    ? `+${stats.avgReturn.toFixed(2)}%`
                    : `${stats.avgReturn.toFixed(2)}%`}
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Win Rate:</span>
                  <span className="font-semibold text-slate-700">{stats.winRatePct.toFixed(0)}%</span>
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5">
                  Best: +{stats.bestYear.returnPct.toFixed(1)}% ({stats.bestYear.year})
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complete Historical Year-by-Year Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Year-by-Year Historical Return Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Examine consistency across years to distinguish persistent historical tendencies from single-year anomaly spikes.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {currentProfile.yearlyMatrix.length} Years Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 text-left w-32 whitespace-nowrap">Year</th>
                {MONTH_SHORT_NAMES.map((m) => (
                  <th key={m} className="py-2.5 px-2">
                    {m}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Annual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentProfile.yearlyMatrix.map((yrData) => {
                const annualPos = yrData.annualReturn !== undefined && yrData.annualReturn >= 0;

                return (
                  <tr key={yrData.year} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-left font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                      {yrData.year}
                    </td>

                    {MONTH_SHORT_NAMES.map((_, idx) => {
                      const mNum = idx + 1;
                      const val = yrData.returns[mNum];

                      if (val === undefined) {
                        return (
                          <td key={mNum} className="py-2 px-1 text-slate-300">
                            —
                          </td>
                        );
                      }

                      // Mathematical cell color coding
                      let bgClass = 'bg-slate-50 text-slate-700';
                      if (val >= 3.0) bgClass = 'bg-emerald-600 text-white font-bold';
                      else if (val >= 1.5) bgClass = 'bg-emerald-500 text-white font-semibold';
                      else if (val >= 0.05) bgClass = 'bg-emerald-100 text-emerald-900';
                      else if (val <= -3.0) bgClass = 'bg-rose-600 text-white font-bold';
                      else if (val <= -1.5) bgClass = 'bg-rose-500 text-white font-semibold';
                      else if (val < -0.05) bgClass = 'bg-rose-100 text-rose-900';

                      return (
                        <td
                          key={mNum}
                          className="py-1.5 px-1 cursor-pointer"
                          onClick={() => {
                            const stats = currentProfile.months[mNum];
                            if (stats) onSelectCell(currentProfile, stats);
                          }}
                        >
                          <span
                            className={`inline-block w-full py-1 rounded text-[11px] transition-transform hover:scale-105 ${bgClass}`}
                          >
                            {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-right font-bold">
                      {yrData.annualReturn !== undefined ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            annualPos
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {annualPos ? `+${yrData.annualReturn.toFixed(1)}%` : `${yrData.annualReturn.toFixed(1)}%`}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Historical Monthly Summary Rows merged directly at the bottom of the table */}
            <tfoot className="border-t-2 border-slate-300 divide-y divide-slate-200 bg-slate-50/95 font-mono text-xs">
              {/* Row 1: Average Return */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-slate-900 text-xs">Average Return</div>
                  <div className="text-[10px] text-slate-500 font-sans">Monthly Mean</div>
                </td>
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  const val = st.avgReturn;
                  const isPos = val >= 0;
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`${MONTH_FULL_NAMES[idx]} Average Return: ${isPos ? '+' : ''}${val.toFixed(2)}% (N=${st.sampleSize})`}
                        className={`inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold ${
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
                      annualSummary.avgReturn >= 0
                        ? 'text-emerald-800 bg-emerald-50'
                        : 'text-rose-800 bg-rose-50'
                    }`}
                    title={`Annual Arithmetic Mean: ${annualSummary.avgReturn >= 0 ? '+' : ''}${annualSummary.avgReturn.toFixed(2)}%`}
                  >
                    {annualSummary.avgReturn >= 0 ? `+${annualSummary.avgReturn.toFixed(2)}` : annualSummary.avgReturn.toFixed(2)}%
                  </span>
                </td>
              </tr>

              {/* Row 2: Win Rate */}
              <tr className="hover:bg-slate-100/70 transition-colors">
                <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200 shadow-xs whitespace-nowrap">
                  <div className="font-bold text-emerald-800 text-xs">Win Rate</div>
                  <div className="text-[10px] text-slate-500 font-sans">% Months &gt; 0</div>
                </td>
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  const winRate = st.sampleSize > 0 ? (st.positiveCount / st.sampleSize) * 100 : 0;
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`${MONTH_FULL_NAMES[idx]} Win Rate: ${winRate.toFixed(1)}% (${st.positiveCount} wins / ${st.sampleSize} years)`}
                        className="inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80"
                      >
                        {winRate.toFixed(1)}%
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
                  <div className="text-[10px] text-slate-500 font-sans">% Months &lt; 0</div>
                </td>
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  const loseRate = st.sampleSize > 0 ? (st.negativeCount / st.sampleSize) * 100 : 0;
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`${MONTH_FULL_NAMES[idx]} Lose Rate: ${loseRate.toFixed(1)}% (${st.negativeCount} losses / ${st.sampleSize} years)`}
                        className="inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold text-rose-900 bg-rose-50 border border-rose-200/80"
                      >
                        {loseRate.toFixed(1)}%
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
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`${MONTH_FULL_NAMES[idx]} Standard Deviation: ${st.stdDev.toFixed(2)}%`}
                        className="inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200"
                      >
                        {st.stdDev.toFixed(2)}%
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
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  const val = st.bestYear.returnPct;
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`Best ${MONTH_FULL_NAMES[idx]}: ${val >= 0 ? '+' : ''}${val.toFixed(1)}% (${st.bestYear.year})`}
                        className="inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80"
                      >
                        {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}%
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
                {MONTH_SHORT_NAMES.map((_, idx) => {
                  const mNum = idx + 1;
                  const st = currentProfile.months[mNum];
                  if (!st || st.sampleSize === 0) {
                    return <td key={mNum} className="py-1 px-1 text-slate-300">—</td>;
                  }
                  const val = st.worstYear.returnPct;
                  return (
                    <td
                      key={mNum}
                      className="py-1 px-1 text-center cursor-pointer"
                      onClick={() => onSelectCell(currentProfile, st)}
                    >
                      <span
                        title={`Worst ${MONTH_FULL_NAMES[idx]}: ${val.toFixed(1)}% (${st.worstYear.year})`}
                        className="inline-block w-full py-1.5 px-0.5 rounded text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200/80"
                      >
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
              Summary rows directly summarize historical performance across all {currentProfile.yearlyMatrix.length} tracked years for {currentProfile.name} ({selectedPeriod}).
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            {currentProfile.periodSummary.totalObservations} Valid Monthly Observations
          </span>
        </div>
      </div>
    </div>
  );
};

