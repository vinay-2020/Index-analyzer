import React from 'react';
import { QuarterlyCellStats, IndexQuarterlySeasonality, HeatmapPeriod } from '../types';
import { QUARTER_FULL_LABELS, QUARTER_MONTHS } from '../quarterlyHeatmapData';
import { MONTH_FULL_NAMES, MONTH_SHORT_NAMES } from '../monthlyHeatmapData';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

interface QuarterlyCellDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  indexProfile: IndexQuarterlySeasonality | null;
  cellStats: QuarterlyCellStats | null;
  selectedPeriod: HeatmapPeriod;
}

export const QuarterlyCellDrilldownModal: React.FC<QuarterlyCellDrilldownModalProps> = ({
  isOpen,
  onClose,
  indexProfile,
  cellStats,
  selectedPeriod,
}) => {
  if (!isOpen || !indexProfile || !cellStats) return null;

  const quarterLabel = QUARTER_FULL_LABELS[cellStats.quarter] || cellStats.quarterName;
  const monthNumbers = QUARTER_MONTHS[cellStats.quarter] || [];

  // Compute expected observation count for the selected period
  const expectedYears =
    selectedPeriod === '15Y' ? 15 :
    selectedPeriod === '10Y' ? 10 :
    selectedPeriod === '5Y' ? 5 :
    selectedPeriod === '3Y' ? 3 : 16;

  // History status determination
  let statusText = 'Sufficient History';
  let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;

  if (cellStats.sampleSize === 0) {
    statusText = 'No Historical Observations';
    statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    statusIcon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
  } else if (cellStats.sampleSize < 3) {
    statusText = `Insufficient History (N = ${cellStats.sampleSize})`;
    statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    statusIcon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
  } else if (cellStats.sampleSize < expectedYears) {
    statusText = `Limited History (N = ${cellStats.sampleSize} of ${expectedYears}Y)`;
    statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    statusIcon = <Info className="w-4 h-4 text-amber-600" />;
  }

  // Monthly stats within this quarter from the underlying monthly profile
  const monthlyStatsInQuarter = monthNumbers.map((m) => {
    return {
      monthNumber: m,
      monthName: MONTH_SHORT_NAMES[m - 1],
      monthFullName: MONTH_FULL_NAMES[m - 1],
      stats: indexProfile.monthlyProfile.months[m],
    };
  });

  return (
    <div
      id="quarterly-cell-drilldown-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="quarterly-cell-drilldown-container"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-900 text-white tracking-wide">
                {indexProfile.category.toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass}`}
              >
                {statusIcon}
                {statusText}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Period: {selectedPeriod} Window
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <span>{indexProfile.name}</span>
              <span className="text-slate-400 font-normal">×</span>
              <span className="text-violet-700">{quarterLabel} Seasonality</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {indexProfile.symbol} • Inception: {indexProfile.inceptionDate}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Avg Return */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Average Return
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold ${
                    cellStats.avgReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {cellStats.avgReturn >= 0 ? `+${cellStats.avgReturn.toFixed(2)}` : cellStats.avgReturn.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (Med: {cellStats.medianReturn >= 0 ? `+${cellStats.medianReturn.toFixed(2)}` : cellStats.medianReturn.toFixed(2)}%)
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Compounded quarterly return
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Win Rate
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">
                  {cellStats.winRatePct.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-500">
                  ({cellStats.positiveCount}/{cellStats.sampleSize} yrs)
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Loss Rate: {cellStats.loseRatePct.toFixed(1)}% ({cellStats.negativeCount} yrs)
              </div>
            </div>

            {/* Volatility */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Std Dev (σ)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800">
                  {cellStats.stdDev.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-500">sample σ</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Dispersion across observed {cellStats.sampleSize} years
              </div>
            </div>

            {/* Range */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Best vs Worst Year
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 font-medium">Best ({cellStats.bestYear.year}):</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +{cellStats.bestYear.returnPct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-700 font-medium">Worst ({cellStats.worstYear.year}):</span>
                  <span className="font-bold text-rose-700 font-mono">
                    {cellStats.worstYear.returnPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Constituent Months Contribution */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-violet-600" />
              <span>Constituent Months Performance in {quarterLabel}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {monthlyStatsInQuarter.map((m) => {
                const st = m.stats;
                const avg = st ? st.avgReturn : 0;
                const win = st ? st.winRatePct : 0;
                return (
                  <div
                    key={m.monthNumber}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{m.monthFullName}</span>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${
                          avg >= 0
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {avg >= 0 ? `+${avg.toFixed(2)}` : avg.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Win Rate: <strong>{win.toFixed(1)}%</strong></span>
                      <span>N = {st?.sampleSize || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observations Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <span>Historical Year-by-Year Quarterly Observations</span>
              </h3>
              <span className="text-xs text-slate-500">
                Sorted by most recent year
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Year</th>
                    <th className="py-2.5 px-3 text-right">Compounded {cellStats.quarterName} Return</th>
                    {monthNumbers.map((m) => (
                      <th key={m} className="py-2.5 px-3 text-right">
                        {MONTH_SHORT_NAMES[m - 1]}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-center">Relative Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cellStats.observations.map((obs) => {
                    const isPositive = obs.returnPct >= 0;
                    const maxBar = 30; // Scale
                    const barWidth = Math.min(100, Math.abs(obs.returnPct) * 3);

                    return (
                      <tr key={obs.year} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-4 font-bold text-slate-900">
                          {obs.year}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs ${
                              isPositive
                                ? 'text-emerald-800 bg-emerald-100/70'
                                : 'text-rose-800 bg-rose-100/70'
                            }`}
                          >
                            {isPositive ? `+${obs.returnPct.toFixed(2)}` : obs.returnPct.toFixed(2)}%
                          </span>
                        </td>
                        {obs.months.map((m) => (
                          <td key={m.month} className="py-2 px-3 text-right font-mono text-slate-600">
                            {m.returnPct !== undefined ? (
                              <span
                                className={
                                  m.returnPct >= 0
                                    ? 'text-emerald-700 font-medium'
                                    : 'text-rose-700 font-medium'
                                }
                              >
                                {m.returnPct >= 0 ? `+${m.returnPct.toFixed(1)}` : m.returnPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1.5 w-full max-w-[120px] mx-auto">
                            <div className="w-1/2 flex justify-end">
                              {!isPositive && (
                                <div
                                  className="h-2 rounded-l bg-rose-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              )}
                            </div>
                            <div className="w-px h-3 bg-slate-300 shrink-0" />
                            <div className="w-1/2 flex justify-start">
                              {isPositive && (
                                <div
                                  className="h-2 rounded-r bg-emerald-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Compounded formula: (1 + M1/100) × (1 + M2/100) × (1 + M3/100) - 1.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
