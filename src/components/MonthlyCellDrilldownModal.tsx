import React from 'react';
import { MonthlyCellStats, IndexMonthlySeasonality, HeatmapPeriod } from '../types';
import { MONTH_FULL_NAMES } from '../monthlyHeatmapData';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface MonthlyCellDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  indexProfile: IndexMonthlySeasonality | null;
  cellStats: MonthlyCellStats | null;
  selectedPeriod: HeatmapPeriod;
}

export const MonthlyCellDrilldownModal: React.FC<MonthlyCellDrilldownModalProps> = ({
  isOpen,
  onClose,
  indexProfile,
  cellStats,
  selectedPeriod,
}) => {
  if (!isOpen || !indexProfile || !cellStats) return null;

  const monthFullName = MONTH_FULL_NAMES[cellStats.month - 1] || cellStats.monthName;
  const isJanuary = cellStats.month === 1;

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

  return (
    <div
      id="monthly-cell-drilldown-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="monthly-cell-drilldown-container"
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
              <span className="text-indigo-600">{monthFullName} Seasonality</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {indexProfile.symbol} • Inception: {indexProfile.inceptionDate}
            </p>
          </div>

          <button
            id="close-cell-drilldown-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Avg Return */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Average Return</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  cellStats.avgReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {cellStats.avgReturn >= 0 ? `+${cellStats.avgReturn.toFixed(2)}%` : `${cellStats.avgReturn.toFixed(2)}%`}
              </div>
              <span className="text-[11px] text-slate-400">Mean monthly move</span>
            </div>

            {/* Median Return */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Median Return</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  cellStats.medianReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {cellStats.medianReturn >= 0 ? `+${cellStats.medianReturn.toFixed(2)}%` : `${cellStats.medianReturn.toFixed(2)}%`}
              </div>
              <span className="text-[11px] text-slate-400">50th percentile</span>
            </div>

            {/* Win Rate */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Win Rate</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {cellStats.winRatePct.toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-500">
                {cellStats.positiveCount} Up / {cellStats.negativeCount} Down
              </span>
            </div>

            {/* Best Year */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Best Year</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                +{cellStats.bestYear.returnPct.toFixed(2)}%
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{cellStats.bestYear.year}</span>
            </div>

            {/* Worst Year */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Worst Year</span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {cellStats.worstYear.returnPct.toFixed(2)}%
              </div>
              <span className="text-[11px] text-slate-500 font-medium">{cellStats.worstYear.year}</span>
            </div>

            {/* Volatility / Sample Size */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-xs text-slate-500 block">Std Dev & Samples</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {cellStats.stdDev.toFixed(2)}%
              </div>
              <span className="text-[11px] text-slate-500">N = {cellStats.sampleSize} years</span>
            </div>
          </div>

          {/* Insufficient or Limited History Warning Banner */}
          {cellStats.sampleSize < 3 && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Insufficient Observations Warning</h4>
                <p className="text-xs text-rose-700 mt-1">
                  This index has only {cellStats.sampleSize} observation{cellStats.sampleSize === 1 ? '' : 's'} for {monthFullName}.
                  Statistical metrics (mean, median, standard deviation) require at least 3 historical observations for minimal mathematical stability. Interpret with extreme caution.
                </p>
              </div>
            </div>
          )}

          {cellStats.sampleSize >= 3 && cellStats.sampleSize < expectedYears && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-900">Limited Historical Depth</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Index inception ({indexProfile.inceptionDate}) allows {cellStats.sampleSize} years of data within the requested {selectedPeriod} window. Calculations strictly use available real observations without price fabrication.
                </p>
              </div>
            </div>
          )}

          {/* Year-by-Year Historical Breakdown Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                Historical Breakdown by Calendar Year
              </h3>
              <span className="text-xs text-slate-500">
                Sorted by most recent year ({cellStats.observations.length} observations)
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Year</th>
                    <th className="py-2.5 px-3">Month-End Date</th>
                    <th className="py-2.5 px-3 text-right">Return %</th>
                    <th className="py-2.5 px-3 text-right">Month-End Close</th>
                    <th className="py-2.5 px-3 text-right">
                      {isJanuary ? 'Prior Dec Close' : 'Prior Month Close'}
                    </th>
                    <th className="py-2.5 px-4 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cellStats.observations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No historical observations found for this period.
                      </td>
                    </tr>
                  ) : (
                    cellStats.observations.map((obs) => {
                      const isPos = obs.returnPct > 0;
                      const isNeg = obs.returnPct < 0;

                      return (
                        <tr
                          key={obs.year}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {obs.year}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono">
                            {obs.date}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs ${
                                isPos
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : isNeg
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isPos ? `+${obs.returnPct.toFixed(2)}%` : `${obs.returnPct.toFixed(2)}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                            {obs.close.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {obs.prevClose.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {isPos ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                <TrendingUp className="w-3 h-3" /> Up
                              </span>
                            ) : isNeg ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                                <TrendingDown className="w-3 h-3" /> Down
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">Flat</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {isJanuary && (
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                January methodology: Return is strictly calculated against the last trading close of December of the prior calendar year.
              </p>
            )}
          </div>
        </div>

        {/* Footer with statistical disclaimer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              <strong>Statistical Boundary:</strong> Historical monthly seasonality describes empirical past occurrences. It does not predict future performance.
            </span>
          </div>
          <button
            id="modal-done-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Close Drill-down
          </button>
        </div>
      </div>
    </div>
  );
};
